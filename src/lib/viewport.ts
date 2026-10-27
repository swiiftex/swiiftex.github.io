/**
 * What the Viewport shows for a page: a project's trailer, clips, videos and
 * screenshots, or a reel of projects. Each item is also a row in the Details
 * panel, where it can be selected.
 */
import type { ImageMetadata } from 'astro';
import { steamTrailer } from './steam';
import { projectHref, type Project } from './projects';
import { thumbOf } from './content-tree';
import { ed, type UeIconName } from './editor';
import type { VideoSource } from '../scripts/hover-video';

export type ViewportItem = {
  id: string;
  /** Row label, e.g. "Screenshot 3" or "Trailer". */
  name: string;
  /** Unreal asset type shown beside the name, e.g. "Texture2D". */
  type: string;
  icon: UeIconName;
  kind: 'image' | 'video' | 'clip' | 'youtube' | 'card';
  /** Shown along the bottom of the viewport. */
  caption?: string;
  /** Still image: the picture itself, or the poster for a video. */
  image?: ImageMetadata;
  /** Small WebP for the Details list (and the blurred backdrop). */
  thumb?: string;
  video?: VideoSource;
  clip?: string;
  youtube?: string;
  /** Open this project page from the viewport (reels). */
  href?: string;
  /** Label for the open button. */
  action?: string;
  /** Lower-third tag, e.g. "Now shipping". */
  tag?: string;
  /** For title cards. */
  card?: { title: string; kicker?: string; meta?: string };
  tint?: string;
  /** Show screenshots of apps whole instead of filling the viewport. */
  fit?: 'contain' | 'cover';
};

const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** A project's media, trailer first. */
export async function projectViewport(p: Project): Promise<ViewportItem[]> {
  const d = p.data;
  const items: ViewportItem[] = [];
  const poster = d.hero ?? d.cover;
  const shot = d.category === 'events' ? 'Photo' : 'Screenshot';
  const fit = d.category === 'software' ? 'contain' : undefined;

  const trailer = d.steamAppId ? await steamTrailer(d.steamAppId) : null;
  if (trailer)
    items.push({
      id: 'trailer',
      name: 'Trailer',
      type: 'Stream Media Source',
      icon: 'media',
      kind: 'video',
      video: trailer,
      image: poster,
      thumb: poster && (await thumbOf(poster)),
      caption: `${d.title} trailer from Steam`,
    });

  // Key art and banner first, unless they're also in the gallery.
  const inGallery = new Set(d.gallery.map((g) => g.src.src));
  if (d.cover && !inGallery.has(d.cover.src))
    items.push({
      id: 'cover',
      name: d.category === 'events' ? 'Cover Photo' : d.category === 'software' ? 'Cover' : 'Key Art',
      type: 'Texture2D',
      icon: 'texture',
      kind: 'image',
      image: d.cover,
      thumb: await thumbOf(d.cover),
      caption: d.coverAlt,
      fit,
    });
  if (d.hero && d.hero.src !== d.cover?.src && !inGallery.has(d.hero.src))
    items.push({
      id: 'banner',
      name: 'Banner',
      type: 'Texture2D',
      icon: 'texture',
      kind: 'image',
      image: d.hero,
      thumb: await thumbOf(d.hero),
      caption: `${d.title} banner art`,
    });

  if (d.clip)
    items.push({
      id: 'clip',
      name: 'Gameplay Clip',
      type: 'File Media Source',
      icon: 'video',
      kind: 'clip',
      clip: d.clip,
      image: poster,
      thumb: poster && (await thumbOf(poster)),
      caption: `${d.title} gameplay clip`,
    });

  d.youtube.forEach((v, i) =>
    items.push({
      id: `video-${i + 1}`,
      name: v.title.replace(new RegExp(`^${escapeRe(d.title)}\\s*[—-]\\s*`, 'i'), '').replace(/^./, (c) => c.toUpperCase()),
      type: 'YouTube Video',
      icon: 'video',
      kind: 'youtube',
      youtube: v.id,
      thumb: ytThumb(v.id),
      caption: v.title,
    }),
  );

  for (const [i, g] of d.gallery.entries())
    items.push({
      id: `shot-${i + 1}`,
      name: `${shot} ${i + 1}`,
      type: 'Texture2D',
      icon: 'texture',
      kind: 'image',
      image: g.src,
      thumb: await thumbOf(g.src),
      caption: g.alt,
      fit,
    });

  if (!items.length)
    items.push({
      id: 'title-card',
      name: 'Title Card',
      type: 'Widget Blueprint',
      icon: 'widget',
      kind: 'card',
      card: { title: d.title, kicker: d.kicker, meta: d.status ?? d.when },
      caption: d.summary,
      tint: d.tint,
    });

  return items;
}

/** One project as a reel item that opens its page. */
export async function reelItem(
  p: Project,
  opts: { tag?: string; caption?: string; trailer?: boolean; video?: VideoSource | null } = {},
): Promise<ViewportItem> {
  const d = p.data;
  const image = d.cover ?? d.hero;
  const video = opts.video !== undefined ? opts.video : opts.trailer && d.steamAppId ? await steamTrailer(d.steamAppId) : null;
  return {
    id: p.id,
    name: d.title,
    type: 'Blueprint Class',
    icon: 'blueprint',
    kind: video ? 'video' : image ? 'image' : 'card',
    video: video ?? undefined,
    image,
    thumb: image && (await thumbOf(image)),
    caption: opts.caption ?? d.summary,
    href: ed(projectHref(p)),
    action: `Open ${d.title}`,
    tag: opts.tag ?? d.kicker,
    card: image ? undefined : { title: d.title, kicker: d.kicker, meta: d.status ?? d.when },
    tint: d.tint,
    fit: d.category === 'software' ? 'contain' : undefined,
  };
}
