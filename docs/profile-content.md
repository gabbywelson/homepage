# Editing the homepage and résumé

English is the source. Edit these files as ordinary writing, then run
`bun run translate` to update the configured languages. Translated files use the
same paths under `es/`, `fr/`, and `zh-CN/`; review them before committing.

## Homepage

Edit `src/content/home/en/index.mdx`. The small YAML block holds the heading,
description, and labels around the page. The body is Markdown with two optional
inline components:

```mdx
I’m a <Accent icon="engineer">software engineer</Accent>.

I work at [Handshake AI](https://joinhandshake.com/ai).

A place for [words](/blog/) and

<HomeLink href="/garden/" icon="flower">
  growing things
</HomeLink>
.
```

Use ordinary Markdown links by default. `HomeLink.astro` supplies the existing
brand logos and link colors for known destinations. `Accent` supports `engineer`
and `coffee`; `HomeLink` allows the `flower` override where the garden link has a
different illustration. The page supplies these components, so imports aren't
needed in the content. Keep sentences intact around inline elements so GT can
translate them in context.

Keep layout, CSS, the theme dial, and the work-list renderer in Astro components.
Avoid JavaScript expressions, imports, exported data objects, and presentation
classes in the writing. Adding another decorative treatment is a component edit;
editing its words is a content edit.

## Résumé

All résumé writing lives under `src/content/resume/en/`:

| Location             | What to edit                                                             |
| -------------------- | ------------------------------------------------------------------------ |
| `intro.md`           | Page heading, introduction, section labels, and summary paragraphs       |
| `before-software.md` | Earlier experience paragraphs                                            |
| `companies/*.md`     | Employer name, compact homepage summary, location, link, dates, and logo |
| `roles/*.md`         | One role per file, with a title and ordinary Markdown bullets            |
| `education/*.md`     | School, qualification, location, and dates                               |
| `skills/*.md`        | Category title and Markdown body                                         |

For example, a role looks like this:

```markdown
---
kind: role
company: handshake
title: Founding Engineer, Handshake AI
order: 0
start: '2025-02'
end: null
---

- Built and shipped LLM-powered features across multiple product surfaces.

- Partnered with design to establish our shared component library.
```

To add a role, copy a role file and give it a stable filename. `company` matches
the filename in `companies/` without `.md`. Lower `order` values appear first,
within that company; company, education, and skills entries have their own order.
Update the company's overall dates and homepage summary when appropriate. The
homepage and detailed résumé use the same employer entries.

Dates are quoted `YYYY-MM` strings. `end: null` means current employment; omit
both dates when they are unknown. Astro formats month names in the content's
language. Don't invent dates for undated experience. Brand IDs select the existing
logo registry; a new employer logo needs a corresponding component/schema update.

GT translates prose and declared text fields, including titles, qualifications,
locations, summaries, and page labels. The normalization step restores structural
fields such as `kind`, `company`, `order`, `brand`, URLs, and dates from English.
Builds validate this boundary too. Add new translatable metadata explicitly to
`src/i18n/content-fields.mjs` and the collection schema.

## Translation completeness

A translated homepage needs its MDX file and all company summaries. A translated
résumé needs every English résumé entry's counterpart. Extra translated files
without an English original are ignored. If an entry is missing, the affected
page keeps its localized navigation but displays the complete English content
with an English notice and canonical URL. It becomes a full translation, with
its own canonical and language alternates, when its content is complete.

This lets you add new English content before its translations are ready. It also
means a new role can temporarily return the translated résumé to English until
GT has translated it. Normal checks and builds never call GT.
