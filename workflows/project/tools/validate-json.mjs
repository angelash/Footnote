#!/usr/bin/env node
import fs from 'fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node validate-json.mjs <file>');
  process.exit(1);
}

try {
  const content = fs.readFileSync(file, 'utf8');
  JSON.parse(content);
  console.log('JSON valid:', file);
  process.exit(0);
} catch (e) {
  console.error('JSON invalid:', e.message);
  process.exit(1);
}
