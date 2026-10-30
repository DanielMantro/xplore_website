// Generates derived images into public/. Run after adding a card or a route post:
//   node scripts/images.mjs
// - public/assets/cards/480/<name>.webp: cards are shown at most 220 px wide, so 480 px covers 2x screens.
// - public/assets/og/<slug>.jpg: 1200×630 share image per route post (JPG, which every link preview supports).
import { readdir, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { parse } from 'yaml';

const root = path.resolve(import.meta.dirname, '..');
const cards = path.join(root, 'public/assets/cards');
const smallCards = path.join(cards, '480');
const og = path.join(root, 'public/assets/og');
const routes = path.join(root, 'src/content/routes');

await mkdir(smallCards, { recursive: true });
await mkdir(og, { recursive: true });

for (const file of (await readdir(cards)).filter((f) => f.endsWith('.webp'))) {
  await sharp(path.join(cards, file)).resize({ width: 480 }).webp({ quality: 78 }).toFile(path.join(smallCards, file));
}

for (const file of (await readdir(routes)).filter((f) => f.endsWith('.md') && !f.startsWith('_'))) {
  const frontmatter = parse((await readFile(path.join(routes, file), 'utf8')).split(/^---$/m)[1]);
  await sharp(path.join(root, 'public', frontmatter.heroImage))
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(og, `${frontmatter.slug}.jpg`));
}
