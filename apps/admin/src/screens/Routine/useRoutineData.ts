import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Routine, RoutineLog, RoutineTimer } from '@vallista/content-core';
import {
  getRoutineTimer,
  listRoutineLogs,
  listRoutines,
  ROUTINES_CHANGED_EVENT,
} from '../../lib/tauri';
import { indexLogs, keyOf, type DayKey, type LogIndex } from '../../lib/routineStats';

export interface RoutineData {
  routines: Routine[];
  logs: RoutineLog[];
  idx: LogIndex;
  timer: RoutineTimer | null;
  loaded: boolean;
  error: string | null;
  reload: () => Promise<void>;
  /** 커맨드가 돌려준 기록을 화면 상태에 바로 반영 (빈 기록이면 지운다) */
  mergeLog: (log: RoutineLog) => void;
  setTimer: (t: RoutineTimer | null) => void;
  setRoutines: (rs: Routine[]) => void;
}

function sameKey(a: RoutineLog, b: RoutineLog): boolean {
  return a.routineId === b.routineId && a.date === b.date;
}

function isEmptyLog(l: RoutineLog): boolean {
  return !l.done && !l.secs && !(l.sessions && l.sessions.length > 0);
}

export function useRoutineData(): RoutineData {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [logs, setLogs] = useState<RoutineLog[]>([]);
  const [timer, setTimer] = useState<RoutineTimer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [rs, ls, t] = await Promise.all([
      listRoutines(),
      listRoutineLogs(),
      getRoutineTimer().catch(() => null),
    ]);
    return { rs, ls, t };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchAll()
        .then(({ rs, ls, t }) => {
          if (cancelled) return;
          setRoutines(rs);
          setLogs(ls);
          setTimer(t);
          setError(null);
        })
        .catch((e: unknown) => {
          if (!cancelled) setError(String(e));
        })
        .finally(() => {
          if (!cancelled) setLoaded(true);
        });
    };
    load();
    window.addEventListener(ROUTINES_CHANGED_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(ROUTINES_CHANGED_EVENT, load);
    };
  }, [fetchAll]);

  const reload = useCallback(async () => {
    const { rs, ls, t } = await fetchAll();
    setRoutines(rs);
    setLogs(ls);
    setTimer(t);
  }, [fetchAll]);

  const mergeLog = useCallback((log: RoutineLog) => {
    setLogs((prev) => {
      const rest = prev.filter((l) => !sameKey(l, log));
      return isEmptyLog(log) ? rest : [...rest, log];
    });
  }, []);

  const idx = useMemo(() => indexLogs(logs), [logs]);

  return { routines, logs, idx, timer, loaded, error, reload, mergeLog, setTimer, setRoutines };
}

/** 오늘 날짜 키. 앱을 며칠 켜 둬도 자정이 지나면 바뀐다 */
export function useTodayKey(): DayKey {
  const [today, setToday] = useState<DayKey>(() => keyOf(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => {
      const k = keyOf(new Date());
      setToday((prev) => (prev === k ? prev : k));
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return today;
}

/** 타이머가 돌 때만 1초마다 다시 그린다. 지난 초를 돌려준다 */
export function useTimerElapsed(timer: RoutineTimer | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!timer) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timer]);
  if (!timer) return 0;
  const started = Date.parse(timer.startedAt);
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.floor((now - started) / 1000));
}
