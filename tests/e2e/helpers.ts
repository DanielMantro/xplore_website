import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';

/** Every page in the built sitemap, plus pages kept out of it on purpose. */
export function sitePages(): string[] {
  const sitemap = readFileSync('dist/sitemap-0.xml', 'utf8');
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  return [...new Set([...paths, '/privacy/app', '/privacy/website'])].sort();
}

/** Scrolls through the page so lazy images load, then back to the top. */
export async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
}
