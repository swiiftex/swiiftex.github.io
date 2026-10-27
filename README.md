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

Every game, mod, piece of software and event is a Markdown file in `src/content/projects/`. The file name becomes the URL (`lunarball.md` → `/lunarball/`), and the page, the Content Drawer, lists and stats all update automatically.

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
  - Each one becomes a node in the project's Blueprint graph
links:
  - label: Steam
    href: https://store.steampowered.com/app/123/
youtube:
  - id: dQw4w9WgXcQ
    title: Trailer
---

Body text in Markdown.
```

### Update posts

A project can show its latest patch notes, taken straight from Steam or GitHub:

```md
updates:
  steam: true                     # Steam event posts for the project's steamAppId
# or
updates:
  github: swiiftex/QuickClip      # GitHub releases
  notes: commits                  # optional: list each release's commits instead of its notes
```

GitHub releases also refresh in the browser, so a new release shows up as soon as it's published. Steam can't be read from the browser, so the deploy workflow checks Steam (and GitHub) every hour and rebuilds the site when a post is added or edited.

All fields are defined in `src/content.config.ts`. Put images in `src/assets/projects/<slug>/`; the build converts them to responsive WebP automatically.

Site-wide bits (nav, socials, mod.io total, older GitHub repos) live in `src/data/site.ts`.

## The editor layout

The site is laid out like the Unreal Engine 5 level editor, in the default dark editor theme:

| Editor part | What it shows |
| --- | --- |
| Title bar | The animated logo (plays once per visit, replays on hover) and the open "level" |
| Menu bar | File / Edit / Window / Tools / Build / Select / Actor / Help: navigation, contact and shortcuts |
| Toolbar | ▶ ⏭ ⏹ drive the viewport gallery; **Platforms** lists where to get the open project |
| Viewport | An auto-playing gallery of the project's Steam trailer, clips, YouTube videos and screenshots (or a reel of projects). View modes (Lit, Unlit, Wireframe…), Game View (G) and Immersive mode work |
| Details tab | A Blueprint graph: Event BeginPlay → Sequence → one node per `highlights` entry |
| Details panel | Everything in the viewport (select one to show it), then the project's facts, links and write-up |
| Content Drawer | Every project as a Blueprint in `Projects/Games`, `Mods`, `Software` and `Events`, plus `About` and `Guides`. Click one to open it |
| Output Log | News and patch notes as log lines, and the console (try `help`, `open lunarball`, `stat fps`) |

Viewport items come from a project's `steamAppId` trailer, `cover`, `hero`, `clip`, `youtube` and `gallery`; see `src/lib/viewport.ts`. Projects with update posts get a **Patch Notes** tab, and a few have tool tabs (the LUNARBALL inventory, the Source2All calculator and supported-games table). On phones the panels stack, and the Content Drawer and Output Log open as sheets from the bottom bar.

## Structure

```
src/
  content/projects/   one Markdown file per project
  assets/             images (optimised at build time)
  components/editor/  the editor: title bar, menus, toolbar, viewport, graph, details, content drawer…
  components/         the logo and the tools shown in tabs (inventory, calculators, patch notes…)
  layouts/Base.astro  the editor window every page opens in
  lib/                content drawer tree, viewport items, Blueprint graphs, Steam/GitHub lookups
  pages/              routes (index, games, mods, software, events, about, [slug]…)
  scripts/editor/     tabs, menus, panels, gallery, graph, drawer and console behaviour
  styles/             UE5 colour tokens (global.css) and the editor shell (editor.css)
public/               served as-is (favicon, og image, hatecodev.html…)
```

## Deploying

`.github/workflows/deploy.yml` builds and deploys on every push to `main`. It also rebuilds weekly, and hourly when a Steam post or GitHub release changes (it compares the live `/update-sources.json` with Steam and GitHub). GitHub turns off scheduled workflows in a repo with no activity for 60 days; re-enable it from the **Actions** tab if that happens. One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Notes

- `public/hatecodev.html` (plus `public/audio` and `public/images/travis.png`) is kept as-is, so its URL still works.
- Old URLs (`games.html`, `events.html`, the WordPress `/my-games/` page, `/games/#mods`, `/simple-sensitivity-converter/`) redirect to their new pages.
- The viewport gallery doesn't auto-play for visitors who prefer reduced motion, and panel sizes are remembered per browser (Window → Reset Layout puts them back).
