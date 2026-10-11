/**
 * Build-time lookup of a Steam game's main trailer, so previews stream the
 * current trailer straight from Steam's CDN. Re-fetched on every site build
 * (including the weekly scheduled one).
 */
import type { VideoSource } from '../scripts/hover-video';

const cache = new Map<string, Promise<VideoSource | null>>();

export function steamTrailer(appId: string): Promise<VideoSource | null> {
  if (!cache.has(appId)) {
    cache.set(
      appId,
      fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=gb&l=english`)
        .then((r) => (r.ok ? r.json() : null))
        .then((json): VideoSource | null => {
          // The store lists the main trailer first.
          for (const m of json?.[appId]?.data?.movies ?? []) {
            if (m.hls_h264) return { type: 'hls', src: m.hls_h264 };
            const mp4 = m.mp4?.['480'] ?? m.mp4?.max;
            if (mp4) return { type: 'mp4', src: mp4 };
          }
          return null;
        })
        .catch(() => null)
        .then((source) => {
          if (!source) console.warn(`[steam] No trailer found for app ${appId}.`);
          return source;
        }),
    );
  }
  return cache.get(appId)!;
}
