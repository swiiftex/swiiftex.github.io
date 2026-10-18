import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const CATEGORIES = ['games', 'mods', 'software', 'events'] as const;
export type Category = (typeof CATEGORIES)[number];

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(CATEGORIES),
      /** Sort key. Newest first everywhere. */
      date: z.coerce.date(),
      /** One-liner used on cards and in meta descriptions. */
      summary: z.string(),
      /** Small label above the title, e.g. studio or tagline. */
      kicker: z.string().optional(),
      /** Human label for when it happened, e.g. "2024" or "3–4 Apr 2026". */
      when: z.string().optional(),
      status: z.string().optional(),
      role: z.string().optional(),
      studio: z.string().optional(),
      platforms: z.array(z.string()).default([]),
      /** For mods: the game they're built for. */
      game: z.string().optional(),
      /** For mods: mod.io download count (snapshot). */
      downloads: z.number().int().optional(),
      /** Wide banner used behind the project page title, if different from the cover. */
      hero: image().optional(),
      location: z.string().optional(),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      /** Optional looping clip in /public, shown on the project hero. */
      clip: z.string().optional(),
      gallery: z.array(z.object({ src: image(), alt: z.string() })).default([]),
      highlightsTitle: z.string().default('Highlights'),
      highlights: z.array(z.string()).default([]),
      stack: z.array(z.string()).default([]),
      links: z
        .array(
          z.object({
            label: z.string(),
            /** Fallback URL, used if the latest release can't be looked up. */
            href: z.url(),
            /** Point this link at a file in the repo's latest GitHub release. */
            release: z
              .object({
                repo: z.string(), // "owner/name"
                asset: z.string(), // regex matched against asset file names
              })
              .optional(),
          }),
        )
        .default([]),
      steamAppId: z.string().optional(),
      /**
       * Show the latest update posts on the project page: Steam event posts
       * (from steamAppId) or a repo's GitHub releases. With `notes: commits`,
       * each release lists its commits instead of its (automated) notes.
       */
      updates: z
        .object({
          steam: z.boolean().optional(),
          github: z.string().optional(), // "owner/name"
          notes: z.enum(['release', 'commits']).default('release'),
        })
        .optional(),
      youtube: z.array(z.object({ id: z.string(), title: z.string() })).default([]),
      featured: z.boolean().default(false),
      /** Accent tint for this project's cards and hero (hex). */
      tint: z.string().optional(),
    }),
});

export const collections = { projects };
