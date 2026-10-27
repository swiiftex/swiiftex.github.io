/**
 * The editor window itself: tab wells, drop-down menus, resizable panels,
 * the bottom sheets on small screens, shortcuts, clock and clipboard.
 */
import { initActions, isTyping, onAction, runAction } from './actions';
import { notify } from './notify';

export const desk = window.matchMedia('(min-width: 1000px) and (min-height: 560px)');
const root = document.documentElement;
const EMAIL = 'obladenkay@gmail.com';

/* ---------- tabs ---------- */

/** Shows a tab in its tab well; returns false if there's no such tab. */
export function showTab(id: string, opts: { focus?: boolean } = {}): boolean {
  const tab = document.querySelector<HTMLButtonElement>(`.dock__tab[data-tab="${CSS.escape(id)}"]`);
  if (!tab) return false;
  const well = tab.closest<HTMLElement>('.dock__tabs')!;
  const body = well.nextElementSibling as HTMLElement;
  well.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
  });
  body.querySelectorAll<HTMLElement>(':scope > [data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== id));
  body.dataset.activeTab = id;
  const panel = body.querySelector<HTMLElement>(`:scope > [data-panel="${CSS.escape(id)}"]`);
  panel?.dispatchEvent(new CustomEvent('panel:shown', { bubbles: true, detail: { id } }));
  if (opts.focus) tab.focus();
  return true;
}

function initTabs() {
  document.querySelectorAll<HTMLElement>('.dock__tabs[role="tablist"]').forEach((well) => {
    well.addEventListener('click', (e) => {
      const tab = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-tab]');
      if (tab) showTab(tab.dataset.tab!);
    });
    well.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const tabs = [...well.querySelectorAll<HTMLButtonElement>('[data-tab]')];
      const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (i < 0) return;
      e.preventDefault();
      const next =
        e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      showTab(tabs[next].dataset.tab!, { focus: true });
    });
  });
  onAction('tab', (id) => {
    if (!showTab(id)) return false;
    if (!desk.matches) document.querySelector('[data-dock="main"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/** Opens the tab (or the element inside a tab) named by the URL's #hash. */
function showHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  if (showTab(id)) return;
  const target = document.getElementById(id);
  const panel = target?.closest<HTMLElement>('[data-panel]');
  if (!target || !panel) return;
  showTab(panel.dataset.panel!);
  if (target instanceof HTMLDetailsElement) target.open = true;
  requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
}

/* ---------- drop-down menus ---------- */

let openMenu: { menu: HTMLElement; trigger: HTMLElement } | null = null;

function placeMenu(menu: HTMLElement, trigger: HTMLElement) {
  const r = trigger.getBoundingClientRect();
  menu.style.left = '0px';
  menu.style.top = '0px';
  const m = menu.getBoundingClientRect();
  const left = Math.max(8, Math.min(r.left, innerWidth - m.width - 8));
  const below = r.bottom + 2;
  const top = below + m.height > innerHeight - 8 && r.top - m.height - 2 > 8 ? r.top - m.height - 2 : below;
  menu.style.left = `${left}px`;
  menu.style.top = `${Math.max(8, top)}px`;
}

export function closeMenu(focusTrigger = false) {
  if (!openMenu) return;
  openMenu.menu.hidden = true;
  openMenu.trigger.setAttribute('aria-expanded', 'false');
  if (focusTrigger) openMenu.trigger.focus();
  openMenu = null;
}

function showMenu(trigger: HTMLElement, focusFirst = false) {
  const menu = document.getElementById(trigger.dataset.menuTrigger!);
  if (!menu) return;
  closeMenu();
  menu.hidden = false;
  trigger.setAttribute('aria-expanded', 'true');
  placeMenu(menu, trigger);
  openMenu = { menu, trigger };
  if (focusFirst) menu.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
}

function initMenus() {
  // Menus live in the body so panels with overflow or containment can't clip them.
  document.querySelectorAll<HTMLElement>('[data-menu]').forEach((m) => document.body.append(m));
  const menubarTriggers = [...document.querySelectorAll<HTMLElement>('.menubar [data-menu-trigger]')];

  document.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const trigger = t.closest<HTMLElement>('[data-menu-trigger]');
    if (trigger) {
      if (openMenu?.trigger === trigger) closeMenu();
      else showMenu(trigger, e.detail === 0);
      return;
    }
    if (!openMenu) return;
    if (t.closest('[role^="menuitem"]') || !openMenu.menu.contains(t)) closeMenu();
  });

  // Moving across the menu bar while a menu is open switches menus, as on Windows.
  menubarTriggers.forEach((t) =>
    t.addEventListener('pointerenter', () => {
      if (openMenu && openMenu.trigger !== t && menubarTriggers.includes(openMenu.trigger)) showMenu(t);
    }),
  );

  document.addEventListener('keydown', (e) => {
    if (!openMenu) {
      const t = e.target as HTMLElement;
      if (t.matches?.('[data-menu-trigger]') && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        showMenu(t, true);
      } else if (menubarTriggers.includes(t) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const i = menubarTriggers.indexOf(t);
        const next = menubarTriggers[(i + (e.key === 'ArrowRight' ? 1 : -1) + menubarTriggers.length) % menubarTriggers.length];
        menubarTriggers.forEach((m) => (m.tabIndex = m === next ? 0 : -1));
        next.focus();
      }
      return;
    }
    const items = [...openMenu.menu.querySelectorAll<HTMLElement>('[role^="menuitem"]')];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu(true);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = i < 0 ? 0 : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[n]?.focus();
    } else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && menubarTriggers.includes(openMenu.trigger)) {
      e.preventDefault();
      const j = menubarTriggers.indexOf(openMenu.trigger);
      showMenu(menubarTriggers[(j + (e.key === 'ArrowRight' ? 1 : -1) + menubarTriggers.length) % menubarTriggers.length], true);
    } else if (e.key === 'Tab') {
      closeMenu();
    }
  });
  addEventListener('resize', () => closeMenu());
  addEventListener('blur', () => closeMenu());
}

/* ---------- resizable panels ---------- */

type Layout = { right?: number; dock?: number; dockHidden?: boolean };
const readLayout = (): Layout => {
  try {
    return JSON.parse(localStorage.getItem('swiift:layout') || '{}');
  } catch {
    return {};
  }
};
const saveLayout = (l: Layout) => {
  try {
    localStorage.setItem('swiift:layout', JSON.stringify(l));
  } catch {
    /* storage blocked */
  }
};

function initSplitters() {
  const ws = document.querySelector<HTMLElement>('[data-workspace]');
  if (!ws) return;
  const set = (key: 'right' | 'dock', px: number) => {
    const r = ws.getBoundingClientRect();
    const v = key === 'right' ? Math.round(Math.min(Math.max(px, 280), r.width * 0.46)) : Math.round(Math.min(Math.max(px, 120), r.height * 0.62));
    root.style.setProperty(key === 'right' ? '--right-w' : '--dock-h', `${v}px`);
    saveLayout({ ...readLayout(), [key]: v });
    window.dispatchEvent(new Event('editor:layout'));
  };
  ws.querySelectorAll<HTMLElement>('[data-split]').forEach((sp) => {
    const key = sp.dataset.split as 'right' | 'dock';
    const measure = (x: number, y: number) => {
      const r = ws.getBoundingClientRect();
      return key === 'right' ? r.right - 4 - x : r.bottom - 4 - y;
    };
    sp.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sp.setPointerCapture(e.pointerId);
      sp.classList.add('is-dragging');
      const move = (ev: PointerEvent) => set(key, measure(ev.clientX, ev.clientY));
      const up = () => {
        sp.classList.remove('is-dragging');
        sp.removeEventListener('pointermove', move);
        sp.removeEventListener('pointerup', up);
        sp.removeEventListener('pointercancel', up);
      };
      sp.addEventListener('pointermove', move);
      sp.addEventListener('pointerup', up);
      sp.addEventListener('pointercancel', up);
    });
    sp.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 64 : 16;
      const cur = key === 'right' ? document.querySelector('.dock--right')!.getBoundingClientRect().width : document.querySelector('.dock--bottom')!.getBoundingClientRect().height;
      const grow = key === 'right' ? 'ArrowLeft' : 'ArrowUp';
      const shrink = key === 'right' ? 'ArrowRight' : 'ArrowDown';
      if (e.key === grow) set(key, cur + step);
      else if (e.key === shrink) set(key, cur - step);
      else return;
      e.preventDefault();
    });
    sp.addEventListener('dblclick', () => resetLayout());
  });
}

function resetLayout() {
  root.style.removeProperty('--right-w');
  root.style.removeProperty('--dock-h');
  root.classList.remove('dock-hidden');
  saveLayout({});
  window.dispatchEvent(new Event('editor:layout'));
}

/* ---------- bottom dock / sheets ---------- */

function setDockHidden(hidden: boolean) {
  root.classList.toggle('dock-hidden', hidden);
  saveLayout({ ...readLayout(), dockHidden: hidden });
  window.dispatchEvent(new Event('editor:layout'));
}

export function closeSheet() {
  if (!root.classList.contains('sheet-open')) return;
  root.classList.remove('sheet-open');
  updateSheetButtons();
}

function updateSheetButtons() {
  const open = root.classList.contains('sheet-open') || (desk.matches && !root.classList.contains('dock-hidden'));
  const active = document.querySelector<HTMLElement>('[data-bottom-dock] .dock__body')?.dataset.activeTab;
  document.querySelectorAll<HTMLElement>('.statusbar [data-action="drawer"], .statusbar [data-action="log"]').forEach((b) =>
    b.setAttribute('aria-pressed', String(open && b.dataset.action === active)),
  );
}

/** Shows the Content Drawer or Output Log: docked on desks, as a sheet on phones. Toggles if already showing. */
export function openBottom(tab: 'drawer' | 'log', opts: { toggle?: boolean } = {}) {
  const body = document.querySelector<HTMLElement>('[data-bottom-dock] .dock__body');
  const showing = desk.matches ? !root.classList.contains('dock-hidden') : root.classList.contains('sheet-open');
  if (opts.toggle && showing && body?.dataset.activeTab === tab) {
    if (desk.matches) setDockHidden(true);
    else closeSheet();
    updateSheetButtons();
    return;
  }
  showTab(tab);
  if (desk.matches) {
    if (root.classList.contains('dock-hidden')) setDockHidden(false);
  } else {
    closeMenuSheet();
    root.classList.add('sheet-open');
  }
  updateSheetButtons();
}

function initSheets() {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.dataset.action = 'close-sheet';
  document.querySelector('[data-editor]')?.append(backdrop);

  onAction('drawer', () => openBottom('drawer', { toggle: true }));
  onAction('log', () => openBottom('log', { toggle: true }));
  onAction('close-sheet', () => closeSheet());
  document.querySelector('[data-bottom-dock] .dock__tabs')?.addEventListener('click', () => requestAnimationFrame(updateSheetButtons));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !openMenu) {
      closeSheet();
      closeMenuSheet();
    }
  });
  desk.addEventListener('change', () => {
    closeSheet();
    closeMenuSheet();
    updateSheetButtons();
  });
  updateSheetButtons();
}

/* ---------- menu sheet (small screens) ---------- */

function closeMenuSheet() {
  const sheet = document.querySelector<HTMLElement>('[data-menu-sheet]');
  if (!sheet || sheet.hidden) return;
  sheet.hidden = true;
  document.querySelector('[data-action="menu-sheet"]')?.setAttribute('aria-expanded', 'false');
  root.classList.remove('menu-sheet-open');
}

function initMenuSheet() {
  onAction('menu-sheet', (_, btn) => {
    const sheet = document.querySelector<HTMLElement>('[data-menu-sheet]');
    if (!sheet) return;
    if (!sheet.hidden) return closeMenuSheet();
    closeSheet();
    sheet.hidden = false;
    btn?.setAttribute('aria-expanded', 'true');
    root.classList.add('menu-sheet-open');
  });
  document.querySelector('[data-menu-sheet]')?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a, [data-action]')) closeMenuSheet();
  });
}

/* ---------- clipboard, contact, fullscreen ---------- */

export async function copyText(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify({ title: `Copied ${what}`, text, kind: 'success', timeout: 4000 });
    return true;
  } catch {
    return false;
  }
}

function initClipboard() {
  onAction('copy-email', () => {
    copyText(EMAIL, 'email address').then((ok) => {
      if (!ok) location.href = `mailto:${EMAIL}`;
    });
  });
  onAction('copy-link', () => void copyText(location.href, 'link'));
  onAction('contact', () => {
    copyText(EMAIL, 'email address').then((ok) => {
      if (ok)
        notify({
          title: 'Get in touch',
          text: `My email address is on your clipboard: ${EMAIL}`,
          href: `mailto:${EMAIL}`,
          action: 'Open in your mail app',
          timeout: 9000,
        });
      else location.href = `mailto:${EMAIL}`;
    });
  });
}

function initFullscreen() {
  onAction('fullscreen', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  });
  onAction('reset-layout', () => {
    resetLayout();
    notify({ title: 'Layout reset', text: 'Panels are back to the default editor layout.', kind: 'success', timeout: 3000 });
  });
}

/* ---------- Build All: a little build, for fun ---------- */

function initBuild() {
  onAction('build', () => {
    const steps = ['Building geometry…', 'Building lighting…', 'Compiling shaders (1,337 remaining)…', 'Building navigation…'];
    const n = notify({ title: 'Building all levels', text: steps[0], kind: 'pending', timeout: 0 });
    steps.slice(1).forEach((s, i) => setTimeout(() => n.update({ text: s }), (i + 1) * 650));
    setTimeout(
      () =>
        n.update({
          title: 'Build completed',
          text: `${document.querySelectorAll('[data-asset-id]').length} assets, 0 errors, 0 warnings.`,
          kind: 'success',
          timeout: 5000,
        }),
      steps.length * 650,
    );
  });
}

/* ---------- local time in Manchester ---------- */

function initClock() {
  const els = document.querySelectorAll<HTMLElement>('[data-clock]');
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' });
  const tick = () => els.forEach((el) => (el.textContent = fmt.format(new Date())));
  tick();
  setInterval(tick, 10_000);
}

/* ---------- keyboard shortcuts ---------- */

function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      runAction('drawer');
    } else if (e.ctrlKey && (e.key === 'b' || e.key === 'B') && !e.shiftKey) {
      if (runAction('browse-asset')) e.preventDefault();
    } else if (e.shiftKey && e.key === 'F11') {
      e.preventDefault();
      runAction('fullscreen');
    } else if (e.altKey && (e.key === 'p' || e.key === 'P' || e.code === 'KeyP')) {
      e.preventDefault();
      runAction('vp-toggle');
    } else if (e.altKey && /^Digit[4-8]$/.test(e.code)) {
      e.preventDefault();
      runAction(`viewmode:${['lit', 'unlit', 'wireframe', 'detail', 'lighting'][Number(e.code.slice(5)) - 4]}`);
    } else if (!isTyping(e) && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === '`' || e.key === '¬')) {
      e.preventDefault();
      runAction('console');
    }
  });
}

/* ---------- the notice a page asks for on load ---------- */

function initNotice() {
  const data = document.querySelector<HTMLScriptElement>('script[data-notice]');
  if (!data) return;
  try {
    const n = JSON.parse(data.textContent || 'null');
    const key = `swiift:notice:${n.href}:${n.title}`;
    if (sessionStorage.getItem(key)) return;
    setTimeout(() => {
      notify({ ...n, timeout: 10_000 });
      sessionStorage.setItem(key, '1');
    }, 1600);
  } catch {
    /* ignore */
  }
}

export function initShell() {
  initActions();
  initTabs();
  initMenus();
  initSplitters();
  initSheets();
  initMenuSheet();
  initClipboard();
  initFullscreen();
  initBuild();
  initClock();
  initShortcuts();
  initNotice();
  showHash();
  addEventListener('hashchange', showHash);
}
