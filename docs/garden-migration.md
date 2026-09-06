# Garden content migration

Imported September 5, 2026 from `~/code/garden/content`, using only files marked `publish: true`. The old repository was not changed. [The manifest](garden-migration.json) records source paths, destinations, routes, and original frontmatter.

## What moved

- Six complete blog posts, including three weeknotes. Post bodies and footnotes are preserved, with internal links converted to the new paths.
- About, Now, Uses, and the old homepage introduction. The latter now introduces the Garden, whose recent-post list is generated from the blog collection instead of an Obsidian `.base` file.
- Six topic notes at `/garden/`: Digital garden, Kimchi, Nori, San Francisco, Software engineer, and Trans woman. The short notes are Gabby's existing published writing, including the deliberately unfinished city guide.
- The previous Quartz colophon is retained as a clearly dated historical section underneath the current Astro colophon. Its unfinished final sentence was omitted.
- All three original local media files are copied into `src/assets/garden/`. Nori and Kimchi's photos are used by their notes; the unreferenced portrait is retained for future use. The desk photo was copied from the existing Uses page's public image URL. Images in Markdown are optimized by Astro and served locally, with dimensions and descriptive alt text.

## Dates and formatting

The blog's `created` dates reflect the original 2025 writing dates and are used as `pubDate`. The source's `published` and `modified` values largely share a May 18, 2026 import timestamp; these are preserved in the manifest rather than used to redate the posts or imply a fresh update.

The Now page's explicit `last updated: 03/06/2025` becomes March 6, 2025, visibly displayed above its content. The personal snapshot and equipment list are preserved as written, not presented as newly verified information. About's "Exter College" typo is corrected to "Exeter College." Uses headings are shifted down one level to maintain a single page H1. Empty trailing list markup is removed from the digital garden note.

## Links and unavailable source material

Obsidian wikilinks and local photo embeds were converted to standard Markdown. Links to the earlier `/posts/coming-out` URL now point to `/blog/coming-out/`; the earlier notes index points to `/garden/`.

`src/data/legacy-redirects.json` preserves changed Quartz paths and earlier `/posts/` aliases. The Quartz paths were obtained using the old repository's own slug utility. Astro produces HTML redirect pages that work without JavaScript; at launch, use this same map for host-level HTTP 301 redirects. Canonical URLs and the sitemap list the destinations only.

These items could not be imported:

- `blog/growing my garden.md` contains only frontmatter. It is not published as an empty post.
- The `/weeks` visualization and `/notes/kiln-review` article linked by the June weeknotes are absent from the source and its Git history. Gabby confirmed that these were lost during earlier rebuilds and requested simply removing the links. Their references remain as text.
- The June 8 and November 30 weeknotes refer to photos "above," but the source contains neither those images nor image URLs. Those prose references are preserved.

The synthetic "A small beginning" article and placeholder slash-page prose have been removed. The original repository remains available as the untouched migration source.
