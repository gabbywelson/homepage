import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// Empty metadata should fail content validation instead of reaching page heads.
const text = z.string().trim().min(1);

// Preserve locale case and nested slugs; URLs normalize only the locale prefix.
const generateId = ({ entry }: { entry: string }) =>
  entry.replace(/\.mdx?$/, '');

const blog = defineCollection({
  loader: glob({
    pattern: '*/**/*.md',
    base: './src/content/blog',
    generateId,
  }),
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
  loader: glob({ pattern: '*/*.md', base: './src/content/pages', generateId }),
  schema: z.object({
    title: text,
    description: text,
    eyebrow: text.optional(),
    priorityImage: text.optional(),
    updatedDate: z.coerce.date().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/notes', generateId }),
  schema: z.object({
    title: text,
    description: text,
    priorityImage: text.optional(),
  }),
});

const home = defineCollection({
  loader: glob({
    pattern: '*/index.mdx',
    base: './src/content/home',
    generateId,
  }),
  schema: z.object({
    title: text,
    eyebrow: text,
    description: text,
    nowLabel: text,
    workTitle: text,
    resumeLabel: text,
    invitation: text,
    gardenLabel: text,
    currentLabel: text,
  }),
});

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const period = { start: month.optional(), end: month.nullable().optional() };
const order = z.number().int().nonnegative();
const brand = z.enum([
  'handshake',
  'linkedin',
  'hack-reactor',
  'williams',
  'exeter',
]);
const href = z.url().startsWith('https://');
const resume = defineCollection({
  loader: glob({
    pattern: '*/**/*.md',
    base: './src/content/resume',
    generateId,
  }),
  schema: z
    .discriminatedUnion('kind', [
      z.object({
        kind: z.literal('intro'),
        title: text,
        description: text,
        eyebrow: text,
        experienceTitle: text,
        educationTitle: text,
        skillsTitle: text,
        linkedinLabel: text,
        currentLabel: text,
        presentLabel: text,
      }),
      z.object({ kind: z.literal('section'), title: text }),
      z.object({
        kind: z.literal('company'),
        title: text,
        summary: text,
        location: text.optional(),
        brand,
        href,
        order,
        ...period,
      }),
      z.object({
        kind: z.literal('role'),
        company: text,
        title: text,
        order,
        ...period,
      }),
      z.object({
        kind: z.literal('education'),
        title: text,
        qualification: text,
        location: text,
        brand,
        href,
        order,
        start: month,
        end: month,
      }),
      z.object({ kind: z.literal('skill'), title: text, order }),
    ])
    .superRefine((entry, context) => {
      if (!('start' in entry) && !('end' in entry)) return;
      const start = 'start' in entry ? entry.start : undefined;
      const end = 'end' in entry ? entry.end : undefined;
      if ((start === undefined) !== (end === undefined)) {
        context.addIssue({
          code: 'custom',
          message:
            'Supply both start and end (null for a current role), or omit both dates.',
        });
      } else if (start && end && start > end) {
        context.addIssue({
          code: 'custom',
          message: 'End month must not precede start month.',
        });
      }
    }),
});

export const collections = { blog, pages, notes, home, resume };
