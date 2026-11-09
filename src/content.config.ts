import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('Ana Ferreira'),
    image: z.string().default('/assets/images/Fragrance-Wheel-Master-04.png'),
    tags: z.array(z.string()).default([]),
    visit: z.string().optional(),
  }),
});

export const collections = { blog };
