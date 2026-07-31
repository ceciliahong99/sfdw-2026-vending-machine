import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, extname, join, resolve } from "node:path";
import { inflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const projectRoot = resolve(__dirname, "..");
const sourceDir = resolve(projectRoot, "webapp", "assets", "receipt-profiles");
const outputDir = resolve(projectRoot, "service", "receipt-profile-cache");
const PROFILE_TARGET_SIZE = 160;
const THRESHOLD = 160;

const PNG_SIGNATURE = "89504e470d0a1a0a";

function paethPredictor(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const distanceLeft = Math.abs(estimate - left);
  const distanceUp = Math.abs(estimate - up);
  const distanceUpLeft = Math.abs(estimate - upLeft);

  if (distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft) return left;
  if (distanceUp <= distanceUpLeft) return up;
  return upLeft;
}

function parsePng(buffer) {
  if (buffer.subarray(0, 8).toString("hex") !== PNG_SIGNATURE) {
    throw new Error("Not a PNG file");
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idatChunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== 8) throw new Error(`Unsupported PNG bit depth: ${bitDepth}`);
  if (interlace !== 0) throw new Error("Interlaced PNGs are not supported");

  const channelsByColorType = {
    0: 1,
    2: 3,
    4: 2,
    6: 4,
  };
  const channels = channelsByColorType[colorType];
  if (!channels) throw new Error(`Unsupported PNG color type: ${colorType}`);

  const inflated = inflateSync(Buffer.concat(idatChunks));
  const stride = width * channels;
  const pixels = new Uint8ClampedArray(width * height * 4);
  let sourceOffset = 0;
  let previous = new Uint8Array(stride);

  for (let y = 0; y < height; y += 1) {
    const filterType = inflated[sourceOffset];
    sourceOffset += 1;
    const row = new Uint8Array(stride);

    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + x];
      const left = x >= channels ? row[x - channels] : 0;
      const up = previous[x] ?? 0;
      const upLeft = x >= channels ? previous[x - channels] : 0;

      if (filterType === 0) row[x] = raw;
      else if (filterType === 1) row[x] = (raw + left) & 0xff;
      else if (filterType === 2) row[x] = (raw + up) & 0xff;
      else if (filterType === 3) row[x] = (raw + Math.floor((left + up) / 2)) & 0xff;
      else if (filterType === 4) row[x] = (raw + paethPredictor(left, up, upLeft)) & 0xff;
      else throw new Error(`Unsupported PNG filter type: ${filterType}`);
    }

    sourceOffset += stride;

    for (let x = 0; x < width; x += 1) {
      const src = x * channels;
      const dst = (y * width + x) * 4;
      const gray = row[src];
      const alpha = colorType === 4 ? row[src + 1] : colorType === 6 ? row[src + 3] : 255;

      pixels[dst] = colorType === 0 || colorType === 4 ? gray : row[src];
      pixels[dst + 1] = colorType === 0 || colorType === 4 ? gray : row[src + 1];
      pixels[dst + 2] = colorType === 0 || colorType === 4 ? gray : row[src + 2];
      pixels[dst + 3] = alpha;
    }

    previous = row;
  }

  return { width, height, pixels };
}

function luminanceWithWhiteMatte(pixels, index) {
  const alpha = pixels[index + 3] / 255;
  const red = pixels[index] * alpha + 255 * (1 - alpha);
  const green = pixels[index + 1] * alpha + 255 * (1 - alpha);
  const blue = pixels[index + 2] * alpha + 255 * (1 - alpha);
  return red * 0.299 + green * 0.587 + blue * 0.114;
}

function resizeToGrayscale(image, targetWidth, targetHeight) {
  const grayscale = new Float64Array(targetWidth * targetHeight);

  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(image.height - 1, Math.floor((y * image.height) / targetHeight));
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(image.width - 1, Math.floor((x * image.width) / targetWidth));
      const sourceIndex = (sourceY * image.width + sourceX) * 4;
      grayscale[y * targetWidth + x] = luminanceWithWhiteMatte(image.pixels, sourceIndex);
    }
  }

  return grayscale;
}

function ditherToRaster(grayscale, width, height) {
  const values = Float64Array.from(grayscale);
  const widthBytes = Math.ceil(width / 8);
  const raster = Buffer.alloc(widthBytes * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const oldValue = values[index];
      const newValue = oldValue < THRESHOLD ? 0 : 255;
      const error = oldValue - newValue;

      if (newValue === 0) {
        raster[y * widthBytes + Math.floor(x / 8)] |= 0x80 >> (x % 8);
      }

      if (x + 1 < width) values[index + 1] += (error * 7) / 16;
      if (x > 0 && y + 1 < height) values[index + width - 1] += (error * 3) / 16;
      if (y + 1 < height) values[index + width] += (error * 5) / 16;
      if (x + 1 < width && y + 1 < height) values[index + width + 1] += error / 16;
    }
  }

  return { widthBytes, raster };
}

function buildRasterCommand(widthBytes, height, raster) {
  const header = Buffer.from([
    0x1d,
    0x76,
    0x30,
    0x00,
    widthBytes & 0xff,
    (widthBytes >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
  ]);

  return Buffer.concat([header, raster]);
}

function buildEscPosRasterCommand(pngBuffer, targetWidth, targetHeight = null, options = {}) {
  const image = parsePng(pngBuffer);
  const resolvedHeight = targetHeight ?? Math.max(1, Math.round((image.height * targetWidth) / image.width));
  const grayscale = resizeToGrayscale(image, targetWidth, resolvedHeight);
  const { widthBytes, raster } = ditherToRaster(grayscale, targetWidth, resolvedHeight);
  const command = buildRasterCommand(widthBytes, resolvedHeight, raster);

  return { command, width: targetWidth, height: resolvedHeight, widthBytes };
}

await mkdir(outputDir, { recursive: true });

const files = (await readdir(sourceDir)).filter((file) => extname(file).toLowerCase() === ".png").sort();
const results = [];

for (const file of files) {
  const personId = basename(file, ".png").toLowerCase();
  const sourcePath = join(sourceDir, file);
  const outputPath = join(outputDir, `${personId}.escpos.bin`);
  const png = await readFile(sourcePath);
  const { command } = buildEscPosRasterCommand(png, PROFILE_TARGET_SIZE, PROFILE_TARGET_SIZE);
  await writeFile(outputPath, command);
  results.push({ personId, outputPath, bytes: command.length });
}

console.log(
  JSON.stringify(
    {
      profileCount: results.length,
      profileTargetSize: PROFILE_TARGET_SIZE,
      results,
    },
    null,
    2
  )
);
