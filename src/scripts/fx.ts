/**
 * Small, dependency-free interaction layer shared by every page.
 * Each effect is opt-in through a data attribute so markup stays declarative.
 */

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------- [data-reveal]: fade/slide in when scrolled into view ---------- */
function initReveal() {
  const els = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window) || reduce()) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- [data-scramble]: decode-style text effect on hover ---------- */
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>_';
export function scramble(el: HTMLElement, duration = 420) {
  if (reduce()) return;
  const original = el.dataset.scrambleText ?? el.textContent ?? '';
  el.dataset.scrambleText = original;
  if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', original.trim());
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    const revealed = Math.floor(p * original.length);
    let out = '';
    for (let i = 0; i < original.length; i++) {
      const ch = original[i];
      out += i < revealed || ch === ' ' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = original;
  };
  requestAnimationFrame(step);
}
function initScramble() {
  document.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el) => {
    el.addEventListener('pointerenter', () => scramble(el));
    el.addEventListener('focus', () => scramble(el));
  });
}

/* ---------- [data-magnetic]: element leans toward the pointer ---------- */
function initMagnetic() {
  if (!finePointer() || reduce()) return;
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.28;
    el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * strength}px, ${dy * strength * 1.2}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = '';
    });
  });
}

/* ---------- [data-tilt]: 3D tilt + spotlight vars for cards ---------- */
function initTilt() {
  if (!finePointer()) return;
  const still = reduce();
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    const max = Number(el.dataset.tilt) || 5;
    let raf = 0;
    el.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        if (!still) {
          el.style.setProperty('--rx', `${(0.5 - py) * max}deg`);
          el.style.setProperty('--ry', `${(px - 0.5) * max}deg`);
        }
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

/* ---------- [data-count]: count up when visible ---------- */
function initCount() {
  const els = document.querySelectorAll<HTMLElement>('[data-count]');
  if (!els.length) return;
  const render = (el: HTMLElement, v: number) => {
    const pad = Number(el.dataset.pad) || 0;
    el.textContent = String(Math.round(v)).padStart(pad, '0');
  };
  if (reduce() || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        io.unobserve(el);
        const target = Number(el.dataset.count);
        const dur = 1600;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          render(el, target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        render(el, 0);
        requestAnimationFrame(tick);
      }
    },
    { threshold: 0.6 },
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- [data-timecode]: broadcast-style HH:MM:SS:FF at 25fps ---------- */
function initTimecode() {
  const els = document.querySelectorAll<HTMLElement>('[data-timecode]');
  if (!els.length) return;
  let start = Date.now();
  try {
    const saved = Number(sessionStorage.getItem('swiift:tc0'));
    if (saved) start = saved;
    else sessionStorage.setItem('swiift:tc0', String(start));
  } catch {
    /* ignore */
  }
  const two = (n: number) => String(n).padStart(2, '0');
  const update = () => {
    const ms = Date.now() - start;
    const frames = Math.floor((ms % 1000) / 40);
    const s = Math.floor(ms / 1000);
    const tc = `${two(Math.floor(s / 3600))}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}:${two(frames)}`;
    els.forEach((el) => (el.textContent = tc));
  };
  update();
  setInterval(update, 40);
}

/* ---------- [data-clock]: local time in Manchester ---------- */
function initClock() {
  const els = document.querySelectorAll<HTMLElement>('[data-clock]');
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/London',
  });
  const update = () => els.forEach((el) => (el.textContent = fmt.format(new Date())));
  update();
  setInterval(update, 10_000);
}

/* ---------- toast ---------- */
let toastTimer = 0;
export function toast(message: string) {
  let el = document.querySelector<HTMLElement>('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    document.body.append(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => el!.classList.add('is-on'));
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el!.classList.remove('is-on'), 2400);
}

/* ---------- [data-copy]: copy to clipboard ---------- */
function initCopy() {
  document.querySelectorAll<HTMLElement>('[data-copy]').forEach((el) => {
    el.addEventListener('click', async () => {
      const text = el.dataset.copy!;
      try {
        await navigator.clipboard.writeText(text);
        toast(`Copied ${text}`);
      } catch {
        window.location.href = `mailto:${text}`;
      }
    });
  });
}

/* ---------- header: solid when scrolled, hides on scroll down ---------- */
function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  let lastY = window.scrollY;
  let ticking = false;
  const update = () => {
    const y = window.scrollY;
    header.toggleAttribute('data-scrolled', y > 8);
    const goingDown = y > lastY + 4;
    const goingUp = y < lastY - 4;
    if (goingDown && y > 480) header.setAttribute('data-hidden', '');
    else if (goingUp || y < 480) header.removeAttribute('data-hidden');
    lastY = y;
    ticking = false;
  };
  update();
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  header.addEventListener('focusin', () => header.removeAttribute('data-hidden'));
}

export function initFx() {
  initHeader();
  initReveal();
  initScramble();
  initMagnetic();
  initTilt();
  initCount();
  initTimecode();
  initClock();
  initCopy();
}
