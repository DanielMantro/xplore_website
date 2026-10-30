// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://xplore-mobileapp.de',
  // Clean URLs (/features, /privacy/app) as listed in the brief's sitemap. GitHub Pages serves
  // /features from features.html.
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap({ filter: (page) => !/\/(get|404)$/.test(page) })],
});
