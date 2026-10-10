// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://www.swiift.co.uk',
  trailingSlash: 'ignore',
  // Astro 7 defaults to JSX-style whitespace collapsing; keep normal HTML spacing.
  compressHTML: true,
  integrations: [sitemap()],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Old WordPress URLs, so links shared from swiift.co.uk keep working here.
  redirects: {
    '/my-games': '/games',
    '/mods': '/games#mods',
    '/all-projects': '/',
    '/simple-sensitivity-converter': '/source2all-sensitivity-converter',
  },
});
