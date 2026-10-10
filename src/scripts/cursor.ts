/**
 * Custom cursor + "blade tracer".
 *
 * A dot that tracks the pointer exactly, a ring that follows with a little
 * lag (and squash-and-stretch with speed), and a canvas ribbon that only
 * shows up on fast swings — a nod to VENATOR's real-time swing tracers.
 * Clicking throws a small parry spark.
 *
 * Only runs on fine, hover-capable pointers. Reduced-motion users get the
 * cursor without lag, trail or sparks.
 */

type Pt = { x: number; y: number; t: number };
type Spark = { x: number; y: number; vx: number; vy: number; born: number };
type Flash = { x: number; y: number; born: number };

const TRAIL_LIFE = 160; // ms a trail point lives
const SPARK_LIFE = 380;
const FLASH_LIFE = 420;
const LABELS: Record<string, string> = {
  view: 'View',
  play: 'Play',
  copy: 'Copy',
  open: 'Open',
  drag: 'Drag',
  zoom: 'Zoom',
  parry: 'Parry',
};

export function initCursor() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!fine.matches) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root = document.documentElement;
  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<div class="cursor__ring"><div class="cursor__shape"></div><span class="cursor__label"></span></div><div class="cursor__dot"></div>';
  document.body.append(el);
  const ring = el.querySelector<HTMLElement>('.cursor__ring')!;
  const shape = el.querySelector<HTMLElement>('.cursor__shape')!;
  const dot = el.querySelector<HTMLElement>('.cursor__dot')!;
  const label = el.querySelector<HTMLElement>('.cursor__label')!;
  root.classList.add('has-cursor');

  // ---- canvas for trail + sparks ----
  const canvas = document.createElement('canvas');
  canvas.className = 'tracer';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d')!;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // ---- state ----
  let x = -100;
  let y = -100;
  let rx = x;
  let ry = y;
  let visible = false;
  const trail: Pt[] = [];
  const sparks: Spark[] = [];
  const flashes: Flash[] = [];

  try {
    const saved = JSON.parse(sessionStorage.getItem('swiift:cursor') || 'null');
    if (saved && typeof saved.x === 'number') {
      x = rx = saved.x;
      y = ry = saved.y;
      visible = true;
      el.classList.add('is-visible');
    }
  } catch {
    /* storage unavailable — start hidden until the first move */
  }

  let raf = 0;
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        el.classList.add('is-visible');
      }
      if (!reduce) trail.push({ x, y, t: performance.now() });
      kick();
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    visible = false;
    el.classList.remove('is-visible');
  });
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    el.classList.add('is-down');
    if (!reduce) parry(x, y);
  });
  window.addEventListener('pointerup', () => el.classList.remove('is-down'));
  window.addEventListener('pagehide', () => {
    try {
      sessionStorage.setItem('swiift:cursor', JSON.stringify({ x, y }));
    } catch {
      /* ignore */
    }
  });

  // ---- hover states via delegation ----
  const INTERACTIVE = 'a, button, summary, label, select, [role="button"], [data-cursor]';
  const TEXT_INPUT = 'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable]';
  document.addEventListener('pointerover', (e) => updateHover(e.target as Element | null));
  // Scrolling moves content under a still pointer without firing pointer events.
  let scrollRaf = 0;
  window.addEventListener(
    'scroll',
    () => {
      if (!visible || scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        updateHover(document.elementFromPoint(x, y));
      });
    },
    { passive: true },
  );

  function updateHover(target: Element | null) {
    if (!target || !target.closest) return;
    if (target.closest(TEXT_INPUT)) {
      el.classList.remove('is-hover', 'has-label');
      el.classList.add('is-text');
      label.textContent = '';
      return;
    }
    const hit = target.closest<HTMLElement>(INTERACTIVE);
    el.classList.remove('is-text');
    if (!hit) {
      el.classList.remove('is-hover', 'has-label');
      label.textContent = '';
      return;
    }
    el.classList.add('is-hover');
    const kind = hit.dataset.cursor;
    const text = hit.dataset.cursorLabel || (kind ? LABELS[kind] : '');
    label.textContent = text || '';
    el.classList.toggle('has-label', !!text);
  }

  // ---- parry spark ----
  function parry(px: number, py: number) {
    const now = performance.now();
    flashes.push({ x: px, y: py, born: now });
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const s = 0.35 + Math.random() * 0.45; // px per ms
      sparks.push({ x: px, y: py, vx: Math.cos(a) * s, vy: Math.sin(a) * s, born: now });
    }
    kick();
  }

  // ---- render loop ----
  let lastRx = rx;
  let lastRy = ry;
  function frame(now: number) {
    raf = 0;

    // ring follow
    const k = reduce ? 1 : 0.2;
    rx += (x - rx) * k;
    ry += (y - ry) * k;
    const vx = rx - lastRx;
    const vy = ry - lastRy;
    lastRx = rx;
    lastRy = ry;
    const speed = Math.min(Math.hypot(vx, vy), 40);
    const stretch = reduce ? 0 : speed / 90;
    const angle = Math.atan2(vy, vx);
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    shape.style.transform = `rotate(${angle}rad) scale(${1 + stretch}, ${1 - stretch * 0.6})`;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;

    // canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTrail(now);
    drawSparks(now);

    const settled = Math.abs(x - rx) < 0.1 && Math.abs(y - ry) < 0.1;
    if (!settled || trail.length || sparks.length || flashes.length) kick();
  }

  function drawTrail(now: number) {
    while (trail.length && now - trail[0].t > TRAIL_LIFE) trail.shift();
    if (trail.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1];
      const b = trail[i];
      const dt = Math.max(b.t - a.t, 1);
      const v = Math.hypot(b.x - a.x, b.y - a.y) / dt; // px per ms
      const swing = Math.min(Math.max((v - 0.6) / 2.2, 0), 1); // only fast swings show
      if (swing <= 0) continue;
      const life = 1 - (now - b.t) / TRAIL_LIFE;
      const head = i / (trail.length - 1);
      const w = 1 + 9 * life * head * swing;
      ctx.strokeStyle = `rgba(0, 177, 255, ${0.55 * life * swing})`;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.strokeStyle = `rgba(235, 248, 255, ${0.8 * life * swing * head})`;
      ctx.lineWidth = Math.max(w * 0.25, 0.75);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSparks(now: number) {
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      const t = (now - f.born) / FLASH_LIFE;
      if (t >= 1) {
        flashes.splice(i, 1);
        continue;
      }
      const e = 1 - Math.pow(1 - t, 3);
      ctx.strokeStyle = `rgba(0, 177, 255, ${0.7 * (1 - t)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 6 + e * 26, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineCap = 'round';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const age = now - s.born;
      const t = age / SPARK_LIFE;
      if (t >= 1) {
        sparks.splice(i, 1);
        continue;
      }
      const ease = 1 - Math.pow(1 - t, 2);
      const px = s.x + s.vx * SPARK_LIFE * ease * 0.5;
      const py = s.y + s.vy * SPARK_LIFE * ease * 0.5;
      const len = 7 * (1 - t);
      ctx.strokeStyle = `rgba(255, 225, 160, ${1 - t})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - s.vx * len * 4, py - s.vy * len * 4);
      ctx.stroke();
    }
  }

  kick();
}
