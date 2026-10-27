/** The Details panel's search box: filters properties, hiding empty categories. */
export function initDetails() {
  const panel = document.querySelector<HTMLElement>('[data-details]');
  const input = panel?.querySelector<HTMLInputElement>('[data-dp-search]');
  if (!panel || !input) return;
  const rows = [...panel.querySelectorAll<HTMLElement>('[data-dp-row]')];
  const cats = [...panel.querySelectorAll<HTMLDetailsElement>('[data-dp-cat]')];
  const none = panel.querySelector<HTMLElement>('[data-dp-none]');
  const wasOpen = new Map(cats.map((c) => [c, c.open]));

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    rows.forEach((r) => {
      const text = `${r.textContent} ${r.dataset.dpKeywords ?? ''}`.toLowerCase();
      r.hidden = !!q && !text.includes(q);
    });
    let any = false;
    cats.forEach((c) => {
      const title = c.querySelector('summary')?.textContent?.toLowerCase() ?? '';
      const titleHit = !!q && title.includes(q);
      if (titleHit) c.querySelectorAll<HTMLElement>('[data-dp-row]').forEach((r) => (r.hidden = false));
      const visible = !q || titleHit || [...c.querySelectorAll<HTMLElement>('[data-dp-row]')].some((r) => !r.hidden);
      c.hidden = !visible;
      if (q) c.open = true;
      else c.open = wasOpen.get(c) ?? true;
      any ||= visible;
    });
    if (none) none.hidden = !q || any;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && input.value) {
      e.stopPropagation();
      input.value = '';
      input.dispatchEvent(new Event('input'));
    }
  });
  cats.forEach((c) => c.addEventListener('toggle', () => !input.value && wasOpen.set(c, c.open)));
}
