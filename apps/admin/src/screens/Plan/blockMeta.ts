import type { Block, BlockSource, KnownBlockKind } from '@vallista/content-core';
import { resolveLabel } from './labelCatalog';
import { listStatsExcluded, setStatsExclusions } from '../../lib/tauri';

export const SOURCE_LABEL: Record<BlockSource, string> = {
  local: '내 블록',
  gcal: 'GCAL',
  applecal: 'APPLE',
};

export const KIND_LABEL: Record<KnownBlockKind, string> = {
  meet: '미팅',
  write: '글쓰기',
  read: '독서',
  deep: '몰입',
  build: '제작',
  publish: '배포',
  health: '건강',
  meal: '식사',
  leisure: '여가',
  people: '사람',
  routine: '루틴',
  life: '일상',
};

export const KIND_COLOR: Record<
  KnownBlockKind,
  { bg: string; border: string; ink: string }
> = {
  meet: {
    bg: 'rgba(196,181,253,0.10)',
    border: 'rgba(196,181,253,0.32)',
    ink: 'var(--hl-violet)',
  },
  write: {
    bg: 'rgba(96,165,250,0.10)',
    border: 'rgba(96,165,250,0.32)',
    ink: 'var(--blue)',
  },
  read: {
    bg: 'rgba(253,164,175,0.10)',
    border: 'rgba(253,164,175,0.32)',
    ink: 'var(--hl-rose)',
  },
  deep: {
    bg: 'rgba(74,222,128,0.10)',
    border: 'rgba(74,222,128,0.32)',
    ink: 'var(--ok)',
  },
  build: {
    bg: 'rgba(252,211,77,0.10)',
    border: 'rgba(252,211,77,0.32)',
    ink: 'var(--hl-amber)',
  },
  publish: {
    bg: 'rgba(96,165,250,0.18)',
    border: 'rgba(96,165,250,0.45)',
    ink: 'var(--blue)',
  },
  health: {
    bg: 'rgba(74,222,128,0.10)',
    border: 'rgba(74,222,128,0.32)',
    ink: 'var(--ok)',
  },
  meal: {
    bg: 'rgba(252,211,77,0.10)',
    border: 'rgba(252,211,77,0.32)',
    ink: 'var(--hl-amber)',
  },
  leisure: {
    bg: 'rgba(253,164,175,0.10)',
    border: 'rgba(253,164,175,0.32)',
    ink: 'var(--hl-rose)',
  },
  people: {
    bg: 'rgba(196,181,253,0.10)',
    border: 'rgba(196,181,253,0.32)',
    ink: 'var(--hl-violet)',
  },
  routine: {
    bg: 'rgba(120,120,128,0.10)',
    border: 'rgba(120,120,128,0.32)',
    ink: 'var(--ink-mute)',
  },
  life: {
    bg: 'rgba(120,120,128,0.10)',
    border: 'rgba(120,120,128,0.32)',
    ink: 'var(--ink-mute)',
  },
};

export const EXTERNAL_COLOR = {
  bg: 'rgba(120,120,128,0.08)',
  border: 'rgba(120,120,128,0.28)',
  ink: 'var(--ink-mute)',
};

export function isLocal(b: Block): boolean {
  return !b.source || b.source === 'local';
}

export function blockColor(b: Block): { bg: string; border: string; ink: string } {
  const isExternal = b.source && b.source !== 'local';
  if (isExternal && !b.kind && !b.color) return EXTERNAL_COLOR;
  const label = resolveLabel(b.kind, b.color);
  return {
    bg: `${label.color}22`,
    border: `${label.color}66`,
    ink: label.color,
  };
}

export function isAllDayBlock(b: Block): boolean {
  if (b.start !== '00:00') return false;
  if (b.end === '00:00' || b.end === '23:59') return true;
  return false;
}

export function isUnscheduledBlock(b: Block): boolean {
  return b.start === '' && b.end === '';
}

export function spanDayCount(b: Block): number {
  const startDay = b.date;
  const endDay = b.endDate ?? b.date;
  return dayOffset(startDay, endDay) + 1;
}

export function dayOffset(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`);
  const b = new Date(`${to}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const STATS_EXCLUDED_STORAGE_KEY = 'bento.plan.statsExcluded';
export const STATS_EXCLUDED_EVENT = 'bento:stats-excluded-changed';

function blockStatsKey(b: Block): string {
  if (b.source === 'local' || !b.externalId) return `local:${b.id}`;
  return `${b.source}:${b.externalId}@${b.date}`;
}

export function loadStatsExcluded(): Set<string> {
  try {
    const raw = localStorage.getItem(STATS_EXCLUDED_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function isStatsExcluded(b: Block): boolean {
  return loadStatsExcluded().has(blockStatsKey(b));
}

export function toggleStatsExcluded(b: Block): boolean {
  const keys = loadStatsExcluded();
  const key = blockStatsKey(b);
  if (keys.has(key)) {
    keys.delete(key);
  } else {
    keys.add(key);
  }
  const arr = [...keys];
  localStorage.setItem(STATS_EXCLUDED_STORAGE_KEY, JSON.stringify(arr));
  window.dispatchEvent(new CustomEvent(STATS_EXCLUDED_EVENT));
  setStatsExclusions(arr).catch(() => {});
  return keys.has(key);
}

export async function syncStatsExcludedFromFile(): Promise<void> {
  try {
    const keys = await listStatsExcluded();
    localStorage.setItem(STATS_EXCLUDED_STORAGE_KEY, JSON.stringify(keys));
    window.dispatchEvent(new CustomEvent(STATS_EXCLUDED_EVENT));
  } catch {
    // tauri not available (e.g. browser dev) — keep existing localStorage
  }
}

export function filterStatsBlocks(blocks: Block[]): Block[] {
  const excluded = loadStatsExcluded();
  return blocks.filter((b) => !excluded.has(blockStatsKey(b)));
}
