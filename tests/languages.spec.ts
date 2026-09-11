import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { localizedPath, sourcePath, localeFromPath } from '../src/i18n/locales';

test('locale paths preserve nested slugs, default URLs, and region tags', () => {
  expect(localizedPath('/blog/weeknotes/week-one/', 'zh-CN')).toBe(
    '/zh-cn/blog/weeknotes/week-one/',
  );
  expect(sourcePath('/zh-cn/blog/weeknotes/week-one/')).toBe(
    '/blog/weeknotes/week-one/',
  );
  expect(localeFromPath('/zh-cn/uses/')).toBe('zh-CN');
  expect(localizedPath('/fr/about/', 'en')).toBe('/about/');
  expect(localizedPath('/fr/about/', 'es')).toBe('/es/about/');
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`footer language picker works on mobile in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');
    const trigger = page.locator('[data-language-picker] summary');
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-language-picker]')).toHaveAttribute(
      'open',
    );
    await expect(page.locator('.language-picker__list > li')).toHaveCount(4);
    await expect(page.locator('.language-picker__panel')).toContainText(
      'Español',
    );
    await expect(page.locator('.language-picker__panel')).toContainText(
      'Français',
    );
    await expect(page.locator('.language-picker__panel')).toContainText(
      '简体中文',
    );
    const panel = await page.locator('.language-picker__panel').boundingBox();
    expect(panel && panel.x >= 0 && panel.x + panel.width <= 320).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-language-picker]')).not.toHaveAttribute(
      'open',
    );
    await expect(trigger).toBeFocused();
    await trigger.click();
    // Click the page margin; the open panel intentionally overlays the footer.
    await page.mouse.click(5, 780);
    await expect(page.locator('[data-language-picker]')).not.toHaveAttribute(
      'open',
    );
  });
}

test('language selection remains usable without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/');
  await page.locator('[data-language-picker] summary').click();
  await expect(page.locator('.language-picker__panel')).toBeVisible();
  await page.locator('.language-picker__option[hreflang="en"]').click();
  await expect(page).toHaveURL('http://127.0.0.1:4322/');
  await context.close();
});
