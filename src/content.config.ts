import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Route posts. Frontmatter mirrors the app's trip model (see the brief's 04-blog/_template.md),
// so a post can later be imported into the app as an example or curated trip.
const month = z.enum(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);

const routes = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/routes' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    appTripId: z.string().nullable(),
    inApp: z.union([z.enum(['available', 'coming-soon']), z.literal(false)]),
    summary: z.string().max(160),
    region: z.enum(['Asia', 'Europe', 'Americas', 'Africa', 'Oceania', 'Middle East']),
    countries: z.array(z.string().length(2)),
    activities: z.array(z.enum(['culture', 'diving', 'hiking', 'safari', 'surfing', 'skiing', 'beach'])),
    durationDays: z.number().int(),
    nights: z.number().int(),
    bestMonths: z.array(month),
    okayMonths: z.array(month),
    avoidMonths: z.array(month),
    heroImage: z.string(),
    heroAlt: z.string(),
    publishedAt: z.coerce.date(),
    author: z.string(),
    stops: z.array(
      z.object({
        name: z.string(),
        cardId: z.string(),
        type: z.enum(['country', 'landmark', 'wildlife', 'event', 'island', 'city']),
        rarity: z.enum(['Common', 'Uncommon', 'Rare', 'Epic']),
        nights: z.number().int(),
        lat: z.number(),
        lng: z.number(),
        image: z.string(),
      }),
    ),
  }),
});

// Legal pages (imprint, privacy). Copy comes from the brief's 03-content with editor notes removed.
const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    last_updated: z.string().optional(),
    /** "In short" points, shown in a highlighted box above the text. */
    summary: z.array(z.string()).optional(),
  }),
});

export const collections = { routes, legal };
