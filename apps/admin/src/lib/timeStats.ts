import type { Block } from '@vallista/content-core';
import { resolveLabel } from '../screens/Plan/labelCatalog';

export type TimeCategory = 'meet' | 'focus' | 'life';

export interface TimeStats {
  plannedMin: number;
  actualMin: number;
  driftMin: number;
  byCategory: Record<TimeCategory, number>;
  hasActual: boolean;
  totalCount: number;
  doneCount: number;
  meanAbsDriftMin: number | null;
}

export function buildTimeStats(blocks: Block[]): TimeStats {
  let plannedMin = 0;
  let actualMin = 0;
  let hasActual = false;
  let totalCount = 0;
  let doneCount = 0;
  const drifts: number[] = [];
  const byCategory: Record<TimeCategory, number> = { meet: 0, focus: 0, life: 0 };
  for (const b of blocks) {
    if (isAllDayLike(b)) continue;
    if (b.endDate && b.endDate !== b.date) continue;
    totalCount += 1;
    if (b.done) doneCount += 1;
    const planned = diffMin(b.start, b.end);
    if (planned !== null && planned > 0) {
      plannedMin += planned;
      byCategory[categoryOf(b.kind)] += planned;
    }
    if (b.actualStart && b.actualEnd) {
      const actual = diffMin(b.actualStart, b.actualEnd);
      if (actual !== null && actual > 0) {
        actualMin += actual;
        hasActual = true;
        if (planned !== null && planned > 0) {
          drifts.push(Math.abs(actual - planned));
        }
      }
    } else if (b.done && planned !== null && planned > 0) {
      actualMin += planned;
      hasActual = true;
    }
  }
  const driftMin = hasActual ? actualMin - plannedMin : 0;
  const meanAbsDriftMin =
    drifts.length > 0
      ? drifts.reduce((acc, n) => acc + n, 0) / drifts.length
      : null;
  return {
    plannedMin,
    actualMin,
    driftMin,
    byCategory,
    hasActual,
    totalCount,
    doneCount,
    meanAbsDriftMin,
  };
}

export function isAllDayLike(b: Block): boolean {
  if (b.start !== '00:00') return false;
  return b.end === '00:00' || b.end === '23:59';
}

export function diffMin(a: string, b: string): number | null {
  const m1 = /^(\d{1,2}):(\d{2})$/.exec(a.trim());
  const m2 = /^(\d{1,2}):(\d{2})$/.exec(b.trim());
  if (!m1 || !m2) return null;
  const t1 = Number(m1[1]) * 60 + Number(m1[2]);
  const t2 = Number(m2[1]) * 60 + Number(m2[2]);
  return t2 - t1;
}

export function categoryOf(kind: string): TimeCategory {
  if (kind === 'meet' || kind === 'people') return 'meet';
  if (
    kind === 'deep' ||
    kind === 'write' ||
    kind === 'read' ||
    kind === 'build' ||
    kind === 'publish'
  ) {
    return 'focus';
  }
  return 'life';
}

export function fmtMin(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return '0';
  if (min < 60) return `${Math.round(min)}분`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export interface TagStat {
  tag: string;
  category: TimeCategory;
  plannedMin: number;
  doneMin: number;
}

export interface WeekProgressStats {
  startKey: string;
  endKey: string;
  plannedMin: number;
  doneMin: number;
  totalCount: number;
  doneCount: number;
  byTag: TagStat[];
}

export function buildWeekProgress(
  blocks: Block[],
  startKey: string,
  endKey: string,
): WeekProgressStats {
  const tagMap = new Map<string, TagStat>();
  let plannedMin = 0;
  let doneMin = 0;
  let totalCount = 0;
  let doneCount = 0;
  for (const b of blocks) {
    if (b.date < startKey || b.date > endKey) continue;
    if (isAllDayLike(b)) continue;
    if (b.endDate && b.endDate !== b.date) continue;
    const planned = diffMin(b.start, b.end);
    if (planned === null || planned <= 0) continue;
    totalCount += 1;
    plannedMin += planned;
    const effectiveTags =
      b.tags && b.tags.length > 0 ? b.tags : [tagOf(b)];
    const cat = categoryOf(b.kind);
    const perPlanned = planned / effectiveTags.length;
    let actual = planned;
    if (b.done) {
      doneCount += 1;
      if (b.actualStart && b.actualEnd) {
        const real = diffMin(b.actualStart, b.actualEnd);
        if (real !== null && real > 0) actual = real;
      }
      doneMin += actual;
    }
    const perActual = actual / effectiveTags.length;
    for (const tag of effectiveTags) {
      let stat = tagMap.get(tag);
      if (!stat) {
        stat = { tag, category: cat, plannedMin: 0, doneMin: 0 };
        tagMap.set(tag, stat);
      }
      stat.plannedMin += perPlanned;
      if (b.done) stat.doneMin += perActual;
    }
  }
  const byTag = Array.from(tagMap.values()).sort(
    (a, b) => b.plannedMin - a.plannedMin,
  );
  return { startKey, endKey, plannedMin, doneMin, totalCount, doneCount, byTag };
}

function tagOf(b: Block): string {
  return b.customLabel || b.kind;
}

export interface LabelStat {
  labelId: string;
  name: string;
  color: string;
  plannedMin: number;
  doneMin: number;
}

export function buildWeekLabelStats(
  blocks: Block[],
  startKey: string,
  endKey: string,
): LabelStat[] {
  const map = new Map<string, LabelStat>();
  for (const b of blocks) {
    if (b.date < startKey || b.date > endKey) continue;
    if (isAllDayLike(b)) continue;
    if (b.endDate && b.endDate !== b.date) continue;
    const planned = diffMin(b.start, b.end);
    if (planned === null || planned <= 0) continue;
    const label = resolveLabel(b.kind, b.color);
    let stat = map.get(label.id);
    if (!stat) {
      stat = { labelId: label.id, name: label.name, color: label.color, plannedMin: 0, doneMin: 0 };
      map.set(label.id, stat);
    }
    stat.plannedMin += planned;
    if (b.done) {
      let actual = planned;
      if (b.actualStart && b.actualEnd) {
        const real = diffMin(b.actualStart, b.actualEnd);
        if (real !== null && real > 0) actual = real;
      }
      stat.doneMin += actual;
    }
  }
  return Array.from(map.values()).sort((a, b) => b.plannedMin - a.plannedMin);
}
