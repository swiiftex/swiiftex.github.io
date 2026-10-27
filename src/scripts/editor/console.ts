/**
 * The console ("Enter Console Command"): a handful of commands with
 * suggestions, echoing to the Output Log like Unreal's.
 *   help · open <name> · about · contact · github · stat fps · viewmode <mode>
 *   play · stop · clear · quit
 */
import { onAction, runAction } from './actions';
import { desk, openBottom } from './shell';
import { notify } from './notify';

type Target = { name: string; href: string; external: boolean; kind: string };
type Command = { name: string; help: string; args?: () => string[]; run: (arg: string) => void };

export function initConsole() {
  const log = document.querySelector<HTMLElement>('[data-log]');
  const inputs = [...document.querySelectorAll<HTMLInputElement>('[data-console-input]')];
  const suggest = document.querySelector<HTMLElement>('[data-console-suggest]');
  if (!inputs.length) return;

  /* ----- Output Log ----- */
  const stamp = () => {
    const d = new Date();
    const p = (n: number, l = 2) => String(n).padStart(l, '0');
    return `[${d.getUTCFullYear()}.${p(d.getUTCMonth() + 1)}.${p(d.getUTCDate())}-${p(d.getUTCHours())}.${p(d.getUTCMinutes())}.${p(d.getUTCSeconds())}:${p(d.getUTCMilliseconds(), 3)}]`;
  };
  // Clone an existing line so new ones pick up the log's scoped styles.
  const lineTpl = log?.querySelector<HTMLElement>('.olog__line');
  const write = (cat: string, text: string, verbosity: 'Display' | 'Warning' | 'Error' | 'Cmd' = 'Display') => {
    if (!log || !lineTpl) return;
    const line = lineTpl.cloneNode(true) as HTMLElement;
    line.dataset.verbosity = verbosity;
    line.querySelector('.olog__link')?.remove();
    line.querySelector('.olog__ts')!.textContent = `${stamp()}[${String(log.children.length % 1000).padStart(3, ' ')}]`;
    const catEl = line.querySelector('.olog__cat')!;
    const verb = line.querySelector('.olog__verb');
    if (verbosity === 'Cmd') {
      catEl.textContent = 'Cmd: ';
      verb?.remove();
    } else {
      catEl.textContent = `Log${cat}: `;
      if (verb) verb.textContent = `${verbosity}: `;
    }
    line.querySelector('.olog__text')!.textContent = text;
    log.append(line);
    requestAnimationFrame(() => (log.scrollTop = log.scrollHeight));
  };
  onAction('log-clear', () => log?.replaceChildren());

  /* ----- what `open` can open ----- */
  const targets: Target[] = [];
  const seen = new Set<string>();
  document.querySelectorAll<HTMLAnchorElement>('[data-cb-folder] a.cb-tile').forEach((a) => {
    const name = a.querySelector('.cb-tile__name')?.textContent?.trim() ?? '';
    if (!name || seen.has(a.href)) return;
    seen.add(a.href);
    targets.push({ name, href: a.getAttribute('href')!, external: a.target === '_blank', kind: a.querySelector('.cb-tile__type')?.textContent ?? '' });
  });
  for (const [name, href] of [
    ['Games', '/editor/games/'],
    ['Mods', '/editor/mods/'],
    ['Software', '/editor/software/'],
    ['Events', '/editor/events/'],
    ['About', '/editor/about/'],
    ['Home', '/editor/'],
  ])
    targets.push({ name, href, external: false, kind: 'Level' });
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const find = (q: string) => {
    const k = slug(q);
    return targets.find((t) => slug(t.name) === k) ?? targets.find((t) => slug(t.name).startsWith(k)) ?? targets.find((t) => slug(t.name).includes(k));
  };
  const go = (t: Target) => {
    if (t.external) window.open(t.href, '_blank', 'noopener');
    else location.href = t.href;
  };

  const COMMANDS: Command[] = [
    {
      name: 'help',
      help: 'List the console commands',
      run: () => {
        COMMANDS.forEach((c) => write('Console', `${c.name.padEnd(14)} ${c.help}`));
        showLog();
      },
    },
    {
      name: 'open',
      help: 'Open a project, folder or page, e.g. open lunarball',
      args: () => targets.map((t) => t.name),
      run: (arg) => {
        if (!arg) return write('Console', 'Usage: open <name>. Try "open lunarball".', 'Warning');
        const t = find(arg);
        if (!t) {
          write('Console', `Couldn't find "${arg}".`, 'Error');
          return showLog();
        }
        write('Load', `LoadMap: ${t.name}`);
        go(t);
      },
    },
    { name: 'about', help: 'Open the About page', run: () => (location.href = '/editor/about/') },
    { name: 'contact', help: 'Copy my email address', run: () => runAction('contact') },
    { name: 'github', help: 'Open my GitHub profile', run: () => window.open('https://github.com/swiiftex', '_blank', 'noopener') },
    { name: 'stat fps', help: 'Show the frame rate in the viewport', run: () => runAction('stat-fps') || write('Console', 'No viewport on this page.', 'Warning') },
    {
      name: 'viewmode',
      help: 'Change the view mode: lit, unlit, wireframe, detail, lighting',
      args: () => ['lit', 'unlit', 'wireframe', 'detail', 'lighting'],
      run: (arg) => {
        const mode = arg.toLowerCase().replace('detaillighting', 'detail').replace('lightingonly', 'lighting');
        if (!['lit', 'unlit', 'wireframe', 'detail', 'lighting'].includes(mode)) return write('Console', 'Usage: viewmode lit|unlit|wireframe|detail|lighting', 'Warning');
        runAction(`viewmode:${mode}`);
      },
    },
    { name: 'play', help: 'Play the viewport gallery', run: () => runAction('vp-play') },
    { name: 'stop', help: 'Stop the viewport gallery', run: () => runAction('vp-stop') },
    { name: 'clear', help: 'Clear the Output Log', run: () => log?.replaceChildren() },
    {
      name: 'quit',
      help: 'Exit the editor',
      run: () => notify({ title: "Can't quit yet", text: 'There are still unsaved changes to your impression. Have a look around first!', timeout: 5000 }),
    },
  ];

  function showLog() {
    if (desk.matches) openBottom('log');
    requestAnimationFrame(() => log && (log.scrollTop = log.scrollHeight));
  }

  function exec(raw: string) {
    const line = raw.trim().replace(/\s+/g, ' ');
    if (!line) return;
    write('', line, 'Cmd');
    const lower = line.toLowerCase();
    const cmd = [...COMMANDS].sort((a, b) => b.name.length - a.name.length).find((c) => lower === c.name || lower.startsWith(`${c.name} `));
    if (cmd) cmd.run(line.slice(cmd.name.length).trim());
    else if (lower === 'exit') COMMANDS.find((c) => c.name === 'quit')!.run('');
    else {
      write('Console', `Command not recognized: ${line}. Type "help" for a list.`, 'Warning');
      showLog();
    }
  }

  /* ----- suggestions (status bar console) ----- */
  let items: string[] = [];
  let active = -1;
  const optionTpl = () => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.className = 'ue-menu__item sb-suggest__item';
    return li;
  };
  const candidates = (q: string) => {
    const v = q.toLowerCase().trimStart();
    if (!v) return [];
    const out: { label: string; help: string }[] = [];
    for (const c of COMMANDS) {
      if (c.name.startsWith(v) || v.startsWith(`${c.name} `)) {
        if (c.args && v.startsWith(`${c.name} `)) {
          const a = v.slice(c.name.length + 1);
          c.args()
            .filter((x) => slug(x).startsWith(slug(a)))
            .slice(0, 8)
            .forEach((x) => out.push({ label: `${c.name} ${x.toLowerCase()}`, help: '' }));
        } else out.push({ label: c.name, help: c.help });
      }
    }
    return out.slice(0, 9);
  };
  const render = (input: HTMLInputElement) => {
    if (!suggest || input !== inputs[0]) return;
    const list = candidates(input.value);
    items = list.map((c) => c.label);
    active = -1;
    suggest.replaceChildren(
      ...list.map((c, i) => {
        const li = optionTpl();
        li.id = `console-opt-${i}`;
        li.innerHTML = '<span></span><span class="ue-menu__label"></span><span class="ue-menu__key"></span>';
        li.children[1].textContent = c.label;
        li.children[2].textContent = c.help;
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          input.value = c.label + (c.help && COMMANDS.find((x) => x.name === c.label)?.args ? ' ' : '');
          render(input);
          input.focus();
        });
        return li;
      }),
    );
    suggest.hidden = !list.length;
    input.setAttribute('aria-expanded', String(!!list.length));
  };
  const highlight = (input: HTMLInputElement) => {
    suggest?.querySelectorAll('li').forEach((li, i) => li.classList.toggle('is-active', i === active));
    if (active >= 0) input.setAttribute('aria-activedescendant', `console-opt-${active}`);
    else input.removeAttribute('aria-activedescendant');
  };

  inputs.forEach((input) => {
    input.addEventListener('input', () => render(input));
    input.addEventListener('blur', () => setTimeout(() => suggest && (suggest.hidden = true), 120));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = active >= 0 && items[active] ? items[active] : input.value;
        exec(value);
        input.value = '';
        render(input);
      } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && items.length && input === inputs[0]) {
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        highlight(input);
      } else if (e.key === 'Tab' && items.length && input === inputs[0]) {
        e.preventDefault();
        input.value = items[Math.max(0, active)] + ' ';
        render(input);
      } else if (e.key === 'Escape') {
        input.value = '';
        render(input);
        input.blur();
      }
      e.stopPropagation();
    });
  });

  onAction('console', () => {
    if (desk.matches) inputs[0].focus();
    else {
      openBottom('log');
      inputs[1]?.focus();
    }
  });
}
