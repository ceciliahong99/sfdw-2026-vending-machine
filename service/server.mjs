import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { basename, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEscPosTextBuffer, buildReceiptText } from "./receiptFormatter.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");
const webRoot = resolve(projectRoot, "webapp");
const jobRoot = resolve(projectRoot, "service", "print-jobs");
const profileImageRoot = resolve(projectRoot, "service", "receipt-profile-cache");

const PORT = Number(process.env.PORT ?? 4174);
const HOST = process.env.HOST ?? "127.0.0.1";
const PRINTER_MODE = process.env.PRINTER_MODE ?? "mock";
const PRINTER_DEVICE = process.env.PRINTER_DEVICE ?? "";
const PRINTER_QUEUE = process.env.PRINTER_QUEUE ?? "";
const RECEIPT_WIDTH = Number(process.env.RECEIPT_WIDTH ?? 32);
const PRINT_PROFILE_IMAGES = (process.env.PRINT_PROFILE_IMAGES ?? "1") !== "0";
const PRINT_COOLDOWN_MS = Number(process.env.PRINT_COOLDOWN_MS ?? (PRINTER_MODE === "lp" ? 20000 : 0));

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

let lastPrintJob = null;
let printQueue = Promise.resolve();
let nextPrintAvailableAt = 0;

function getNextPrintAvailableAtIso() {
  if (PRINT_COOLDOWN_MS <= 0 || nextPrintAvailableAt <= Date.now()) return null;
  return new Date(nextPrintAvailableAt).toISOString();
}

function sendJson(response, statusCode, body) {
  const payload = JSON.stringify(body, null, 2);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  response.end(payload);
}

function readRequestBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    let size = 0;

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        rejectBody(new Error("Request body too large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    request.on("error", rejectBody);
  });
}

function sleep(ms) {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

function safeStaticPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = normalize(decoded).replace(/^(\.\.(\/|\\|$))+/, "");
  const relativePath = normalized === "/" ? "/index.html" : normalized;
  const absolutePath = resolve(webRoot, `.${relativePath}`);

  if (!absolutePath.startsWith(webRoot)) return null;
  return absolutePath;
}

async function serveStatic(request, response, pathname) {
  const filePath = safeStaticPath(pathname);
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const contentType = mimeTypes[extname(filePath)] ?? "application/octet-stream";
    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": fileStat.size,
      "Cache-Control": basename(filePath) === "index.html" ? "no-store" : "public, max-age=60",
    });
    createReadStream(filePath).pipe(response);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500);
    response.end(error.code === "ENOENT" ? "Not found" : "Static file error");
  }
}

function printViaLp(data) {
  return new Promise((resolvePrint, rejectPrint) => {
    if (!PRINTER_QUEUE) {
      rejectPrint(new Error("PRINTER_QUEUE is required for PRINTER_MODE=lp"));
      return;
    }

    const child = spawn("lp", ["-d", PRINTER_QUEUE, "-o", "raw"], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", rejectPrint);
    child.on("close", (code) => {
      if (code === 0) {
        resolvePrint();
        return;
      }
      rejectPrint(new Error(stderr.trim() || `lp exited with code ${code}`));
    });

    child.stdin.end(data);
  });
}

async function readProfileImageCommand(personId) {
  if (!PRINT_PROFILE_IMAGES || !personId) return null;

  const safeId = String(personId).replace(/[^a-z0-9._-]+/gi, "").toLowerCase();
  if (!safeId) return null;

  try {
    return await readFile(join(profileImageRoot, `${safeId}.escpos.bin`));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function printReceipt(payload) {
  const receiptId = payload.receiptId || `receipt-${Date.now()}`;
  const profileImage = await readProfileImageCommand(payload.personId);
  const text = buildReceiptText(payload, { width: RECEIPT_WIDTH });
  const escpos = buildEscPosTextBuffer(payload, { width: RECEIPT_WIDTH, profileImage });

  if (PRINTER_MODE === "mock") {
    console.log(`\n--- ${receiptId} ---\n${text}--- end ${receiptId} ---\n`);
    return { status: "printed", adapter: "mock", receiptText: text, profileImage: Boolean(profileImage) };
  }

  if (PRINTER_MODE === "file") {
    await mkdir(jobRoot, { recursive: true });
    const safeId = receiptId.replace(/[^a-z0-9._-]+/gi, "_");
    await writeFile(join(jobRoot, `${safeId}.txt`), text, "utf8");
    await writeFile(join(jobRoot, `${safeId}.escpos.bin`), escpos);
    return { status: "printed", adapter: "file", path: join(jobRoot, `${safeId}.txt`), profileImage: Boolean(profileImage) };
  }

  if (PRINTER_MODE === "raw") {
    if (!PRINTER_DEVICE) {
      throw new Error("PRINTER_DEVICE is required for PRINTER_MODE=raw");
    }
    await writeFile(PRINTER_DEVICE, escpos);
    return { status: "printed", adapter: "raw", device: PRINTER_DEVICE, profileImage: Boolean(profileImage) };
  }

  if (PRINTER_MODE === "lp") {
    await printViaLp(escpos);
    return { status: "printed", adapter: "lp", queue: PRINTER_QUEUE, profileImage: Boolean(profileImage) };
  }

  throw new Error(`Unknown PRINTER_MODE: ${PRINTER_MODE}`);
}

async function executeQueuedPrint(payload) {
  const now = Date.now();
  const queueDelayMs = Math.max(0, nextPrintAvailableAt - now);

  if (queueDelayMs > 0) {
    await sleep(queueDelayMs);
  }

  const result = await printReceipt(payload);

  if (PRINT_COOLDOWN_MS > 0) {
    nextPrintAvailableAt = Date.now() + PRINT_COOLDOWN_MS;
  }

  return {
    result,
    queueDelayMs,
    printCooldownMs: PRINT_COOLDOWN_MS,
    nextPrintAvailableAt: getNextPrintAvailableAtIso(),
  };
}

function enqueuePrint(payload) {
  const queuedPrint = printQueue.catch(() => null).then(() => executeQueuedPrint(payload));
  printQueue = queuedPrint.catch(() => null);
  return queuedPrint;
}

async function handlePrint(request, response) {
  try {
    const body = await readRequestBody(request);
    const payload = JSON.parse(body);
    const receivedAt = new Date().toISOString();
    const queued = await enqueuePrint(payload);
    const { result } = queued;

    lastPrintJob = {
      receiptId: payload.receiptId,
      personId: payload.personId,
      displayName: payload.displayName,
      role: payload.role,
      roleWithTeam: payload.roleWithTeam,
      funFact: payload.funFact,
      whereToFind: payload.whereToFind,
      callToAction: payload.callToAction,
      status: result.status,
      adapter: result.adapter,
      profileImage: result.profileImage,
      receivedAt,
      queueDelayMs: queued.queueDelayMs,
      printCooldownMs: queued.printCooldownMs,
      nextPrintAvailableAt: queued.nextPrintAvailableAt,
      printedAt: new Date().toISOString(),
      result,
    };

    sendJson(response, 200, lastPrintJob);
  } catch (error) {
    lastPrintJob = {
      status: "failed",
      adapter: PRINTER_MODE,
      failedAt: new Date().toISOString(),
      error: error.message,
    };
    sendJson(response, 500, lastPrintJob);
  }
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host ?? `${HOST}:${PORT}`}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, {
      ok: true,
      printerMode: PRINTER_MODE,
      printerDevice: PRINTER_DEVICE || null,
      printerQueue: PRINTER_QUEUE || null,
      receiptWidth: RECEIPT_WIDTH,
      printProfileImages: PRINT_PROFILE_IMAGES,
      printCooldownMs: PRINT_COOLDOWN_MS,
      nextPrintAvailableAt: getNextPrintAvailableAtIso(),
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/printer/status") {
    sendJson(response, 200, {
      printerMode: PRINTER_MODE,
      printCooldownMs: PRINT_COOLDOWN_MS,
      nextPrintAvailableAt: getNextPrintAvailableAtIso(),
      lastPrintJob,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/print") {
    await handlePrint(request, response);
    return;
  }

  if (request.method === "GET" || request.method === "HEAD") {
    await serveStatic(request, response, url.pathname);
    return;
  }

  response.writeHead(405, { Allow: "GET, HEAD, POST" });
  response.end("Method not allowed");
});

server.listen(PORT, HOST, () => {
  console.log(`SFDW Vending Machine service: http://${HOST}:${PORT}/?printer=service`);
  console.log(`Printer mode: ${PRINTER_MODE}`);
});
