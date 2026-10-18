/**
 * Renders a project's update posts (Steam events or GitHub releases) as HTML.
 * Shared by the build and the browser, so a live refresh from GitHub produces
 * exactly the markup the page was built with.
 */

export type UpdatePost = {
  /** Stable id, e.g. "steam:<gid>" or "gh:<repo>:<tag>". */
  key: string;
  title: string;
  /** ISO date. */
  date: string;
  /** The post on Steam or GitHub. */
  url: string;
  /** Body, already HTML. */
  html: string;
  source: 'steam' | 'github';
  /** Version tag (GitHub) or post type (Steam), shown as a chip. */
  tag?: string;
  subtitle?: string;
  cover?: { src: string; width?: number; height?: number };
};

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const attr = (s: string) => esc(s).replace(/"/g, '&quot;');

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const updateDate = (iso: string) => dateFmt.format(new Date(iso));

/** Posts that were published in the last few weeks count as new. */
export const isRecent = (iso: string, days = 30) => Date.now() - new Date(iso).valueOf() < days * 86_400_000;

/** Changes whenever a post is added, removed or edited. */
export const updatesSignature = (posts: UpdatePost[]) => posts.map((p) => `${p.key}:${p.html.length}`).join('|');

const where = (p: UpdatePost) => (p.source === 'steam' ? 'Read it on Steam' : 'View the release on GitHub');

const sourceLink = (p: UpdatePost) =>
  `<a class="upd__source mono" href="${attr(p.url)}" target="_blank" rel="noopener">${where(p)} <span aria-hidden="true">↗</span></a>`;

const tagChip = (p: UpdatePost) => (p.tag ? `<span class="upd__tag mono">${esc(p.tag)}</span>` : '');

const time = (p: UpdatePost) => `<time class="mono" datetime="${attr(p.date)}">${updateDate(p.date)}</time>`;

function latest(p: UpdatePost) {
  const cover = p.cover
    ? `<img class="upd__cover" src="${attr(p.cover.src)}" alt=""${p.cover.width ? ` width="${p.cover.width}" height="${p.cover.height}"` : ''} loading="lazy" decoding="async">`
    : '';
  return `<article class="upd__post">${cover}<div class="upd__inner">
<header class="upd__post-head">
<p class="upd__meta">${tagChip(p)}${time(p)}</p>
<h3 class="upd__title display">${esc(p.title)}</h3>
${p.subtitle ? `<p class="upd__sub">${esc(p.subtitle)}</p>` : ''}
${sourceLink(p)}
</header>
<div class="upd__content">
<div class="upd__body prose" data-upd-body>${p.html}</div>
<button type="button" class="upd__more mono" data-upd-more hidden aria-expanded="false">Show the full notes</button>
</div>
</div></article>`;
}

const earlier = (p: UpdatePost) => `<details class="upd__item">
<summary>${tagChip(p)}<span class="upd__item-title">${esc(p.title)}</span>${time(p)}</summary>
<div class="upd__item-body"><div class="upd__body prose">${p.html}</div>${sourceLink(p)}</div>
</details>`;

export function renderUpdates(posts: UpdatePost[], more = 6): string {
  const [first, ...rest] = posts;
  if (!first) return '';
  const older = rest.slice(0, more);
  return (
    latest(first) +
    (older.length
      ? `<div class="upd__earlier"><h3 class="upd__earlier-title mono">Earlier updates</h3>${older.map(earlier).join('')}</div>`
      : '')
  );
}
