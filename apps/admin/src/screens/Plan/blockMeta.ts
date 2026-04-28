import type { Block, BlockSource, KnownBlockKind } from '@vallista/content-core';

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

export function isAllDayBlock(b: Block): boolean {
  if (b.start !== '00:00') return false;
  if (b.end === '00:00' || b.end === '23:59') return true;
  return false;
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
