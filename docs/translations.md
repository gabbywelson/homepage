# Translations with General Translation

The site uses GT as a file translation service. Astro builds the downloaded
Markdown and JSON into static pages; readers never contact GT. Normal development,
checks, builds, and deployment do not need GT credentials or generate translations.

## Languages

`gt.config.json` selects Spanish (`es`), French (`fr`), and Simplified Chinese
(`zh-CN`). These are the three initial targets for a limited translation budget;
GT does not translate every supported language by default.
Language names and Open Graph locale tags live in `src/i18n/locales.ts`.

English URLs remain unprefixed. Translations use lowercase URL prefixes, for
example `/zh-cn/blog/coming-out/`; their HTML language tag remains `zh-CN`.
Slugs stay the same across languages.

## Budget

The intended initial budget is **$25 total**, managed in the GT dashboard. All
English blog posts, slash pages, garden notes, and the shared UI dictionary remain
configured for all three target languages.

GT quoted $104.62 for the original eight-language request. Scaling that estimate
to three languages gives roughly **$39.23** for the same content. This is a rough
projection, not a new GT quote or a guarantee; three languages alone may still
exceed the budget. Check the dashboard balance and billing settings before
running translations, and leave auto-reload disabled if you want to avoid
additional funding. No account billing settings are changed by this repository.

`bun run translations:check` only validates file discovery; it does **not** quote
costs or enforce a spending cap. The pinned CLI does not expose a maximum-cost
flag, and the translation wrapper does not enforce the $25 budget. GT's current
[usage rates](https://generaltranslation.com/en-US/pricing/usage) depend on input
tokens and additional platform context. If the request still exceeds available
credits, reduce the configured file scope or locales before retrying. Do not use
auto-reload as a workaround for the budget limit.

## Credentials and the first run

1. Create a project in the [GT dashboard](https://dash.generaltranslation.com).
2. Generate a **production API key** for it and copy its project ID.
3. Copy `.env.example` to `.env.local` and fill in `GT_PROJECT_ID` and `GT_API_KEY`.
   `.env.local` is ignored. Do not paste keys into source, chat, screenshots, or
   `gt.config.json`, and never prefix them with `PUBLIC_`.
4. Run `bun run translations:check` to list source files without an API request.
5. Review the budget guidance above, then run `bun run translate` when ready to
   generate translations. This is a billable GT operation across the configured
   locales. For a smaller pilot, temporarily
   narrow the config's locales and file patterns; GT's `--locales` flag **adds**
   languages rather than restricting the configured list.
6. Review generated files and run `bun run check` and `bun run test`. Inspect
   translated typography and the open picker at mobile widths in both themes.
7. Commit reviewed translated files and `gt-lock.json` alongside the source.
   Deploy through the existing site workflow when the release is ready.

`bun run test:translations` exercises temporary translated fixtures, including
static navigation without JavaScript, images, footnotes, language metadata,
publication filtering, and mobile accessibility. It removes its fixtures and
rebuilds the ordinary site when finished. Run it separately from other Astro
commands; no key or GT API request is involved.

The CLI is pinned as a development dependency. No GT React or browser runtime is
used. `.env.local` is read explicitly by the translation command. Missing keys
produce an actionable error without echoing credentials.

## Authoring and updates

- English writing: `src/content/{blog,pages,notes}/en/`. Nested blog folders work.
- Generated translations: the same collection and relative filename under the
  target language folder. Images stay in `src/assets/`; every language has the
  same folder depth, so relative image URLs need no translation-specific rewrite.
- Shared UI copy: `src/i18n/messages/en.json`; translated dictionaries use the GT
  language code, such as `src/i18n/messages/zh-CN.json`.
- Run `bun run translate` after adding or changing English content. GT tracks
  source changes in its lockfile and reuses translations. `options.saveLocal`
  explicitly synchronizes local translation corrections before new work.
- Avoid `--force` unless intentional: it retranslates and overwrites corrections.
- After downloading, the wrapper restores structural frontmatter from English.
  Only `title`, `description`, and `eyebrow` come from translated frontmatter.
  Publication dates, draft flags, tags, image paths, and future metadata remain
  owned by the original. It leaves the translated body intact.
- Changes to terminology or tone do not automatically rewrite old translations;
  review GT's context-update workflow before a deliberate retranslation.

In GT, add a Context Group for the site's personal, conversational voice, names,
she/her pronouns, technical terms, and the meaning of “digital garden.” Preserve
Markdown links, image paths, footnote identifiers, and code. Review actual
translation quality with readers of each language.

## Publication and navigation

A language is usable only when its complete UI dictionary and at least one
published translated content file exist. The picker displays all planned
languages, but unavailable choices are marked disabled and cannot navigate.
They remain focusable to preview their greeting with a keyboard. The passport-style
menu includes a small globe that turns on opening and tilts as languages are
explored; greetings respond to hover and keyboard focus. Reduced-motion preferences
disable the animations. Without JavaScript, the native disclosure, language links,
and printed greetings still work. Greetings live alongside native language names
in `src/i18n/locales.ts`, rather than being translated from the current UI language.
Available choices link to the current page's translation, or its translated blog
index when that page is unavailable. English remains accessible.

The route builder excludes orphan translations and follows the English source's
draft and publication status. It fails on inconsistent structural metadata.
Localized pages have their own canonical URLs and reciprocal `hreflang` links
only for real equivalents. Each active language has a separate RSS feed.

Internal navigation uses `availableLink(path, locale, paths)` from
`src/i18n/content.ts`; spread its result onto an anchor to set both `href` and
`hreflang`. `availableHref` is the URL-only convenience wrapper. Both call
`resolveLocalizedLink` in `src/i18n/navigation.ts`, which is also used by the
Markdown compiler. Use this shared policy for new internal links rather than
hard-coding an English destination or prepending locale strings in a component.

```astro
---
const locale = localeFromPath(Astro.url.pathname);
const paths = await availablePaths(locale);
const link = (path: string) => availableLink(path, locale, paths);
---

<a {...link('/')}>Home</a>
```

The policy handles root-relative and production same-origin absolute URLs,
preserves query strings, resolves legacy redirects, and avoids double locale
prefixes. External URLs, assets, endpoints, relative URLs, and in-page anchors are
left alone. Use root-relative paths for internal navigation. Language-picker links
and explicit English-original links bypass this policy intentionally.

Markdown links are localized at build time only when their destination route
exists and the source is published. Missing translated writing retains its
English destination.
Cross-page fragments deliberately remain on English because translated headings
may generate different IDs; in-page footnotes retain their existing identifiers.
No experimental GT URL/asset rewriting flags are enabled.

`build` forces a content sync before building, because adding a translation can
change links in unchanged Markdown. This prevents cached HTML retaining stale
destinations. Restart development or run a forced sync after adding translations
to refresh already-cached Markdown links.

## Current scope and next steps

This foundation covers blog posts, slash pages, garden notes, the garden landing
page, blog lists, RSS, navigation, footer, metadata, and theme-control labels.
The homepage and résumé now have routes in each active locale, so the wordmark,
footer signature, author links, navigation, and homepage calls to action retain
the reader's language. Their rich prose and work history still use the original
English content inside `main lang="en"`, with a notice and an explicit link to the
English original. Navigation, footer, theme controls, and the picker use the
selected locale. These are locale-preserving routes, not completed translations:
they canonicalize to English and do not advertise `hreflang` alternates yet.

`HomePage.astro` and `ResumePage.astro` share the existing layouts across locales.
When extracting their content for GT, preserve whole sentences and named inline
links/logos. Once the prose is translated, remove the English fallback treatment
and update the canonical and alternate-language policy for these routes.

The current local fonts cover Latin text; CJK uses system fallback fonts. Check
real translated pages for line breaks and glyph coverage before release. The
selected languages are left-to-right; future RTL languages need direction/layout
work as well as adding a language code.

Translation generation is manual for now. Once the first output has been reviewed,
a separate GitHub workflow can run GT with repository secrets and propose a
translation PR. Keep that workflow separate from ordinary builds, and prevent
translation commits from triggering a translation loop.

## References

- [GT CLI](https://generaltranslation.com/en-US/docs/cli/quickstart)
- [Configuration](https://generaltranslation.com/en-US/docs/cli/reference/config)
- [Markdown](https://generaltranslation.com/en-US/docs/cli/reference/formats/mdx-md-files)
- [Local corrections and review](https://generaltranslation.com/en-US/docs/cli/guides/managing-translations)
- [Astro i18n](https://docs.astro.build/en/guides/internationalization/)
