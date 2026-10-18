/**
 * Build-time lookup of a game's Steam update posts (events), turned into
 * update posts with their images optimised. Steam's API can't be called from
 * the browser, so these refresh when the site rebuilds: the deploy workflow
 * checks Steam every hour and rebuilds when a post is added or edited.
 */
import { getImage, inferRemoteSize } from 'astro:assets';
import { bbcodeImages, bbcodeToHtml, steamUrl, type BbImage } from './bbcode';
import type { UpdatePost } from './updates-view';

export const steamEventsUrl = (appId: string, count: number) =>
  `https://store.steampowered.com/events/ajaxgetpartnereventspageable/?clan_accountid=0&appid=${appId}&offset=0&count=${count}&l=english`;

/** What the update-check workflow compares: the newest post and when it was last edited. */
export const STEAM_STAMP_JQ = '.events[0] | "\\(.gid):\\(.rtime32_last_modified)"';

// Steam event types that are game updates: patch notes, regular and major updates.
const UPDATE_TYPES: Record<number, string> = { 12: 'Patch notes', 13: 'Update', 14: 'Major update' };

export type SteamUpdates = { posts: UpdatePost[]; stamp: string };

async function optimise(url: string, maxWidth: number): Promise<BbImage> {
  try {
    const size = await inferRemoteSize(url);
    const width = Math.min(maxWidth, size.width);
    const height = Math.round((width * size.height) / size.width);
    const img = await getImage({ src: url, width, height, format: 'webp' });
    return { src: img.src, width, height };
  } catch {
    console.warn(`[steam] Couldn't optimise ${url}; linking to it directly.`);
    return { src: url };
  }
}

async function load(appId: string): Promise<SteamUpdates> {
  let events: any[];
  try {
    const res = await fetch(steamEventsUrl(appId, 10));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    events = (await res.json()).events ?? [];
  } catch (e: any) {
    console.warn(`[steam] Couldn't load update posts for app ${appId}: ${e.message}`);
    return { posts: [], stamp: '' };
  }

  const stamp = events[0] ? `${events[0].gid}:${events[0].rtime32_last_modified}` : '';
  const updates = events.filter(
    (e) => e.announcement_body && (UPDATE_TYPES[e.event_type] || e.announcement_body.tags?.includes('patchnotes')),
  );

  const posts = await Promise.all(
    updates.map(async (e): Promise<UpdatePost> => {
      const body: string = e.announcement_body.body ?? '';
      const images = new Map(await Promise.all(bbcodeImages(body).map(async (u) => [u, await optimise(u, 1280)] as const)));

      let meta: any = {};
      try {
        meta = JSON.parse(e.jsondata || '{}');
      } catch {
        /* no extras */
      }
      const clan = e.announcement_body.clanid;
      const header = meta.localized_title_image?.[0] ?? meta.localized_capsule_image?.[0];
      const cover = header && clan ? await optimise(steamUrl(`{STEAM_CLAN_IMAGE}/${clan}/${header}`), 1600) : undefined;

      return {
        key: `steam:${e.gid}`,
        title: e.event_name,
        date: new Date(e.rtime32_start_time * 1000).toISOString(),
        url: `https://store.steampowered.com/news/app/${appId}/view/${e.gid}`,
        html: bbcodeToHtml(body, images),
        source: 'steam',
        tag: UPDATE_TYPES[e.event_type] ?? 'Patch notes',
        subtitle: meta.localized_subtitle?.[0] || undefined,
        cover,
      };
    }),
  );
  return { posts, stamp };
}

const cache = new Map<string, Promise<SteamUpdates>>();

export function steamUpdates(appId: string): Promise<SteamUpdates> {
  if (!cache.has(appId)) cache.set(appId, load(appId));
  return cache.get(appId)!;
}
