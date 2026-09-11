import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const phase = process.env['PROFILE_TEST_PHASE'];
test.skip(
  !phase,
  'Run bun run test:profile-translations for reversible fixtures.',
);

test('homepage MDX preserves rich links and shares translated company summaries without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/fr/');
  await expect(page.locator('main')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('h1')).toContainText('Bonjour, moi c’est Gabby');
  await expect(page.locator('.home-accent').first()).toContainText(
    'software engineer',
  );
  await expect(
    page.locator(
      '.home-intro__copy a[href="https://joinhandshake.com/ai"] [data-brand="handshake"]',
    ),
  ).toHaveCount(1);
  await expect(
    page.locator('.home-intro__copy a[href="/fr/garden/"]'),
  ).toHaveCount(2);
  await expect(
    page.locator('.home-intro__copy a[href="/fr/blog/"]'),
  ).toHaveCount(1);
  await expect(page.locator('.work-list__item').first()).toContainText(
    'Ingénieure senior → Ingénieure fondatrice',
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://welson.net/fr/',
  );
  await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
    'href',
    'https://welson.net/',
  );
  await page.goto('http://127.0.0.1:4322/');
  await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute(
    'href',
    'https://welson.net/fr/',
  );
  await context.close();
});

test('résumé completeness controls language, source dates and reciprocal alternates', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/fr/resume/');
  await expect(page.locator('.work-list__role')).toHaveCount(6);
  await expect(page.locator('.education-list > li')).toHaveCount(3);
  if (phase === 'complete') {
    await expect(page.locator('main')).toHaveAttribute('lang', 'fr');
    await expect(page.locator('h1')).toContainText('Mon parcours');
    await expect(page.locator('.work-list__role').first()).toContainText(
      'Ingénieure fondatrice',
    );
    await expect(page.locator('.work-list__role').first()).toContainText(
      'février 2025',
    );
    await expect(page.locator('.work-list__highlights').first()).toContainText(
      'Refonte du parcours',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://welson.net/fr/resume/',
    );
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute(
      'href',
      'https://welson.net/resume/',
    );
  } else {
    await expect(page.locator('main')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText('Résumé.');
    await expect(page.locator('.work-list__role').first()).toContainText(
      'Founding Engineer, Handshake AI',
    );
    await expect(page.locator('.content-footer a')).toHaveAttribute(
      'href',
      '/resume/',
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://welson.net/resume/',
    );
    await expect(page.locator('link[hreflang]')).toHaveCount(0);
  }
  await page.goto('http://127.0.0.1:4322/resume/');
  if (phase === 'complete')
    await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute(
      'href',
      'https://welson.net/fr/resume/',
    );
  else await expect(page.locator('link[hreflang="fr"]')).toHaveCount(0);
  await context.close();
});

test('profile content remains accessible in both themes at 320px', async ({
  page,
}) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 320, height: 800 });
    for (const path of ['/fr/', '/fr/resume/']) {
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
  }
});
