export type Collection = 'articles' | 'notes';

export const VAULT_LAYOUT = {
  root: 'contents',
  articles: 'contents/articles',
  notes: 'contents/notes',
  projects: 'contents/projects',
} as const;

function join(...parts: string[]): string {
  return parts
    .map((p) => p.replace(/\\/g, '/').replace(/^\/+|\/+$/g, ''))
    .filter((p) => p.length > 0)
    .join('/');
}

export function articleFolder(slug: string): string {
  return join(VAULT_LAYOUT.articles, slug);
}

export function articleIndex(slug: string): string {
  return join(articleFolder(slug), 'index.md');
}

export function noteFolder(slug: string): string {
  return join(VAULT_LAYOUT.notes, slug);
}

export function noteIndex(slug: string): string {
  return join(noteFolder(slug), 'index.md');
}

export function isInsideVault(absRoot: string, absPath: string): boolean {
  const root = absRoot.replace(/\\/g, '/').replace(/\/+$/, '');
  const target = absPath.replace(/\\/g, '/').replace(/\/+$/, '');
  if (target === root) return false;
  return target.startsWith(root + '/');
}
