import { expect, test } from '@playwright/test';
import { sitePages } from './helpers';

test('every internal link and in-page anchor resolves', async ({ page, request }) => {
  const checked = new Map<string, number>();
  const broken: string[] = [];

  for (const path of sitePages()) {
    await page.goto(path);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')!));
    for (const href of hrefs) {
      if (/^(https?:|mailto:|tel:)/.test(href)) continue;
      const url = new URL(href, page.url());
      const target = url.pathname;

      if (!checked.has(target)) checked.set(target, (await request.get(target)).status());
      if (checked.get(target) !== 200) broken.push(`${path} → ${href} (${checked.get(target)})`);

      if (url.hash) {
        const id = decodeURIComponent(url.hash.slice(1));
        const exists =
          target === new URL(page.url()).pathname
            ? await page.locator(`[id="${id}"]`).count()
            : (await (await request.get(target)).text()).includes(`id="${id}"`);
        if (!exists) broken.push(`${path} → ${href} (missing #${id})`);
      }
    }
  }
  expect(broken).toEqual([]);
});
