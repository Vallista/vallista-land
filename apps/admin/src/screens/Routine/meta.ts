import type { RoutineColor, RoutineSlot } from '@vallista/content-core';
import type { RoutineInput } from '../../lib/tauri';

/** 검증한 순서 그대로. 새 루틴은 아직 안 쓴 색 중 앞에서부터 고른다 */
export const ROUTINE_COLORS: Array<{ key: RoutineColor; label: string }> = [
  { key: 'blue', label: '파랑' },
  { key: 'orange', label: '주황' },
  { key: 'aqua', label: '청록' },
  { key: 'yellow', label: '노랑' },
  { key: 'magenta', label: '분홍' },
  { key: 'violet', label: '보라' },
];

export function routineColor(key: RoutineColor | string | undefined): string {
  const k = ROUTINE_COLORS.some((c) => c.key === key) ? key : 'blue';
  return `var(--routine-${k})`;
}

export const SLOT_ORDER: RoutineSlot[] = ['morning', 'afternoon', 'evening', 'anytime'];

export const SLOT_META: Record<RoutineSlot, { label: string; hint: string }> = {
  morning: { label: '아침', hint: '하루를 여는' },
  afternoon: { label: '오후', hint: '일하는 사이' },
  evening: { label: '저녁', hint: '하루를 닫는' },
  anytime: { label: '언제든', hint: '시간 무관' },
};

/** 요일 버튼 순서 (월요일 시작) */
export const WEEKDAY_BUTTONS: Array<{ value: number; label: string }> = [
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
  { value: 0, label: '일' },
];

export type RoutineTemplate = Pick<RoutineInput, 'title' | 'slot' | 'goalMin'> & {
  weekdays?: number[];
};

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  { title: '물 한 잔 마시기', slot: 'morning' },
  { title: '스트레칭', slot: 'morning', goalMin: 10 },
  { title: '독서', slot: 'evening', goalMin: 20 },
  { title: '운동', slot: 'evening', goalMin: 40, weekdays: [1, 3, 5] },
  { title: '명상', slot: 'morning', goalMin: 10 },
  { title: '일기 쓰기', slot: 'evening' },
];
