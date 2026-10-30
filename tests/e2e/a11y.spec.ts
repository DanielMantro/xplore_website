import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { scrollThrough, sitePages } from './helpers';

// Fails on serious and critical WCAG 2.1 A/AA violations.
for (const path of [...sitePages(), '/404']) {
  test(`accessibility: ${path}`, async ({ page }) => {
    await page.goto(path);
    await scrollThrough(page);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const serious = violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(serious).toEqual([]);
  });
}
