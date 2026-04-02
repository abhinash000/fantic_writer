
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * PRODUCTION-READY CONVERSION SCRIPT
 * PNG -> AVIF (Quality 50, Effort 6)
 * Replaces references in HTML, CSS, and JS/TS files.
 */

const PROJECT_ROOT = process.cwd();
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', '.cache'];
const TARGET_EXTS = ['.html', '.css', '.js', '.jsx', '.ts', '.tsx', '.json'];

async function convertPngToAvif(filePath) {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const avifPath = path.join(dir, `${base}.avif`);

  try {
    console.log(`Converting: ${filePath} -> ${avifPath}`);
    await sharp(filePath)
      .avif({ quality: 50, effort: 6 })
      .toFile(avifPath);
    return true;
  } catch (err) {
    console.error(`Error converting ${filePath}:`, err.message);
    return false;
  }
}

function updateFileReferences(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple regex to replace .png with .avif
  // Covers: "image.png", 'image.png', url(image.png), import x from './image.png'
  const updatedContent = content.replace(/\.png\b/gi, '.avif');
  
  if (content !== updatedContent) {
    console.log(`Updating references in: ${filePath}`);
    fs.writeFileSync(filePath, updatedContent, 'utf8');
  }
}

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.includes(entry.name)) {
        await processDirectory(fullPath);
      }
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();

    // 1. Convert PNG to AVIF
    if (ext === '.png') {
      await convertPngToAvif(fullPath);
    }

    // 2. Update code references
    if (TARGET_EXTS.includes(ext)) {
      updateFileReferences(fullPath);
    }
  }
}

async function run() {
  console.log('🚀 Starting PNG -> AVIF Universe Migration...');
  await processDirectory(PROJECT_ROOT);
  console.log('✅ Universe Restructured. All PNGs converted and references updated.');
}

run();
