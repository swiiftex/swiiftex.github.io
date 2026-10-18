/**
 * Build-time lookups of a repo's GitHub releases and commits: download buttons
 * link straight to the newest file, and project pages show the release notes.
 * The page also re-checks both in the browser (scripts in pages/[slug].astro
 * and components/Updates.astro), so new releases show up without a rebuild.
 */
import { fetchCommits, fetchReleases, latestRelease, type GhCommit, type GhRelease } from './github';

export type ReleaseAsset = { url: string; name: string; tag: string; size: number };

// In CI, a token avoids the shared-IP rate limit on anonymous API calls.
const token = () => process.env.GITHUB_TOKEN;

const releases = new Map<string, Promise<GhRelease[] | null>>();
const commits = new Map<string, Promise<GhCommit[] | null>>();

export function getReleases(repo: string): Promise<GhRelease[] | null> {
  if (!releases.has(repo)) {
    releases.set(
      repo,
      fetchReleases(repo, token()).catch((e) => {
        console.warn(`[releases] Couldn't look up the releases of ${repo}: ${e.message}`);
        return null;
      }),
    );
  }
  return releases.get(repo)!;
}

export function getCommits(repo: string): Promise<GhCommit[] | null> {
  if (!commits.has(repo)) {
    commits.set(
      repo,
      fetchCommits(repo, token()).catch((e) => {
        console.warn(`[releases] Couldn't look up the commits of ${repo}: ${e.message}`);
        return null;
      }),
    );
  }
  return commits.get(repo)!;
}

export async function latestAsset(repo: string, assetPattern: string): Promise<ReleaseAsset | null> {
  const release = latestRelease((await getReleases(repo)) ?? []);
  if (!release) {
    console.warn(`[releases] No release found for ${repo}; using the fallback link.`);
    return null;
  }
  const re = new RegExp(assetPattern, 'i');
  const asset = release.assets.find((a) => re.test(a.name));
  if (!asset) {
    console.warn(`[releases] No asset matching /${assetPattern}/ in ${repo} ${release.tag}; using the fallback link.`);
    return null;
  }
  return { url: asset.url, name: asset.name, tag: release.tag, size: asset.size };
}
