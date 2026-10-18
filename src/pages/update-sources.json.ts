/**
 * The update posts this build was made with (Steam posts and GitHub releases).
 * The deploy workflow fetches this every hour, compares each value with the
 * source, and rebuilds the site when one has changed.
 */
import type { APIRoute } from 'astro';
import { getProjects } from '../lib/projects';
import { updateSources } from '../lib/updates';

export const GET: APIRoute = async () =>
  new Response(JSON.stringify(await updateSources(await getProjects()), null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
