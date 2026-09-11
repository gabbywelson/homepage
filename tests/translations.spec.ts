import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.skip(
  process.env['I18N_TEST_FIXTURES'] !== '1',
  'Run through bun run test:translations with temporary fixtures.',
);

test('translated writing renders statically with correct links, images, metadata and feeds', async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/fr/blog/translation-fixture/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(page.locator('h1')).toContainText('Bonjour');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://welson.net/fr/blog/translation-fixture/',
  );
  for (const [locale, path] of [
    ['en', '/blog/translation-fixture/'],
    ['fr', '/fr/blog/translation-fixture/'],
    ['x-default', '/blog/translation-fixture/'],
  ]) {
    await expect(page.locator(`link[hreflang="${locale}"]`)).toHaveAttribute(
      'href',
      `https://welson.net${path}`,
    );
  }
  await expect(
    page.locator('.prose a').filter({ hasText: 'Translated page' }),
  ).toHaveAttribute('href', '/fr/translation-fixture/');
  await expect(
    page.locator('.prose a').filter({ hasText: 'English résumé' }),
  ).toHaveAttribute('href', '/resume/');
  await expect(
    page.locator('.prose a').filter({ hasText: 'English résumé' }),
  ).toHaveAttribute('hreflang', 'en');
  await expect(page.locator('.prose img')).toHaveAttribute('loading', 'eager');
  await expect(page.locator('.prose img')).toHaveAttribute(
    'fetchpriority',
    'high',
  );
  await expect
    .poll(() =>
      page
        .locator('.prose img')
        .evaluate(
          (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
        ),
    )
    .toBe(true);
  const footnote = page.locator('[data-footnote-ref]');
  const target = await footnote.getAttribute('href');
  await footnote.click();
  expect(new URL(page.url()).hash).toBe(target);
  await page.locator('[data-language-picker] summary').click();
  await page.locator('.language-picker__option[hreflang="en"]').click();
  await expect(page).toHaveURL(
    'http://127.0.0.1:4322/blog/translation-fixture/',
  );
  const feed = await (await request.get('/fr/rss.xml')).text();
  expect(feed).toContain('/fr/blog/translation-fixture/');
  expect(feed).not.toContain('translation-draft-fixture');
  for (const slug of [
    'translation-draft-fixture',
    'translation-future-fixture',
    'translation-orphan-fixture',
  ]) {
    expect((await request.get(`/fr/blog/${slug}/`)).status()).toBe(404);
    expect(feed).not.toContain(slug);
  }
  await context.close();
});

test('translated pages and open picker remain accessible in both themes and narrow layouts', async ({
  page,
}) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const path of [
      '/fr/blog/translation-fixture/',
      '/fr/translation-fixture/',
      '/fr/blog/',
    ]) {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await page.locator('[data-language-picker] summary').click();
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
