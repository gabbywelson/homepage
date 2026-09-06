# Working in this repository

This is Gabby Welson's static personal site, built with Astro and Bun. Preserve
the warm light/dark design, typography, writing, and whimsical theme dial.
The old `~/code/garden` repository is migration reference material; this is the
active site. Keep changes scoped and never commit credentials, environment files,
browser state, generated output, or reports.

## Commands and checks

Use the Node versions declared in `package.json` and the pinned Bun version in
`packageManager`. Install with `bun install --frozen-lockfile`.

Start the development server in background mode:

```sh
bun run dev --background
bun run astro dev status
bun run astro dev logs
bun run astro dev stop
```

Run Astro content-sync commands (`astro check`, `astro build`, dev) sequentially
within a checkout: they share generated content caches. Avoid concurrent builds
or sharing `node_modules/.astro` between checkouts.

Restart the dev server after changing installed dependencies. Keep `sharp` as a
direct dependency: Astro's development image endpoint needs its native runtime,
and a stale process can return `MissingSharp` errors even when builds succeed.

```sh
bun run format          # format code/config/docs, preserving imported writing
bun run check           # Astro + TypeScript 7 + lint + formatting, zero warnings
bun run test            # build, then Playwright on isolated preview port 4322
bun run test:performance # build, then mobile Lighthouse budgets on port 4324
```

Without Google Chrome, install `bunx playwright install chromium` and run
`PLAYWRIGHT_CHANNEL=chromium bun run test`. Lighthouse uses Chrome or the
executable specified by `CHROME_PATH`. After an existing build, run
`node scripts/lighthouse.mjs --desktop /` for a desktop audit. Reports go into
ignored `lighthouse-report/`; browser artifacts go into ignored `test-results/`.
See `docs/performance.md` for measurement conditions and budgets.

CI (`.github/workflows/quality.yml`) installs the frozen lockfile, runs `check`,
builds once, and runs browser tests. Run checks relevant to a change, fix
failures, and report commands that could not run. Layout/theme changes need
browser checks in both themes and at mobile widths; font/image changes also
need performance checks. Do not add tests that merely repeat implementation.

## Architecture

| Location                          | Responsibility                                                            |
| --------------------------------- | ------------------------------------------------------------------------- |
| `src/pages/`                      | File-based routes, static path generation, endpoints and page composition |
| `src/layouts/BaseLayout.astro`    | Document, metadata, navigation, footer, fonts and early theme bootstrap   |
| `src/layouts/PageLayout.astro`    | Shared title, introduction, theme dial and slotted content                |
| `src/components/`                 | Reusable Astro markup with scoped styles; no framework hydration          |
| `src/data/`                       | Typed identity, links, résumé data and legacy redirects                   |
| `src/types/site.ts`               | Readonly data contracts, brand names and URL types                        |
| `src/lib/`                        | Build-time content helpers, icon registry and Markdown image sizing       |
| `src/scripts/`                    | Browser-only theme initialization and interaction                         |
| `src/content.config.ts`           | Collection loaders and validated frontmatter schemas                      |
| `src/content/{blog,pages,notes}/` | Markdown writing                                                          |
| `src/assets/`                     | Build-optimized images and fonts                                          |
| `public/`                         | Pass-through files such as favicon and license notices                    |

Keep the site static and server-rendered. Prefer Astro components over adding
a UI framework; ship browser JavaScript only for interaction that needs it.
Shared data/types/helpers must not import `.astro` views (lint enforces this).
Keep browser globals out of build-time helpers. Use the existing layouts for
metadata and accessibility rather than duplicating document heads.

## TypeScript and tooling

- `astro/tsconfigs/strictest`, `checkJs`, and explicit index access are enabled.
  `astro check` checks component frontmatter, templates and scripts; native
  TypeScript 7 checks TypeScript and JavaScript, including scripts and tests.
- TypeScript 7.0.2 is installed as `@typescript/native`; `typescript` remains on
  6.x because Astro/Volar and typescript-eslint require its compiler API. The
  explicit native path in `typecheck` avoids binary-name collisions. Keep both
  checks until those integrations support the native API; `astro build` alone
  does not provide type safety.
- Infer obvious local types, type public props/data contracts, and use
  `as const satisfies` for immutable configuration. Use `import type`. Validate
  optional data and DOM lookups; avoid `any`, unchecked assertions and non-null
  assertions. Optional props may explicitly include `undefined` when forwarding
  values under `exactOptionalPropertyTypes`.
- ESLint checks TypeScript with type-aware rules and Astro with its dedicated
  parser, script extraction and accessibility rules. Prettier with
  `prettier-plugin-astro` is the sole formatter, including CSS. Full Astro support
  in Biome is still experimental; verify support before switching.
- Preserve intentionally ignored imported Markdown and migration inventories
  when formatting. Commit dependency/config edits with `bun.lock`.

## CSS conventions

Use scoped `<style>` blocks beside the component/page owning the markup.
Use multiline CSS and BEM for compound components: `work-list`,
`work-list__role`, `work-list--detailed`. Keep responsive and print rules with
their owner. Avoid global component-layout selectors, generic modifiers,
inline presentation styles, and repeated overrides.

Global stylesheet boundaries are deliberate:

- `tokens.css`: light/dark colors, system-theme fallback and print tokens.
- `global.css`: imports tokens, document defaults and shared text/focus utilities.
- `content.css`: shared spacing for content passed through layout slots.
- `prose.css`: Markdown descendants and Shiki dark colors; import only where
  Markdown is rendered. Markdown nodes are outside Astro's scope, so `.prose`
  selectors intentionally remain global.

Use token custom properties. `Icon` accepts a class and exposes inherited
`--icon-size` and `--icon-color`; use these instead of reaching into child markup.
Use `:global()` only at documented boundaries (root theme state, generated
SVG/Markdown). Avoid `!important` except where Shiki inline styles or reduced
motion require an override.

## Loading and accessibility

Fonts use Astro's local provider in `astro.config.mjs`, hashed assets, generated
metric-adjusted fallbacks, and `font-display: optional`. Preload only the two
normal faces used above the fold. Slow connections may retain the fallback for
that navigation to avoid late reflow. Source font files are unserved; see
`src/assets/fonts/README.md` for reproducible subsetting and licenses.

Keep photographs in `src/assets/` and use Astro/Markdown to generate intrinsic
dimensions and responsive sources. Do not put unoptimized photos in `public/`.
Keep Markdown `sizes` in `src/lib/markdown.ts` aligned with the 624px content
column and BaseLayout padding. Below-fold images load lazily; explicitly
prioritize an image only when it is the page's measured LCP. `BrandLogo` owns
small fixed-size WebP variants; adjacent text supplies the accessible name.

Set optional `priorityImage` frontmatter to the exact relative Markdown image
path for a measured above-fold LCP photo. The processor gives that image eager
loading, high fetch priority and explicit sizes; other photos retain lazy loading.
When changing Markdown processor code, run `bun run astro sync --force` before
building: Astro's content cache does not detect edits to plugin function bodies.

`theme-bootstrap.js` is linted/type-checked JavaScript inserted synchronously in
the head. Keep it standalone and early so saved preferences apply before paint.
`theme.ts` enhances the fixed-size dial, handles optional storage, system changes
and cross-tab preferences. Preserve no-JavaScript navigation, the system-theme
CSS fallback, reduced motion, keyboard operation and visible focus.

Maintain one h1, ordered headings, landmarks, meaningful link names, descriptive
photo alt text, decorative icon semantics, and intrinsic media dimensions.
Browser tests cover all content routes and 320px layouts.

## Content and deployment

`getPosts()` is the publication filter/sort for blog routes, lists and RSS:
drafts and future posts stay excluded. Dates render in UTC. Schemas reject blank
titles/descriptions. Use ordinary Markdown links and relative image paths;
preserve imported footnotes and dated snapshots.

Use trailing slashes consistently. Keep redirects and migration mappings
working; sitemap excludes redirects. `site.url` and Astro's `site` must agree.
Preview builds intentionally emit `noindex, nofollow` and disallow robots. Do not
enable indexing merely to improve Lighthouse scores. `SITE_INDEXABLE=true` is
for an explicitly intended production build. Source maintenance does not imply
a hosting change. Hosting must supply HTTPS, compression, immutable caching for
hashed `/_astro/` assets, real HTTP redirects and the 404 status.

## Astro documentation

Consult relevant official guides before changing these areas:

- [Routing](https://docs.astro.build/en/guides/routing/)
- [Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Framework components](https://docs.astro.build/en/guides/framework-components/)
- [Content collections](https://docs.astro.build/en/guides/content-collections/)
- [Styles](https://docs.astro.build/en/guides/styling/)
- [Fonts](https://docs.astro.build/en/guides/fonts/)
- [Images](https://docs.astro.build/en/guides/images/)
- [Internationalization](https://docs.astro.build/en/guides/internationalization/)
