import { expect, test } from '@playwright/test';

test.describe('header', () => {
  test('desktop shows the main nav without Privacy', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link')).toHaveText(['Features', 'Travel routes']);
  });

  test('mobile menu opens, shows links and badges, and closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    const burger = page.getByRole('button', { name: 'Open menu' });
    const sheet = page.locator('#mobile-menu');
    await expect(sheet).toBeHidden();
    await burger.click();
    await expect(sheet).toBeVisible();
    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await expect(sheet.getByRole('link', { name: 'Travel routes' })).toBeVisible();
    await expect(sheet.getByRole('img', { name: 'Get it on Google Play' })).toBeVisible();
    await burger.click();
    await expect(sheet).toBeHidden();
  });
});

test('store badges link to the right stores', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await expect(footer.getByRole('link', { name: 'Download on the App Store' })).toHaveAttribute('href', 'https://apps.apple.com/app/id6760126153');
  await expect(footer.getByRole('link', { name: 'Get it on Google Play' })).toHaveAttribute('href', 'https://play.google.com/store/apps/details?id=app.xplore');
});

test('footer: Instagram icon only under Follow, no email address', async ({ page }) => {
  await page.goto('/');
  const follow = page.getByRole('navigation', { name: 'Follow' });
  await expect(follow.getByRole('link')).toHaveCount(1);
  await expect(follow.getByRole('link', { name: 'Xplore on Instagram' })).toBeVisible();
  await expect(page.locator('footer a[href^="mailto:"]')).toHaveCount(0);
});

test('trailer loads YouTube only after a click', async ({ page }) => {
  const youtube: string[] = [];
  // Don't actually reach YouTube from tests; record and block.
  await page.route(/youtube/, (route) => {
    youtube.push(route.request().url());
    return route.abort();
  });
  await page.goto('/');
  const trailer = page.locator('.trailer');
  await trailer.scrollIntoViewIfNeeded();
  await expect(trailer.locator('iframe')).toHaveCount(0);
  expect(youtube).toEqual([]);

  await trailer.getByRole('button', { name: /Play the Xplore trailer/ }).click();
  await expect(trailer.locator('iframe')).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
});

test('features: section chips jump to sections and highlight the current one', async ({ page }) => {
  await page.goto('/features');
  const chips = page.getByRole('navigation', { name: 'Feature sections' });
  await chips.getByRole('link', { name: 'Unlock' }).click();
  await expect(page).toHaveURL(/#unlock$/);
  await expect(page.locator('#unlock')).toBeInViewport();
  await expect(chips.getByRole('link', { name: 'Unlock' })).toHaveAttribute('aria-current', 'true');
});

test('features: FAQ answers open and close', async ({ page }) => {
  await page.goto('/features#faq');
  const question = page.locator('#faq details').nth(1);
  await expect(question).not.toHaveAttribute('open');
  await question.locator('summary').click();
  await expect(question).toHaveAttribute('open');
});

test('legal pages: table of contents lists every numbered section', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the desktop side panel is hidden on phones');
  await page.goto('/privacy/app');
  const toc = page.locator('nav.toc a');
  await expect(toc).toHaveCount(await page.locator('article h2').count());
  await expect(toc.first()).toHaveText('1. Data controller');
});

test('route post: month strip, collect cards and in-app status', async ({ page }) => {
  await page.goto('/routes/japan-classic-route');
  await expect(page.locator('.glance .months > div')).toHaveCount(12);
  await expect(page.locator('.glance .months .m-best')).toHaveCount(5);
  await expect(page.locator('.collect .xcard')).toHaveCount(7);
  await expect(page.locator('.collect')).toContainText('Coming to the Xplore trip planner');
});

test('privacy policies stay out of search engines until reviewed', async ({ page }) => {
  for (const path of ['/privacy/app', '/privacy/website']) {
    await page.goto(path);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  }
  await page.goto('/features');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
});

test.describe('get the app', () => {
  test('desktop: popover with QR code and badges, closes with Escape', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await page.goto('/');
    const popover = page.locator('#get-app');
    await expect(popover).toBeHidden();
    await page.getByRole('banner').getByRole('button', { name: 'Get the app' }).click();
    await expect(popover).toBeVisible();
    await expect(popover.getByRole('img', { name: /QR code/ }).locator('svg')).toBeVisible();
    await expect(popover.getByRole('link', { name: 'Get it on Google Play' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
  });

  test('phones: links straight to /get', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile only');
    await page.goto('/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Get the app' })).toHaveAttribute('href', '/get');
  });
});

test('cards lift and glow on hover', async ({ page, isMobile }) => {
  test.skip(isMobile, 'no hover on touch screens');
  await page.goto('/routes/japan-classic-route');
  const card = page.locator('.collect .xcard').first();
  const shadow = () => card.evaluate((el) => getComputedStyle(el).boxShadow);
  const before = await shadow();
  await card.hover();
  await expect(card).toHaveCSS('translate', '0px -4px');
  expect(await shadow()).not.toBe(before);
});

test('home hero: four cards fanned around the phone, the Epic card in front', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the fan is desktop only');
  await page.goto('/');
  await expect(page.locator('.hero .visual .xcard')).toHaveCount(4);
  await expect(page.locator('.hero .visual .xcard.front')).toHaveClass(/r-epic/);
});

test('404 shows the card back', async ({ page }) => {
  await page.goto('/nowhere');
  await expect(page.getByRole('img', { name: 'Card back: an undiscovered place' })).toBeVisible();
});
