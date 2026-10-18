/**
 * Live GitHub lookups for project pages. Each repo is fetched once per page
 * (download buttons and release notes share the result) and cached for the
 * tab session for a few minutes, to stay well inside GitHub's anonymous rate limit.
 */
import { fetchCommits, fetchReleases, type GhCommit, type GhRelease } from '../lib/github';

const MAX_AGE = 5 * 60_000;
const pending = new Map<string, Promise<any>>();

function cached<T>(key: string, load: () => Promise<T>): Promise<T | null> {
  if (!pending.has(key)) {
    pending.set(
      key,
      (async () => {
        try {
          const hit = JSON.parse(sessionStorage.getItem(key) || 'null');
          if (hit && Date.now() - hit.t < MAX_AGE) return hit.v as T;
        } catch {
          /* storage unavailable */
        }
        try {
          const v = await load();
          try {
            sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v }));
          } catch {
            /* full or unavailable */
          }
          return v;
        } catch {
          return null; // offline or rate-limited: keep what the page was built with
        }
      })(),
    );
  }
  return pending.get(key)!;
}

export const liveReleases = (repo: string) => cached<GhRelease[]>(`swiift:gh:releases:${repo}`, () => fetchReleases(repo));
export const liveCommits = (repo: string) => cached<GhCommit[]>(`swiift:gh:commits:${repo}`, () => fetchCommits(repo));
