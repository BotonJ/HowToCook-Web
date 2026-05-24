import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public/images/dishes');

type Options = {
  quality: number;
  sample: number;
  overwrite: boolean;
  outputDir?: string;
  width?: number;
  height?: number;
  concurrency: number;
};

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const getArg = (key: string) => {
    const index = args.findIndex((arg) => arg === key);
    if (index === -1) return undefined;
    return args[index + 1];
  };

  const defaultConcurrency = Math.max(1, Math.min(os.cpus().length, 8));
  const quality = Number(getArg('--quality') ?? 88);
  const sample = Number(getArg('--sample') ?? 0);
  const overwrite = (getArg('--overwrite') ?? 'true') !== 'false';
  const outputDir = getArg('--output-dir');
  const width = Number(getArg('--width'));
  const height = Number(getArg('--height'));
  const concurrency = Number(getArg('--concurrency') ?? defaultConcurrency);

  return {
    quality: Number.isFinite(quality) ? quality : 88,
    sample: Number.isFinite(sample) ? sample : 0,
    overwrite,
    outputDir,
    width: Number.isFinite(width) ? width : undefined,
    height: Number.isFinite(height) ? height : undefined,
    concurrency: Number.isFinite(concurrency) && concurrency > 0
      ? Math.floor(concurrency)
      : defaultConcurrency,
  };
}

function listImageFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listImageFiles(fullPath));
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function compressFile(filePath: string, options: Options): Promise<{ before: number; after: number; outputPath: string; }> {
  const ext = path.extname(filePath).toLowerCase();
  const before = fs.statSync(filePath).size;
  let pipeline = sharp(filePath);

  if (options.width || options.height) {
    pipeline = pipeline.resize({
      width: options.width,
      height: options.height,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    pipeline = pipeline.jpeg({
      quality: options.quality,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:4:4',
    });
  } else if (ext === '.png') {
    pipeline = pipeline.png({
      compressionLevel: 9,
      adaptiveFiltering: true,
    });
  } else if (ext === '.webp') {
    pipeline = pipeline.webp({
      quality: options.quality,
    });
  }

  const outputPath = options.outputDir
    ? path.join(options.outputDir, path.relative(IMAGES_DIR, filePath))
    : filePath;

  if (options.outputDir) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  const buffer = await pipeline.toBuffer();
  fs.writeFileSync(outputPath, buffer);

  const after = fs.statSync(outputPath).size;
  return { before, after, outputPath };
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      if (currentIndex >= items.length) return;
      nextIndex += 1;
      await worker(items[currentIndex], currentIndex);
    }
  });
  await Promise.all(runners);
}

async function main() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const options = parseArgs();
  if (!options.overwrite && !options.outputDir) {
    console.error('Overwrite is disabled. Provide --output-dir to write compressed files.');
    process.exit(1);
  }
  const allFiles = listImageFiles(IMAGES_DIR);
  const sorted = allFiles
    .map((filePath) => ({ filePath, size: fs.statSync(filePath).size }))
    .sort((a, b) => b.size - a.size);

  const targets = options.sample > 0 ? sorted.slice(0, options.sample) : sorted;
  if (targets.length === 0) {
    console.log('No images found.');
    return;
  }

  if (options.outputDir) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;

  const concurrency = Math.max(1, Math.min(options.concurrency, targets.length));
  await runWithConcurrency(targets, concurrency, async (target) => {
    const { before, after } = await compressFile(target.filePath, options);
    totalBefore += before;
    totalAfter += after;
    processed += 1;
    const ratio = before > 0 ? ((1 - after / before) * 100).toFixed(2) : '0.00';
    console.log(`${path.relative(PROJECT_ROOT, target.filePath)}: ${Math.round(before / 1024)}KB -> ${Math.round(after / 1024)}KB (${ratio}%)`);
  });

  const totalRatio = totalBefore > 0 ? ((1 - totalAfter / totalBefore) * 100).toFixed(2) : '0.00';
  console.log(`Processed ${processed} images`);
  console.log(`Total: ${Math.round(totalBefore / 1024)}KB -> ${Math.round(totalAfter / 1024)}KB (${totalRatio}%)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
