import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Block, Task } from '@vallista/content-core';
import {
  addBlock,
  addTask,
  deleteBlock,
  deleteTask,
  listAllEventSubtaskCounts,
  listBlocksInRange,
  listEventSubtasks,
  listTasks,
  macosCalImport,
  macosCalStatus,
  purgeStaleBlocks,
  syncIcalFeeds,
  toggleEventSubtask,
  updateBlock,
  updateTask,
  upsertEventNote,
  eventNoteKeysFromBlock,
  type EventSubtask,
  type MacosCalStatus,
} from '../../lib/tauri';
import { CalPermissionModal } from './CalPermissionModal';
import { readMacosCalAutoConfig } from '../../lib/icalSync';
import { Button, Eyebrow, IconBtn, Mono } from '../../components/atoms/Atoms';
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  TicketIcon,
} from '../../components/atoms/Icons';
import { WeekCalendar, type CalendarDay } from './WeekCalendar';
import { AddBlockDialog, blockToDraft, type AddBlockDraft } from './AddBlockDialog';
import { MonthGrid } from './MonthGrid';
import { TicketPlannerView } from './TicketPlannerView';
import { TaskEditor } from './TaskEditor';
import { WeekProgress } from './WeekProgress';
import { NextWeekBriefing } from './NextWeekBriefing';
import { resolveLabel } from './labelCatalog';
import { isStatsExcluded, loadStatsExcluded, toggleStatsExcluded, STATS_EXCLUDED_EVENT, syncStatsExcludedFromFile } from './blockMeta';
import { TimeSelect } from '../../components/TimeSelect';
import { QuickEntry } from '../../components/QuickEntry';
import { dispatchToast, dispatchRemoveToast } from '../../components/NotifToast';
import { startOfWeek, useWeekStartDay, weekdayLabel, type WeekStartDay } from '../../lib/weekStart';

type ViewMode = 'day' | 'week' | 'week7' | '2week' | 'month';
type DisplayMode = 'time' | 'ticket';

const VIEW_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: 'day', label: '일' },
  { id: 'week', label: '5일' },
  { id: 'week7', label: '7일' },
  { id: '2week', label: '2주' },
  { id: 'month', label: '월' },
];

const TICKET_RANGE_DAYS = 60;

function estLabel(min?: number): string | null {
  if (!min || min <= 0) return null;
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h}h` : `${h}h${r}m`;
}

export function Plan() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [view, setView] = useState<ViewMode>('week');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('time');
  const [anchor, setAnchor] = useState<Date>(() => new Date());

  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadedRef = useRef<{ tasks: boolean; blocks: boolean }>({ tasks: false, blocks: false });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitial, setDialogInitial] = useState<Partial<AddBlockDraft> | null>(null);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDialogDate, setTaskDialogDate] = useState<string | undefined>(undefined);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [draggingBlock, setDraggingBlock] = useState<Block | null>(null);
  const [inboxDropOver, setInboxDropOver] = useState(false);
  const [activeHours, setActiveHours] = useState<{ start: string; end: string }>(() => ({
    start: typeof window !== 'undefined' ? (window.localStorage.getItem(ACTIVE_START_KEY) ?? '09:00') : '09:00',
    end: typeof window !== 'undefined' ? (window.localStorage.getItem(ACTIVE_END_KEY) ?? '21:00') : '21:00',
  }));
  const inboxRef = useRef<HTMLDivElement>(null);
  const [subtaskCounts, setSubtaskCounts] = useState<Map<string, { total: number; done: number }>>(new Map());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [calPermStatus, setCalPermStatus] = useState<MacosCalStatus | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [excludedCalendars, setExcludedCalendars] = useState<Set<string>>(() => {
    try {
      const stored = window.localStorage.getItem(EXCLUDED_CALS_KEY);
      if (stored) return new Set(JSON.parse(stored) as string[]);
    } catch {}
    return new Set();
  });

  const [statsExcludedVersion, setStatsExcludedVersion] = useState(0);

  const weekStartDay = useWeekStartDay();
  const range = useMemo(
    () => buildRange(view, anchor, now, weekStartDay),
    [view, anchor, now, weekStartDay],
  );
  const days = range.days;
  const ticketRange = useMemo(() => buildTicketRange(anchor), [anchor]);
  const startKey = displayMode === 'ticket' ? ticketRange.startKey : range.startKey;
  const endKey = displayMode === 'ticket' ? ticketRange.endKey : range.endKey;
  const firstDayKey = days[0]?.date ?? range.startKey;

  useEffect(() => {
    const tick = () => setNow(new Date());
    const id = setInterval(tick, 60_000);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', tick);
    };
  }, []);

  const refreshBlocks = useCallback(() => {
    listBlocksInRange(startKey, endKey)
      .then((data) => {
        setBlocks(data);
        loadedRef.current.blocks = true;
        if (loadedRef.current.tasks) setIsLoading(false);
      })
      .catch((e: unknown) => setError(String(e)));
  }, [startKey, endKey]);

  const handleCalRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    dispatchToast({ id: 'cal-refresh', title: '캘린더 동기화 중…', duration: 0 });
    try {
      const macCfg = readMacosCalAutoConfig();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const viewStart = new Date(startKey);
      const viewEnd = new Date(endKey);
      const msPerDay = 86_400_000;
      const daysBack = Math.max(macCfg.daysBack, Math.ceil((today.getTime() - viewStart.getTime()) / msPerDay));
      const daysForward = Math.max(macCfg.daysForward, Math.ceil((viewEnd.getTime() - today.getTime()) / msPerDay));
      const macReport = await macosCalImport({
        calendars: macCfg.calendars,
        daysBack,
        daysForward,
      }).catch(async (e: unknown) => {
        const status = await macosCalStatus().catch(() => null);
        if (status && !status.available) {
          dispatchRemoveToast('cal-refresh');
          setIsRefreshing(false);
          setCalPermStatus(status);
          return null;
        }
        dispatchToast({ title: 'macOS 캘린더 오류', body: String(e), duration: 6000 });
        return null;
      });
      await syncIcalFeeds().catch(() => {});
      const data = await listBlocksInRange(startKey, endKey);
      setBlocks(data);
      dispatchRemoveToast('cal-refresh');
      const summary = macReport
        ? `macOS: ${macReport.total}개 조회 / 추가 ${macReport.added} / 갱신 ${macReport.updated} / 스킵 ${macReport.skipped}`
        : 'macOS: 권한 없음 또는 오류';
      dispatchToast({ title: '캘린더 업데이트됨', body: summary, duration: 6000 });
    } catch (e: unknown) {
      setError(String(e));
      dispatchRemoveToast('cal-refresh');
      dispatchToast({ title: '캘린더 동기화 실패', body: String(e), duration: 5000 });
    } finally {
      setIsRefreshing(false);
    }
  }, [startKey, endKey, isRefreshing]);

  const handlePurge = useCallback(async () => {
    if (isPurging) return;
    setIsPurging(true);
    try {
      const removed = await purgeStaleBlocks();
      if (removed > 0) {
        await refreshBlocks();
        dispatchToast({ title: `오래된 일정 ${removed}건 정리됨`, duration: 4000 });
      } else {
        dispatchToast({ title: '정리할 오래된 일정 없음', duration: 3000 });
      }
    } catch (e: unknown) {
      dispatchToast({ title: '정리 실패', body: String(e), duration: 4000 });
    } finally {
      setIsPurging(false);
    }
  }, [isPurging, refreshBlocks]);

  useEffect(() => {
    refreshBlocks();
  }, [refreshBlocks]);

  useEffect(() => {
    const onSynced = () => refreshBlocks();
    window.addEventListener('bento:ical-synced', onSynced);
    return () => window.removeEventListener('bento:ical-synced', onSynced);
  }, [refreshBlocks]);

  useEffect(() => {
    const onBudget = () => {
      setActiveHours({
        start: window.localStorage.getItem(ACTIVE_START_KEY) ?? '09:00',
        end: window.localStorage.getItem(ACTIVE_END_KEY) ?? '21:00',
      });
    };
    window.addEventListener('bento:budget-changed', onBudget);
    return () => window.removeEventListener('bento:budget-changed', onBudget);
  }, []);

  useEffect(() => {
    listTasks()
      .then((data) => {
        setTasks(data);
        loadedRef.current.tasks = true;
        if (loadedRef.current.blocks) setIsLoading(false);
      })
      .catch((e: unknown) => setError(String(e)));
  }, []);

  useEffect(() => {
    const refresh = () => listTasks().then(setTasks).catch(() => {});
    window.addEventListener('bento:tasks-changed', refresh);
    return () => window.removeEventListener('bento:tasks-changed', refresh);
  }, []);

  const refreshSubtaskCounts = useCallback(() => {
    listAllEventSubtaskCounts()
      .then((counts) =>
        setSubtaskCounts(new Map(counts.map((c) => [c.eventKey, { total: c.total, done: c.done }]))),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshSubtaskCounts();
  }, [refreshSubtaskCounts]);

  useEffect(() => {
    window.addEventListener('bento:subtasks-changed', refreshSubtaskCounts);
    return () => window.removeEventListener('bento:subtasks-changed', refreshSubtaskCounts);
  }, [refreshSubtaskCounts]);

  useEffect(() => {
    const onChanged = () => setStatsExcludedVersion((v) => v + 1);
    window.addEventListener(STATS_EXCLUDED_EVENT, onChanged);
    return () => window.removeEventListener(STATS_EXCLUDED_EVENT, onChanged);
  }, []);

  useEffect(() => {
    syncStatsExcludedFromFile();
  }, []);

  const upsertBlock = useCallback((b: Block) => {
    setBlocks((prev) => {
      if (!prev) return [b];
      const idx = prev.findIndex((x) => x.id === b.id);
      if (idx === -1) return [...prev, b];
      const next = prev.slice();
      next[idx] = b;
      return next;
    });
    window.dispatchEvent(new CustomEvent('bento:blocks-changed'));
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => (prev ? prev.filter((b) => b.id !== id) : prev));
    window.dispatchEvent(new CustomEvent('bento:blocks-changed'));
  }, []);

  const openAddAt = useCallback((date: string, hour: number) => {
    setEditingBlock(null);
    setDialogInitial({
      date,
      start: `${pad(hour)}:00`,
      end: `${pad(hour + 1)}:00`,
    });
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback(
    (b: Block) => {
      if (b.id.startsWith('task:')) {
        const taskId = b.id.slice(5);
        const t = tasks?.find((x) => x.id === taskId);
        if (t) setEditingTask(t);
        return;
      }
      setEditingBlock(b);
      setDialogInitial(blockToDraft(b));
      setDialogOpen(true);
    },
    [tasks],
  );

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setEditingBlock(null);
    setDialogInitial(null);
  }, []);

  const handleSubmit = useCallback(
    async (draft: AddBlockDraft) => {
      if (editingBlock) {
        const updated = await updateBlock(editingBlock.id, {
          date: draft.date,
          start: draft.start,
          end: draft.end,
          endDate: draft.endDate ?? null,
          title: draft.title,
          kind: draft.kind,
          customLabel: draft.customLabel ?? null,
          attendees: draft.attendees,
          actualStart: draft.actualStart ?? null,
          actualEnd: draft.actualEnd ?? null,
          done: draft.done,
          notes: draft.notes ?? null,
          color: draft.color ?? null,
          tags: draft.tags ?? [],
        });
        upsertBlock(updated);
      } else {
        const created = await addBlock({
          id: newId(),
          date: draft.date,
          start: draft.start,
          end: draft.end,
          endDate: draft.endDate,
          title: draft.title,
          kind: draft.kind,
          customLabel: draft.customLabel,
          attendees: draft.attendees,
          notes: draft.notes,
          color: draft.color,
          tags: draft.tags,
        });
        let final = created;
        if (draft.actualStart || draft.actualEnd || draft.done) {
          final = await updateBlock(created.id, {
            actualStart: draft.actualStart ?? null,
            actualEnd: draft.actualEnd ?? null,
            done: draft.done,
          });
        }
        upsertBlock(final);
        if (draft.notes?.trim()) {
          const { eventKey, seriesKey } = eventNoteKeysFromBlock(final);
          await upsertEventNote({
            eventKey,
            seriesKey,
            eventTitleSnapshot: final.title,
            eventDateSnapshot: final.date,
            body: draft.notes.trim(),
          }).catch(() => {});
        }
      }
    },
    [editingBlock, upsertBlock],
  );

  const upsertTaskInState = useCallback((updated: Task) => {
    setTasks((prev) => {
      if (!prev) return [updated];
      const idx = prev.findIndex((t) => t.id === updated.id);
      if (idx === -1) return [...prev, updated];
      const next = prev.slice();
      next[idx] = updated;
      return next;
    });
  }, []);

  const handleBlockDone = useCallback(
    async (id: string, done: boolean) => {
      if (id.startsWith('task:')) {
        const taskId = id.slice(5);
        try {
          const updated = await updateTask(taskId, { done });
          upsertTaskInState(updated);
          window.dispatchEvent(new CustomEvent('bento:tasks-changed'));
        } catch (e) {
          setError(String(e));
        }
        return;
      }
      const target = blocks?.find((x) => x.id === id);
      try {
        const patch: Parameters<typeof updateBlock>[1] = { done };
        if (done && target && !target.actualEnd) {
          const isMultiDay = !!(target.endDate && target.endDate !== target.date);
          const isAllDay =
            target.start === '00:00' &&
            (target.end === '00:00' || target.end === '23:59');
          if (!isMultiDay && !isAllDay) {
            const now = currentHHMM();
            // planned end가 이미 지났으면 현재시각 대신 planned end로 cap
            patch.actualEnd = now > target.end ? target.end : now;
            if (!target.actualStart) patch.actualStart = target.start;
          }
        }
        const updated = await updateBlock(id, patch);
        upsertBlock(updated);
      } catch (e) {
        setError(String(e));
      }
    },
    [blocks, upsertBlock, upsertTaskInState],
  );

  const handleDelete = useCallback(async () => {
    if (!editingBlock) return;
    await deleteBlock(editingBlock.id);
    removeBlock(editingBlock.id);
  }, [editingBlock, removeBlock]);

  const taskInbox = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .filter((t) => !t.done && !dateOf(t.startAt))
      .sort((a, b) => {
        const ad = a.due ?? '';
        const bd = b.due ?? '';
        if (ad && bd) return ad < bd ? -1 : ad > bd ? 1 : 0;
        if (ad) return -1;
        if (bd) return 1;
        return a.createdAt < b.createdAt ? 1 : -1;
      })
      .slice(0, 8);
  }, [tasks]);

  const calendarNames = useMemo<string[]>(() => {
    if (!blocks) return [];
    const names = new Set<string>();
    for (const b of blocks) {
      if (b.calendarName) names.add(b.calendarName);
    }
    return [...names].sort();
  }, [blocks]);

  const toggleCalendar = useCallback((name: string) => {
    setExcludedCalendars((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      window.localStorage.setItem(EXCLUDED_CALS_KEY, JSON.stringify([...next]));
      window.dispatchEvent(new CustomEvent('bento:calendar-filter-changed'));
      return next;
    });
  }, []);

  const displayBlocks = useMemo<Block[]>(() => {
    const real = (blocks ?? []).filter(
      (b) => !b.calendarName || !excludedCalendars.has(b.calendarName),
    );
    if (!tasks) return real;
    const linkedTaskIds = new Set<string>();
    for (const b of real) {
      if (b.taskId) linkedTaskIds.add(b.taskId);
    }
    const virtual: Block[] = [];
    for (const t of tasks) {
      if (linkedTaskIds.has(t.id)) continue;
      const date = dateOf(t.startAt);
      if (!date) continue;
      const explicitTime = timeOf(t.startAt);
      const start = explicitTime ?? '';
      const dur = t.estMin && t.estMin > 0 ? t.estMin : 60;
      const end = explicitTime ? addMinutesHHMM(explicitTime, dur) : '';
      virtual.push({
        id: `task:${t.id}`,
        date,
        start,
        end,
        title: t.title,
        kind: 'write',
        attendees: [],
        done: t.done,
        source: 'local',
        taskId: t.id,
        createdAt: t.createdAt,
      });
    }
    return virtual.length === 0 ? real : [...real, ...virtual];
  }, [blocks, tasks, excludedCalendars]);

  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(() => new Set());
  const taskTree = useMemo(() => buildTaskTree(taskInbox), [taskInbox]);
  const toggleFolder = useCallback((path: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const rangeLabel = useMemo(() => formatRangeLabel(range), [range]);
  const weekNumber = useMemo(
    () =>
      displayMode === 'ticket' || view === 'day'
        ? isoWeekNumber(anchor)
        : isoWeekNumber(addDays(range.start, 3)),
    [displayMode, view, anchor, range.start],
  );

  const dialogExcludedFromStats = useMemo(
    () => (editingBlock ? isStatsExcluded(editingBlock) : false),
    // statsExcludedVersion triggers recompute when exclusion list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingBlock, statsExcludedVersion],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const excludedBlockKeys = useMemo(() => loadStatsExcluded(), [statsExcludedVersion]);

  const upsertTaskDone = useCallback(
    async (id: string, done: boolean) => {
      const updated = await updateTask(id, { done });
      upsertTaskInState(updated);
      window.dispatchEvent(new CustomEvent('bento:tasks-changed'));
    },
    [upsertTaskInState],
  );

  const saveEditingTask = useCallback(
    async (patch: { title: string; done?: boolean; color?: string | null; kind?: string | null }) => {
      if (!editingTask) return;
      const updated = await updateTask(editingTask.id, {
        title: patch.title,
        color: patch.color,
        kind: patch.kind,
      });
      upsertTaskInState(updated);
      window.dispatchEvent(new CustomEvent('bento:tasks-changed'));
    },
    [editingTask, upsertTaskInState],
  );

  const removeEditingTask = useCallback(async () => {
    if (!editingTask) return;
    const id = editingTask.id;
    await deleteTask(id);
    setTasks((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
  }, [editingTask]);

  const handleTaskDrop = useCallback(
    async (taskId: string, date: string, start: string, end: string) => {
      const t = tasks?.find((x) => x.id === taskId);
      if (!t) return;
      try {
        const created = await addBlock({
          id: newId(),
          date,
          start,
          end,
          title: t.title,
          kind: 'write',
          taskId,
        });
        upsertBlock(created);
        const updated = await updateTask(taskId, {
          startAt: makeIso(date, start) || null,
        });
        upsertTaskInState(updated);
      } catch (e) {
        setError(String(e));
      }
    },
    [tasks, upsertBlock, upsertTaskInState],
  );

  const handleBlockMove = useCallback(
    async (id: string, date: string, start: string, end: string) => {
      if (id.startsWith('task:')) {
        const taskId = id.slice(5);
        try {
          const updated = await updateTask(taskId, {
            startAt: makeIso(date, start) || null,
          });
          upsertTaskInState(updated);
        } catch (e) {
          setError(String(e));
        }
        return;
      }
      try {
        const updated = await updateBlock(id, { date, start, end });
        upsertBlock(updated);
      } catch (e) {
        setError(String(e));
      }
    },
    [upsertBlock, upsertTaskInState],
  );

  const handleBlockToInbox = useCallback(
    async (blockId: string) => {
      if (blockId.startsWith('task:')) {
        const taskId = blockId.slice(5);
        try {
          const updated = await updateTask(taskId, { startAt: '' });
          upsertTaskInState(updated);
        } catch (e) {
          setError(String(e));
        }
        return;
      }
      const b = blocks?.find((x) => x.id === blockId);
      if (!b) return;
      if (b.source && b.source !== 'local') return;
      try {
        if (b.taskId) {
          const updated = await updateTask(b.taskId, { startAt: '' });
          upsertTaskInState(updated);
        } else {
          const startM = hhmmToMin(b.start);
          const endM = hhmmToMin(b.end);
          const estMin =
            startM != null && endM != null && endM > startM
              ? Math.max(15, endM - startM)
              : 60;
          const created = await addTask({
            id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            title: b.title,
            estMin,
          });
          setTasks((prev) => (prev ? [...prev, created] : [created]));
        }
        await deleteBlock(blockId);
        removeBlock(blockId);
      } catch (e) {
        setError(String(e));
      }
    },
    [blocks, upsertTaskInState, removeBlock],
  );

  if (error && !blocks) {
    return (
      <div style={{ padding: 32 }}>
        <div
          style={{
            padding: 16,
            border: '1px solid var(--err-soft)',
            background: 'var(--err-soft)',
            color: 'var(--err)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <PlanSkeleton />;
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {calPermStatus && (
        <CalPermissionModal
          status={calPermStatus}
          onClose={() => setCalPermStatus(null)}
          onGranted={() => {
            setCalPermStatus(null);
            void handleCalRefresh();
          }}
        />
      )}
      <aside
        style={{
          flex: '0 0 280px',
          borderRight: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: 'var(--card-pad) var(--card-pad) calc(var(--card-pad) - 4px)', borderBottom: '1px solid var(--line)' }}>
          <Eyebrow>{view === 'day' ? '오늘' : view === 'month' ? '이번 달' : '이번 주'}</Eyebrow>
          <div
            style={{
              marginTop: 6,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.3px',
            }}
          >
            {view === 'month'
              ? `${anchor.getFullYear()}.${pad(anchor.getMonth() + 1)}`
              : `${anchor.getFullYear()}-W${pad(weekNumber)}`}
          </div>
          <div
            style={{
              marginTop: 6,
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              fontSize: 11,
              color: 'var(--ink-mute)',
            }}
          >
            <Mono>{rangeLabel}</Mono>
          </div>
        </div>

        <WeekProgress now={now} />

        <DayBudget />

        <CalendarFilter
          calendarNames={calendarNames}
          excluded={excludedCalendars}
          onToggle={toggleCalendar}
        />

        <div
          ref={inboxRef}
          onDragOver={(e) => {
            const types = Array.from(e.dataTransfer.types);
            if (!types.includes('application/x-bento-block')) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (!inboxDropOver) setInboxDropOver(true);
          }}
          onDragLeave={(e) => {
            const next = e.relatedTarget as Node | null;
            if (next && e.currentTarget.contains(next)) return;
            setInboxDropOver(false);
          }}
          onDrop={(e) => {
            const blockId = e.dataTransfer.getData('application/x-bento-block');
            setInboxDropOver(false);
            if (!blockId) return;
            e.preventDefault();
            void handleBlockToInbox(blockId);
          }}
          style={{
            flex: '1 1 0',
            minHeight: 0,
            overflowY: 'auto',
            padding: '16px 18px 8px',
            background: inboxDropOver
              ? 'repeating-linear-gradient(45deg, transparent 0 8px, rgba(96,165,250,0.18) 8px 14px)'
              : draggingBlock
                ? 'repeating-linear-gradient(45deg, transparent 0 8px, rgba(96,165,250,0.06) 8px 14px)'
                : undefined,
            outline: inboxDropOver
              ? '1.5px dashed var(--blue)'
              : draggingBlock
                ? '1px dashed var(--blue)'
                : undefined,
            outlineOffset: -4,
            borderRadius: inboxDropOver || draggingBlock ? 6 : 0,
            transition: 'background 120ms, outline 120ms',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Eyebrow>TODO 인박스</Eyebrow>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              {taskInbox.length}
            </Mono>
          </div>
          <button
            onClick={() => {
              setTaskDialogDate(undefined);
              setTaskDialogOpen(true);
            }}
            style={{
              marginBottom: 8,
              padding: '7px 10px',
              fontSize: 12.5,
              border: '1px dashed var(--line)',
              background: 'transparent',
              color: 'var(--ink-mute)',
              borderRadius: 6,
              fontFamily: 'inherit',
              textAlign: 'left',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            + 할 일 추가
          </button>
          {taskInbox.length === 0 ? (
            <SidebarEmpty
              text={
                inboxDropOver
                  ? '여기에 놓아 TODO로'
                  : draggingBlock
                    ? '여기로 끌면 TODO로'
                    : '비어 있음'
              }
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {taskTree.tasks.map((t) => (
                <TaskInboxRow
                  key={t.id}
                  task={t}
                  displayTitle={t.leafTitle}
                  onDone={(done) => upsertTaskDone(t.id, done)}
                  onEdit={() => setEditingTask(t)}
                  onDragStartTask={(task) => setDraggingTask(task)}
                  onDragEndTask={() => setDraggingTask(null)}
                  onSchedule={() => {
                    setEditingBlock(null);
                    const startStr = timeOf(t.startAt) ?? timeOf(t.due) ?? '09:00';
                    const dur = t.estMin && t.estMin > 0 ? t.estMin : 60;
                    const dateStr =
                      dateOf(t.startAt) ?? dateOf(t.due) ?? firstDayKey;
                    setDialogInitial({
                      date: dateStr,
                      start: startStr,
                      end: addMinutesHHMM(startStr, dur),
                      title: t.title,
                      kind: 'write',
                    });
                    setDialogOpen(true);
                  }}
                />
              ))}
              {taskTree.children.map((node) => (
                <TaskInboxFolder
                  key={node.path}
                  node={node}
                  collapsed={collapsedFolders}
                  onToggle={toggleFolder}
                  depth={0}
                  rowProps={{
                    onDone: (id, done) => upsertTaskDone(id, done),
                    onEdit: (t) => setEditingTask(t),
                    onSchedule: (t) => {
                      setEditingBlock(null);
                      const startStr = timeOf(t.startAt) ?? timeOf(t.due) ?? '09:00';
                      const dur = t.estMin && t.estMin > 0 ? t.estMin : 60;
                      const dateStr =
                        dateOf(t.startAt) ?? dateOf(t.due) ?? firstDayKey;
                      setDialogInitial({
                        date: dateStr,
                        start: startStr,
                        end: addMinutesHHMM(startStr, dur),
                        title: t.title,
                        kind: 'write',
                      });
                      setDialogOpen(true);
                    },
                    onDragStartTask: (task) => setDraggingTask(task),
                    onDragEndTask: () => setDraggingTask(null),
                  }}
                />
              ))}
            </div>
          )}
        </div>

      </aside>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <div
          style={{
            height: 'calc(var(--row-h) + 16px)',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--card-pad)',
            gap: 'var(--gap-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Button
              sm
              ghost
              onClick={() =>
                setAnchor(
                  displayMode === 'ticket'
                    ? stripTime(new Date())
                    : anchorForToday(view, new Date(), weekStartDay),
                )
              }
            >
              오늘
            </Button>
            <IconBtn
              title="이전"
              onClick={() =>
                setAnchor(
                  displayMode === 'ticket'
                    ? addDays(anchor, -7)
                    : shiftAnchor(view, anchor, -1),
                )
              }
            >
              <ChevronLeftIcon size={14} />
            </IconBtn>
            <IconBtn
              title="다음"
              onClick={() =>
                setAnchor(
                  displayMode === 'ticket'
                    ? addDays(anchor, 7)
                    : shiftAnchor(view, anchor, 1),
                )
              }
            >
              <ChevronRightIcon size={14} />
            </IconBtn>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
            {displayMode === 'ticket' ? formatTicketLabel(anchor) : rangeLabel}
          </span>
          <DisplayModeToggle value={displayMode} onChange={setDisplayMode} />
          {displayMode === 'time' && (
            <ViewToggle
              value={view}
              onChange={(next) => {
                setView(next);
                setAnchor(anchorForToday(next, anchor, weekStartDay));
              }}
            />
          )}
          <span style={{ flex: 1 }} />
          <button
            onClick={() => setShowBriefing((v) => !v)}
            style={{
              padding: '4px 10px',
              border: `1px solid ${showBriefing ? 'var(--ink-mute)' : 'var(--line)'}`,
              borderRadius: 5,
              background: showBriefing ? 'var(--bg-shade)' : 'transparent',
              color: showBriefing ? 'var(--ink)' : 'var(--ink-mute)',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            차주 브리핑
          </button>
          {isRefreshing && (
            <style>{`@keyframes plan-cal-spin { to { transform: rotate(360deg); } }`}</style>
          )}
          <button
            onClick={handleCalRefresh}
            disabled={isRefreshing}
            title="캘린더 새로 가져오기"
            style={{
              padding: '4px 6px',
              border: 'none',
              borderRadius: 4,
              background: 'transparent',
              color: 'var(--ink-mute)',
              fontSize: 14,
              lineHeight: 1,
              cursor: isRefreshing ? 'default' : 'pointer',
              opacity: isRefreshing ? 0.45 : 1,
              display: 'flex',
              alignItems: 'center',
              animation: isRefreshing ? 'plan-cal-spin 0.7s linear infinite' : 'none',
            }}
          >
            ↻
          </button>
          <button
            onClick={handlePurge}
            disabled={isPurging}
            title="60일 이상 지난 외부 캘린더 일정 정리 (메모 없는 항목만)"
            style={{
              padding: '4px 6px',
              border: 'none',
              borderRadius: 4,
              background: 'transparent',
              color: 'var(--ink-mute)',
              fontSize: 11,
              lineHeight: 1,
              cursor: isPurging ? 'default' : 'pointer',
              opacity: isPurging ? 0.45 : 1,
              fontFamily: 'var(--font-mono)',
            }}
          >
            정리
          </button>
          <Button
            sm
            onClick={() => {
              setEditingBlock(null);
              setDialogInitial({
                date: displayMode === 'ticket' ? isoKey(stripTime(now)) : firstDayKey,
                start: '09:00',
                end: '10:00',
              });
              setDialogOpen(true);
            }}
          >
            + 블록
          </Button>
        </div>

        {showBriefing ? (
          <NextWeekBriefing blocks={blocks ?? []} now={now} />
        ) : displayMode === 'ticket' ? (
          <TicketPlannerView
            anchor={anchor}
            now={now}
            weekStartDay={weekStartDay}
            blocks={displayBlocks}
            tasks={tasks ?? []}
            draggingTask={draggingTask}
            inboxRef={inboxRef}
            onSlotClick={openAddAt}
            onBlockClick={openEdit}
            onRangeSelect={(date, start, end) => {
              setEditingBlock(null);
              setDialogInitial({ date, start, end });
              setDialogOpen(true);
            }}
            onBlockMove={handleBlockMove}
            onTaskDrop={handleTaskDrop}
            onBlockMoveToInbox={handleBlockToInbox}
            onInboxHoverChange={setInboxDropOver}
            onBlockDragChange={setDraggingBlock}
            onCreateForDay={(date) => {
              setTaskDialogDate(date);
              setTaskDialogOpen(true);
            }}
            onTaskClick={(t) => setEditingTask(t)}
            onTaskDone={(id, done) => upsertTaskDone(id, done)}
            onBlockDone={handleBlockDone}
            onJumpToDate={(date) => setAnchor(parseKey(date) ?? anchor)}
          />
        ) : view === 'month' ? (
          <MonthGrid
            anchor={anchor}
            now={now}
            weekStartDay={weekStartDay}
            blocks={displayBlocks}
            onDayClick={(date) => {
              setView('day');
              setAnchor(parseKey(date) ?? anchor);
            }}
          />
        ) : (
          <WeekCalendar
            days={days}
            blocks={displayBlocks}
            tasks={tasks ?? []}
            now={now}
            draggingTask={draggingTask}
            inboxRef={inboxRef}
            activeStart={activeHours.start}
            activeEnd={activeHours.end}
            subtaskCounts={subtaskCounts}
            onSlotClick={openAddAt}
            onBlockClick={openEdit}
            onRangeSelect={(date, start, end) => {
              setEditingBlock(null);
              setDialogInitial({ date, start, end });
              setDialogOpen(true);
            }}
            onAllDayCreate={(date, endDate) => {
              setEditingBlock(null);
              setDialogInitial({
                date,
                start: '00:00',
                end: '00:00',
                endDate,
              });
              setDialogOpen(true);
            }}
            onBlockMove={handleBlockMove}
            onTaskDrop={handleTaskDrop}
            onBlockMoveToInbox={handleBlockToInbox}
            onInboxHoverChange={setInboxDropOver}
            onBlockDragChange={setDraggingBlock}
            onBlockDone={handleBlockDone}
            excludedBlockKeys={excludedBlockKeys}
          />
        )}
      </div>

      <AddBlockDialog
        open={dialogOpen}
        initial={dialogInitial}
        editingId={editingBlock?.id}
        source={editingBlock?.source}
        block={editingBlock ?? undefined}
        onSubmit={handleSubmit}
        onClose={closeDialog}
        onDelete={editingBlock ? handleDelete : undefined}
        excludedFromStats={dialogExcludedFromStats}
        onToggleExcludeFromStats={
          editingBlock
            ? () => { toggleStatsExcluded(editingBlock); }
            : undefined
        }
      />

      <TaskEditor
        open={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={saveEditingTask}
        onDelete={removeEditingTask}
      />

      <QuickEntry
        open={taskDialogOpen}
        initialKind="task"
        initialStartDate={taskDialogDate}
        onClose={() => setTaskDialogOpen(false)}
      />
    </div>
  );
}

const SLEEP_START_KEY = 'bento.plan.sleepStart';
const SLEEP_END_KEY = 'bento.plan.sleepEnd';
const ACTIVE_START_KEY = 'bento.plan.activeStart';
const ACTIVE_END_KEY = 'bento.plan.activeEnd';
const EXCLUDED_CALS_KEY = 'bento.plan.excludedCalendars';

function readSleepTime(): { start: string; end: string } {
  if (typeof window === 'undefined') return { start: '23:00', end: '07:00' };
  return {
    start: window.localStorage.getItem(SLEEP_START_KEY) ?? '23:00',
    end: window.localStorage.getItem(SLEEP_END_KEY) ?? '07:00',
  };
}

function sleepMinutes(start: string, end: string): number {
  const toMin = (hhmm: string) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
    if (!m || !m[1] || !m[2]) return 0;
    return Number(m[1]) * 60 + Number(m[2]);
  };
  const s = toMin(start);
  const e = toMin(end);
  return e > s ? e - s : 24 * 60 - s + e;
}

function readActiveTime(): { start: string; end: string } {
  if (typeof window === 'undefined') return { start: '09:00', end: '21:00' };
  return {
    start: window.localStorage.getItem(ACTIVE_START_KEY) ?? '09:00',
    end: window.localStorage.getItem(ACTIVE_END_KEY) ?? '21:00',
  };
}

function activeMinutes(start: string, end: string): number {
  const toMin = (hhmm: string) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
    if (!m || !m[1] || !m[2]) return 0;
    return Number(m[1]) * 60 + Number(m[2]);
  };
  const s = toMin(start);
  const e = toMin(end);
  return e > s ? e - s : 0;
}

function DayBudget() {
  const [sleep, setSleep] = useState(readSleepTime);
  const [active, setActive] = useState(readActiveTime);
  const [editing, setEditing] = useState(false);

  const sleepMin = sleepMinutes(sleep.start, sleep.end);
  const availMin = 24 * 60 - sleepMin;
  const activeMin = activeMinutes(active.start, active.end);

  const saveSleep = (next: { start: string; end: string }) => {
    window.localStorage.setItem(SLEEP_START_KEY, next.start);
    window.localStorage.setItem(SLEEP_END_KEY, next.end);
    setSleep(next);
  };

  const saveActive = (next: { start: string; end: string }) => {
    window.localStorage.setItem(ACTIVE_START_KEY, next.start);
    window.localStorage.setItem(ACTIVE_END_KEY, next.end);
    setActive(next);
    window.dispatchEvent(new CustomEvent('bento:budget-changed'));
  };

  return (
    <div
      style={{
        padding: '10px 18px 12px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg-soft)',
      }}
    >
      <button
        onClick={() => setEditing((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <Eyebrow>하루 예산</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.2px' }}>
            {fmtBudget(availMin)}
          </span>
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
            활동 {fmtBudget(activeMin)}
          </Mono>
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
            수면 {fmtBudget(sleepMin)}
          </Mono>
          <Mono style={{ fontSize: 10, color: editing ? 'var(--ink)' : 'var(--ink-mute)' }}>
            {editing ? '▲' : '▼'}
          </Mono>
        </div>
      </button>

      {editing && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', width: 36, flexShrink: 0 }}>
              취침
            </Mono>
            <div style={{ width: 100 }}>
              <TimeSelect
                value={sleep.start}
                onChange={(v) => saveSleep({ ...sleep, start: v })}
                title="취침 시각"
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', width: 36, flexShrink: 0 }}>
              기상
            </Mono>
            <div style={{ width: 100 }}>
              <TimeSelect
                value={sleep.end}
                onChange={(v) => saveSleep({ ...sleep, end: v })}
                title="기상 시각"
              />
            </div>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              → 가용 {fmtBudget(availMin)}
            </Mono>
          </div>
          <div style={{ height: 1, background: 'var(--line)', margin: '2px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', width: 36, flexShrink: 0 }}>
              활동↑
            </Mono>
            <div style={{ width: 100 }}>
              <TimeSelect
                value={active.start}
                onChange={(v) => saveActive({ ...active, start: v })}
                title="활동 시작"
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', width: 36, flexShrink: 0 }}>
              활동↓
            </Mono>
            <div style={{ width: 100 }}>
              <TimeSelect
                value={active.end}
                onChange={(v) => saveActive({ ...active, end: v })}
                title="활동 종료"
              />
            </div>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              → 활동 {fmtBudget(activeMin)}
            </Mono>
          </div>
        </div>
      )}
    </div>
  );
}

function fmtBudget(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h${m}m`;
}

function CalendarFilter({
  calendarNames,
  excluded,
  onToggle,
}: {
  calendarNames: string[];
  excluded: Set<string>;
  onToggle: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  if (calendarNames.length === 0) return null;
  const hiddenCount = calendarNames.filter((n) => excluded.has(n)).length;
  return (
    <div
      style={{
        padding: '10px 18px 12px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg-soft)',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          border: 'none',
          background: 'transparent',
          padding: 0,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <Eyebrow>캘린더 필터</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {hiddenCount > 0 && (
            <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>
              {hiddenCount}개 숨김
            </Mono>
          )}
          <Mono style={{ fontSize: 10, color: open ? 'var(--ink)' : 'var(--ink-mute)' }}>
            {open ? '▲' : '▼'}
          </Mono>
        </div>
      </button>
      {open && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {calendarNames.map((name) => {
            const visible = !excluded.has(name);
            return (
              <button
                key={name}
                onClick={() => onToggle(name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  background: 'transparent',
                  border: 'none',
                  padding: '3px 0',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 13,
                    height: 13,
                    border: `1.5px solid ${visible ? 'var(--blue)' : 'var(--line)'}`,
                    borderRadius: 3,
                    background: visible ? 'var(--blue)' : 'transparent',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {visible && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.2 5.8L6.5 2.2" stroke="var(--bg)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: 11.5,
                    color: visible ? 'var(--ink)' : 'var(--ink-mute)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textDecoration: visible ? 'none' : 'line-through',
                  }}
                >
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TaskInboxRow({
  task,
  displayTitle,
  onDone,
  onSchedule,
  onEdit,
  onDragStartTask,
  onDragEndTask,
}: {
  task: Task;
  displayTitle?: string;
  onDone: (done: boolean) => void;
  onSchedule: () => void;
  onEdit: () => void;
  onDragStartTask?: (task: Task) => void;
  onDragEndTask?: () => void;
}) {
  const [eventSubtasks, setEventSubtasks] = useState<EventSubtask[]>([]);
  const eventKey = `task:${task.id}`;

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      listEventSubtasks(eventKey).then((items) => {
        if (!cancelled) setEventSubtasks(items);
      });
    };
    load();
    window.addEventListener('bento:subtasks-changed', load);
    return () => {
      cancelled = true;
      window.removeEventListener('bento:subtasks-changed', load);
    };
  }, [eventKey]);

  const handleSubtaskToggle = async (id: string, done: boolean) => {
    const updated = await toggleEventSubtask(eventKey, id, done);
    setEventSubtasks((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  };

  const subDone = eventSubtasks.filter((s) => s.done).length;
  const subTotal = eventSubtasks.length;
  const hasNotes = !!(task.notes && task.notes.trim().length > 0);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-bento-task', task.id);
        e.dataTransfer.setData('text/plain', task.title);
        e.dataTransfer.effectAllowed = 'copy';
        onDragStartTask?.(task);
      }}
      onDragEnd={() => onDragEndTask?.()}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onEdit();
      }}
      title="클릭해서 편집 · 드래그해서 캘린더에 꽂기"
      style={{
        padding: '10px 12px',
        border: '1px solid var(--line)',
        borderLeft: `3px solid ${resolveLabel(task.kind, task.color).color}`,
        background: 'var(--bg)',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        cursor: 'grab',
      }}
    >
      <div
        style={{
          fontSize: 12.5,
          color: 'var(--ink)',
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {displayTitle ?? task.title}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        {timeOf(task.startAt) && (
          <Mono style={{ fontSize: 10, color: 'var(--blue)' }}>
            {timeOf(task.startAt)}
          </Mono>
        )}
        {task.due && (
          <Mono style={{ fontSize: 10, color: 'var(--blue)' }}>
            {(() => {
              const d = toDateKey(task.due) ?? '날짜';
              const t = timeOf(task.due);
              return t ? `${d} ${t}` : d;
            })()}
          </Mono>
        )}
        {estLabel(task.estMin) && (
          <Mono
            style={{
              fontSize: 10,
              color: 'var(--ink-mute)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <ClockIcon size={10} /> {estLabel(task.estMin)}
          </Mono>
        )}
        {(task.tags ?? []).slice(0, 3).map((t) => (
          <Mono
            key={t}
            style={{
              fontSize: 10,
              color: 'var(--ink-mute)',
              background: 'var(--bg-shade)',
              padding: '1px 6px',
              borderRadius: 3,
            }}
          >
            #{t}
          </Mono>
        ))}
        {subTotal > 0 && (
          <Mono
            style={{
              fontSize: 10,
              color: subDone === subTotal ? 'var(--ok)' : 'var(--ink-mute)',
            }}
            title="세부 작업"
          >
            ☐ {subDone}/{subTotal}
          </Mono>
        )}
        {hasNotes && (
          <Mono
            style={{
              fontSize: 10,
              color: 'var(--ink-soft)',
              background: 'var(--bg-shade)',
              border: '1px solid var(--line)',
              padding: '1px 5px',
              borderRadius: 3,
            }}
            title="메모 있음"
          >
            ✎ 메모
          </Mono>
        )}
        <span style={{ flex: 1 }} />
        <button
          onClick={() => onDone(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--ok)',
            cursor: 'pointer',
            fontSize: 10.5,
            padding: 0,
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
          }}
          title="완료"
        >
          <CheckIcon size={12} />
        </button>
        <button
          onClick={onSchedule}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--blue)',
            cursor: 'pointer',
            fontSize: 10.5,
            padding: 0,
            fontFamily: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
          title="시간에 꽂기"
        >
          <ArrowRightIcon size={11} /> 시간
        </button>
      </div>
      {subTotal > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {eventSubtasks.slice(0, 5).map((s) => (
            <button
              key={s.id}
              onClick={(e) => {
                e.stopPropagation();
                void handleSubtaskToggle(s.id, !s.done);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12,
                color: s.done ? 'var(--ink-mute)' : 'var(--ink)',
                textDecoration: s.done ? 'line-through' : 'none',
                background: 'transparent',
                border: 'none',
                padding: '2px 0',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{
                flexShrink: 0,
                width: 14,
                height: 14,
                border: `1.5px solid ${s.done ? 'var(--ok)' : 'var(--line-strong, var(--line))'}`,
                borderRadius: 3,
                background: s.done ? 'var(--ok)' : 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {s.done && <CheckIcon size={9} style={{ color: 'var(--bg)' }} />}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.title}
              </span>
            </button>
          ))}
          {subTotal > 5 && (
            <div style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              +{subTotal - 5}개 더
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TaskTreeNode {
  name: string;
  path: string;
  isSystem: boolean; // [Bracket] 으로 시작하는 시스템 그룹
  children: TaskTreeNode[];
  tasks: Array<Task & { leafTitle: string }>;
}

function isSystemSegment(seg: string): boolean {
  return /^\[.+\]$/.test(seg.trim());
}

function buildTaskTree(tasks: Task[]): TaskTreeNode {
  const root: TaskTreeNode = { name: '', path: '', isSystem: false, children: [], tasks: [] };
  for (const task of tasks) {
    const segments = task.title.split('/').map((s) => s.trim()).filter(Boolean);
    if (segments.length <= 1) {
      root.tasks.push({ ...task, leafTitle: task.title });
      continue;
    }
    let node = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i]!;
      const nodePath = segments.slice(0, i + 1).join('/');
      let child = node.children.find((c) => c.name === seg);
      if (!child) {
        child = {
          name: seg,
          path: nodePath,
          isSystem: i === 0 && isSystemSegment(seg),
          children: [],
          tasks: [],
        };
        node.children.push(child);
      }
      node = child;
    }
    node.tasks.push({ ...task, leafTitle: segments[segments.length - 1]! });
  }
  return root;
}

function countTreeTasks(node: TaskTreeNode): number {
  let n = node.tasks.length;
  for (const child of node.children) n += countTreeTasks(child);
  return n;
}

interface TaskFolderRowProps {
  onDone: (id: string, done: boolean) => void;
  onEdit: (t: Task) => void;
  onSchedule: (t: Task) => void;
  onDragStartTask: (t: Task) => void;
  onDragEndTask: () => void;
}

function TaskInboxFolder({
  node,
  collapsed,
  onToggle,
  depth,
  rowProps,
}: {
  node: TaskTreeNode;
  collapsed: Set<string>;
  onToggle: (path: string) => void;
  depth: number;
  rowProps: TaskFolderRowProps;
}) {
  const isCollapsed = collapsed.has(node.path);
  const count = countTreeTasks(node);
  const sys = node.isSystem;
  return (
    <div style={{ paddingLeft: depth > 0 ? 10 : 0 }}>
      <button
        onClick={() => onToggle(node.path)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 6px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          borderRadius: 4,
          opacity: sys ? 0.7 : 1,
        }}
      >
        <Mono style={{ fontSize: 9, color: 'var(--ink-mute)', width: 10 }}>
          {isCollapsed ? '▶' : '▼'}
        </Mono>
        <span
          style={{
            flex: 1,
            fontSize: sys ? 10 : 11,
            fontWeight: sys ? 400 : 600,
            color: sys ? 'var(--ink-mute)' : 'var(--ink-soft)',
            letterSpacing: sys ? '0.04em' : '0.03em',
            textAlign: 'left',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: sys ? 'var(--font-mono)' : 'inherit',
          }}
        >
          {sys ? node.name.replace(/^\[(.+)\]$/, '$1') : node.name}
        </span>
        <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>{count}</Mono>
      </button>
      {!isCollapsed && (
        <div
          style={{
            paddingLeft: 8,
            borderLeft: `1px ${sys ? 'dashed' : 'solid'} var(--line)`,
            marginLeft: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            marginTop: 2,
            marginBottom: 2,
            opacity: sys ? 0.85 : 1,
          }}
        >
          {node.tasks.map((t) => (
            <TaskInboxRow
              key={t.id}
              task={t}
              displayTitle={t.leafTitle}
              onDone={(done) => rowProps.onDone(t.id, done)}
              onEdit={() => rowProps.onEdit(t)}
              onSchedule={() => rowProps.onSchedule(t)}
              onDragStartTask={rowProps.onDragStartTask}
              onDragEndTask={rowProps.onDragEndTask}
            />
          ))}
          {node.children.map((child) => (
            <TaskInboxFolder
              key={child.path}
              node={child}
              collapsed={collapsed}
              onToggle={onToggle}
              depth={depth + 1}
              rowProps={rowProps}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (next: ViewMode) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        padding: 2,
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 6,
        marginLeft: 6,
      }}
    >
      {VIEW_OPTIONS.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: '3px 9px',
            border: 'none',
            background: value === o.id ? 'var(--bg-shade)' : 'transparent',
            color: value === o.id ? 'var(--ink)' : 'var(--ink-soft)',
            fontSize: 11,
            cursor: 'pointer',
            borderRadius: 4,
            fontFamily: 'inherit',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DisplayModeToggle({
  value,
  onChange,
}: {
  value: DisplayMode;
  onChange: (next: DisplayMode) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        padding: 2,
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 6,
        marginLeft: 6,
      }}
    >
      <ModeChip
        active={value === 'time'}
        onClick={() => onChange('time')}
        title="시간 단위 타임라인"
      >
        <ClockIcon size={12} /> 시간
      </ModeChip>
      <ModeChip
        active={value === 'ticket'}
        onClick={() => onChange('ticket')}
        title="일별 티켓 그리드"
      >
        <TicketIcon size={12} /> 티켓
      </ModeChip>
    </div>
  );
}

function ModeChip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '3px 9px',
        border: 'none',
        background: active ? 'var(--bg-shade)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-soft)',
        fontSize: 11,
        cursor: 'pointer',
        borderRadius: 4,
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
  );
}

function formatTicketLabel(anchor: Date): string {
  return `${anchor.getFullYear()}.${pad(anchor.getMonth() + 1)}.${pad(anchor.getDate())} 기준 ±${TICKET_RANGE_DAYS}일`;
}

function SidebarEmpty({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '8px 0',
        color: 'var(--ink-mute)',
        fontSize: 11.5,
        fontStyle: 'italic',
      }}
    >
      {text}
    </div>
  );
}

/** 5일 뷰는 업무 주(월–금)라 주 시작일 설정과 무관하게 월요일부터 시작한다. */
function rangeWeekStart(view: ViewMode, weekStartDay: WeekStartDay): WeekStartDay {
  return view === 'week' ? 'mon' : weekStartDay;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

interface CalendarRange {
  days: CalendarDay[];
  startKey: string;
  endKey: string;
  start: Date;
  end: Date;
  view: ViewMode;
}

function buildTicketRange(anchor: Date): { startKey: string; endKey: string } {
  const a = stripTime(anchor);
  const start = addDays(a, -TICKET_RANGE_DAYS);
  const end = addDays(a, TICKET_RANGE_DAYS);
  return { startKey: isoKey(start), endKey: isoKey(end) };
}

function buildRange(
  view: ViewMode,
  anchor: Date,
  now: Date,
  weekStartDay: WeekStartDay,
): CalendarRange {
  const todayK = isoKey(now);
  if (view === 'day') {
    const d = stripTime(anchor);
    const day: CalendarDay = {
      date: isoKey(d),
      label: weekdayLabel(d),
      dayNumber: d.getDate(),
      isToday: isoKey(d) === todayK,
    };
    const k = isoKey(d);
    return { days: [day], startKey: k, endKey: k, start: d, end: d, view };
  }
  if (view === 'month') {
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    return {
      days: [],
      startKey: isoKey(start),
      endKey: isoKey(end),
      start,
      end,
      view,
    };
  }
  const span = view === '2week' ? 14 : view === 'week7' ? 7 : 5;
  const start = startOfWeek(anchor, rangeWeekStart(view, weekStartDay));
  const days: CalendarDay[] = [];
  for (let i = 0; i < span; i++) {
    const d = addDays(start, i);
    const dow = d.getDay();
    days.push({
      date: isoKey(d),
      label: weekdayLabel(d),
      dayNumber: d.getDate(),
      isToday: isoKey(d) === todayK,
      isWeekend: dow === 0 || dow === 6,
    });
  }
  const last = addDays(start, span - 1);
  return {
    days,
    startKey: isoKey(start),
    endKey: isoKey(last),
    start,
    end: last,
    view,
  };
}

function formatRangeLabel(range: CalendarRange): string {
  const { start, end, view } = range;
  if (view === 'day') {
    return `${start.getMonth() + 1}월 ${start.getDate()}일, ${start.getFullYear()}`;
  }
  if (view === 'month') {
    return `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
  }
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.getMonth() + 1}월 ${start.getDate()}일 — ${end.getDate()}일, ${start.getFullYear()}`;
  }
  if (sameYear) {
    return `${start.getMonth() + 1}월 ${start.getDate()}일 — ${end.getMonth() + 1}월 ${end.getDate()}일, ${start.getFullYear()}`;
  }
  return `${start.getFullYear()}.${pad(start.getMonth() + 1)}.${pad(start.getDate())} — ${end.getFullYear()}.${pad(end.getMonth() + 1)}.${pad(end.getDate())}`;
}

function shiftAnchor(view: ViewMode, anchor: Date, dir: 1 | -1): Date {
  if (view === 'day') return addDays(anchor, dir);
  if (view === 'week' || view === 'week7') return addDays(anchor, 7 * dir);
  if (view === '2week') return addDays(anchor, 14 * dir);
  const next = new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
  return next;
}

function anchorForToday(view: ViewMode, today: Date, weekStartDay: WeekStartDay): Date {
  if (view === 'day') return stripTime(today);
  if (view === 'month') return new Date(today.getFullYear(), today.getMonth(), 1);
  return startOfWeek(today, rangeWeekStart(view, weekStartDay));
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseKey(k: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function isoWeekNumber(d: Date): number {
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = (target.getTime() - firstThursday.getTime()) / 86_400_000;
  return 1 + Math.round((diff - ((firstThursday.getUTCDay() + 6) % 7) + 3) / 7);
}

function isoKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toDateKey(iso: string): string | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(0, 10) || null;
  const d = new Date(t);
  return isoKey(d);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function addMinutesHHMM(hhmm: string, minutes: number): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm;
  const total = Number(m[1]) * 60 + Number(m[2]) + minutes;
  const h = Math.floor((total % (24 * 60)) / 60);
  const mi = total % 60;
  return `${pad(h)}:${pad(mi)}`;
}

function hhmmToMin(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function currentHHMM(): string {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function timeOf(s: string | undefined | null): string | null {
  if (!s) return null;
  const hhmm = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (hhmm && hhmm[1] && hhmm[2]) return `${pad(Number(hhmm[1]))}:${hhmm[2]}`;
  const iso = /T(\d{2}):(\d{2})/.exec(s);
  return iso ? `${iso[1]}:${iso[2]}` : null;
}

function dateOf(s: string | undefined | null): string | null {
  if (!s) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1]! : null;
}

function makeIso(date: string, time?: string | null): string {
  if (!date) return '';
  if (!time) return date;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!m || !m[1] || !m[2]) return date;
  return `${date}T${pad(Number(m[1]))}:${m[2]}:00`;
}

function Skel({ w, h, r = 4, style }: { w?: string | number; h: number; r?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: w ?? '100%',
        height: h,
        borderRadius: r,
        background: 'linear-gradient(90deg, var(--line) 25%, var(--line-strong) 50%, var(--line) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

function PlanSkeleton() {
  const COL_COUNT = 5;
  return (
    <div style={{ height: '100%', display: 'flex', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* 사이드바 */}
      <aside
        style={{
          flex: '0 0 280px',
          borderRight: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div style={{ padding: 'var(--card-pad)', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skel w={60} h={10} />
          <Skel w={140} h={18} />
          <Skel w={100} h={10} />
        </div>
        {/* WeekProgress 자리 */}
        <div style={{ padding: '8px var(--card-pad)', borderBottom: '1px solid var(--line)' }}>
          <Skel h={6} r={3} />
        </div>
        {/* DayBudget 자리 */}
        <div style={{ padding: '10px var(--card-pad)', borderBottom: '1px solid var(--line)' }}>
          <Skel h={20} />
        </div>
        {/* 인박스 */}
        <div style={{ padding: '16px 18px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Skel w={80} h={10} />
            <Skel w={16} h={10} />
          </div>
          <Skel h={30} r={6} />
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skel w="80%" h={13} />
              <Skel w="50%" h={10} />
            </div>
          ))}
        </div>
        {/* 읽기큐 */}
        <div style={{ padding: '0 var(--card-pad) var(--gap-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Skel w={100} h={10} />
            <Skel w={16} h={10} />
          </div>
          {[0, 1].map((i) => (
            <div key={i} style={{ padding: '10px 12px', border: '1px dashed var(--line-strong)', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skel w="70%" h={13} />
              <Skel w="40%" h={10} />
            </div>
          ))}
        </div>
      </aside>

      {/* 메인 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* 툴바 */}
        <div
          style={{
            height: 'calc(var(--row-h) + 16px)',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 var(--card-pad)',
            gap: 8,
          }}
        >
          <Skel w={44} h={24} r={6} />
          <Skel w={24} h={24} r={6} />
          <Skel w={24} h={24} r={6} />
          <Skel w={160} h={14} r={4} style={{ marginLeft: 8 }} />
          <div style={{ flex: 1 }} />
          <Skel w={60} h={24} r={6} />
        </div>
        {/* 그리드 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* 시간 레이블 열 */}
          <div style={{ width: 44, flexShrink: 0, borderRight: '1px solid var(--line)', padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skel key={i} w={28} h={10} style={{ marginLeft: 'auto' }} />
            ))}
          </div>
          {/* 날짜 컬럼들 */}
          {Array.from({ length: COL_COUNT }).map((_, col) => (
            <div
              key={col}
              style={{
                flex: 1,
                borderRight: col < COL_COUNT - 1 ? '1px solid var(--line)' : 'none',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* 날짜 헤더 */}
              <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--line)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <Skel w={16} h={10} />
                <Skel w={24} h={16} r={12} />
              </div>
              {/* 시간 슬롯 영역 */}
              <div style={{ flex: 1, padding: 6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col === 0 && (
                  <div style={{ borderRadius: 6, overflow: 'hidden' }}>
                    <Skel h={48} />
                  </div>
                )}
                {col === 2 && (
                  <div style={{ borderRadius: 6, overflow: 'hidden', marginTop: 24 }}>
                    <Skel h={72} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

