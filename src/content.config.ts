import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One post per milestone, English for every locale.
const devlog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/devlog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    milestone: z.number(),
    description: z.string(),
    cover: z.string().optional(),
    video: z.string().optional(),
  }),
});

export const collections = { devlog };
