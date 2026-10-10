# swiift — Owen Bladen-Kay

Portfolio site for games, mods, software and live events. Built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Commands

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `npm install`     | Install dependencies (Node 22.12+)            |
| `npm run dev`     | Local dev server at `http://localhost:4321`   |
| `npm run build`   | Build the static site into `dist/`            |
| `npm run preview` | Serve the built site locally                  |
| `npm run check`   | Type-check `.astro` and `.ts` files           |

## Adding or editing a project

Every game, mod, piece of software and event is a Markdown file in `src/content/projects/`. The file name becomes the URL (`lunarball.md` → `/lunarball/`), and the page, cards, lists and stats all update automatically.

```md
---
title: My Project
category: games            # games | mods | software | events
date: 2026-01-31           # used for sorting, newest first
summary: One sentence for cards and search results.
kicker: Studio or tagline
when: "2026"               # short label shown in lists
cover: ../../assets/projects/my-project/cover.jpg
gallery:
  - src: ../../assets/projects/my-project/shot-1.jpg
    alt: What the screenshot shows.
highlights:
  - A bullet for the sidebar
links:
  - label: Steam
    href: https://store.steampowered.com/app/123/
youtube:
  - id: dQw4w9WgXcQ
    title: Trailer
---

Body text in Markdown.
```

All fields are defined in `src/content.config.ts`. Put images in `src/assets/projects/<slug>/`; the build converts them to responsive WebP automatically.

Site-wide bits (nav, socials, mod.io total, older GitHub repos) live in `src/data/site.ts`.

## Structure

```
src/
  content/projects/   one Markdown file per project
  assets/             images (optimised at build time)
  components/         cards, feed, vision mixer, gallery, calculators…
  layouts/Base.astro  page shell: head, header, footer, cursor
  pages/              routes (index, games, software, events, about, [slug]…)
  scripts/            custom cursor + shared interaction effects
  styles/global.css   design tokens and global styles
public/               served as-is (favicon, og image, hatecodev.html…)
```

## Deploying

`.github/workflows/deploy.yml` builds and deploys on every push to `main`. One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Notes

- `public/hatecodev.html` (plus `public/audio` and `public/images/travis.png`) is kept as-is, so its URL still works.
- Old URLs (`games.html`, `events.html`, the WordPress `/my-games/` and `/mods/` pages, `/simple-sensitivity-converter/`) redirect to their new pages.
- The custom cursor only runs on mouse/trackpad devices, and motion effects respect `prefers-reduced-motion`.
