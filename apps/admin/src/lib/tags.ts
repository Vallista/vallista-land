import { useEffect, useState } from 'react';
import { listDocs, listTasks } from './tauri';
import { loadThoughts } from './thoughts';

export function collectThoughtTags(): string[] {
  const set = new Set<string>();
  for (const t of loadThoughts()) {
    for (const tg of t.tags ?? []) {
      const tag = tg.trim();
      if (tag) set.add(tag);
    }
  }
  return Array.from(set);
}

export function useAllTags(): string[] {
  const [tags, setTags] = useState<string[]>(() => collectThoughtTags());

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      const set = new Set<string>(collectThoughtTags());
      try {
        const tasks = await listTasks();
        for (const t of tasks) {
          for (const tg of t.tags ?? []) {
            const tag = tg.trim();
            if (tag) set.add(tag);
          }
        }
      } catch {
        /* ignore */
      }
      try {
        const docs = await listDocs();
        for (const d of docs) {
          for (const tg of d.tags ?? []) {
            const tag = tg.trim();
            if (tag) set.add(tag);
          }
        }
      } catch {
        /* ignore */
      }
      if (alive) {
        setTags(Array.from(set).sort((a, b) => a.localeCompare(b)));
      }
    };
    refresh();
    const onChanged = () => refresh();
    window.addEventListener('bento:thoughts-changed', onChanged);
    window.addEventListener('bento:tasks-changed', onChanged);
    window.addEventListener('bento:docs-changed', onChanged);
    return () => {
      alive = false;
      window.removeEventListener('bento:thoughts-changed', onChanged);
      window.removeEventListener('bento:tasks-changed', onChanged);
      window.removeEventListener('bento:docs-changed', onChanged);
    };
  }, []);

  return tags;
}

export function getLastTagToken(input: string): { token: string; before: string } {
  const m = /([^\s,]*)$/.exec(input);
  const token = m?.[1] ?? '';
  return { token, before: input.slice(0, input.length - token.length) };
}

export function notifyTagsChanged(scope: 'thoughts' | 'tasks' | 'docs'): void {
  if (typeof window === 'undefined') return;
  const event =
    scope === 'thoughts'
      ? 'bento:thoughts-changed'
      : scope === 'tasks'
        ? 'bento:tasks-changed'
        : 'bento:docs-changed';
  window.dispatchEvent(new CustomEvent(event));
}
