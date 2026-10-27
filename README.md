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

Every game, mod, piece of software and event is a Markdown file in `src/content/projects/`. The file name becomes the URL (`lunarball.md` → `/lunarball/`, and `/editor/lunarball/` in the editor view), and the pages, cards, Content Drawer, lists and stats all update automatically.

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
  - A bullet for the sidebar (and a node in the editor view's Blueprint graph)
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

## Two views

The site has two views of the same content, with a **UE5 view** toggle at the top right of every page that switches to the same page in the other view:

- **Classic** (the default) at the normal URLs: `/`, `/games/`, `/lunarball/`… This is the one search engines index and the one download links point at.
- **UE5 editor view** under `/editor/`: `/editor/`, `/editor/games/`, `/editor/lunarball/`… Every link inside it stays in `/editor/`. Its pages point search engines at their classic versions and are left out of the sitemap.

### The editor view

It's laid out like the Unreal Engine 5 level editor, in the default dark editor theme:

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
  content/projects/     one Markdown file per project (used by both views)
  assets/               images (optimised at build time)
  components/           classic site: header, footer, cards, vision mixer… plus the logo,
                        the view toggle and the tools both views share (inventory, calculators, patch notes…)
  components/editor/    editor view: title bar, menus, toolbar, viewport, graph, details, content drawer…
  layouts/Base.astro    the classic page shell
  layouts/Editor.astro  the editor window every /editor/ page opens in
  lib/                  project data, Steam/GitHub lookups, and the editor's drawer tree, viewport items and graphs
  pages/                classic routes (index, games, software, events, about, [slug]…)
  pages/editor/         editor view routes (the same pages, plus /editor/mods/)
  scripts/              classic site: custom cursor and shared effects
  scripts/editor/       editor view: tabs, menus, panels, gallery, graph, drawer and console
  styles/global.css     classic design tokens and global styles
  styles/ue.css, editor.css  UE5 colour tokens and the editor shell
public/                 served as-is (favicon, og image, hatecodev.html…)
```

## Deploying

`.github/workflows/deploy.yml` builds and deploys on every push to `main`. It also rebuilds weekly, and hourly when a Steam post or GitHub release changes (it compares the live `/update-sources.json` with Steam and GitHub). GitHub turns off scheduled workflows in a repo with no activity for 60 days; re-enable it from the **Actions** tab if that happens. One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.

## Notes

- `public/hatecodev.html` (plus `public/audio` and `public/images/travis.png`) is kept as-is, so its URL still works.
- Old URLs (`games.html`, `events.html`, the WordPress `/my-games/` and `/mods/` pages, `/simple-sensitivity-converter/`) redirect to their new pages.
- The custom cursor only runs on mouse/trackpad devices, and motion effects respect `prefers-reduced-motion`.
- In the editor view the gallery doesn't auto-play for visitors who prefer reduced motion, and panel sizes are remembered per browser (Window → Reset Layout puts them back).
