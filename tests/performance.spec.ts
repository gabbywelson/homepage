import { expect, test } from '@playwright/test';

for (const deviceScaleFactor of [1, 2, 3]) {
  test.describe(`Résumé logos at ${deviceScaleFactor}× pixel density`, () => {
    test.use({ deviceScaleFactor });

    test('every employer and education logo loads after scrolling', async ({
      page,
    }) => {
      await page.goto('/resume/');
      const logos = page.locator('img[data-brand]');
      await expect(logos).toHaveCount(6);
      for (const logo of await logos.all()) {
        await logo.scrollIntoViewIfNeeded();
        await expect
          .poll(
            () =>
              logo.evaluate(
                (image: HTMLImageElement) =>
                  image.complete && image.naturalWidth > 0,
              ),
            {
              message: `${await logo.getAttribute('data-brand')} logo must decode at ${deviceScaleFactor}×`,
            },
          )
          .toBe(true);
      }
    });
  });
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

declare global {
  interface Window {
    testLayoutShifts: number[];
  }
}

test('saved theme and reserved dial space work before the client module loads', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
  // Astro can inline small modules; make both inline and external modules inert.
  // The synchronous head bootstrap remains intact and must set the first theme.
  await page.route('http://127.0.0.1:4322/', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replaceAll(
        'type="module"',
        'type="application/x-delayed-module"',
      ),
    });
  });
  await page.goto('/');
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(
    await page
      .locator('html')
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe('rgb(32, 39, 33)');
  const toggle = page.locator('[data-theme-toggle]');
  await expect(toggle).toBeHidden();
  const before = await heading.boundingBox();
  await page.evaluate(() => {
    for (const deferred of document.querySelectorAll<HTMLScriptElement>(
      'script[type="application/x-delayed-module"]',
    )) {
      const script = document.createElement('script');
      script.type = 'module';
      if (deferred.src) script.src = deferred.src;
      else script.textContent = deferred.textContent;
      deferred.replaceWith(script);
    }
  });
  await expect(
    page.getByRole('button', { name: 'Dark mode', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  expect(await heading.boundingBox()).toEqual(before);
});

test('delayed fonts keep text readable without late layout shifts', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    window.testLayoutShifts = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        if (!entry.hadRecentInput) window.testLayoutShifts.push(entry.value);
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  let releaseFonts: (() => void) | undefined;
  const fontsReady = new Promise<void>((resolve) => {
    releaseFonts = resolve;
  });
  await page.route('**/*.woff2', async (route) => {
    await fontsReady;
    await route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    // Font-display's short optional period must expire before delivery.
    await expect
      .poll(() => page.evaluate(() => performance.now()))
      .toBeGreaterThan(500);
    const before = await heading.boundingBox();
    releaseFonts?.();
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(await heading.boundingBox()).toEqual(before);
    expect(
      await page.evaluate(() =>
        window.testLayoutShifts.reduce((sum, value) => sum + value, 0),
      ),
    ).toBeLessThanOrEqual(0.01);
  } finally {
    releaseFonts?.();
  }
});

test('photos reserve space and offer responsive local image sources', async ({
  page,
}) => {
  for (const route of ['/uses/', '/garden/nori/', '/garden/kimchi/']) {
    await page.goto(route);
    const images = page.locator('.prose img');
    expect(await images.count()).toBeGreaterThan(0);
    for (const image of await images.all()) {
      await expect(image).toHaveAttribute('width', /^[1-9]\d*$/);
      await expect(image).toHaveAttribute('height', /^[1-9]\d*$/);
      await expect(image).toHaveAttribute('srcset', /\d+w/);
      await expect(image).toHaveAttribute('sizes');
      await expect(image).toHaveAttribute('decoding', 'async');
      await expect(image).toHaveAttribute('loading', 'eager');
      await expect(image).toHaveAttribute('fetchpriority', 'high');
    }
  }
});
