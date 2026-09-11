# Gabby's homepage

A small, static Astro site for `welson.net`, with a fresh design and published writing migrated from `~/code/garden`. The site is hosted by the `homepage` Cloudflare Worker at https://welson.net. The existing Quartz repository remains migration reference material.

## Develop

Requires Node 22.22.3+, 24.16+, or 26.3+ within the supported ranges in
`package.json`, and Bun 1.3.14. Use the lockfile when installing dependencies.

```sh
bun install --frozen-lockfile
bun run dev --background
bun run astro dev status
bun run astro dev logs
bun run astro dev stop
```

## Check

```sh
bun run format
bun run check
bun run test
bun run test:performance
```

`check` runs Astro's component checker, the latest stable TypeScript 7 compiler,
ESLint, and Prettier. Astro uses its strictest TypeScript preset; JavaScript,
scripts, tests, data and configuration are also checked. ESLint understands Astro
frontmatter, templates and browser scripts, with accessibility rules and
type-aware rules for TypeScript. Prettier formats Astro, CSS and configuration;
imported Markdown writing is deliberately excluded.

TypeScript 7 currently has no compiler API for Astro/Volar or typescript-eslint.
The native compiler is therefore installed under `@typescript/native`, alongside
TypeScript 6 for those integrations. `typecheck` invokes both explicitly.
ESLint and Prettier provide full Astro coverage while Biome's complete Astro
support remains experimental. See [Microsoft's compatibility guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
and [Biome's language support](https://biomejs.dev/internals/language-support/).

`test` builds the static output, starts a temporary preview on port 4322, and runs Playwright with the local Google Chrome installation. For a different machine, install Playwright Chromium with `bunx playwright install chromium` and run `PLAYWRIGHT_CHANNEL=chromium bun run test`.

The tests cover keyboard navigation, theme persistence, live system preferences, unavailable storage, reduced motion, navigation without JavaScript, 320px layouts, enlarged text, same-origin assets, local links, metadata, RSS, and axe WCAG A/AA checks in both themes. Automated checks complement rather than replace testing with assistive technology.

Loading regressions also test the saved theme before the interaction module runs,
delayed fonts without late layout shifts, and intrinsic responsive image sizes.
`test:performance` runs local mobile Lighthouse audits with budgets and saves HTML
and JSON reports under `lighthouse-report/`. See [performance notes](docs/performance.md).
CI runs the frozen install, code checks, build and Playwright suite. Run Astro
build/check/dev processes sequentially because they share generated content caches.

## Where to edit

See [Editing the homepage and résumé](docs/profile-content.md) for examples,
inline components, dates, and the translation workflow.

| What                                              | File                                                     |
| ------------------------------------------------- | -------------------------------------------------------- |
| Homepage introduction and inline links            | `src/content/home/en/index.mdx`                          |
| Work entries, role details, education, and skills | `src/content/resume/en/`                                 |
| Name, description, social profiles, garden links  | `src/data/site.ts`                                       |
| Color palette and shared document defaults        | `src/styles/tokens.css`, `src/styles/global.css`         |
| Markdown typography and shared content spacing    | `src/styles/prose.css`, `src/styles/content.css`         |
| Component/page layout, responsive and print CSS   | Scoped `<style>` beside the owning Astro markup          |
| Font configuration and subsetting                 | `astro.config.mjs`, `src/assets/fonts/README.md`         |
| Theme animation                                   | `src/components/ThemeDial.astro`                         |
| Early theme and preference handling               | `src/scripts/theme-bootstrap.js`, `src/scripts/theme.ts` |
| Shared data contracts and icon registry           | `src/types/site.ts`, `src/lib/icons.ts`                  |
| Header, footer, shared metadata                   | `src/layouts/BaseLayout.astro`                           |
| Blog posts                                        | `src/content/blog/en/**/*.md`                            |
| Slash-page content                                | `src/content/pages/en/*.md`                              |
| Garden notes                                      | `src/content/notes/en/*.md`                              |
| Imported photos                                   | `src/assets/garden/`                                     |
| Old URL mappings                                  | `src/data/legacy-redirects.json`                         |

The homepage uses Gabby's supplied copy. Work history, accomplishments, education, and skills are based on her supplied résumé; the homepage summarizes employers while the résumé page lists individual roles. Teaching and pre-tech experience come from her homepage copy and are left undated where no dates were supplied. Personal side projects remain unnamed, as requested by the copy. LinkedIn could not be fetched during this update, so additional profile-only details have not been imported.

The social links were carried over from the public configuration in the old garden; review them before launch. Six blog posts, six garden notes, and the About, Now, Uses, and garden introduction have been imported. The colophon describes the current Astro site and preserves the earlier Quartz colophon as history. See [migration notes](docs/garden-migration.md) for dates, source mappings, and unavailable material.

## Translations

General Translation generates Markdown and shared UI dictionaries for Spanish,
French, and Simplified Chinese. English stays at its existing URLs; translated pages are generated only
when their content and UI dictionary exist. See [the translation workflow](docs/translations.md)
for API-key setup, language selection, the $25 budget guidance, generation, review,
and current coverage. All content remains configured; the CLI does not enforce a
spending cap.

## Writing a post

Add a Markdown file to `src/content/blog/en/`:

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

Pages are pre-rendered HTML, with no framework hydration or third-party requests. The theme dial and progressively enhanced language picker provide client interaction. It respects the system setting until a choice is made, remembers that choice when storage is available, follows changes from another tab, and skips transitions with reduced motion. With JavaScript disabled, the theme follows the system and the nonfunctional button stays hidden.

Astro's local font provider generates hashed URLs and adjusted fallback faces.
The normal body and heading faces are preloaded; italics load on demand. Fonts
use `font-display: optional`: on a slow connection, readable fallback text remains
for that navigation instead of moving after a late swap. Maple Mono is subset
from 130,908 to 66,040 bytes. The checked-in source and reproducible subset script
are documented in [the font README](src/assets/fonts/README.md).

Astro generates WebP images with intrinsic dimensions and responsive candidates.
Markdown image sizes match the 624px prose column; list logos and below-fold
photographs load lazily. For a measured above-fold LCP photo, optional
`priorityImage` frontmatter names its exact relative Markdown path and enables
eager loading and high fetch priority. Component styles stay scoped, shared tokens live in one place, and
Markdown styles are imported only by pages that render Markdown. Naming follows
BEM for compound components. [AGENTS.md](AGENTS.md) documents ownership,
conventions, checks and deployment constraints for future work.

The original Maple Mono variable WOFF2 is sourced from the upstream `v7` branch:
https://github.com/subframe7536/maple-font/tree/v7/woff2/var

## Deploy

The public repository is https://github.com/gabbywelson/homepage. Cloudflare
Workers Static Assets serves `dist/` without a server runtime or SSR adapter.
`wrangler.jsonc` owns the `homepage` Worker and its `welson.net` and
`www.welson.net` custom-domain bindings.

```sh
bunx wrangler login
bun run check
bun run deploy
```

`deploy` always creates a fresh production build with `SITE_INDEXABLE=true`.
Ordinary `bun run build` and development remain non-indexable. The workers.dev
URL also receives an `X-Robots-Tag` header to avoid duplicate indexing.

`build` runs `scripts/hosting.mjs` after Astro to generate real HTTP 301 rules
from `src/data/legacy-redirects.json`, for both slash variants. `public/_headers`
sets immutable caching for hashed `/_astro/` assets; HTML revalidates normally.
Missing URLs serve the custom 404 with an HTTP 404 status. Configuration enforces
trailing slashes for HTML routes.

After deploying, check the homepage, résumé logos, a legacy redirect, a missing
URL, robots.txt, sitemap, and hashed asset cache headers. Keep credentials in
Wrangler's local login store or CI secrets, never in this repository.

**DNS boundary:** this domain also hosts email. Only manage the two website
custom-domain bindings above. Never replace the DNS zone or change MX, TXT
(SPF/DKIM/DMARC), mail-related CNAMEs, or unrelated records during site deploys.

Routine deploys use `scripts/deploy.mjs`: upload a uniquely tagged version, then
send 100% of traffic to that exact version. These commands do not reapply domain
bindings. Avoid noninteractive `wrangler deploy` or `wrangler triggers deploy`
for routine releases: Wrangler may implicitly replace conflicting DNS records.
Domain changes require a separately inspected changeset and DNS replacement
disabled. The existing custom domains are recorded in `wrangler.jsonc` for
reference and recovery, not changed by `bun run deploy`.
