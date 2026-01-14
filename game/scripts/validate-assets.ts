
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const AUDIO_DIR = path.join(ASSETS_DIR, 'audio');
const IMAGE_DIR = path.join(ASSETS_DIR, 'images');

let hasError = false;

function error(msg: string) {
  console.error(`❌ ${msg}`);
  hasError = true;
}

function info(msg: string) {
  console.log(`✓ ${msg}`);
}

function validateAudio() {
  if (!fs.existsSync(AUDIO_DIR)) return;
  
  // Check snake_case naming
  const checkDir = (dir: string) => {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      const fullPath = path.join(dir, f);
      if (fs.statSync(fullPath).isDirectory()) {
        checkDir(fullPath);
      } else {
        if (!/^[a-z0-9_]+\.(mp3|ogg|wav)$/.test(f)) {
           // Allow dot files? No.
           if (f.startsWith('.')) return;
           error(`Invalid audio filename: ${path.relative(ASSETS_DIR, fullPath)} (Use snake_case.mp3)`);
        }
      }
    });
  };
  
  checkDir(AUDIO_DIR);
  info('Audio assets checked');
}

function validateImages() {
  if (!fs.existsSync(IMAGE_DIR)) return;

  const checkDir = (dir: string) => {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      const fullPath = path.join(dir, f);
      if (fs.statSync(fullPath).isDirectory()) {
        checkDir(fullPath);
      } else {
        // SVG, PNG, WEBP
        if (!/^[a-z0-9_]+\.(svg|png|webp|jpg)$/.test(f)) {
           if (f.startsWith('.')) return;
           error(`Invalid image filename: ${path.relative(ASSETS_DIR, fullPath)} (Use snake_case)`);
        }
      }
    });
  };

  checkDir(IMAGE_DIR);
  info('Image assets checked');
}

console.log('Running Asset Validation...');
validateAudio();
validateImages();

if (hasError) {
  console.error('Validation FAILED');
  process.exit(1);
} else {
  console.log('Validation PASSED');
  process.exit(0);
}
