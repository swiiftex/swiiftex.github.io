/**
 * Steam event posts are written in Steam's BBCode. This turns them into HTML
 * so update posts look the way they do on Steam: headings, lists, images,
 * carousels, videos and tables. Unknown tags are dropped and their text kept.
 */
import { attr, esc } from './updates-view';

const CLAN_IMAGES = 'https://clan.akamai.steamstatic.com/images';

export type BbImage = { src: string; width?: number; height?: number };

/** Steam writes its image host as a placeholder; quotes around values are optional. */
export const steamUrl = (raw: string) =>
  raw
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace('{STEAM_CLAN_IMAGE}', CLAN_IMAGES);

const safeUrl = (raw: string) => {
  const url = steamUrl(raw);
  return /^https?:\/\//i.test(url) ? url : null;
};

const IMG_RE = /\[img(?:\s+src=("[^"]*"|[^\]\s]+))?[^\]]*\]([\s\S]*?)\[\/img\]/gi;

/** Every image a post uses, so they can be optimised before rendering. */
export function bbcodeImages(body: string): string[] {
  const urls = new Set<string>();
  for (const m of body.matchAll(IMG_RE)) {
    const url = safeUrl(m[1] ?? m[2]);
    if (url) urls.add(url);
  }
  return [...urls];
}

const YT_PLAY =
  '<svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true"><path d="M66.5 7.7a8.5 8.5 0 0 0-6-6C55.2.3 34 .3 34 .3S12.8.3 7.5 1.7a8.5 8.5 0 0 0-6 6C0 13 0 24 0 24s0 11 1.5 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C68 35 68 24 68 24s0-11-1.5-16.3z" fill="currentColor"/><path d="m27 34 18-10-18-10z" fill="#fff"/></svg>';

// Simple tags: BBCode name → [opening HTML, closing HTML].
const TAGS: Record<string, [string, string]> = {
  p: ['<p>', '</p>'],
  h1: ['<h4 class="bb-h1">', '</h4>'],
  h2: ['<h5 class="bb-h2">', '</h5>'],
  h3: ['<h6 class="bb-h3">', '</h6>'],
  h4: ['<h6 class="bb-h3">', '</h6>'],
  h5: ['<h6 class="bb-h3">', '</h6>'],
  b: ['<strong>', '</strong>'],
  i: ['<em>', '</em>'],
  u: ['<u>', '</u>'],
  s: ['<s>', '</s>'],
  strike: ['<s>', '</s>'],
  spoiler: ['<span class="bb-spoiler">', '</span>'],
  quote: ['<blockquote>', '</blockquote>'],
  code: ['<pre class="bb-code"><code>', '</code></pre>'],
  hr: ['<hr>', ''],
  table: ['<div class="bb-table"><table>', '</table></div>'],
  tr: ['<tr>', '</tr>'],
  th: ['<th>', '</th>'],
  td: ['<td>', '</td>'],
  carousel: ['<div class="bb-carousel">', '</div>'],
  expand: ['<details class="bb-expand"><summary>More</summary>', '</details>'],
  // Lists are finished off below, once every item is marked.
  list: ['<ul>\u0005', '\u0006</ul>'],
  olist: ['<ol>\u0005', '\u0006</ol>'],
};

const BLOCK = 'p|h4|h5|h6|ul|ol|li|div|blockquote|pre|table|tr|td|th|details|summary|hr';

export function bbcodeToHtml(body: string, images: Map<string, BbImage> = new Map()): string {
  const OPEN = '\u0001';
  const CLOSE = '\u0002';
  const tokens: string[] = [];
  const tok = (html: string) => `\u0003${tokens.push(html) - 1}\u0003`;

  let s = body.replace(/\r\n?/g, '\n');

  // Escaped brackets are literal text, as is anything inside [noparse].
  s = s.replace(/\\\[/g, OPEN).replace(/\\\]/g, CLOSE);
  s = s.replace(/\[noparse\]([\s\S]*?)\[\/noparse\]/gi, (_, t: string) => t.replace(/\[/g, OPEN).replace(/\]/g, CLOSE));

  // Tags with URLs become finished HTML first, so escaping can't touch them.
  s = s.replace(IMG_RE, (_, a: string | undefined, b: string) => {
    const url = safeUrl(a ?? b);
    if (!url) return '';
    const img = images.get(url) ?? { src: url };
    const size = img.width ? ` width="${img.width}" height="${img.height}"` : '';
    return tok(`<img class="bb-img" src="${attr(img.src)}" alt=""${size} loading="lazy" decoding="async">`);
  });

  s = s.replace(/\[previewyoutube=["']?([\w-]+)[^\]]*\](?:\s*\[\/previewyoutube\])?/gi, (_, id: string) =>
    tok(
      `<div class="bb-yt" data-bb-yt="${attr(id)}"><img src="https://i.ytimg.com/vi/${attr(id)}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async"><button type="button" class="bb-yt__play" aria-label="Play video">${YT_PLAY}</button></div>`,
    ),
  );

  s = s.replace(/\[video([^\]]*)\]([\s\S]*?)\[\/video\]/gi, (_, attrs: string) => {
    const a = Object.fromEntries([...attrs.matchAll(/(\w+)=["']([^"']*)["']/g)].map((m) => [m[1].toLowerCase(), m[2]]));
    const sources = (['webm', 'mp4'] as const)
      .map((type) => {
        const url = a[type] && safeUrl(a[type]);
        return url ? `<source src="${attr(url)}" type="video/${type}">` : '';
      })
      .join('');
    if (!sources) return '';
    const poster = a.poster && safeUrl(a.poster);
    return tok(`<video class="bb-video" controls playsinline preload="none"${poster ? ` poster="${attr(poster)}"` : ''}>${sources}</video>`);
  });

  s = s.replace(/\[url=("[^"]*"|'[^']*'|[^\]]+)\]([\s\S]*?)\[\/url\]/gi, (_, href: string, text: string) => {
    const url = safeUrl(href);
    return url ? `${tok(`<a href="${attr(url)}" target="_blank" rel="noopener">`)}${text}${tok('</a>')}` : text;
  });
  s = s.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, (_, href: string) => {
    const url = safeUrl(href);
    return url ? tok(`<a href="${attr(url)}" target="_blank" rel="noopener">${esc(url)}</a>`) : href;
  });
  s = s.replace(/\[dynamiclink\s+href=("[^"]*"|[^\]\s]+)[^\]]*\](?:\s*\[\/dynamiclink\])?/gi, (_, href: string) => {
    const url = safeUrl(href);
    return url ? tok(`<a href="${attr(url)}" target="_blank" rel="noopener">${esc(url)}</a>`) : '';
  });

  // Everything left is text and simple tags.
  s = esc(s);
  s = s.replace(/\[(\/?)([a-z][a-z0-9]*)(?:[= ][^\]]*)?\]/gi, (m, close: string, name: string) => {
    const tag = TAGS[name.toLowerCase()];
    return tag ? tag[close ? 1 : 0] : m;
  });

  // List items: Steam closes them with [/*], older posts don't.
  s = s
    .replace(/\[\/\*\]/g, '')
    .replace(/\[\*\]/g, '\u0004')
    .replace(/\u0005\s*\u0004/g, '<li>')
    .replace(/\u0004/g, '</li><li>')
    .replace(/\u0005/g, '')
    .replace(/\u0006/g, '</li>')
    .replace(/<(ul|ol)><\/li>/g, '<$1>');

  // Leftover tags from Steam's set are dropped; other bracketed text is kept.
  s = s.replace(
    /\[\/?(?:img|url|video|previewyoutube|dynamiclink|emoticon|sticker|center|left|right)(?:[= ][^\]]*)?\]/gi,
    '',
  );

  // Line breaks inside text, but not between blocks.
  s = s
    .replace(/\n/g, '<br>')
    .replace(new RegExp(`(<(?:${BLOCK})\\b[^>]*>)(?:\\s|<br>)+`, 'g'), '$1')
    .replace(new RegExp(`(?:\\s|<br>)+(</(?:${BLOCK})>)`, 'g'), '$1')
    .replace(new RegExp(`(</(?:${BLOCK})>)(?:\\s|<br>)+`, 'g'), '$1');

  // Steam uses empty paragraphs and headings as spacers; the page spaces blocks itself.
  for (let i = 0; i < 2; i++) s = s.replace(/<(p|h4|h5|h6)\b[^>]*>(?:\s|&nbsp;|<br>)*<\/\1>/g, '');

  return s
    .replace(/\u0003(\d+)\u0003/g, (_, i: string) => tokens[Number(i)])
    .replace(new RegExp(OPEN, 'g'), '[')
    .replace(new RegExp(CLOSE, 'g'), ']')
    .trim();
}
