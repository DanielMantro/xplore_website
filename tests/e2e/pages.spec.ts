import { expect, test } from '@playwright/test';
import { scrollThrough, sitePages } from './helpers';

for (const path of sitePages()) {
  test.describe(path, () => {
    test('loads cleanly: status, head tags, one h1, no console errors, first-party requests only', async ({ page, baseURL }) => {
      const errors: string[] = [];
      const foreign: string[] = [];
      page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('request', (req) => {
        if (!req.url().startsWith(baseURL!) && !req.url().startsWith('data:')) foreign.push(req.url());
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/\S/);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{40,}/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://xplore-mobileapp.de${path === '/' ? '/' : path}`);
      await expect(page.locator('h1')).toHaveCount(1);

      await scrollThrough(page);
      expect(errors, 'console errors').toEqual([]);
      // No cookies, no tracking: nothing may load from another host (the trailer only after a click).
      expect(foreign, 'third-party requests').toEqual([]);
    });

    test('layout: no sideways scrolling, every image loaded and undistorted', async ({ page }) => {
      await page.goto(path);
      await scrollThrough(page);

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, 'page is wider than the viewport').toBeLessThanOrEqual(0);

      const problems = await page.evaluate(() =>
        [...document.images]
          .filter((img) => img.getClientRects().length > 0 && img.clientWidth > 0)
          .flatMap((img) => {
            const name = img.currentSrc.split('/').pop();
            if (!img.complete || img.naturalWidth === 0) return [`${name}: not loaded`];
            const fit = getComputedStyle(img).objectFit;
            if (fit === 'cover' || fit === 'contain') return [];
            const drawn = img.clientHeight / img.clientWidth;
            const natural = img.naturalHeight / img.naturalWidth;
            return Math.abs(drawn - natural) / natural > 0.03 ? [`${name}: stretched (${drawn.toFixed(2)} vs ${natural.toFixed(2)})`] : [];
          }),
      );
      expect(problems).toEqual([]);
    });
  });
}

test('unknown pages return the 404 page', async ({ page }) => {
  const response = await page.goto('/this-place-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText("isn't on the map");
});

test('llms.txt links every page in the sitemap', async ({ request }) => {
  const response = await request.get('/llms.txt');
  expect(response.status()).toBe(200);
  const text = await response.text();
  for (const path of sitePages().filter((p) => !['/imprint', '/privacy/app', '/privacy/website'].includes(p))) {
    expect(text, path).toContain(`https://xplore-mobileapp.de${path === '/' ? '/' : path})`);
  }
});

test('every page has one valid schema.org graph with the organization', async ({ page }) => {
  for (const path of sitePages()) {
    await page.goto(path);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks, path).toHaveLength(1);
    const graph = JSON.parse(blocks[0])['@graph'];
    expect(graph.map((n: { '@type': string }) => n['@type']), path).toContain('Organization');
  }
});
