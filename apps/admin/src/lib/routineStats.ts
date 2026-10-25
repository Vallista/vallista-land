import type { Routine, RoutineLog, RoutineSlot } from '@vallista/content-core';
import { startOfWeek, type WeekStartDay } from './weekStart';

/** YYYY-MM-DD (로컬 날짜) */
export type DayKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function keyOf(d: Date): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 로컬 정오. 날짜 산술이 서머타임 경계에서 하루 밀리지 않게 */
export function parseKey(k: DayKey): Date {
  const [y, m, d] = k.split('-').map((s) => Number.parseInt(s, 10));
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12);
}

export function addDays(k: DayKey, n: number): DayKey {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
}

/** 0=일 … 6=토 */
export function dowOf(k: DayKey): number {
  return parseKey(k).getDay();
}

/** b - a (일) */
export function daysBetween(a: DayKey, b: DayKey): number {
  const pa = parseKey(a);
  const pb = parseKey(b);
  const ua = Date.UTC(pa.getFullYear(), pa.getMonth(), pa.getDate());
  const ub = Date.UTC(pb.getFullYear(), pb.getMonth(), pb.getDate());
  return Math.round((ub - ua) / 86_400_000);
}

/** from..to 양 끝 포함. from > to면 빈 배열 */
export function rangeKeys(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = [];
  const n = daysBetween(from, to);
  for (let i = 0; i <= n; i++) out.push(addDays(from, i));
  return out;
}

export function weekStartKey(k: DayKey, weekStart: WeekStartDay): DayKey {
  return keyOf(startOfWeek(parseKey(k), weekStart));
}

export function monthStartKey(k: DayKey): DayKey {
  return `${k.slice(0, 7)}-01`;
}

export function monthEndKey(k: DayKey): DayKey {
  const d = parseKey(monthStartKey(k));
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return keyOf(d);
}

// ---------------------------------------------------------------------------
// 예정일
// ---------------------------------------------------------------------------

/** 시작일 이후, 보관 전, 쉬는 구간 밖 */
export function isActiveOn(r: Routine, k: DayKey): boolean {
  if (k < r.startDate) return false;
  if (r.archivedAt && k >= r.archivedAt) return false;
  for (const p of r.pauses ?? []) {
    if (k >= p.from && k <= p.to) return false;
  }
  return true;
}

export function isScheduled(r: Routine, k: DayKey): boolean {
  if (!isActiveOn(r, k)) return false;
  if (r.schedule.freq === 'daily') return true;
  return r.schedule.weekdays.includes(dowOf(k));
}

// ---------------------------------------------------------------------------
// 기록 색인
// ---------------------------------------------------------------------------

export type LogIndex = Map<string, RoutineLog>;

export function indexLogs(logs: RoutineLog[]): LogIndex {
  const m: LogIndex = new Map();
  for (const l of logs) m.set(`${l.routineId}|${l.date}`, l);
  return m;
}

export function logOf(idx: LogIndex, routineId: string, k: DayKey): RoutineLog | undefined {
  return idx.get(`${routineId}|${k}`);
}

export function isDone(idx: LogIndex, routineId: string, k: DayKey): boolean {
  return logOf(idx, routineId, k)?.done === true;
}

// ---------------------------------------------------------------------------
// 하루 · 기간
// ---------------------------------------------------------------------------

export interface DayStat {
  date: DayKey;
  /** 예정된 루틴 수 */
  scheduled: number;
  /** 예정된 루틴 중 완료 */
  done: number;
  /** 예정이 아닌 날 완료(보너스) */
  extra: number;
  secs: number;
  /** 예정이 없으면 null */
  rate: number | null;
  future: boolean;
}

export function dayStat(routines: Routine[], idx: LogIndex, k: DayKey, today: DayKey): DayStat {
  let scheduled = 0;
  let done = 0;
  let extra = 0;
  let secs = 0;
  for (const r of routines) {
    const log = logOf(idx, r.id, k);
    if (log) secs += log.secs || 0;
    if (isScheduled(r, k)) {
      scheduled += 1;
      if (log?.done) done += 1;
    } else if (log?.done) {
      extra += 1;
    }
  }
  return {
    date: k,
    scheduled,
    done,
    extra,
    secs,
    rate: scheduled > 0 ? done / scheduled : null,
    future: k > today,
  };
}

export interface RangeSummary {
  from: DayKey;
  to: DayKey;
  days: DayStat[];
  scheduled: number;
  done: number;
  rate: number | null;
  secs: number;
  /** 예정한 루틴을 모두 끝낸 날 */
  perfectDays: number;
  /** 하나라도 완료한 날 */
  activeDays: number;
}

/** 기간 통계. 미래 날짜는 days에는 넣되 합계에서 뺀다. 오늘은 진행 중이라도 합계에 넣는다. */
export function summarize(
  routines: Routine[],
  idx: LogIndex,
  from: DayKey,
  to: DayKey,
  today: DayKey,
): RangeSummary {
  const days = rangeKeys(from, to).map((k) => dayStat(routines, idx, k, today));
  let scheduled = 0;
  let done = 0;
  let secs = 0;
  let perfectDays = 0;
  let activeDays = 0;
  for (const s of days) {
    if (s.future) continue;
    scheduled += s.scheduled;
    done += s.done;
    secs += s.secs;
    if (s.scheduled > 0 && s.done === s.scheduled) perfectDays += 1;
    if (s.done + s.extra > 0) activeDays += 1;
  }
  return {
    from,
    to,
    days,
    scheduled,
    done,
    rate: scheduled > 0 ? done / scheduled : null,
    secs,
    perfectDays,
    activeDays,
  };
}

// ---------------------------------------------------------------------------
// 스트릭
// ---------------------------------------------------------------------------

export interface StreakInfo {
  /** 오늘(진행 중이면 어제)까지 이어진 연속 예정일 수 */
  current: number;
  best: number;
  /** 오늘이 예정일인데 아직 안 함 */
  pendingToday: boolean;
}

/** 예정일만 센다. 오늘 안 한 건 끊김이 아니라 '진행 중'. 예정 없는 날 한 건 늘리지도 끊지도 않는다. */
export function routineStreak(r: Routine, idx: LogIndex, today: DayKey): StreakInfo {
  let cur = 0;
  let best = 0;
  let pendingToday = false;
  if (r.startDate > today) return { current: 0, best: 0, pendingToday };
  for (const k of rangeKeys(r.startDate, today)) {
    if (!isScheduled(r, k)) continue;
    if (isDone(idx, r.id, k)) {
      cur += 1;
      if (cur > best) best = cur;
    } else if (k === today) {
      pendingToday = true;
    } else {
      cur = 0;
    }
  }
  return { current: cur, best, pendingToday };
}

/** 예정한 루틴을 전부 끝낸 날의 연속. 예정이 하나도 없는 날은 건너뛴다. */
export function perfectStreak(
  routines: Routine[],
  idx: LogIndex,
  today: DayKey,
): { current: number; best: number } {
  if (routines.length === 0) return { current: 0, best: 0 };
  const first = routines.reduce((m, r) => (r.startDate < m ? r.startDate : m), today);
  let cur = 0;
  let best = 0;
  for (const k of rangeKeys(first, today)) {
    const s = dayStat(routines, idx, k, today);
    if (s.scheduled === 0) continue;
    if (s.done === s.scheduled) {
      cur += 1;
      if (cur > best) best = cur;
    } else if (k !== today) {
      cur = 0;
    }
  }
  return { current: cur, best };
}

// ---------------------------------------------------------------------------
// 패턴
// ---------------------------------------------------------------------------

export interface Rate {
  scheduled: number;
  done: number;
  rate: number | null;
}

function rateOf(scheduled: number, done: number): Rate {
  return { scheduled, done, rate: scheduled > 0 ? done / scheduled : null };
}

/** 요일별(0=일…6=토) 달성률 */
export function weekdayRates(routines: Routine[], idx: LogIndex, from: DayKey, to: DayKey): Rate[] {
  const sched = Array<number>(7).fill(0);
  const done = Array<number>(7).fill(0);
  for (const k of rangeKeys(from, to)) {
    const dow = dowOf(k);
    for (const r of routines) {
      if (!isScheduled(r, k)) continue;
      sched[dow] = (sched[dow] ?? 0) + 1;
      if (isDone(idx, r.id, k)) done[dow] = (done[dow] ?? 0) + 1;
    }
  }
  return sched.map((s, i) => rateOf(s, done[i] ?? 0));
}

export function slotRates(
  routines: Routine[],
  idx: LogIndex,
  from: DayKey,
  to: DayKey,
): Record<RoutineSlot, Rate> {
  const acc: Record<RoutineSlot, [number, number]> = {
    morning: [0, 0],
    afternoon: [0, 0],
    evening: [0, 0],
    anytime: [0, 0],
  };
  for (const k of rangeKeys(from, to)) {
    for (const r of routines) {
      if (!isScheduled(r, k)) continue;
      const a = acc[r.slot] ?? acc.anytime;
      a[0] += 1;
      if (isDone(idx, r.id, k)) a[1] += 1;
    }
  }
  return {
    morning: rateOf(...acc.morning),
    afternoon: rateOf(...acc.afternoon),
    evening: rateOf(...acc.evening),
    anytime: rateOf(...acc.anytime),
  };
}

export type CellState = 'done' | 'missed' | 'pending' | 'extra' | 'off';

/** 한 루틴의 하루 상태 */
export function cellState(r: Routine, idx: LogIndex, k: DayKey, today: DayKey): CellState {
  const done = isDone(idx, r.id, k);
  if (!isScheduled(r, k)) return done ? 'extra' : 'off';
  if (done) return 'done';
  return k >= today ? 'pending' : 'missed';
}

// ---------------------------------------------------------------------------
// 루틴별 성과
// ---------------------------------------------------------------------------

export interface RoutineRow {
  routine: Routine;
  streak: StreakInfo;
  rate7: Rate;
  rate30: Rate;
  secs7: number;
  secs30: number;
  /** 최근 14일, 오래된 날부터 */
  recent: Array<{ date: DayKey; state: CellState }>;
}

function routineRate(r: Routine, idx: LogIndex, from: DayKey, to: DayKey): Rate {
  let s = 0;
  let d = 0;
  for (const k of rangeKeys(from, to)) {
    if (!isScheduled(r, k)) continue;
    s += 1;
    if (isDone(idx, r.id, k)) d += 1;
  }
  return rateOf(s, d);
}

function routineSecs(r: Routine, idx: LogIndex, from: DayKey, to: DayKey): number {
  let secs = 0;
  for (const k of rangeKeys(from, to)) secs += logOf(idx, r.id, k)?.secs ?? 0;
  return secs;
}

export function routineRows(routines: Routine[], idx: LogIndex, today: DayKey): RoutineRow[] {
  return routines.map((r) => ({
    routine: r,
    streak: routineStreak(r, idx, today),
    rate7: routineRate(r, idx, addDays(today, -6), today),
    rate30: routineRate(r, idx, addDays(today, -29), today),
    secs7: routineSecs(r, idx, addDays(today, -6), today),
    secs30: routineSecs(r, idx, addDays(today, -29), today),
    recent: rangeKeys(addDays(today, -13), today).map((k) => ({
      date: k,
      state: cellState(r, idx, k, today),
    })),
  }));
}

// ---------------------------------------------------------------------------
// 분석 문장
// ---------------------------------------------------------------------------

export interface RoutineInsight {
  id: string;
  tone: 'good' | 'warn' | 'info';
  text: string;
}

const DOW_LABEL = ['일', '월', '화', '수', '목', '금', '토'];
const SLOT_LABEL: Record<RoutineSlot, string> = {
  morning: '아침',
  afternoon: '오후',
  evening: '저녁',
  anytime: '언제든',
};

export function pct(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return '–';
  return `${Math.round(rate * 100)}%`;
}

export function fmtSecs(secs: number): string {
  if (!Number.isFinite(secs) || secs < 60) return '0분';
  const min = Math.floor(secs / 60);
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

/** 좁은 축 라벨용: 25m · 1h · 1h 20m */
export function fmtSecsCompact(secs: number): string {
  if (!Number.isFinite(secs) || secs < 60) return '0m';
  const min = Math.round(secs / 60);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** 타이머 표시용 mm:ss / h:mm:ss */
export function fmtClock(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
}

export function weekdayLabelOf(dow: number): string {
  return DOW_LABEL[dow] ?? '';
}

/**
 * 기록에서 눈여겨볼 만한 점을 문장으로. 근거가 얇으면(예정일이 적으면) 말하지 않는다.
 * `routines`는 보관하지 않은 루틴만 넘긴다.
 */
export function buildInsights(
  routines: Routine[],
  idx: LogIndex,
  today: DayKey,
  weekStart: WeekStartDay,
): RoutineInsight[] {
  const out: RoutineInsight[] = [];
  if (routines.length === 0) return out;

  // 1) 이번 주 vs 지난주 같은 기간
  const ws = weekStartKey(today, weekStart);
  const elapsed = daysBetween(ws, today);
  const thisWeek = summarize(routines, idx, ws, today, today);
  const lastFrom = addDays(ws, -7);
  const lastWeek = summarize(routines, idx, lastFrom, addDays(lastFrom, elapsed), today);
  if (
    thisWeek.rate !== null &&
    lastWeek.rate !== null &&
    thisWeek.scheduled >= 3 &&
    lastWeek.scheduled >= 3
  ) {
    const delta = Math.round((thisWeek.rate - lastWeek.rate) * 100);
    if (Math.abs(delta) >= 5) {
      out.push({
        id: 'week-delta',
        tone: delta > 0 ? 'good' : 'warn',
        text: `이번 주 달성률 ${pct(thisWeek.rate)} — 지난주 같은 기간보다 ${Math.abs(delta)}%p ${
          delta > 0 ? '높아요' : '낮아요'
        }.`,
      });
    }
  }

  const rows = routineRows(routines, idx, today);

  // 2) 최고 기록을 갱신 중인 스트릭
  const record = rows
    .filter((r) => r.streak.current >= 3 && r.streak.current === r.streak.best)
    .sort((a, b) => b.streak.current - a.streak.current)[0];
  if (record) {
    out.push({
      id: `record-${record.routine.id}`,
      tone: 'good',
      text: `‘${record.routine.title}’ ${record.streak.current}일 연속 — 최고 기록을 갱신하는 중이에요.`,
    });
  }

  // 3) 오늘 하면 이어지는 스트릭
  const atStake = rows
    .filter((r) => r.streak.pendingToday && r.streak.current >= 3 && r !== record)
    .sort((a, b) => b.streak.current - a.streak.current)[0];
  if (atStake) {
    out.push({
      id: `stake-${atStake.routine.id}`,
      tone: 'info',
      text: `‘${atStake.routine.title}’ 오늘도 하면 ${atStake.streak.current + 1}일 연속이에요.`,
    });
  }

  // 4) 요일 패턴 (최근 8주, 어제까지)
  const yesterday = addDays(today, -1);
  const wd = weekdayRates(routines, idx, addDays(today, -56), yesterday);
  const judged = wd
    .map((r, dow) => ({ ...r, dow }))
    .filter((r) => r.rate !== null && r.scheduled >= 4);
  if (judged.length >= 3) {
    const total = judged.reduce((a, r) => a + r.scheduled, 0);
    const avg = judged.reduce((a, r) => a + r.done, 0) / total;
    const worst = [...judged].sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0))[0];
    const best = [...judged].sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0))[0];
    if (worst && best && avg - (worst.rate ?? 0) >= 0.15) {
      out.push({
        id: 'weekday',
        tone: 'warn',
        text: `최근 8주 동안 ${weekdayLabelOf(worst.dow)}요일 달성률이 가장 낮아요 (${pct(worst.rate)}, 평균 ${pct(
          avg,
        )}). 가장 잘 지키는 날은 ${weekdayLabelOf(best.dow)}요일(${pct(best.rate)})이에요.`,
      });
    }
  }

  // 5) 힘들어하는 루틴
  const struggling = rows
    .filter((r) => r.rate30.scheduled >= 8 && (r.rate30.rate ?? 1) < 0.5)
    .sort((a, b) => (a.rate30.rate ?? 0) - (b.rate30.rate ?? 0))[0];
  if (struggling) {
    out.push({
      id: `struggle-${struggling.routine.id}`,
      tone: 'warn',
      text: `‘${struggling.routine.title}’ 최근 30일 달성률 ${pct(
        struggling.rate30.rate,
      )} — 요일을 줄이거나 목표를 낮춰 보는 것도 방법이에요.`,
    });
  }

  // 6) 시간을 가장 많이 쓴 루틴 (이번 주)
  const weekSecs = routines
    .map((r) => ({ r, secs: routineSecs(r, idx, ws, today) }))
    .sort((a, b) => b.secs - a.secs)[0];
  if (weekSecs && weekSecs.secs >= 600) {
    const days = elapsed + 1;
    out.push({
      id: 'time-top',
      tone: 'info',
      text: `이번 주는 ‘${weekSecs.r.title}’에 가장 많은 시간을 썼어요 (${fmtSecs(weekSecs.secs)}, 하루 평균 ${fmtSecs(
        weekSecs.secs / days,
      )}).`,
    });
  }

  // 7) 시간대 비교 (최근 30일)
  const slots = slotRates(routines, idx, addDays(today, -29), yesterday);
  const comparable = (Object.keys(slots) as RoutineSlot[])
    .filter((s) => s !== 'anytime' && slots[s].scheduled >= 10 && slots[s].rate !== null)
    .sort((a, b) => (slots[b].rate ?? 0) - (slots[a].rate ?? 0));
  if (comparable.length >= 2) {
    const hi = comparable[0]!;
    const lo = comparable[comparable.length - 1]!;
    if ((slots[hi].rate ?? 0) - (slots[lo].rate ?? 0) >= 0.15) {
      out.push({
        id: 'slot',
        tone: 'info',
        text: `${SLOT_LABEL[hi]} 루틴(${pct(slots[hi].rate)})이 ${SLOT_LABEL[lo]} 루틴(${pct(
          slots[lo].rate,
        )})보다 잘 지켜지고 있어요.`,
      });
    }
  }

  return out.slice(0, 5);
}

export function slotLabel(slot: RoutineSlot): string {
  return SLOT_LABEL[slot];
}

export function describeSchedule(r: Pick<Routine, 'schedule'>): string {
  if (r.schedule.freq === 'daily') return '매일';
  const days = [...r.schedule.weekdays].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (days.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return '평일';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return '주말';
  return days.map((d) => DOW_LABEL[d]).join('·');
}
