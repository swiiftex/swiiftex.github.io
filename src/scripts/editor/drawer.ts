/**
 * Content Drawer: folder navigation (tiles, tree and breadcrumb), search
 * across every asset, asset tooltips, and "Browse to Asset" (Ctrl+B).
 */
import { onAction } from './actions';
import { desk, openBottom } from './shell';

const KEY = 'swiift:cb-folder';
const SCROLL = 'swiift:cb-scroll';

export function initDrawer() {
  const found = document.querySelector<HTMLElement>('[data-cb]');
  if (!found) return;
  const cb = found;
  const view = cb.querySelector<HTMLElement>('[data-cb-view]')!;
  const grids = [...cb.querySelectorAll<HTMLElement>('[data-cb-folder]')];
  const results = cb.querySelector<HTMLElement>('[data-cb-results]')!;
  const empty = cb.querySelector<HTMLElement>('[data-cb-empty]')!;
  const search = cb.querySelector<HTMLInputElement>('[data-cb-search]')!;
  const crumbs = cb.querySelector<HTMLElement>('[data-cb-crumbs]')!;
  const count = cb.querySelector<HTMLElement>('[data-cb-count]')!;
  const tree = cb.querySelector<HTMLElement>('.cb-tree[role="tree"]');
  // Templates for the breadcrumb, cloned so they keep the component's scoped styles.
  const crumbTpl = crumbs.querySelector<HTMLElement>('.cb__crumb')!.cloneNode(false) as HTMLElement;
  const sepTpl = crumbs.querySelector('.cb__crumb-sep')?.cloneNode(true) as Element | undefined;
  const rootIcon = crumbs.querySelector('.cb__crumb .ue-icon')?.cloneNode(true) as Element | undefined;
  let folder = cb.dataset.folder ?? '';

  const nameOf = (path: string) => (path === '' ? 'Content' : path.split('/').pop()!);
  const gridOf = (path: string) => grids.find((g) => g.dataset.cbFolder === path);

  function renderCrumbs() {
    const parts = folder.split('/').filter(Boolean);
    const paths = ['', ...parts.map((_, i) => parts.slice(0, i + 1).join('/'))];
    const nodes: Node[] = [];
    paths.forEach((p, i) => {
      if (i && sepTpl) nodes.push(sepTpl.cloneNode(true));
      const b = crumbTpl.cloneNode(false) as HTMLElement;
      b.dataset.cbGo = p;
      if (i === paths.length - 1) b.setAttribute('aria-current', 'location');
      else b.removeAttribute('aria-current');
      if (p === '' && rootIcon) b.append(rootIcon.cloneNode(true));
      b.append(p === '' ? 'All' : p.split('/').pop()!);
      nodes.push(b);
    });
    crumbs.replaceChildren(...nodes);
    crumbs.scrollLeft = crumbs.scrollWidth;
  }

  function syncTree() {
    tree?.querySelectorAll<HTMLElement>('[data-cb-node]').forEach((li) => {
      const p = li.dataset.cbNode!;
      li.setAttribute('aria-selected', String(p === folder));
      if (li.hasAttribute('aria-expanded') && (p === '' || folder === p || folder.startsWith(`${p}/`))) li.setAttribute('aria-expanded', 'true');
    });
  }

  function go(path: string, opts: { save?: boolean } = {}) {
    if (!gridOf(path)) return;
    folder = path;
    cb.dataset.folder = path;
    if (search.value) search.value = '';
    results.hidden = true;
    empty.hidden = true;
    grids.forEach((g) => (g.hidden = g.dataset.cbFolder !== path));
    const items = gridOf(path)!.querySelectorAll('.cb-tile:not(.cb-tile--up)').length;
    count.textContent = `${items} ${items === 1 ? 'item' : 'items'}`;
    search.placeholder = `Search ${nameOf(path)}`;
    renderCrumbs();
    syncTree();
    view.scrollTop = 0;
    if (opts.save !== false) {
      try {
        sessionStorage.setItem(KEY, path);
      } catch {
        /* storage blocked */
      }
    }
  }

  /* ----- clicks: folders, crumbs, tree ----- */
  cb.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const twisty = t.closest<HTMLElement>('[data-cb-twisty]');
    if (twisty) {
      const li = twisty.closest<HTMLElement>('[data-cb-node]')!;
      li.setAttribute('aria-expanded', String(li.getAttribute('aria-expanded') !== 'true'));
      e.stopPropagation();
      return;
    }
    const target = t.closest<HTMLElement>('[data-cb-go]');
    if (target) go(target.dataset.cbGo!);
  });

  // Backspace goes up a folder, as in the Content Browser.
  view.addEventListener('keydown', (e) => {
    if (e.key !== 'Backspace' || folder === '' || search.value) return;
    e.preventDefault();
    go(folder.split('/').slice(0, -1).join('/'));
    view.querySelector<HTMLElement>(`[data-cb-folder="${CSS.escape(folder)}"] .cb-tile`)?.focus();
  });

  /* ----- search every asset ----- */
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    if (!q) {
      results.hidden = true;
      empty.hidden = true;
      gridOf(folder)!.hidden = false;
      const items = gridOf(folder)!.querySelectorAll('.cb-tile:not(.cb-tile--up)').length;
      count.textContent = `${items} items`;
      return;
    }
    grids.forEach((g) => (g.hidden = true));
    const seen = new Set<string>();
    const matches = [...cb.querySelectorAll<HTMLElement>('[data-cb-folder] [data-cb-name]')].filter((tile) => {
      const key = tile.dataset.assetId ?? `folder:${tile.dataset.cbGo}`;
      if (seen.has(key) || !tile.dataset.cbName!.toLowerCase().includes(q)) return false;
      seen.add(key);
      return true;
    });
    results.replaceChildren(
      ...matches.map((tile) => {
        const li = document.createElement('li');
        li.append(tile.cloneNode(true));
        return li;
      }),
    );
    results.hidden = !matches.length;
    empty.hidden = !!matches.length;
    count.textContent = `${matches.length} ${matches.length === 1 ? 'result' : 'results'}`;
  });
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && search.value) {
      e.stopPropagation();
      search.value = '';
      search.dispatchEvent(new Event('input'));
    }
  });

  /* ----- tooltips on hover (mouse only) ----- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const tip = document.createElement('div');
    tip.className = 'ue-tooltip cb-tooltip';
    tip.setAttribute('role', 'tooltip');
    document.body.append(tip);
    let timer = 0;
    let current: HTMLElement | null = null;
    const hide = () => {
      clearTimeout(timer);
      current = null;
      tip.classList.remove('is-on');
    };
    view.addEventListener('pointerover', (e) => {
      const tile = (e.target as HTMLElement).closest<HTMLElement>('.cb-tile[data-asset-id]');
      if (!tile || tile === current) return;
      hide();
      current = tile;
      timer = window.setTimeout(() => {
        const src = tile.querySelector('.cb-tile__tip');
        if (!src || current !== tile) return;
        tip.innerHTML = src.innerHTML;
        tip.style.setProperty('--type', tile.style.getPropertyValue('--type'));
        const r = tile.getBoundingClientRect();
        tip.style.left = '0px';
        tip.style.top = '0px';
        tip.classList.add('is-on');
        const t = tip.getBoundingClientRect();
        let left = r.right + 8;
        if (left + t.width > innerWidth - 8) left = r.left - t.width - 8;
        let top = r.top;
        if (top + t.height > innerHeight - 8) top = innerHeight - t.height - 8;
        tip.style.left = `${Math.max(8, left)}px`;
        tip.style.top = `${Math.max(8, top)}px`;
      }, 450);
    });
    view.addEventListener('pointerleave', hide);
    view.addEventListener('pointerout', (e) => {
      if (current && !current.contains(e.relatedTarget as Node)) hide();
    });
    view.addEventListener('scroll', hide, { passive: true });
    view.addEventListener('click', hide);
  }

  /* ----- Browse to Asset (Ctrl+B) ----- */
  const reveal = (id: string) => {
    const tile = cb.querySelector<HTMLElement>(`[data-cb-folder] [data-asset-id="${CSS.escape(id)}"]`);
    if (!tile) return false;
    go(tile.closest<HTMLElement>('[data-cb-folder]')!.dataset.cbFolder!);
    openBottom('drawer');
    requestAnimationFrame(() => {
      tile.scrollIntoView({ block: 'nearest' });
      tile.classList.remove('is-flash');
      void tile.offsetWidth;
      tile.classList.add('is-flash');
      tile.focus({ preventScroll: true });
    });
    return true;
  };
  onAction('open-drawer', (path) => {
    if (path && gridOf(path)) go(path);
    openBottom('drawer');
    if (desk.matches) {
      cb.classList.remove('is-flash');
      void cb.offsetWidth;
      cb.classList.add('is-flash');
    }
  });
  onAction('browse-asset', () => {
    const id = cb.dataset.asset;
    if (id && reveal(id)) return;
    go(cb.dataset.pageFolder ?? '');
    openBottom('drawer');
  });

  /* ----- keep the folder and scroll position between pages ----- */
  go(folder, { save: false });
  try {
    const saved = JSON.parse(sessionStorage.getItem(SCROLL) || 'null');
    if (saved && saved.folder === folder) view.scrollTop = saved.top;
  } catch {
    /* ignore */
  }
  if (cb.dataset.asset) {
    const tile = gridOf(folder)?.querySelector<HTMLElement>(`[data-asset-id="${CSS.escape(cb.dataset.asset)}"]`);
    if (tile) requestAnimationFrame(() => tile.scrollIntoView({ block: 'nearest' }));
  }
  addEventListener('pagehide', () => {
    try {
      sessionStorage.setItem(KEY, folder);
      sessionStorage.setItem(SCROLL, JSON.stringify({ folder, top: view.scrollTop }));
    } catch {
      /* ignore */
    }
  });

  // On phones, opening a project from the sheet closes it first so the page change is visible.
  view.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.cb-tile');
    if (a && !desk.matches && !a.target) document.documentElement.classList.remove('sheet-open');
  });
}
