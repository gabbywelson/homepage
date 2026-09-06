# Gabby's homepage

A small, static Astro site for `welson.net`, with a fresh design and published writing migrated from `~/code/garden`. The existing Quartz source remains untouched; no deployment or domain change has been made.

## Develop

Requires Node 22.12+ and Bun. Use the lockfile when installing dependencies.

```sh
bun install --frozen-lockfile
bun run dev --background
bun run astro dev status
bun run astro dev logs
bun run astro dev stop
```

## Check

```sh
bun run check
bun run test
```

`test` builds the static output, starts a temporary preview on port 4322, and runs Playwright with the local Google Chrome installation. For a different machine, install Playwright Chromium with `bunx playwright install chromium` and run `PLAYWRIGHT_CHANNEL=chromium bun run test`.

The tests cover keyboard navigation, theme persistence, live system preferences, unavailable storage, reduced motion, navigation without JavaScript, 320px layouts, enlarged text, same-origin assets, local links, metadata, RSS, and axe WCAG A/AA checks in both themes. Automated checks complement rather than replace testing with assistive technology.

## Where to edit

| What | File |
| --- | --- |
| Homepage introduction and inline links | `src/pages/index.astro` |
| Work entries, role details, education, and skills | `src/data/work.ts` |
| Name, description, social profiles, garden links | `src/data/site.ts` |
| Colors, fonts, spacing, article typography | `src/styles/global.css` |
| Theme animation and preference handling | `src/components/ThemeDial.astro` |
| Header, footer, shared metadata | `src/layouts/BaseLayout.astro` |
| Blog posts | `src/content/blog/*.md` |
| Slash-page content | `src/content/pages/*.md` |
| Garden notes | `src/content/notes/*.md` |
| Imported photos | `src/assets/garden/` |
| Old URL mappings | `src/data/legacy-redirects.json` |

The homepage uses Gabby's supplied copy. Work history, accomplishments, education, and skills are based on her supplied résumé; the homepage summarizes employers while the résumé page lists individual roles. Teaching and pre-tech experience come from her homepage copy and are left undated where no dates were supplied. Personal side projects remain unnamed, as requested by the copy. LinkedIn could not be fetched during this update, so additional profile-only details have not been imported.

The social links were carried over from the public configuration in the old garden; review them before launch. Six blog posts, six garden notes, and the About, Now, Uses, and garden introduction have been imported. The colophon describes the current Astro site and preserves the earlier Quartz colophon as history. See [migration notes](docs/garden-migration.md) for dates, source mappings, and unavailable material.

## Writing a post

Add a Markdown file to `src/content/blog/`:

```yaml
---
title: A title for your post
description: A short, plain-language summary.
pubDate: 2026-09-05
tags: [notes]
draft: false
---
```

The filename becomes the URL, such as `/blog/my-first-post/`. Nested folders also work. Optional fields are `updatedDate` and `draft`. Drafts and future-dated posts are omitted from generated routes, lists, and RSS. A new build is required when a future post reaches its publication date.

The RSS feed includes all six imported posts in reverse chronological order. Stable permalinks, `h-card` / `h-entry` / `h-feed` microformats, `rel="me"` social links, canonical URLs, page descriptions, Open Graph and Twitter metadata, sitemap, robots.txt, and a custom 404 are included. Webmentions and social-preview images are not configured yet.

Slash pages and garden notes also use Markdown. Both require `title` and `description`; slash pages optionally accept `eyebrow` and `updatedDate`. Notes live at `/garden/<filename>/`. The garden landing page renders its Markdown introduction and automatically lists notes and recent posts. Use ordinary Markdown links and relative image paths, rather than Obsidian wikilinks or `.base` embeds.

## Design & performance

Maple Mono headings, DM Sans body text, Phosphor SVG icons, and a warm paper / evening garden palette. All fonts and icons are served locally; only the selected SVGs are rendered into HTML. Font licenses and the icon license are in `public/`.

Pages are pre-rendered HTML, with no framework hydration or third-party requests. The theme dial is the only client interaction. It respects the system setting until a choice is made, remembers that choice when storage is available, follows changes from another tab, and skips transitions with reduced motion. With JavaScript disabled, the theme follows the system and the nonfunctional button stays hidden.

The original Maple Mono variable WOFF2 is sourced from the upstream `v7` branch:
https://github.com/subframe7536/maple-font/tree/v7/woff2/var

## Before the eventual launch

1. Review the imported historical content, update the dated Now/Uses information as desired, and review résumé details and social links.
2. Review `src/data/legacy-redirects.json` and the unavailable source material listed in the migration notes. Astro generates portable HTML redirects; configure HTTP 301 redirects at the chosen host using the same mapping when deploying.
3. Confirm `site` in `astro.config.mjs` and `url` in `src/data/site.ts` for the production domain.
4. Build with `SITE_INDEXABLE=true` only for the real production launch. Until then the scaffold emits `noindex, nofollow` and disallows crawling in robots.txt. This is indexing control, not access control.
5. Deploy the generated `dist/` directory through the chosen static host and configure its 404/redirect behavior.

No hosting provider is required by the source. The existing `welson.net` deployment remains the live site until the migration is ready.
