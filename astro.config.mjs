// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://welson.net',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: (page) => !page.includes('/blog/a-small-beginning/') })],
  markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
});
