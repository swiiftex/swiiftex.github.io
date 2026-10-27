/** Wires up the editor: shell first (tabs, menus, actions), then each panel. */
import { initShell } from './shell';
import { initDrawer } from './drawer';
import { initViewport } from './viewport';
import { initGraph } from './graph';
import { initConsole } from './console';
import { initDetails } from './details';

export function initEditor() {
  initShell();
  initDrawer();
  initViewport();
  initGraph();
  initConsole();
  initDetails();
}
