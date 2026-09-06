# Performance and quality audit

Measured September 5, 2026 on macOS with Lighthouse 13.4.1 and Chrome 152,
against Astro's production output on localhost. Mobile runs use Lighthouse's
default simulated throttling: 150ms RTT, roughly 1.6Mbps throughput, 4× CPU
slowdown, and a 412×823 viewport. These are local lab measurements, not field
measurements of the eventual hosting service. Scores can vary between runs.

## Final mobile measurements

| Route               | Performance | Accessibility | Best practices |    LCP | CLS |
| ------------------- | ----------: | ------------: | -------------: | -----: | --: |
| `/`                 |         100 |           100 |            100 | 1.80 s |   0 |
| `/blog/`            |         100 |           100 |            100 | 1.65 s |   0 |
| `/resume/`          |         100 |           100 |            100 | 1.73 s |   0 |
| `/garden/`          |         100 |           100 |            100 | 1.65 s |   0 |
| `/uses/`            |          99 |           100 |            100 | 2.10 s |   0 |
| `/blog/coming-out/` |         100 |           100 |            100 | 1.80 s |   0 |
| `/garden/nori/`     |         100 |           100 |            100 | 1.80 s |   0 |
| `/garden/kimchi/`   |         100 |           100 |            100 | 1.80 s |   0 |

All eight routes recorded **0ms total blocking time**. The homepage's saved
pre-refactor build scored 99 performance with 2.03s LCP; the final homepage scored
100 with 1.80s LCP. Both recorded zero layout shift. The existing site was already
fast; the changes chiefly reduce asset cost and make that behavior maintainable.

The separate desktop homepage run also scored **100 performance, 100
accessibility and 100 best practices**, with **0.40s LCP**, zero CLS and zero
blocking time. Its report confirms desktop emulation (1350×940, device scale 1),
using Lighthouse's official desktop configuration.

## Indexing and launch

Normal preview builds retain `noindex, nofollow` and `Disallow: /`. Their SEO
scores are 66–69 solely because the crawlability audit fails deliberately; the
other applicable SEO audits pass. Do not remove this protection to raise a score.
An isolated `SITE_INDEXABLE=true` build returned **100 performance, 100
accessibility, 100 best practices, and 100 SEO** for the mobile homepage, with
1.80s LCP and zero CLS. It was built to `/tmp/homepage-indexable-audit/`; the normal
workspace `dist/` remains non-indexable. The full local report is
`lighthouse-report/launch-home-mobile.report.html`.
No deployment, domain change, or production indexing change was made.

## Changes behind the measurements

- Maple Mono shrank from **130,908 to 66,040 bytes (49.6%)**, preserving the variable
  weight axis and normal shaping/ligatures. Full source remains unserved and the
  subset is reproducible with `scripts/subset-fonts.py`.
- Astro's local font provider emits hashed WOFF2 assets and metric-adjusted
  fallbacks. Only normal DM Sans and Maple Mono preload; italic DM Sans loads on
  demand. `font-display: optional` preserves readable fallback text on slow
  connections without a late swap. This deliberately trades custom typography
  on that slow navigation for stable rendering.
- The synchronous, type-checked head script selects the saved theme before paint.
  The dial reserves its geometry before the interaction module runs. Decorative
  stars use SVG, avoiding an accessible-name mismatch with text glyphs.
- Images retain intrinsic dimensions and generated WebP candidates. Markdown
  `sizes` matches the 624px content column and mobile padding. `priorityImage`
  frontmatter names the exact Markdown source path of an above-fold LCP photo;
  that image loads eagerly with high fetch priority. Other photos and list logos
  remain lazy. Fixed-size logos include 1×, 2× and 3× candidates.
- Scoped component/page CSS replaces the mixed global stylesheet. Shared tokens,
  document defaults, slotted-content spacing, and Markdown typography each have
  explicit ownership. Pages without prose no longer load article styles.
- The missing About Markdown source was restored from the migration source,
  matching the already generated page and migration manifest. Clean builds now
  preserve all 21 pages, RSS, the sitemap and legacy redirect destinations.

## Repeatable checks

```sh
bun install --frozen-lockfile
bun run check
bun run test
bun run test:performance
# Additional photo routes, without rebuilding:
node scripts/lighthouse.mjs /garden/nori/ /garden/kimchi/
# Desktop Lighthouse uses its official desktop configuration:
node scripts/lighthouse.mjs --desktop /
```

`check` combines Astro checking, native TypeScript 7 checking, type-aware ESLint,
Astro accessibility linting, and Prettier. **15 Playwright tests pass**, covering
all content routes in light/dark modes, 320px overflow, keyboard navigation,
no-JavaScript rendering, reduced motion, unavailable storage and cross-tab
preferences. Loading tests explicitly delay fonts and withhold interaction
modules to check layout stability and the early theme. Image tests check
responsive sources, dimensions and leading-photo priority. Desktop/mobile views
and résumé print styling were also inspected.

The Lighthouse runner owns its local preview (port 4324) and temporary Chrome
profile, then cleans them up. `CHROME_PATH` can select another Chrome/Chromium
executable. Reports are saved in ignored `lighthouse-report/` as HTML and JSON.
Stop any existing Astro preview with `bun run astro preview stop` first; Astro
allows one tracked preview per checkout. The runner fails clearly if another
preview is active instead of replacing it.
Routes can be passed positionally; queries, fragments and external URLs are
rejected. Only the indexing audit is exempted; other applicable SEO audits must
pass. Budgets fail the command when:

- Performance is below 95, accessibility below 100, or best practices below 100.
- CLS exceeds 0.01, LCP exceeds 2.5s, or total blocking time exceeds 200ms.

CI runs install, check, build and Playwright. Lighthouse remains an explicit
local check because shared CI machine speed can distort performance scores.
After changing Markdown processor code, run `bun run astro sync --force` before
building to discard cached compiled Markdown. Run Astro sync/check/build commands
sequentially within a checkout.

## Hosting work for launch

Local audits do not validate production CDN/cache behavior. Configure HTTPS,
Brotli or gzip, long-lived immutable caching for hashed `/_astro/` assets
(including `/_astro/fonts/`), short/revalidated HTML caching, correct MIME types,
real HTTP redirects from `legacy-redirects.json`, and a 404 HTTP status for the
custom error page. Rerun Lighthouse on the deployed host and check real-user
Core Web Vitals once traffic exists.

Reference: [Astro fonts](https://docs.astro.build/en/guides/fonts/),
[Astro images](https://docs.astro.build/en/guides/images/), and
[Lighthouse score interpretation](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).
