import { useEffect, useState } from 'react';

export type WeekStartDay = 'mon' | 'sun';

export const WEEK_START_KEY = 'bento.summary.weekStartDay';
export const WEEK_START_EVENT = 'bento:week-start-changed';

const DAY_LABELS_SUN_FIRST = ['일', '월', '화', '수', '목', '금', '토'];

export function readWeekStartDay(): WeekStartDay {
  try {
    const v = window.localStorage.getItem(WEEK_START_KEY);
    return v === 'sun' ? 'sun' : 'mon';
  } catch {
    return 'mon';
  }
}

export function writeWeekStartDay(value: WeekStartDay): void {
  try {
    window.localStorage.setItem(WEEK_START_KEY, value);
  } catch {}
  window.dispatchEvent(new CustomEvent(WEEK_START_EVENT));
}

export function useWeekStartDay(): WeekStartDay {
  const [value, setValue] = useState<WeekStartDay>(readWeekStartDay);
  useEffect(() => {
    const onChanged = () => setValue(readWeekStartDay());
    window.addEventListener(WEEK_START_EVENT, onChanged);
    return () => window.removeEventListener(WEEK_START_EVENT, onChanged);
  }, []);
  return value;
}

/** 주 시작일 기준 요일 인덱스. 0 = 주의 첫째 날, 6 = 마지막 날. */
export function weekdayIndex(d: Date, weekStartDay: WeekStartDay): number {
  const startDow = weekStartDay === 'mon' ? 1 : 0;
  return (d.getDay() - startDow + 7) % 7;
}

export function startOfWeek(d: Date, weekStartDay: WeekStartDay): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - weekdayIndex(x, weekStartDay));
  return x;
}

export function weekdayLabel(d: Date): string {
  return DAY_LABELS_SUN_FIRST[d.getDay()] ?? '';
}

/** 주 시작일 순서로 정렬한 요일 라벨 7개. */
export function weekdayLabels(weekStartDay: WeekStartDay): string[] {
  const startDow = weekStartDay === 'mon' ? 1 : 0;
  return Array.from({ length: 7 }, (_, i) => DAY_LABELS_SUN_FIRST[(startDow + i) % 7] ?? '');
}
