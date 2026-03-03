import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'public/images/logo-mark.png');
const out = join(root, 'public/icons');

const BG = '#0a0a0a';

const standard = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 180, name: 'icon-180x180.png' },
];

const maskable = [
  { size: 192, name: 'icon-maskable-192x192.png' },
  { size: 512, name: 'icon-maskable-512x512.png' },
];

await mkdir(out, { recursive: true });

for (const { size, name } of standard) {
  await sharp(src).resize(size, size, { fit: 'contain', background: BG }).png().toFile(join(out, name));
  console.log(`✓ ${name}`);
}

for (const { size, name } of maskable) {
  const inner = Math.round(size * 0.8); // 10% safe-zone on each side
  const padding = Math.round((size - inner) / 2);

  await sharp(src)
    .resize(inner, inner, { fit: 'contain', background: BG })
    .extend({ top: padding, bottom: padding, left: padding, right: padding, background: BG })
    .png()
    .toFile(join(out, name));
  console.log(`✓ ${name} (maskable)`);
}

console.log('\nDone — icons written to public/icons/');
