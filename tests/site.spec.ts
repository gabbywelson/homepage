import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const routes = ['/', '/blog/', '/blog/a-small-beginning/', '/resume/', '/garden/', '/now/', '/uses/', '/about/', '/colophon/'];

test('keyboard toggle persists across reloads and navigation', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.focus();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Garden' }).click();
  await expect(page).toHaveURL('/garden/');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('system theme updates until a visitor makes a choice; invalid saved values are ignored', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'invalid'));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('unavailable storage does not break the theme control', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', { value() { throw new Error('Storage disabled'); } });
    Object.defineProperty(Storage.prototype, 'setItem', { value() { throw new Error('Storage disabled'); } });
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Dark mode', exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(errors).toEqual([]);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`all routes are accessible and fit mobile in ${colorScheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of routes) {
      await page.setViewportSize({ width: 1280, height: 900 });
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://welson.net${route}`);
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      expect(accessibility.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), `${route}: ${JSON.stringify(accessibility.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })))}`).toEqual([]);
      await page.setViewportSize({ width: 320, height: 800 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test(`navigation and system theme work without JavaScript (${colorScheme})`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, colorScheme, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4322/');
    await expect(page.locator('h1')).toHaveText("I'm Gabby.");
    await expect(page.getByRole('button', { name: 'Dark mode', exact: true })).toHaveCount(0);
    const background = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
    expect(background).toBe(colorScheme === 'dark' ? 'rgb(32, 39, 33)' : 'rgb(250, 248, 243)');
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Garden' }).click();
    await page.locator('a[href="/now/"]').click();
    await expect(page.locator('h1')).toHaveText('Now.');
    await context.close();
  });
}

test('reduced motion, larger text, and same-origin assets', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  expect(await page.locator('.dial-orbit').evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s');
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => document.documentElement.style.fontSize = '200%');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const remoteAssets = await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name).filter(url => new URL(url).origin !== location.origin));
  expect(remoteAssets).toEqual([]);
});

test('RSS, sitemap, and local links resolve; sample stays out of feeds', async ({ page, request }) => {
  for (const route of routes) {
    await page.goto(route);
    const links = await page.locator('a[href^="/"], link[href^="/"]').evaluateAll(elements => [...new Set(elements.map(el => el.getAttribute('href')!))]);
    for (const href of links) expect((await request.get(href)).ok(), `${route} → ${href}`).toBe(true);
  }
  const rss = await request.get('/rss.xml');
  expect(rss.headers()['content-type']).toContain('xml');
  expect(await rss.text()).toContain('<rss');
  expect(await rss.text()).not.toContain('A small beginning');
  const sitemap = await request.get('/sitemap-0.xml');
  expect(await sitemap.text()).toContain('https://welson.net/garden/');
  expect(await sitemap.text()).not.toContain('a-small-beginning');
  const missing = await page.goto('/this-path-does-not-exist/');
  expect(missing?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveText('A little lost.');
});
