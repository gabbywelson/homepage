import { existsSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolveLocalizedLink } from '../src/i18n/navigation';

test('internal links share locale, query, fragment, redirect and asset rules', () => {
  const paths = new Set([
    '/zh-cn/',
    '/zh-cn/about/',
    '/zh-cn/blog/',
    '/zh-cn/resume/',
  ]);
  const resolve = (href: string) =>
    resolveLocalizedLink(href, 'zh-CN', (path) => paths.has(path));
  expect(resolve('/')).toEqual({ href: '/zh-cn/', hreflang: 'zh-CN' });
  expect(resolve('/about?from=home')).toEqual({
    href: '/zh-cn/about/?from=home',
    hreflang: 'zh-CN',
  });
  expect(resolve('https://welson.net/fr/about/')).toEqual({
    href: '/zh-cn/about/',
    hreflang: 'zh-CN',
  });
  expect(resolve('/posts/')).toEqual({
    href: '/zh-cn/blog/',
    hreflang: 'zh-CN',
  });
  expect(resolve('/missing/')).toEqual({ href: '/missing/', hreflang: 'en' });
  expect(resolve('/about/?from=home#heading')).toEqual({
    href: '/about/?from=home#heading',
    hreflang: 'en',
  });
  for (const href of [
    '#heading',
    '?page=2',
    '../photo.webp',
    '/favicon.svg',
    '/rss.xml',
    'mailto:hello@example.com',
    'https://example.com/about/',
    '//example.com/about/',
  ]) {
    expect(resolve(href)).toEqual({ href });
  }
});

for (const [prefix, locale] of [
  ['es', 'es'],
  ['fr', 'fr'],
  ['zh-cn', 'zh-CN'],
] as const) {
  test(`navigation stays in ${locale}, including home and résumé, without JavaScript`, async ({
    browser,
    page: auditPage,
  }) => {
    test.skip(
      !existsSync(`src/i18n/messages/${locale}.json`),
      'Translation dictionary is not available yet.',
    );
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4322/${prefix}/blog/`);
    await page.locator('.wordmark').click();
    await expect(page).toHaveURL(`http://127.0.0.1:4322/${prefix}/`);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('main')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.theme-control')).toHaveAttribute(
      'lang',
      locale,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://welson.net/',
    );
    await expect(page.locator('.home-intro__now')).toHaveAttribute(
      'href',
      `/${prefix}/now/`,
    );
    await expect(page.locator('.garden-invitation a')).toHaveAttribute(
      'href',
      `/${prefix}/garden/`,
    );
    await page.locator(`.site-header nav a[href="/${prefix}/resume/"]`).click();
    await expect(page.locator('h1')).toHaveText('Résumé.');
    await expect(page.locator('main')).toHaveAttribute('lang', 'en');
    await expect(page.locator('.footer-signature')).toHaveAttribute(
      'href',
      `/${prefix}/`,
    );
    await page.locator('.footer-signature').click();
    await page.goto(`http://127.0.0.1:4322/${prefix}/blog/coming-out/`);
    await page.locator('.p-author').click();
    await expect(page).toHaveURL(`http://127.0.0.1:4322/${prefix}/`);
    await context.close();
    // Axe needs JavaScript; keep its audit separate from the no-JS journey.
    for (const colorScheme of ['light', 'dark'] as const) {
      await auditPage.emulateMedia({ colorScheme });
      await auditPage.setViewportSize({ width: 320, height: 800 });
      await auditPage.goto(`/${prefix}/`);
      expect(
        await auditPage.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        (
          await new AxeBuilder({ page: auditPage })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
  });
}
