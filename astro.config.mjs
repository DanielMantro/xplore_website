// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';

// lastmod per route post, from its frontmatter. Other pages get none: CI checks out a shallow clone,
// so git dates would be wrong, and a wrong lastmod is worse than none.
const routeDates = Object.fromEntries(
  readdirSync('src/content/routes')
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => {
      const data = parse(readFileSync(`src/content/routes/${f}`, 'utf8').split(/^---$/m)[1]);
      return [`https://xplore-mobileapp.de/routes/${data.slug}`, new Date(data.updatedAt ?? data.publishedAt).toISOString()];
    }),
);

// https://astro.build/config
export default defineConfig({
  site: 'https://xplore-mobileapp.de',
  // Clean URLs (/features, /privacy/app) as listed in the brief's sitemap. GitHub Pages serves
  // /features from features.html.
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      // /privacy/app and /privacy/website are noindex until legally reviewed; list them again when that's lifted.
      filter: (page) => !/\/(get|404|privacy\/app|privacy\/website)$/.test(page),
      serialize: (item) => ({ ...item, lastmod: routeDates[item.url] }),
    }),
  ],
});
