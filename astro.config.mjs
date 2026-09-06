// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import redirects from './src/data/legacy-redirects.json';

// https://astro.build/config
export default defineConfig({
  site: 'https://welson.net',
  output: 'static',
  trailingSlash: 'always',
  redirects,
  integrations: [sitemap({ filter: (page) => !Object.keys(redirects).some((path) => new URL(page).pathname.replace(/\/$/, '') === path) })],
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
});
