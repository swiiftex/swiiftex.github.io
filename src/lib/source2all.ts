/**
 * Source2All's supported-games list, read at build time from the "Supported
 * games" table in the app's README so the site follows the app. Falls back to
 * the snapshot in src/data if GitHub can't be reached.
 */
import snapshot from '../data/source2all-games.json';

export type S2AStatus = 'auto' | 'convert' | 'none';
export type S2AGame = { name: string; engine: string; status: S2AStatus; approx: boolean };

const README_URL = 'https://raw.githubusercontent.com/swiiftex/Source2AllSensitivityConverter/HEAD/README.md';

export function parseSupportedGames(markdown: string): S2AGame[] {
  const start = markdown.search(/^##\s+Supported games/im);
  if (start < 0) return [];
  const games: S2AGame[] = [];
  let inTable = false;
  for (const line of markdown.slice(start).split(/\r?\n/).slice(1)) {
    if (/^#{1,6}\s/.test(line)) break; // next section
    if (!line.trim().startsWith('|')) {
      if (inTable) break; // table finished
      continue;
    }
    inTable = true;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 3 || /^-+$/.test(cells[0].replace(/[:\s]/g, '')) || /^game$/i.test(cells[0])) continue;
    const [name, engine, statusText] = cells;
    const status: S2AStatus = /auto-apply/i.test(statusText) ? 'auto' : /convert-only/i.test(statusText) ? 'convert' : 'none';
    games.push({ name, engine, status, approx: statusText.includes('≈') });
  }
  return games;
}

let cached: Promise<S2AGame[]> | null = null;

export function supportedGames(): Promise<S2AGame[]> {
  cached ??= fetch(README_URL)
    .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((md) => {
      const games = parseSupportedGames(md);
      if (games.length < 10) throw new Error('table not found');
      return games;
    })
    .catch((err) => {
      console.warn(`[source2all] Using the saved games list (${err.message ?? err}).`);
      return snapshot as S2AGame[];
    });
  return cached;
}
