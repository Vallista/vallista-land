import { useCallback, useEffect, useState } from 'react';

export interface Label {
  id: string;
  name: string;
  color: string;
  builtin?: boolean;
  order: number;
}

const STORAGE_KEY = 'bento.plan.labels.v1';

export const LABELS_CHANGED_EVENT = 'bento:labels-changed';

const BUILTIN_LABELS: Label[] = [
  { id: 'meet',    name: '미팅',   color: '#c4b5fd', builtin: true, order: 0 },
  { id: 'deep',    name: '몰입',   color: '#4ade80', builtin: true, order: 1 },
  { id: 'write',   name: '글쓰기', color: '#60a5fa', builtin: true, order: 2 },
  { id: 'read',    name: '독서',   color: '#fda4af', builtin: true, order: 3 },
  { id: 'build',   name: '제작',   color: '#fcd34d', builtin: true, order: 4 },
  { id: 'publish', name: '배포',   color: '#60a5fa', builtin: true, order: 5 },
  { id: 'health',  name: '건강',   color: '#4ade80', builtin: true, order: 6 },
  { id: 'meal',    name: '식사',   color: '#fcd34d', builtin: true, order: 7 },
  { id: 'leisure', name: '여가',   color: '#fda4af', builtin: true, order: 8 },
  { id: 'people',  name: '사람',   color: '#c4b5fd', builtin: true, order: 9 },
  { id: 'routine', name: '루틴',   color: '#71717a', builtin: true, order: 10 },
  { id: 'life',    name: '일상',   color: '#71717a', builtin: true, order: 11 },
];

function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[a-z0-9ㄱ-힝]+/g, (m) => m)
    .replace(/[^a-z0-9ㄱ-힝]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function loadLabels(): Label[] {
  if (typeof window === 'undefined') return BUILTIN_LABELS.map((l) => ({ ...l }));
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return BUILTIN_LABELS.map((l) => ({ ...l }));
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return BUILTIN_LABELS.map((l) => ({ ...l }));
    return parsed as Label[];
  } catch {
    return BUILTIN_LABELS.map((l) => ({ ...l }));
  }
}

export function saveLabels(labels: Label[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(labels));
  window.dispatchEvent(new CustomEvent(LABELS_CHANGED_EVENT));
}

export function addLabel(input: { name: string; color: string }): Label {
  const labels = loadLabels();
  const existing = labels.find((l) => l.name === input.name);
  if (existing) return existing;

  const baseId = slugify(input.name) || 'label';
  let id = baseId;
  const existingIds = new Set(labels.map((l) => l.id));
  let suffix = 1;
  while (existingIds.has(id)) {
    id = `${baseId}_${suffix}`;
    suffix += 1;
  }

  const maxOrder = labels.reduce((max, l) => (l.order > max ? l.order : max), -1);
  const label: Label = {
    id,
    name: input.name,
    color: input.color,
    order: maxOrder + 1,
  };

  saveLabels([...labels, label]);
  return label;
}

export function updateLabel(
  id: string,
  patch: Partial<Pick<Label, 'name' | 'color' | 'order'>>,
): void {
  const labels = loadLabels();
  const updated = labels.map((l) => (l.id === id ? { ...l, ...patch } : l));
  saveLabels(updated);
}

export function removeLabel(id: string): void {
  const labels = loadLabels();
  saveLabels(labels.filter((l) => l.id !== id));
}

export function resolveLabel(kind?: string | null, color?: string | null): Label {
  const labels = loadLabels();
  const found = kind != null ? labels.find((l) => l.id === kind) : undefined;
  if (found) {
    return found;
  }
  return {
    id: kind ?? 'unknown',
    name: kind ?? '미분류',
    color: color ?? '#71717a',
    order: 999,
  };
}

export function useLabels(): {
  labels: Label[];
  addLabel: (input: { name: string; color: string }) => Label;
  updateLabel: (id: string, patch: Partial<Pick<Label, 'name' | 'color' | 'order'>>) => void;
  removeLabel: (id: string) => void;
} {
  const [labels, setLabels] = useState<Label[]>(() => loadLabels());

  useEffect(() => {
    const onChanged = () => setLabels(loadLabels());
    window.addEventListener(LABELS_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(LABELS_CHANGED_EVENT, onChanged);
  }, []);

  const add = useCallback((input: { name: string; color: string }) => {
    return addLabel(input);
  }, []);

  const update = useCallback(
    (id: string, patch: Partial<Pick<Label, 'name' | 'color' | 'order'>>) => {
      updateLabel(id, patch);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    removeLabel(id);
  }, []);

  return { labels, addLabel: add, updateLabel: update, removeLabel: remove };
}
