/**
 * `data-action` buttons and menu items anywhere on the page run a named
 * action. Modules register handlers; "name:arg" actions pass the argument.
 */
type Handler = (arg: string, el: HTMLElement | null, e: Event | null) => void | boolean;

const handlers = new Map<string, Handler>();

export function onAction(name: string, fn: Handler) {
  handlers.set(name, fn);
}

/** Runs an action; returns false if nothing handles it. */
export function runAction(action: string, el: HTMLElement | null = null, e: Event | null = null): boolean {
  const i = action.indexOf(':');
  const name = i < 0 ? action : action.slice(0, i);
  const arg = i < 0 ? '' : action.slice(i + 1);
  const fn = handlers.get(name);
  if (!fn) return false;
  return fn(arg, el, e) !== false;
}

export function initActions() {
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!el) return;
    if (runAction(el.dataset.action!, el, e)) e.preventDefault();
  });
}

/** True while typing in a field, so single-key shortcuts don't fire. */
export const isTyping = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement;
  return t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
};
