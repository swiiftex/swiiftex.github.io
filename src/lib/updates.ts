/**
 * A project's update posts, from Steam or GitHub depending on its `updates`
 * setting, plus the list of sources the hourly update check compares.
 */
import type { Project } from './projects';
import { RELEASES_PER_PAGE, latestRelease, releasePosts } from './github';
import { getCommits, getReleases } from './releases';
import { STEAM_STAMP_JQ, steamEventsUrl, steamUpdates } from './steam-events';
import type { UpdatePost } from './updates-view';

export async function projectUpdates(p: Project): Promise<UpdatePost[]> {
  const u = p.data.updates;
  if (!u) return [];
  if (u.steam && p.data.steamAppId) return (await steamUpdates(p.data.steamAppId)).posts;
  if (u.github) {
    const releases = await getReleases(u.github);
    if (!releases) return [];
    const commits = u.notes === 'commits' ? await getCommits(u.github) : null;
    return releasePosts(u.github, releases, commits);
  }
  return [];
}

/** One per source: a URL, a jq expression that pulls the current version out of it, and the version this build used. */
export type UpdateSource = { project: string; url: string; jq: string; value: string };

export async function updateSources(projects: Project[]): Promise<UpdateSource[]> {
  const sources: UpdateSource[] = [];
  for (const p of projects) {
    const u = p.data.updates;
    if (u?.steam && p.data.steamAppId) {
      sources.push({
        project: p.id,
        url: steamEventsUrl(p.data.steamAppId, 1),
        jq: STEAM_STAMP_JQ,
        value: (await steamUpdates(p.data.steamAppId)).stamp,
      });
    }
    if (u?.github) {
      sources.push({
        project: p.id,
        url: `https://api.github.com/repos/${u.github}/releases?per_page=${RELEASES_PER_PAGE}`,
        // Same choice as latestRelease(): the newest non-prerelease, else the newest of any.
        jq: '([.[] | select(.draft | not) | select(.prerelease | not)][0].tag_name) // ([.[] | select(.draft | not)][0].tag_name) // ""',
        value: latestRelease((await getReleases(u.github)) ?? [])?.tag ?? '',
      });
    }
  }
  return sources;
}
