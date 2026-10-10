import { getCollection, type CollectionEntry } from 'astro:content';
import type { Category } from '../content.config';

export type Project = CollectionEntry<'projects'>;

export async function getProjects(category?: Category | Category[]): Promise<Project[]> {
  const cats = category ? ([] as Category[]).concat(category) : null;
  const all = await getCollection('projects', ({ data }) => !cats || cats.includes(data.category));
  return all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const projectHref = (p: Project) => `/${p.id}/`;

export const vtName = (p: Project) => `cover-${p.id}`;

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDate = (d: Date) => dateFmt.format(d);

/** The label shown for "when": explicit `when`, else the year of `date`. */
export const whenLabel = (p: Project) => p.data.when ?? String(p.data.date.getFullYear());
