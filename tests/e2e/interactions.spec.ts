import { expect, test } from '@playwright/test';

test.describe('header', () => {
  test('desktop shows the main nav without Privacy', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop only');
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link')).toHaveText(['Features', 'Travel routes']);
  });
});

test.describe('mobile menu', () => {
  // Checks what the visitor sees, not just that elements exist: the open menu must cover the screen below
  // the header and sit on top of the page, wherever the page is scrolled to.
  for (const path of ['/', '/features', '/routes/italian-lakes-dolomites']) {
    test(`covers the screen and sits on top of the page: ${path}`, async ({ page, isMobile }) => {
      test.skip(!isMobile, 'phones only');
      await page.goto(path);
      await page.evaluate(() => scrollTo(0, 900));
      const burger = page.getByRole('button', { name: 'Open menu' });
      const sheet = page.locator('#mobile-menu');
      await burger.click();
      await expect(sheet).toBeVisible();
      await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');

      const viewport = page.viewportSize()!;
      const box = (await sheet.boundingBox())!;
      expect(box.x).toBe(0);
      expect(box.width).toBeCloseTo(viewport.width, 0);
      expect(box.y).toBeLessThanOrEqual(80);
      expect(box.y + box.height).toBeGreaterThanOrEqual(viewport.height - 1);

      const onTop = await page.evaluate(() => {
        const menu = document.getElementById('mobile-menu')!;
        const points = [[24, 120], [innerWidth / 2, innerHeight / 2], [innerWidth - 24, innerHeight - 24]];
        return points.map(([x, y]) => menu.contains(document.elementFromPoint(x, y)));
      });
      expect(onTop, 'page content shows through the open menu').toEqual([true, true, true]);

      for (const name of ['Features', 'Travel routes']) await expect(sheet.getByRole('link', { name })).toBeInViewport();
      await expect(sheet.getByRole('img', { name: 'Get it on Google Play' })).toBeInViewport();
      await expect(page.locator('body')).toHaveCSS('overflow-y', 'hidden');

      await page.keyboard.press('Escape');
      await expect(sheet).toBeHidden();
      await expect(burger).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow-y', 'hidden');
    });
  }

  test('a menu link navigates and the menu closes', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phones only');
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.locator('#mobile-menu').getByRole('link', { name: 'Travel routes' }).click();
    await expect(page).toHaveURL(/\/routes$/);
    await expect(page.locator('#mobile-menu')).toBeHidden();
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

test.describe('route post', () => {
  test('map: one numbered pin and legend entry per stop, tooltip on focus', async ({ page }) => {
    await page.goto('/routes/japan-classic-route');
    const map = page.locator('.route-map');
    await expect(map.locator('.pin')).toHaveCount(7);
    await expect(map.locator('.legend li')).toHaveCount(7);
    await expect(map).toContainText(/about [\d,]+ km between stops/);

    const nara = map.getByRole('button', { name: /^6\. Nara/ });
    await nara.focus();
    await expect(nara.getByRole('tooltip')).toBeVisible();
    await expect(nara.getByRole('tooltip')).toContainText('Rare');
  });

  test('stops: each section has its card, tips are callouts', async ({ page }) => {
    await page.goto('/routes/japan-classic-route');
    const stops = page.locator('.stop');
    await expect(stops).toHaveCount(7);
    await expect(stops.nth(0).locator('.xcard')).toContainText('Tokyo');
    await expect(stops.nth(0).locator('h3')).toContainText('Tokyo');
    await expect(stops.nth(5).locator('.xcard')).toHaveClass(/r-rare/);
    await expect(page.locator('.prose .tip').first()).toContainText('Tip:');
  });
});

test.describe('travel routes filters', () => {
  const visibleTitles = (page: import('@playwright/test').Page) => page.locator('.list .item:visible .h3').allTextContents();
  const chip = (page: import('@playwright/test').Page, group: string, name: string) =>
    page.getByRole('group', { name: group }).getByRole('button', { name, exact: true });

  test('filter by region, duration and status; empty state; reset', async ({ page }) => {
    await page.goto('/routes');
    await expect(page.locator('.list .item')).toHaveCount(3);
    await expect(page.locator('.count')).toHaveText('3 routes');

    await chip(page, 'Region', 'Asia').click();
    await expect(chip(page, 'Region', 'Asia')).toHaveAttribute('aria-pressed', 'true');
    await expect(chip(page, 'Region', 'All')).toHaveAttribute('aria-pressed', 'false');
    expect(await visibleTitles(page)).toEqual(["Japan's classic route"]);
    await expect(page.locator('.count')).toHaveText('1 route');

    // Groups combine: Europe has Iceland (7 days) and Italy (11 days).
    await chip(page, 'Region', 'Europe').click();
    await chip(page, 'Duration', '1 week').click();
    expect(await visibleTitles(page)).toEqual(["Iceland's Golden Circle"]);

    await chip(page, 'Region', 'Africa').click();
    await expect(page.locator('.list .item:visible')).toHaveCount(0);
    await expect(page.locator('.empty')).toBeVisible();
    await expect(page.locator('.empty')).toContainText('No route here yet');

    await chip(page, 'Region', 'All').click();
    expect((await visibleTitles(page)).sort()).toEqual(["Iceland's Golden Circle", "Japan's classic route"]);

    await chip(page, 'Duration', 'All').click();
    await chip(page, 'In the app', 'Available').click();
    await expect(page.locator('.empty')).toBeVisible();
    await chip(page, 'In the app', 'Coming soon').click();
    await expect(page.locator('.list .item:visible')).toHaveCount(3);
    await expect(page.locator('.empty')).toBeHidden();
  });

  test('filter by activity', async ({ page }) => {
    await page.goto('/routes');
    await chip(page, 'Activity', 'City & Culture').click();
    expect((await visibleTitles(page)).sort()).toEqual(['Italian lakes & Dolomites', "Japan's classic route"]);
  });

  test('explainer and suggestion call to action', async ({ page }) => {
    await page.goto('/routes');
    await expect(page.getByRole('heading', { name: 'From article to itinerary' })).toBeVisible();
    await expect(page.locator('.steps li')).toHaveCount(3);
    await expect(page.getByRole('heading', { name: 'Got a route we should add?' })).toBeVisible();
    await expect(page.locator('.cta').getByRole('link', { name: /@xplore_the_world_app/ })).toHaveAttribute('href', 'https://www.instagram.com/xplore_the_world_app');
  });
});

test('reviews carousel: every review in the page, buttons page through and stop at the ends', async ({ page }) => {
  await page.goto('/');
  const track = page.locator('#reviews .carousel');
  const prev = page.getByRole('button', { name: 'Previous reviews' });
  const next = page.getByRole('button', { name: 'Next reviews' });
  expect(await track.locator('li').count()).toBeGreaterThan(3);
  await expect(prev).toBeDisabled();
  await next.click();
  await expect(prev).toBeEnabled();
  await expect.poll(() => track.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await track.evaluate((el) => el.scrollTo({ left: el.scrollWidth }));
  await expect(next).toBeDisabled();
});

test('reviews: phones cut long reviews short, Read more shows the whole text', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phones only');
  await page.goto('/');
  const cards = page.locator('#reviews .review');
  const index = await cards.evaluateAll((all) => all.findIndex((c) => !c.querySelector<HTMLElement>('.more')!.hidden));
  expect(index).toBeGreaterThanOrEqual(0);
  const card = cards.nth(index);
  const text = card.locator('.original p');
  const clamped = await text.evaluate((el) => el.clientHeight);
  expect(await text.evaluate((el) => el.scrollHeight)).toBeGreaterThan(clamped);
  await card.getByRole('button', { name: 'Read more' }).click();
  await expect(card.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
  expect(await text.evaluate((el) => el.clientHeight)).toBeGreaterThan(clamped);
});
