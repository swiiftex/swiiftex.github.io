/**
 * Build-time lookup of a repo's latest GitHub release, so download buttons
 * can link straight to the newest file. The project page also re-checks in
 * the browser (script in pages/[slug].astro), so new releases show up without
 * a rebuild.
 */

export type ReleaseAsset = { url: string; name: string; tag: string; size: number };

const cache = new Map<string, Promise<any | null>>();

function latestRelease(repo: string) {
  if (!cache.has(repo)) {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'swiift-portfolio-build',
    };
    // In CI, a token avoids the shared-IP rate limit on anonymous API calls.
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    cache.set(
      repo,
      fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    );
  }
  return cache.get(repo)!;
}

export async function latestAsset(repo: string, assetPattern: string): Promise<ReleaseAsset | null> {
  const release = await latestRelease(repo);
  if (!release) {
    console.warn(`[releases] Couldn't look up the latest release of ${repo}; using the fallback link.`);
    return null;
  }
  const re = new RegExp(assetPattern, 'i');
  const asset = (release.assets ?? []).find((a: any) => re.test(a.name));
  if (!asset) {
    console.warn(`[releases] No asset matching /${assetPattern}/ in ${repo} ${release.tag_name}; using the fallback link.`);
    return null;
  }
  return { url: asset.browser_download_url, name: asset.name, tag: release.tag_name, size: asset.size };
}
