import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync, inflateSync } from "node:zlib";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cardDir = join(root, "assets", "cards");
const selectedCardDir = join(root, "assets", "selected-cards");

const people = [
  "jan.png",
  "henry.png",
  "dennis.png",
  "cecilia.png",
  "kimberly.png",
  "gadi.png",
  "michele.png",
  "jeff.png",
  "yoshi.png",
  "kyu.png",
  "stan.png",
  "yuri.png",
  "felipe.png",
  "aidan.png",
  "anthony.png",
  "mystery.png",
];
const selectedCardFiles = people.flatMap((file) => {
  const personId = file.replace(".png", "");
  return [`${personId}-state-1.png`, `${personId}-state-2.png`];
});

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const crcTable = makeCrcTable();

function makeCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
}

function crc32(type, data) {
  let c = 0xffffffff;
  for (const byte of Buffer.concat([Buffer.from(type), data])) {
    c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function readChunks(buffer) {
  if (!buffer.subarray(0, 8).equals(signature)) {
    throw new Error("Not a PNG file");
  }

  const chunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 12 + length;
    if (type === "IEND") break;
  }
  return chunks;
}

function writeChunk(type, data) {
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(type, data), 8 + data.length);
  return chunk;
}

function unfilter(raw, width, height, bytesPerPixel) {
  const stride = width * bytesPerPixel;
  const out = Buffer.alloc(stride * height);
  let rawOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[rawOffset];
    rawOffset += 1;
    const rowStart = y * stride;
    const prevRowStart = rowStart - stride;

    for (let x = 0; x < stride; x += 1) {
      const left = x >= bytesPerPixel ? out[rowStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? out[prevRowStart + x] : 0;
      const upLeft = y > 0 && x >= bytesPerPixel ? out[prevRowStart + x - bytesPerPixel] : 0;
      const value = raw[rawOffset];
      rawOffset += 1;

      if (filter === 0) out[rowStart + x] = value;
      else if (filter === 1) out[rowStart + x] = (value + left) & 0xff;
      else if (filter === 2) out[rowStart + x] = (value + up) & 0xff;
      else if (filter === 3) out[rowStart + x] = (value + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) out[rowStart + x] = (value + paeth(left, up, upLeft)) & 0xff;
      else throw new Error(`Unsupported PNG filter ${filter}`);
    }
  }

  return out;
}

function filterNone(pixels, width, height, bytesPerPixel) {
  const stride = width * bytesPerPixel;
  const out = Buffer.alloc((stride + 1) * height);
  let outOffset = 0;

  for (let y = 0; y < height; y += 1) {
    out[outOffset] = 0;
    outOffset += 1;
    pixels.copy(out, outOffset, y * stride, (y + 1) * stride);
    outOffset += stride;
  }

  return out;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function roundedRectCoverage(x, y, width, height) {
  const scale = width / 125;
  const left = 7.5 * scale;
  const top = 7.5 * scale;
  const rectWidth = 110 * scale;
  const rectHeight = 110 * scale;
  const radius = 10 * scale;
  const right = left + rectWidth;
  const bottom = top + rectHeight;

  if (x < left || x >= right || y < top || y >= bottom) return 0;

  const cx = x < left + radius ? left + radius : x >= right - radius ? right - radius - 1 : x;
  const cy = y < top + radius ? top + radius : y >= bottom - radius ? bottom - radius - 1 : y;
  const dx = x - cx;
  const dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const edge = radius - distance;

  if (edge >= 1) return 1;
  if (edge <= 0) return 0;
  return edge;
}

function cleanPng(buffer) {
  const chunks = readChunks(buffer);
  const ihdr = chunks.find((chunk) => chunk.type === "IHDR");
  if (!ihdr) throw new Error("Missing IHDR");

  const width = ihdr.data.readUInt32BE(0);
  const height = ihdr.data.readUInt32BE(4);
  const bitDepth = ihdr.data[8];
  const colorType = ihdr.data[9];

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const bytesPerPixel = 4;
  const idat = Buffer.concat(chunks.filter((chunk) => chunk.type === "IDAT").map((chunk) => chunk.data));
  const pixels = unfilter(inflateSync(idat), width, height, bytesPerPixel);

  let changed = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * bytesPerPixel;
      const coverage = roundedRectCoverage(x + 0.5, y + 0.5, width, height);
      const nextAlpha = Math.round(pixels[offset + 3] * coverage);
      if (nextAlpha !== pixels[offset + 3]) {
        pixels[offset + 3] = nextAlpha;
        changed += 1;
      }
    }
  }

  const nextChunks = [];
  for (const chunk of chunks) {
    if (chunk.type === "IDAT") continue;
    if (chunk.type === "IEND") {
      nextChunks.push(writeChunk("IDAT", deflateSync(filterNone(pixels, width, height, bytesPerPixel), { level: 9 })));
    }
    nextChunks.push(writeChunk(chunk.type, chunk.data));
  }

  return { buffer: Buffer.concat([signature, ...nextChunks]), changed };
}

const targets = [
  { dir: cardDir, files: people },
  { dir: selectedCardDir, files: selectedCardFiles },
];

for (const target of targets) {
  for (const file of target.files) {
    const path = join(target.dir, file);
    const original = await readFile(path);
    const { buffer, changed } = cleanPng(original);
    await writeFile(path, buffer);
    console.log(`${file}: adjusted ${changed} outside-card pixels`);
  }
}
