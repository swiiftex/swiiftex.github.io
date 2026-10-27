/**
 * The Content Drawer's folders and assets, built once per build from the
 * project collection and the site data. Every project is a Blueprint in its
 * category's folder; mods and repos without a page of their own are
 * Hyperlink assets that open externally.
 */
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { getProjects, projectHref, whenLabel, type Project } from './projects';
import { ASSET_TYPES, CATEGORY_FOLDER, assetPath, bpName, ed, type AssetKind, type UeIconName } from './editor';
import { CATEGORY_LABELS, MODIO, MORE_ON_GITHUB, SITE, SOCIALS } from '../data/site';
import portrait from '../assets/about/graduation.jpg';

export type DrawerAsset = {
  kind: 'asset';
  /** Unique id; a project's id is its slug. */
  id: string;
  name: string;
  type: string;
  color: string;
  icon: UeIconName;
  href: string;
  external: boolean;
  thumb?: string;
  folder: string;
  path: string;
  summary?: string;
  /** Rows for the hover tooltip. */
  tip: { k: string; v: string }[];
  /** Small label in the thumbnail corner, e.g. download count. */
  badge?: string;
  tint?: string;
};
export type DrawerFolder = { kind: 'folder'; path: string; name: string; children: DrawerNode[] };
export type DrawerNode = DrawerFolder | DrawerAsset;

const thumbCache = new Map<string, Promise<string>>();
/** A small WebP for tiles and lists. */
export function thumbOf(src: ImageMetadata, width = 320): Promise<string> {
  const key = `${src.src}@${width}`;
  if (!thumbCache.has(key)) thumbCache.set(key, getImage({ src, width: Math.min(width, src.width), format: 'webp' }).then((r) => r.src));
  return thumbCache.get(key)!;
}

const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n));

const asset = (kind: AssetKind, a: Omit<DrawerAsset, 'kind' | 'type' | 'color' | 'icon' | 'path'> & { pathName?: string }): DrawerAsset => {
  const t = ASSET_TYPES[kind];
  const { pathName, ...rest } = a;
  return { kind: 'asset', type: t.label, color: t.color, icon: t.icon, path: assetPath(a.folder, pathName ?? a.name), ...rest };
};

async function projectAsset(p: Project): Promise<DrawerAsset> {
  const d = p.data;
  const folder = CATEGORY_FOLDER[d.category];
  const tip = [
    { k: 'Category', v: CATEGORY_LABELS[d.category] },
    d.studio && { k: 'Studio', v: d.studio },
    d.game && { k: 'Game', v: d.game },
    d.role && { k: 'Role', v: d.role },
    d.location && { k: 'Location', v: d.location },
    { k: 'When', v: whenLabel(p) },
    d.status && { k: 'Status', v: d.status },
    d.downloads && { k: 'Downloads', v: d.downloads.toLocaleString('en-GB') },
  ].filter(Boolean) as { k: string; v: string }[];
  return asset('blueprint', {
    id: p.id,
    name: d.title,
    pathName: bpName(p),
    href: ed(projectHref(p)),
    external: false,
    thumb: d.cover ? await thumbOf(d.cover) : undefined,
    folder,
    summary: d.summary,
    tip,
    badge: d.downloads ? `↓ ${fmtK(d.downloads)}` : undefined,
    tint: d.tint,
  });
}

let treePromise: Promise<DrawerFolder> | null = null;

export function contentTree(): Promise<DrawerFolder> {
  treePromise ??= buildTree();
  return treePromise;
}

async function buildTree(): Promise<DrawerFolder> {
  const all = await getProjects();
  const byCat = async (c: Project['data']['category']) => Promise.all(all.filter((p) => p.data.category === c).map(projectAsset));

  const modLinks = MODIO.more.map((m) =>
    asset('link', {
      id: `modio:${m.title}`,
      name: m.title,
      href: m.href,
      external: true,
      folder: 'Projects/Mods',
      summary: 'A MORDHAU mod on mod.io.',
      tip: [
        { k: 'Opens', v: 'mod.io' },
        { k: 'Downloads', v: m.downloads.toLocaleString('en-GB') },
      ],
      badge: `↓ ${fmtK(m.downloads)}`,
    }),
  );
  const repoLinks = MORE_ON_GITHUB.map((r) =>
    asset('link', {
      id: `github:${r.title}`,
      name: r.title,
      href: r.href,
      external: true,
      folder: 'Projects/Software/Archive',
      summary: r.blurb,
      tip: [
        { k: 'Opens', v: 'GitHub' },
        { k: 'Year', v: r.year },
        { k: 'Tech', v: r.tech },
      ],
    }),
  );
  const socials = SOCIALS.map((s) =>
    asset('link', {
      id: `social:${s.label}`,
      name: s.label,
      href: s.href,
      external: true,
      folder: 'About',
      summary: s.handle,
      tip: [{ k: 'Handle', v: s.handle }],
    }),
  );

  const folder = (path: string, children: DrawerNode[]): DrawerFolder => ({
    kind: 'folder',
    path,
    name: path.split('/').pop() || 'Content',
    children,
  });

  const portraitThumb = await thumbOf(portrait);

  return folder('', [
    folder('About', [
      asset('level', {
        id: 'about',
        name: SITE.author,
        pathName: 'Lvl_About',
        href: ed('/about/'),
        external: false,
        thumb: portraitThumb,
        folder: 'About',
        summary: 'Bio, experience, skills and contact details.',
        tip: [
          { k: 'Role', v: 'Unreal Engine programmer' },
          { k: 'Based in', v: SITE.location },
        ],
      }),
      asset('data', {
        id: 'contact',
        name: 'Email',
        pathName: 'DA_Email',
        href: `mailto:${SITE.email}`,
        external: true,
        folder: 'About',
        summary: SITE.email,
        tip: [{ k: 'Address', v: SITE.email }],
      }),
      ...socials,
    ]),
    folder('Guides', [
      asset('level', {
        id: 'melee-slashers',
        name: 'Melee Slashers',
        pathName: 'Lvl_MeleeSlashers',
        href: ed('/melee-slashers/'),
        external: false,
        folder: 'Guides',
        summary: 'A quick start guide to melee slashers, with a parry trainer to play.',
        tip: [{ k: 'Includes', v: 'Parry trainer mini game' }],
      }),
    ]),
    folder('Projects', [
      folder('Projects/Games', await byCat('games')),
      folder('Projects/Mods', [...(await byCat('mods')), ...modLinks]),
      folder('Projects/Software', [folder('Projects/Software/Archive', repoLinks), ...(await byCat('software'))]),
      folder('Projects/Events', await byCat('events')),
    ]),
    asset('level', {
      id: 'home',
      name: 'Main',
      pathName: 'Lvl_Main',
      href: ed('/'),
      external: false,
      folder: '',
      summary: 'The home page: featured projects and what I do.',
      tip: [{ k: 'Opens', v: 'Home' }],
    }),
  ]);
}

/** Every folder in the tree, depth first. */
export function allFolders(root: DrawerFolder): DrawerFolder[] {
  return [root, ...root.children.filter((c): c is DrawerFolder => c.kind === 'folder').flatMap(allFolders)];
}

/** Every asset in the tree. */
export function allAssets(root: DrawerFolder): DrawerAsset[] {
  return allFolders(root).flatMap((f) => f.children.filter((c): c is DrawerAsset => c.kind === 'asset'));
}

/** How many assets live in a folder and everything under it. */
export const assetCount = (f: DrawerFolder): number =>
  f.children.reduce((n, c) => n + (c.kind === 'asset' ? 1 : assetCount(c)), 0);
