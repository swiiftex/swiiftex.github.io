/**
 * Shared vocabulary for the editor layout: icon names, asset naming, the
 * Content Drawer's folders and the Output Log's line format.
 */
import type { Project } from './projects';
import type { Category } from '../content.config';

export type UeIconName =
  | 'level'
  | 'blueprint'
  | 'folder'
  | 'folder-open'
  | 'texture'
  | 'media'
  | 'video'
  | 'widget'
  | 'data'
  | 'link'
  | 'save'
  | 'select'
  | 'quickadd'
  | 'cinematics'
  | 'play'
  | 'pause'
  | 'next'
  | 'prev'
  | 'stop'
  | 'more'
  | 'platforms'
  | 'settings'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'close'
  | 'search'
  | 'filter'
  | 'menu'
  | 'perspective'
  | 'lit'
  | 'show'
  | 'move'
  | 'rotate'
  | 'scale'
  | 'globe'
  | 'grid'
  | 'angle'
  | 'camera'
  | 'maximize'
  | 'drawer'
  | 'log'
  | 'terminal'
  | 'branch'
  | 'check'
  | 'plus'
  | 'import'
  | 'save-all'
  | 'actor'
  | 'component'
  | 'details'
  | 'graph'
  | 'event'
  | 'function'
  | 'sequence'
  | 'variable'
  | 'mail'
  | 'external'
  | 'copy'
  | 'star'
  | 'clock'
  | 'info'
  | 'warning'
  | 'error'
  | 'back'
  | 'forward'
  | 'plugin'
  | 'minimize'
  | 'restore'
  | 'game'
  | 'table'
  | 'utility'
  | 'fullscreen'
  | 'history'
  | 'user';

/** "Goldrush: Revived" → "GoldrushRevived", "swiift's Comp Mod" → "SwiiftsCompMod". */
export const pascal = (title: string) =>
  title
    .replace(/['’]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');

/** The project's Blueprint asset name, e.g. BP_LUNARBALL. */
export const bpName = (p: Project) => `BP_${pascal(p.data.title)}`;

/** The editor view lives under /editor/; the classic site keeps the plain URLs. */
export const EDITOR_BASE = '/editor';

/** An editor-view URL for a site path: "/lunarball/#updates" → "/editor/lunarball/#updates". */
export const ed = (href: string) => (href.startsWith('/') && !href.startsWith(`${EDITOR_BASE}/`) ? `${EDITOR_BASE}${href}` : href);

/** The same page in the other view. The classic site keeps mods on the Games page. */
export function toClassic(path: string) {
  const p = path.startsWith(`${EDITOR_BASE}/`) ? path.slice(EDITOR_BASE.length) : path;
  return p === '/mods/' || p === '/mods' ? '/games/#mods' : p;
}
export function toEditor(path: string) {
  if (path.startsWith(`${EDITOR_BASE}/`)) return path;
  return /^\/404\/?$/.test(path) ? `${EDITOR_BASE}/` : ed(path.endsWith('/') ? path : `${path}/`);
}

/** Content Drawer folder for each category. */
export const CATEGORY_FOLDER: Record<Category, string> = {
  games: 'Projects/Games',
  mods: 'Projects/Mods',
  software: 'Projects/Software',
  events: 'Projects/Events',
};

/** Page each category's folder opens as a level. */
export const CATEGORY_HREF: Record<Category, string> = {
  games: '/editor/games/',
  mods: '/editor/mods/',
  software: '/editor/software/',
  events: '/editor/events/',
};

export const assetPath = (folder: string, name: string) => `/Game/${folder ? `${folder}/` : ''}${name}`;

/** Asset type shown under Content Browser tiles, with its colour strip. */
export const ASSET_TYPES = {
  blueprint: { label: 'Blueprint Class', color: 'var(--asset-blueprint)', icon: 'blueprint' },
  level: { label: 'Level', color: 'var(--asset-level)', icon: 'level' },
  link: { label: 'Hyperlink', color: 'var(--asset-link)', icon: 'link' },
  data: { label: 'Data Asset', color: 'var(--asset-data)', icon: 'data' },
} as const satisfies Record<string, { label: string; color: string; icon: UeIconName }>;
export type AssetKind = keyof typeof ASSET_TYPES;

export type LogVerbosity = 'Display' | 'Warning' | 'Error' | 'Log';
export type LogLine = {
  /** Log category without the "Log" prefix, e.g. "News" → LogNews. */
  cat: string;
  verbosity?: LogVerbosity;
  text: string;
  href?: string;
  /** Link text shown after the line. */
  action?: string;
  /** ISO date; defaults to the build time. */
  time?: string;
};

/** Unreal's log timestamp: [2026.10.26-23.05.42:000] */
export function logStamp(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const p = (n: number, l = 2) => String(n).padStart(l, '0');
  return `[${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())}-${p(d.getUTCHours())}.${p(d.getUTCMinutes())}.${p(d.getUTCSeconds())}:${p(d.getUTCMilliseconds(), 3)}]`;
}

/** A tab in one of the docked tab wells. */
export type DockTab = { id: string; label: string; icon: UeIconName; title?: string };

/** A link shown in the toolbar's Platforms menu and the Details panel. */
export type ProjectLink = {
  label: string;
  href: string;
  external: boolean;
  /** A file in a repo's latest GitHub release (re-checked in the browser). */
  release?: { repo: string; asset: string };
  tag?: string;
};
