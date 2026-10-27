// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: 'https://www.swiift.co.uk',
  trailingSlash: 'ignore',
  // Astro 7 defaults to JSX-style whitespace collapsing; keep normal HTML spacing.
  compressHTML: true,
  // The editor view (/editor/…) mirrors the classic pages, so only the classic ones are listed.
  integrations: [sitemap({ filter: (page) => !new URL(page).pathname.startsWith('/editor/') })],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Images in Steam update posts are downloaded at build time and served as optimised WebP.
  image: {
    remotePatterns: [{ protocol: 'https', hostname: '**.steamstatic.com' }],
  },
  // Old WordPress URLs, so links shared from swiift.co.uk keep working here.
  redirects: {
    '/my-games': '/games',
    '/mods': '/games#mods',
    '/all-projects': '/',
    '/simple-sensitivity-converter': '/source2all-sensitivity-converter',
  },
});
