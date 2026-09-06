# Local fonts

Astro's local font provider in `astro.config.mjs` serves these files with hashed
URLs, generates metric-adjusted fallback faces, and exposes `--font-mono` and
`--font-body`. `BaseLayout.astro` preloads the two normal faces used above the
fold. Italic DM Sans loads only when needed. All faces use `font-display: optional`
to avoid a late font swap when the connection is slow.

`source/maple-mono.woff2` is the original supplied Maple Mono variable font
(weights 100–800). It is retained only as build source and is never published.
`maple-mono-latin.woff2` is the browser subset: Latin and extended Latin,
combining accents, punctuation, currency, and common arrows. It retains the
original variable weight axis and normal shaping, contextual ligatures,
composition, localization, kerning, and mark positioning features (`calt`,
`ccmp`, `clig`, `liga`, `kern`, `locl`, `mark`, `mkmk`, `rlig`). Unused opt-in
stylistic sets and character variants are omitted. Characters outside this
subset use the declared system fallback stack. Before publishing another
language, review this coverage and the DM Sans Latin subset.

DM Sans normal and italic WOFF2 files come from the pinned
`@fontsource-variable/dm-sans` dependency. Builds use the local files and do not
contact a font service. Both fonts' OFL licenses remain in `public/fonts/`.

To regenerate the checked-in Maple subset (Python is only required for this
maintenance task):

```sh
python3 -m venv /tmp/homepage-fonttools-venv
/tmp/homepage-fonttools-venv/bin/pip install 'fonttools[woff]==4.59.2'
/tmp/homepage-fonttools-venv/bin/python scripts/subset-fonts.py
```
