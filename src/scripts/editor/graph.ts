/**
 * Blueprint graph: lays the nodes out (Event → Sequence → a column or two of
 * function nodes), draws the wires between pins, and on desks lets you pan
 * (drag), zoom (wheel), drag nodes and double-click to fit. On phones the
 * graph is laid out top to bottom and simply scales to the screen width.
 */
import { desk } from './shell';

type Pos = { x: number; y: number };

const GAP_X = 70;
const GAP_Y = 26;
const PAD = 28;
const MIN_FIT = 0.78;

export function initGraph() {
  const found = document.querySelector<HTMLElement>('[data-bp]');
  if (!found) return;
  const bp = found;
  const canvas = bp.querySelector<HTMLElement>('[data-bp-canvas]')!;
  const world = bp.querySelector<HTMLElement>('[data-bp-world]')!;
  const wires = bp.querySelector<SVGSVGElement>('[data-bp-wires]')!;
  const comment = bp.querySelector<HTMLElement>('[data-bp-comment]');
  const zoomLabel = bp.querySelector<HTMLElement>('[data-bp-zoom]');
  const nodes = [...bp.querySelectorAll<HTMLElement>('[data-bp-node]')];
  const byId = new Map(nodes.map((n) => [n.dataset.bpNode!, n]));
  const links: [string, string][] = JSON.parse(bp.dataset.links || '[]');
  const panel = bp.closest<HTMLElement>('[data-panel]');

  const pos = new Map<HTMLElement, Pos>();
  const view = { x: 0, y: 0, s: 1 };
  let laidOut = false;
  let moved = false; // a node was dragged: keep the user's arrangement on resize

  /* ----- layout ----- */
  const size = (n: HTMLElement) => ({ w: n.offsetWidth, h: n.offsetHeight });

  function layout() {
    const event = byId.get('begin')!;
    const seq = byId.get('seq')!;
    const fns = nodes.filter((n) => n !== event && n !== seq);
    const ev = size(event);
    const sq = size(seq);
    const vertical = !desk.matches || canvas.clientWidth < 640;

    if (vertical) {
      // Event above Sequence on the left, the function nodes cascading down beside them.
      pos.set(event, { x: 0, y: 0 });
      const seqY = ev.h + GAP_Y;
      pos.set(seq, { x: 0, y: seqY });
      const x = sq.w + 34;
      let y = seqY + (comment ? 46 : 0);
      fns.forEach((n) => {
        pos.set(n, { x, y });
        y += size(n).h + GAP_Y;
      });
      return;
    }

    // Try one to three columns of function nodes and keep whichever fits the canvas best.
    const cw = canvas.clientWidth - PAD * 2;
    const ch = canvas.clientHeight - PAD * 2 - 30;
    let best: { cols: number; scale: number } = { cols: 1, scale: 0 };
    for (let cols = 1; cols <= Math.min(3, fns.length); cols++) {
      const rows = Math.ceil(fns.length / cols);
      const colW = Array.from({ length: cols }, (_, c) => Math.max(0, ...fns.filter((_, i) => Math.floor(i / rows) === c).map((n) => size(n).w)));
      const colH = Array.from({ length: cols }, (_, c) =>
        fns.filter((_, i) => Math.floor(i / rows) === c).reduce((h, n) => h + size(n).h + GAP_Y, -GAP_Y),
      );
      const w = ev.w + GAP_X + sq.w + GAP_X * 1.3 + colW.reduce((a, b) => a + b, 0) + GAP_X * (cols - 1);
      const h = Math.max(ev.h, sq.h, ...colH) + (comment ? 40 : 0);
      const scale = Math.min(cw / w, ch / h, 1);
      if (scale > best.scale + 0.04) best = { cols, scale };
    }
    const rows = Math.ceil(fns.length / best.cols);
    const columns = Array.from({ length: best.cols }, (_, c) => fns.filter((_, i) => Math.floor(i / rows) === c));
    const colH = columns.map((col) => col.reduce((h, n) => h + size(n).h + GAP_Y, -GAP_Y));
    const tallest = Math.max(...colH, sq.h);
    const top = comment ? 40 : 0;
    const seqY = top + Math.max(0, (tallest - sq.h) / 2);
    pos.set(event, { x: 0, y: seqY + (sq.h - ev.h) / 2 - 10 });
    pos.set(seq, { x: ev.w + GAP_X, y: seqY });
    let x = ev.w + GAP_X + sq.w + GAP_X * 1.3;
    columns.forEach((col, c) => {
      let y = top + (tallest - colH[c]) / 2;
      col.forEach((n) => {
        pos.set(n, { x, y });
        y += size(n).h + GAP_Y;
      });
      x += Math.max(...col.map((n) => size(n).w)) + GAP_X;
    });
  }

  /* ----- drawing ----- */
  const anchor = (pinId: string): Pos | null => {
    const pin = bp.querySelector<HTMLElement>(`[data-pin="${CSS.escape(pinId)}"]`);
    const node = pin?.closest<HTMLElement>('[data-bp-node]');
    if (!pin || !node) return null;
    const p = pos.get(node)!;
    // Offsets within the node, independent of the current zoom.
    let x = 0;
    let y = 0;
    let el: HTMLElement | null = pin;
    while (el && el !== node) {
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent as HTMLElement | null;
    }
    const out = pin.closest('.bp-pin--out');
    return { x: p.x + x + (out ? pin.offsetWidth : 0), y: p.y + y + pin.offsetHeight / 2 };
  };

  function draw() {
    nodes.forEach((n) => {
      const p = pos.get(n)!;
      n.style.transform = `translate(${p.x}px, ${p.y}px)`;
    });
    const paths = links
      .map(([from, to]) => {
        const a = anchor(from);
        const b = anchor(to);
        if (!a || !b) return '';
        const dx = Math.max(50, Math.abs(b.x - a.x) * 0.5);
        const type = bp.querySelector(`[data-pin="${CSS.escape(from)}"]`)?.closest<HTMLElement>('.bp-pin')?.dataset.type;
        const color = type === 'exec' ? '#ffffff' : `var(--bp-${type})`;
        return `<path d="M${a.x} ${a.y}C${a.x + dx} ${a.y} ${b.x - dx} ${b.y} ${b.x} ${b.y}" stroke="${color}"/>`;
      })
      .join('');
    wires.innerHTML = paths;
    if (comment) {
      const fns = nodes.filter((n) => !['begin', 'seq'].includes(n.dataset.bpNode!));
      const xs = fns.map((n) => pos.get(n)!.x);
      const ys = fns.map((n) => pos.get(n)!.y);
      const x1 = Math.min(...xs) - 18;
      const y1 = Math.min(...ys) - 52;
      const x2 = Math.max(...fns.map((n) => pos.get(n)!.x + n.offsetWidth)) + 18;
      const y2 = Math.max(...fns.map((n) => pos.get(n)!.y + n.offsetHeight)) + 18;
      Object.assign(comment.style, { transform: `translate(${x1}px, ${y1}px)`, width: `${x2 - x1}px`, height: `${y2 - y1}px` });
    }
  }

  const bounds = () => {
    const els = [...nodes, ...(comment ? [comment] : [])];
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    els.forEach((el) => {
      const p = el === comment ? parseTranslate(el) : pos.get(el)!;
      x1 = Math.min(x1, p.x);
      y1 = Math.min(y1, p.y);
      x2 = Math.max(x2, p.x + el.offsetWidth);
      y2 = Math.max(y2, p.y + el.offsetHeight);
    });
    return { x1, y1, x2, y2 };
  };
  const parseTranslate = (el: HTMLElement): Pos => {
    const m = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(el.style.transform);
    return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 0, y: 0 };
  };

  function apply() {
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.s})`;
    canvas.style.setProperty('--g', `${16 * view.s}px`);
    canvas.style.setProperty('--gx', `${view.x}px`);
    canvas.style.setProperty('--gy', `${view.y}px`);
    if (zoomLabel) {
      const steps = Math.round(Math.log2(view.s) * 4);
      zoomLabel.textContent = steps === 0 ? 'Zoom 1:1' : `Zoom ${steps > 0 ? '+' : ''}${steps}`;
    }
  }

  function fit() {
    const b = bounds();
    const w = b.x2 - b.x1;
    const h = b.y2 - b.y1;
    if (!desk.matches) {
      // Phones: scale to the width and grow the canvas to the graph's height.
      const s = Math.min(1, (canvas.clientWidth - 24) / w);
      view.s = s;
      view.x = 12 - b.x1 * s;
      view.y = 16 - b.y1 * s;
      canvas.style.height = `${Math.ceil(h * s + 56)}px`;
    } else {
      canvas.style.height = '';
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight - 24;
      // Fit, but never so small the nodes can't be read: past that, start at
      // Event BeginPlay and let the visitor pan to the rest.
      view.s = Math.max(MIN_FIT, Math.min(1, (cw - PAD * 2) / w, (ch - PAD * 2) / h));
      view.x = w * view.s <= cw - PAD * 2 ? (cw - w * view.s) / 2 - b.x1 * view.s : PAD - b.x1 * view.s;
      view.y = h * view.s <= ch - PAD * 2 ? (ch - h * view.s) / 2 - b.y1 * view.s : PAD - b.y1 * view.s;
    }
    apply();
  }

  function build() {
    if (!canvas.clientWidth || panel?.hidden) return;
    if (!moved || !laidOut) layout();
    draw();
    fit();
    laidOut = true;
    bp.classList.add('bp-ready');
  }

  /* ----- interaction (desk) ----- */
  let drag: { kind: 'pan' | 'node'; node?: HTMLElement; sx: number; sy: number; ox: number; oy: number; id: number } | null = null;
  const select = (n: HTMLElement | null) => nodes.forEach((m) => m.classList.toggle('is-selected', m === n));

  canvas.addEventListener('pointerdown', (e) => {
    if (!desk.matches || e.button > 2) return;
    const t = e.target as HTMLElement;
    if (t.closest('a, button')) return;
    const node = t.closest<HTMLElement>('[data-bp-node]');
    select(node);
    if (node && !t.closest('[data-bp-drag]') && e.button === 0) return; // let text be selected
    const p = node ? pos.get(node)! : { x: view.x, y: view.y };
    drag = { kind: node ? 'node' : 'pan', node: node ?? undefined, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, id: e.pointerId };
    canvas.setPointerCapture(e.pointerId);
    if (!node) canvas.classList.add('is-panning');
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (drag.kind === 'pan') {
      view.x = drag.ox + dx;
      view.y = drag.oy + dy;
      apply();
    } else if (drag.node) {
      pos.set(drag.node, { x: drag.ox + dx / view.s, y: drag.oy + dy / view.s });
      moved = true;
      draw();
    }
  });
  const end = () => {
    drag = null;
    canvas.classList.remove('is-panning');
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('contextmenu', (e) => {
    if (desk.matches) e.preventDefault();
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!desk.matches) return;
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      const s = Math.min(2, Math.max(0.25, view.s * Math.pow(1.0018, -e.deltaY)));
      view.x = mx - ((mx - view.x) * s) / view.s;
      view.y = my - ((my - view.y) * s) / view.s;
      view.s = s;
      apply();
    },
    { passive: false },
  );
  canvas.addEventListener('dblclick', (e) => {
    if (!desk.matches || (e.target as HTMLElement).closest('[data-bp-node]')) return;
    if (moved) {
      moved = false;
      layout();
      draw();
    }
    fit();
  });
  // Keyboard: arrow keys pan, +/- zoom, Home fits.
  canvas.tabIndex = -1;
  bp.addEventListener('keydown', (e) => {
    if (!desk.matches || (e.target as HTMLElement).closest('a, button, input')) return;
    const step = 40;
    if (e.key === 'Home') fit();
    else if (e.key === '+' || e.key === '=') view.s = Math.min(2, view.s * 1.2);
    else if (e.key === '-') view.s = Math.max(0.25, view.s / 1.2);
    else if (e.key === 'ArrowLeft') view.x += step;
    else if (e.key === 'ArrowRight') view.x -= step;
    else if (e.key === 'ArrowUp') view.y += step;
    else if (e.key === 'ArrowDown') view.y -= step;
    else return;
    e.preventDefault();
    apply();
  });

  /* ----- when to (re)build ----- */
  panel?.addEventListener('panel:shown', () => requestAnimationFrame(build));
  new ResizeObserver(() => {
    if (panel?.hidden) return;
    if (!laidOut || !moved) build();
  }).observe(canvas);
  desk.addEventListener('change', () => {
    moved = false;
    build();
  });
  document.fonts?.ready.then(() => {
    if (!moved) build();
  });
  build();
}
