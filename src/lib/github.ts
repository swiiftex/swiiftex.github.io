/**
 * GitHub releases and commits, shared by the build and the browser. GitHub's
 * API allows cross-origin requests, so project pages refresh these live.
 */
import { attr, esc, type UpdatePost } from './updates-view';

export type GhAsset = { name: string; url: string; size: number };
export type GhRelease = {
  tag: string;
  name: string;
  date: string;
  url: string;
  /** Release notes, rendered to HTML by GitHub. */
  html: string;
  prerelease: boolean;
  assets: GhAsset[];
};
export type GhCommit = { sha: string; message: string; date: string; url: string };

/** How many releases to look at; the update-check workflow uses the same number. */
export const RELEASES_PER_PAGE = 30;

async function get(path: string, accept: string, token?: string) {
  const headers: Record<string, string> = { Accept: accept };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (typeof window === 'undefined') headers['User-Agent'] = 'swiift-portfolio-build';
  const res = await fetch(`https://api.github.com/repos/${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${path}`);
  return res.json();
}

export async function fetchReleases(repo: string, token?: string): Promise<GhRelease[]> {
  const list: any[] = await get(`${repo}/releases?per_page=${RELEASES_PER_PAGE}`, 'application/vnd.github.html+json', token);
  return list
    .filter((r) => !r.draft)
    .map((r) => ({
      tag: r.tag_name,
      name: r.name || r.tag_name,
      date: r.published_at ?? r.created_at,
      url: r.html_url,
      html: r.body_html ?? '',
      prerelease: !!r.prerelease,
      assets: (r.assets ?? []).map((a: any) => ({ name: a.name, url: a.browser_download_url, size: a.size })),
    }));
}

export async function fetchCommits(repo: string, token?: string): Promise<GhCommit[]> {
  const list: any[] = await get(`${repo}/commits?per_page=60`, 'application/vnd.github+json', token);
  return list
    .map((c) => ({
      sha: c.sha,
      message: String(c.commit.message).replace(/^﻿/, '').split('\n')[0].trim(),
      date: c.commit.committer?.date ?? c.commit.author?.date,
      url: c.html_url,
    }))
    .filter((c) => !/^Merge (pull request|branch|remote-tracking)/i.test(c.message));
}

/** Tested releases only (nightlies and betas are skipped), unless there are none yet. */
export function stableReleases(all: GhRelease[]): GhRelease[] {
  const stable = all.filter((r) => !r.prerelease);
  return stable.length ? stable : all;
}

export const latestRelease = (all: GhRelease[]) => stableReleases(all)[0] ?? null;

/**
 * Releases as update posts, newest first. With commits, each release lists
 * the commits made since the release before it instead of its own notes.
 */
export function releasePosts(repo: string, releases: GhRelease[], commits?: GhCommit[] | null): UpdatePost[] {
  const list = stableReleases(releases);
  return list.map((r, i) => {
    let html = r.html;
    if (commits) {
      const since = list[i + 1]?.date ?? '';
      const own = commits.filter((c) => c.date <= r.date && c.date > since);
      if (own.length) {
        html = `<ul>${own
          .map(
            (c) =>
              `<li>${esc(c.message)} <a class="upd__sha mono" href="${attr(c.url)}" target="_blank" rel="noopener">${c.sha.slice(0, 7)}</a></li>`,
          )
          .join('')}</ul>`;
      }
    }
    return { key: `gh:${repo}:${r.tag}`, title: r.name, tag: r.tag, date: r.date, url: r.url, html, source: 'github' as const };
  });
}
