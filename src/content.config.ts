import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Empty metadata should fail content validation instead of reaching page heads.
const text = z.string().trim().min(1);

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: text,
    description: text,
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    priorityImage: text.optional(),
    tags: z.array(text).default([]),
  }),
});
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: text,
    description: text,
    eyebrow: text.optional(),
    priorityImage: text.optional(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/notes' }),
  schema: z.object({
    title: text,
    description: text,
    priorityImage: text.optional(),
  }),
});

export const collections = { blog, pages, notes };
