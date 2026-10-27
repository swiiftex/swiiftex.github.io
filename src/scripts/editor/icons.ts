/** The few editor glyphs that scripts create on the fly (same drawings as UeIcon.astro). */
const S = (d: string) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>`;
const F = (d: string) => `<path d="${d}" fill="currentColor"/>`;

const ICONS = {
  info: S('M8 1.8a6.2 6.2 0 1 1 0 12.4A6.2 6.2 0 0 1 8 1.8z') + S('M8 7.3v4') + F('M8 4.3a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z'),
  check: S('M3 8.5 6.5 12 13 4.5'),
  close: S('M4 4l8 8M12 4l-8 8'),
  terminal: S('M1.8 2.5h12.4v11H1.8z') + S('M4.5 6.2 6.7 8l-2.2 1.8M8 10.2h3.5'),
} as const;

export function iconSvg(name: keyof typeof ICONS, size = 16) {
  return `<svg class="ue-icon" width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;
}
