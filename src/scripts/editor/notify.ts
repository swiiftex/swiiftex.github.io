/**
 * Editor-style notifications, stacked in the bottom-right corner like
 * Unreal's toasts ("Compiling shaders…", "Build succeeded").
 */
import { iconSvg } from './icons';

export type NotifyOptions = {
  title: string;
  text?: string;
  href?: string;
  action?: string;
  kind?: 'info' | 'success' | 'pending';
  /** Milliseconds before it closes itself; 0 keeps it open. */
  timeout?: number;
};

export type NotifyHandle = { update(o: Partial<NotifyOptions>): void; close(): void };

const ICON = { info: 'info', success: 'check', pending: 'info' } as const;

export function notify(opts: NotifyOptions): NotifyHandle {
  const area = document.querySelector<HTMLElement>('[data-notify-area]');
  const el = document.createElement('div');
  el.className = 'ue-notify';
  el.setAttribute('role', 'status');
  let timer = 0;

  const render = (o: NotifyOptions) => {
    el.dataset.kind = o.kind ?? 'info';
    const external = o.href && /^https?:/.test(o.href);
    el.innerHTML = `
      <span class="ue-notify__icon">${iconSvg(ICON[o.kind ?? 'info'], 20)}</span>
      <p class="ue-notify__title"></p>
      ${o.text ? '<p class="ue-notify__text"></p>' : ''}
      ${o.href ? `<a class="ue-notify__link"${external ? ' target="_blank" rel="noopener"' : ''}></a>` : ''}
      <button type="button" class="ue-notify__close" aria-label="Dismiss">${iconSvg('close', 12)}</button>`;
    el.querySelector('.ue-notify__title')!.textContent = o.title;
    if (o.text) el.querySelector('.ue-notify__text')!.textContent = o.text;
    if (o.href) {
      const a = el.querySelector<HTMLAnchorElement>('.ue-notify__link')!;
      a.href = o.href;
      a.textContent = o.action ?? 'Open';
    }
    el.querySelector('.ue-notify__close')!.addEventListener('click', close);
    clearTimeout(timer);
    const t = o.timeout ?? 6000;
    if (t > 0) timer = window.setTimeout(close, t);
  };

  let current = opts;
  render(current);

  function close() {
    clearTimeout(timer);
    el.classList.remove('is-on');
    setTimeout(() => el.remove(), 350);
  }

  if (area) {
    area.append(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-on')));
  }
  return {
    update(o) {
      current = { ...current, ...o };
      render(current);
    },
    close,
  };
}
