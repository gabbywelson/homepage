// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import redirects from './src/data/legacy-redirects.json';
import { markdownProcessor } from './src/lib/markdown.ts';
import gtConfig from './gt.config.json' with { type: 'json' };

// https://astro.build/config
export default defineConfig({
  site: 'https://welson.net',
  output: 'static',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', ...gtConfig.locales.map((code) => code.toLowerCase())],
    routing: { prefixDefaultLocale: false },
  },
  redirects,
  fonts: [
    {
      name: 'DM Sans Variable',
      cssVariable: '--font-body',
      provider: fontProviders.local(),
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          {
            src: [
              '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2',
            ],
            weight: '100 1000',
            style: 'normal',
            display: 'optional',
          },
          {
            src: [
              '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-italic.woff2',
            ],
            weight: '100 1000',
            style: 'italic',
            display: 'optional',
          },
        ],
      },
    },
    {
      name: 'Maple Mono',
      cssVariable: '--font-mono',
      provider: fontProviders.local(),
      fallbacks: ['monospace'],
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/maple-mono-latin.woff2'],
            weight: '100 800',
            style: 'normal',
            display: 'optional',
          },
        ],
      },
    },
  ],
  image: {
    layout: 'constrained',
    // Additional candidates cover the 624px prose column up to 2x.
    breakpoints: [320, 624, 960, 1248],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !Object.keys(redirects).some(
          (path) => new URL(page).pathname.replace(/\/$/, '') === path,
        ),
    }),
  ],
  markdown: {
    processor: markdownProcessor,
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
