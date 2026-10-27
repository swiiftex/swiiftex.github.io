/**
 * Blueprint graphs for the "Details" tab: Event BeginPlay fans out through a
 * Sequence node to one function node per thing done on the project.
 */
import { projectHref, type Project } from './projects';
import { bpName } from './editor';

export type PinType = 'exec' | 'object' | 'string' | 'text' | 'bool' | 'int' | 'float';
export type BpPin = { id: string; label?: string; type: PinType; dir: 'in' | 'out'; value?: string };
export type BpNode = {
  id: string;
  kind: 'event' | 'sequence' | 'function';
  title: string;
  detail?: string;
  /** Small grey line at the bottom of function nodes, e.g. "Target is BP LUNARBALL". */
  footer?: string;
  pins: BpPin[];
  href?: string;
};
export type BpGraph = {
  /** Blueprint asset, shown in the breadcrumb. */
  asset: string;
  /** Comment box drawn around the function nodes. */
  comment?: string;
  tint?: string;
  nodes: BpNode[];
  /** [from pin id, to pin id] */
  links: [string, string][];
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "UI programming in UMG — button glyphs…" → title + detail. */
export function splitHighlight(text: string): { title: string; detail?: string } {
  const dash = text.indexOf(' — ');
  if (dash > 0) return { title: text.slice(0, dash), detail: cap(text.slice(dash + 3)) };
  const colon = /^(.{3,40}?):\s(.+)$/.exec(text);
  if (colon) return { title: colon[1], detail: cap(colon[2]) };
  return { title: text };
}

type Step = { title: string; detail?: string; href?: string; pins?: BpPin[] };

/** Event BeginPlay → Sequence → one function node per step. */
export function buildGraph(asset: string, steps: Step[], opts: { comment?: string; tint?: string; target?: string } = {}): BpGraph {
  const target = opts.target ?? asset.replace(/^BP_/, 'BP ');
  const nodes: BpNode[] = [
    { id: 'begin', kind: 'event', title: 'Event BeginPlay', pins: [{ id: 'begin.out', type: 'exec', dir: 'out' }] },
    {
      id: 'seq',
      kind: 'sequence',
      title: 'Sequence',
      pins: [
        { id: 'seq.in', type: 'exec', dir: 'in' },
        ...steps.map((_, i): BpPin => ({ id: `seq.then${i}`, label: `Then ${i}`, type: 'exec', dir: 'out' })),
      ],
    },
  ];
  const links: [string, string][] = [['begin.out', 'seq.in']];
  steps.forEach((s, i) => {
    const id = `fn${i}`;
    nodes.push({
      id,
      kind: 'function',
      title: s.title,
      detail: s.detail,
      href: s.href,
      footer: `Target is ${target}`,
      pins: [
        { id: `${id}.in`, type: 'exec', dir: 'in' },
        { id: `${id}.out`, type: 'exec', dir: 'out' },
        ...(s.pins ?? [{ id: `${id}.target`, label: 'Target', type: 'object', dir: 'in', value: 'self' }]),
      ],
    });
    links.push([`seq.then${i}`, `${id}.in`]);
  });
  return { asset, comment: opts.comment, tint: opts.tint, nodes, links };
}

/** A project's graph: its highlights, or its summary if it has none. */
export function projectGraph(p: Project): BpGraph {
  const d = p.data;
  const steps = d.highlights.length ? d.highlights.map(splitHighlight) : [{ title: d.title, detail: d.summary }];
  return buildGraph(bpName(p), steps, { comment: d.highlights.length ? d.highlightsTitle : undefined, tint: d.tint });
}

/** A folder's graph: one node per project, each opening it. */
export function folderGraph(name: string, projects: Project[]): BpGraph {
  return buildGraph(
    `BP_${name}`,
    projects.map((p) => ({ title: p.data.title, detail: p.data.summary, href: projectHref(p) })),
    { comment: name },
  );
}
