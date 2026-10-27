/**
 * The Viewport gallery: auto-advances through its items ("Realtime"), plays
 * trailers and clips muted while they're on screen, and stays in sync with
 * the Details panel's item list. Selecting, swiping or pressing the arrows
 * stops the gallery; the toolbar's Play button starts it again.
 */
import { onAction, isTyping } from './actions';
import { notify } from './notify';
import { HoverVideo } from '../hover-video';

const DURATION: Record<string, number> = { image: 6000, card: 6000, youtube: 7000, clip: 12000, video: 24000 };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const VIEW_MODES = { lit: 'Lit', unlit: 'Unlit', wireframe: 'Wireframe', detail: 'Detail Lighting', lighting: 'Lighting Only' } as const;
type ViewMode = keyof typeof VIEW_MODES;

export function initViewport() {
  const vpEl = document.querySelector<HTMLElement>('[data-vp]');
  const root = document.documentElement;

  /* View modes and Game View work even without a gallery on the page. */
  const setViewMode = (mode: ViewMode, announce = true) => {
    if (!(mode in VIEW_MODES)) return;
    if (vpEl) vpEl.dataset.viewmode = mode;
    document.querySelectorAll<HTMLElement>('[data-viewmode-option]').forEach((o) => o.setAttribute('aria-checked', String(o.dataset.viewmodeOption === mode)));
    document.querySelectorAll<HTMLElement>('[data-viewmode-label]').forEach((l) => (l.textContent = VIEW_MODES[mode]));
    try {
      sessionStorage.setItem('swiift:viewmode', mode);
    } catch {
      /* ignore */
    }
    if (announce && !vpEl) notify({ title: `View mode: ${VIEW_MODES[mode]}`, text: 'Open a page with a viewport to see it.', timeout: 2500 });
  };
  onAction('viewmode', (mode) => setViewMode(mode as ViewMode));
  try {
    const saved = sessionStorage.getItem('swiift:viewmode') as ViewMode | null;
    if (saved && saved !== 'lit') setViewMode(saved, false);
  } catch {
    /* ignore */
  }

  if (!vpEl) {
    ['vp-next', 'vp-prev', 'vp-play', 'vp-stop', 'vp-toggle', 'game-view', 'vp-fullscreen', 'vp-highres'].forEach((a) => onAction(a, () => false));
    return;
  }
  const vp = vpEl;

  const track = vp.querySelector<HTMLElement>('[data-vp-track]')!;
  const slides = [...vp.querySelectorAll<HTMLElement>('[data-vp-slide]')];
  const segs = [...vp.querySelectorAll<HTMLElement>('[data-vp-seg]')];
  const rows = [...document.querySelectorAll<HTMLButtonElement>('[data-vp-select]')];
  const list = document.querySelector<HTMLElement>('[data-vp-list]');
  const capName = vp.querySelector<HTMLElement>('[data-vp-caption-name]');
  const capText = vp.querySelector<HTMLElement>('[data-vp-caption-text]');
  const realtimeNote = vp.querySelector<HTMLElement>('[data-vp-realtime]');
  const n = slides.length;
  const players = new Map<HTMLElement, HoverVideo | null>();

  let index = 0;
  let playing = false;
  let timer = 0;
  let visible = !vp.closest<HTMLElement>('[data-panel]')?.hidden;
  let programmatic = false;
  let settleTimer = 0;

  /* ----- media on the current slide ----- */
  const startMedia = (slide: HTMLElement) => {
    const kind = slide.dataset.kind;
    if (kind === 'video') {
      const host = slide.querySelector<HTMLElement>('[data-hover-video]');
      if (!host) return;
      if (!players.has(slide)) players.set(slide, HoverVideo.fromElement(host));
      const p = players.get(slide);
      if (!p) return;
      p.play();
      slide.classList.add('is-playing');
      host.querySelector('video')?.addEventListener('ended', onEnded, { once: true });
    } else if (kind === 'clip') {
      const v = slide.querySelector<HTMLVideoElement>('[data-vp-clip]');
      v?.play().catch(() => {});
    }
  };
  const stopMedia = (slide: HTMLElement) => {
    players.get(slide)?.stop();
    slide.classList.remove('is-playing');
    const host = slide.querySelector<HTMLElement>('[data-hover-video]');
    const v = host?.querySelector('video');
    if (v) v.muted = true;
    const unmute = slide.querySelector<HTMLElement>('[data-vp-unmute]');
    unmute?.setAttribute('aria-pressed', 'false');
    const label = unmute?.querySelector('span');
    if (label) label.textContent = 'Unmute';
    slide.querySelector<HTMLVideoElement>('[data-vp-clip]')?.pause();
    // Unload a playing YouTube player so it stops.
    const yt = slide.querySelector<HTMLElement>('[data-yt]');
    yt?.querySelector('iframe')?.remove();
    yt?.classList.remove('is-loaded');
  };
  function onEnded() {
    if (playing) next(false);
  }

  /* ----- selection ----- */
  // Keep the current row in view: always in the phone filmstrip, but in the
  // Details panel only when the visitor moved the selection, so autoplay never
  // scrolls the panel away from whatever they're reading.
  const ensureVisible = (el: HTMLElement, user: boolean) => {
    if (!list) return;
    const sc = list.scrollWidth > list.clientWidth ? list : el.closest<HTMLElement>('.doc-panel');
    if (!sc) return;
    const r = el.getBoundingClientRect();
    const c = sc.getBoundingClientRect();
    const behavior = reduceMotion ? 'auto' : 'smooth';
    if (sc === list) {
      if (r.left < c.left || r.right > c.right) sc.scrollBy({ left: r.left - c.left - 10, behavior });
    } else if (user && (r.top < c.top + 90 || r.bottom > c.bottom)) {
      sc.scrollBy({ top: r.top - c.top - 120, behavior });
    }
  };

  const restartProgress = () => {
    const dur = DURATION[slides[index]?.dataset.kind ?? 'image'] ?? 6000;
    root.style.setProperty('--vp-dur', `${dur}ms`);
    // Re-trigger the CSS progress animations on the current segment and row.
    [segs[index], rows[index]?.querySelector<HTMLElement>('.ml__bar > span')].forEach((el) => {
      const bar = el?.matches('.ml__bar > span') ? el : el?.firstElementChild;
      if (!(bar instanceof HTMLElement)) return;
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    });
    return dur;
  };

  const schedule = () => {
    clearTimeout(timer);
    if (!playing || !visible || document.hidden) return;
    const dur = restartProgress();
    timer = window.setTimeout(() => next(false), dur);
  };

  function show(i: number, opts: { user?: boolean; scroll?: boolean; smooth?: boolean } = {}) {
    const to = ((i % n) + n) % n;
    const changed = to !== index;
    if (opts.user) setPlaying(false);
    if (changed) stopMedia(slides[index]);
    index = to;
    const slide = slides[index];
    if (opts.scroll !== false) {
      programmatic = true;
      track.scrollTo({ left: index * track.clientWidth, behavior: opts.smooth === false || reduceMotion ? 'auto' : 'smooth' });
      clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => (programmatic = false), 900);
    }
    // Warm the next picture so the next advance doesn't flash.
    slides[(index + 1) % n]?.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((img) => (img.loading = 'eager'));
    segs.forEach((s, k) => {
      s.classList.toggle('is-current', k === index);
      s.classList.toggle('is-done', k < index);
    });
    rows.forEach((r, k) => (k === index ? r.setAttribute('aria-current', 'true') : r.removeAttribute('aria-current')));
    if (rows[index] && changed) ensureVisible(rows[index], !!opts.user);
    if (capName) capName.textContent = slide.dataset.name ?? '';
    if (capText) capText.textContent = slide.dataset.caption ?? '';
    vp.classList.toggle('has-lower', !!slide.querySelector('.vp__lower'));
    if (visible) startMedia(slide);
    schedule();
  }

  const next = (user = true) => show(index + 1, { user });
  const prev = (user = true) => show(index - 1, { user });

  function setPlaying(on: boolean) {
    playing = on && n > 1;
    root.classList.toggle('vp-playing', playing);
    document.querySelectorAll<HTMLElement>('[data-realtime-toggle]').forEach((t) => t.setAttribute('aria-checked', String(playing)));
    if (realtimeNote) realtimeNote.hidden = playing || n < 2;
    if (playing) schedule();
    else clearTimeout(timer);
  }

  /* ----- user input ----- */
  rows.forEach((r) =>
    r.addEventListener('click', () => {
      showViewportTab();
      show(Number(r.dataset.vpSelect), { user: true });
      // On phones the viewport may be scrolled away; bring it back.
      const rect = vp.getBoundingClientRect();
      if (rect.bottom < 60 || rect.top > innerHeight - 60) vp.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }),
  );

  // Swipes and trackpad scrolls settle on a slide; treat them as a selection.
  const settle = () => {
    const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    if (programmatic) return;
    if (i !== index) show(i, { user: true, scroll: false });
  };
  if ('onscrollend' in window) track.addEventListener('scrollend', () => {
    settle();
    programmatic = false;
  });
  else
    track.addEventListener(
      'scroll',
      () => {
        clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          settle();
          programmatic = false;
        }, 140);
      },
      { passive: true },
    );
  track.addEventListener('pointerdown', () => (programmatic = false), { passive: true });
  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) programmatic = false;
  }, { passive: true });

  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'Home') show(0, { user: true });
    else if (e.key === 'End') show(n - 1, { user: true });
    else return;
    e.preventDefault();
  });
  document.addEventListener('keydown', (e) => {
    if (isTyping(e) || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
    const panel = vp.closest<HTMLElement>('[data-panel]');
    if (panel?.hidden) return;
    const inOther = (e.target as HTMLElement).closest('[data-bp], [data-cb], .ue-menu, [role="tablist"], [data-vp-track]');
    if (e.key === 'g' || e.key === 'G') {
      toggleGameView();
    } else if (!inOther && e.key === 'ArrowRight' && n > 1) {
      next();
    } else if (!inOther && e.key === 'ArrowLeft' && n > 1) {
      prev();
    } else return;
    e.preventDefault();
  });

  // Unmute a trailer / play a YouTube video: the visitor is watching, so stop advancing.
  vp.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const unmute = t.closest<HTMLButtonElement>('[data-vp-unmute]');
    if (unmute) {
      const v = unmute.closest('[data-vp-slide]')?.querySelector<HTMLVideoElement>('[data-hover-video] video');
      if (!v) return;
      v.muted = !v.muted;
      unmute.setAttribute('aria-pressed', String(!v.muted));
      unmute.querySelector('span')!.textContent = v.muted ? 'Unmute' : 'Mute';
      if (!v.muted) setPlaying(false);
      return;
    }
    const play = t.closest<HTMLElement>('[data-yt-play]');
    if (play) {
      const box = play.closest<HTMLElement>('[data-yt]')!;
      setPlaying(false);
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${box.dataset.yt}?autoplay=1&rel=0`;
      iframe.title = box.dataset.ytTitle || 'YouTube video';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      box.append(iframe);
      box.classList.add('is-loaded');
      iframe.focus();
    }
  });
  // Not every video has a full-size YouTube thumbnail.
  vp.querySelectorAll<HTMLImageElement>('img[data-fallback]').forEach((img) => {
    const swap = () => {
      if (img.dataset.fallback && img.src !== img.dataset.fallback) img.src = img.dataset.fallback;
    };
    img.addEventListener('error', swap, { once: true });
    img.addEventListener('load', () => {
      if (img.naturalWidth <= 120) swap();
    });
  });

  /* ----- actions ----- */
  function toggleGameView() {
    const on = vp!.classList.toggle('is-game-view');
    document.querySelectorAll<HTMLElement>('[data-game-view-toggle]').forEach((t) => t.setAttribute('aria-checked', String(on)));
  }
  onAction('vp-next', () => next());
  onAction('vp-prev', () => prev());
  onAction('vp-play', () => {
    if (n < 2) return;
    setPlaying(true);
    showViewportTab();
  });
  onAction('vp-stop', () => setPlaying(false));
  onAction('vp-toggle', () => setPlaying(!playing));
  onAction('game-view', () => toggleGameView());
  onAction('vp-fullscreen', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else vp.requestFullscreen?.().catch(() => {});
  });
  onAction('vp-highres', () => {
    const full = slides[index].dataset.full;
    if (full) window.open(full, '_blank', 'noopener');
    else notify({ title: 'No still image for this item', text: 'Pick a screenshot to open it at full size.', timeout: 3000 });
  });
  const showViewportTab = () => {
    const tab = document.querySelector<HTMLElement>('.dock__tab[data-tab="viewport"]');
    if (tab?.getAttribute('aria-selected') !== 'true') tab?.click();
  };

  /* ----- pause when nobody can see it ----- */
  const setVisible = (v: boolean) => {
    if (v === visible) return;
    visible = v;
    if (visible) {
      startMedia(slides[index]);
      schedule();
    } else {
      clearTimeout(timer);
      stopMedia(slides[index]);
    }
  };
  if ('IntersectionObserver' in window)
    new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting && !vp.closest<HTMLElement>('[data-panel]')!.hidden), { threshold: 0.35 }).observe(vp);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else schedule();
  });
  vp.closest('[data-panel]')?.addEventListener('panel:shown', () => requestAnimationFrame(() => track.scrollTo({ left: index * track.clientWidth })));
  document.addEventListener('panel:shown', (e) => {
    const panel = vp.closest<HTMLElement>('[data-panel]');
    const id = (e as CustomEvent).detail.id;
    if (panel && id !== 'viewport' && (e.target as HTMLElement).parentElement === panel.parentElement) setVisible(false);
    else if (id === 'viewport') setVisible(true);
  });

  // Keep the current slide aligned when the panel is resized.
  new ResizeObserver(() => {
    programmatic = true;
    track.scrollTo({ left: index * track.clientWidth, behavior: 'auto' });
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => (programmatic = false), 200);
  }).observe(track);

  /* ----- stat fps (console) ----- */
  let fpsEl: HTMLElement | null = null;
  let fpsRaf = 0;
  onAction('stat-fps', () => {
    if (fpsEl) {
      cancelAnimationFrame(fpsRaf);
      fpsEl.remove();
      fpsEl = null;
      return;
    }
    fpsEl = document.createElement('p');
    fpsEl.className = 'vp-stat';
    vp.append(fpsEl);
    let frames = 0;
    let last = performance.now();
    const loop = (now: number) => {
      frames++;
      if (now - last >= 500) {
        const fps = (frames * 1000) / (now - last);
        fpsEl!.innerHTML = `<span>${fps.toFixed(2)} FPS</span><span>${(1000 / fps).toFixed(2)} ms</span>`;
        fpsEl!.dataset.level = fps >= 50 ? 'good' : fps >= 30 ? 'ok' : 'bad';
        frames = 0;
        last = now;
      }
      fpsRaf = requestAnimationFrame(loop);
    };
    fpsRaf = requestAnimationFrame(loop);
  });

  /* ----- go ----- */
  show(0, { scroll: false });
  setPlaying(vp.hasAttribute('data-autoplay') && !reduceMotion);
}
