import { getImage } from 'astro:assets';
import { steamTrailer } from './steam';
import type { Project } from './projects';
import type { CardPreview } from '../components/ProjectCard.astro';

/**
 * Hover preview for a project card: its Steam trailer if it has one,
 * otherwise a slideshow of its gallery (ending on the cover so it loops back).
 */
export async function cardPreview(p: Project): Promise<CardPreview | undefined> {
  if (p.data.steamAppId) {
    const source = await steamTrailer(p.data.steamAppId);
    if (source) return { kind: 'video', source };
  }
  const cover = p.data.cover;
  const slides = p.data.gallery.map((g) => g.src).filter((src) => src.src !== cover?.src);
  if (slides.length === 0) return undefined;
  if (cover) slides.push(cover);
  const images = await Promise.all(slides.map((src) => getImage({ src, width: 800, format: 'webp' }).then((r) => r.src)));
  return { kind: 'gallery', images };
}
