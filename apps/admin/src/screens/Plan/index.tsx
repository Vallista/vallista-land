import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Block, GleanItem, Subtask, Task } from '@vallista/content-core';
import {
  addBlock,
  addTask,
  deleteBlock,
  deleteTask,
  listBlocksInRange,
  listGlean,
  listTasks,
  updateBlock,
  updateTask,
} from '../../lib/tauri';
import { Button, Eyebrow, IconBtn, Input, Mono } from '../../components/atoms/Atoms';
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
import { TagInput } from '../../components/TagInput';
import { TimeSelect } from '../../components/TimeSelect';
import { EstSelect } from '../../components/EstSelect';
import { notifyTagsChanged } from '../../lib/tags';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

type ViewMode = 'day' | 'week' | '2week' | 'month';
type DisplayMode = 'time' | 'ticket';

const VIEW_OPTIONS: { id: ViewMode; label: string }[] = [
  { id: 'day', label: '일' },
  { id: 'week', label: '주' },
  { id: '2week', label: '2주' },
  { id: 'month', label: '월' },
];

const TICKET_RANGE_DAYS = 60;

const EST_OPTIONS: { min: number; label: string }[] = [
  { min: 15, label: '15m' },
  { min: 30, label: '30m' },
  { min: 60, label: '1h' },
  { min: 120, label: '2h' },
];

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
  const [anchor, setAnchor] = useState<Date>(() => mondayOf(new Date()));
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [glean, setGlean] = useState<GleanItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitial, setDialogInitial] = useState<Partial<AddBlockDraft> | null>(null);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  const [draggingBlock, setDraggingBlock] = useState<Block | null>(null);
  const [inboxDropOver, setInboxDropOver] = useState(false);
  const inboxRef = useRef<HTMLDivElement>(null);

  const range = useMemo(() => buildRange(view, anchor, now), [view, anchor, now]);
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
      .then(setBlocks)
      .catch((e: unknown) => setError(String(e)));
  }, [startKey, endKey]);

  useEffect(() => {
    refreshBlocks();
  }, [refreshBlocks]);

  useEffect(() => {
    const onSynced = () => refreshBlocks();
    window.addEventListener('bento:ical-synced', onSynced);
    return () => window.removeEventListener('bento:ical-synced', onSynced);
  }, [refreshBlocks]);

  useEffect(() => {
    listTasks()
      .then(setTasks)
      .catch((e: unknown) => setError(String(e)));
    listGlean()
      .then(setGlean)
      .catch(() => setGlean([]));
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
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => (prev ? prev.filter((b) => b.id !== id) : prev));
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
        });
        upsertBlock(created);
      }
    },
    [editingBlock, upsertBlock],
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

  const displayBlocks = useMemo<Block[]>(() => {
    const real = blocks ?? [];
    if (!tasks) return real;
    const linkedTaskIds = new Set<string>();
    for (const b of real) {
      if (b.taskId) linkedTaskIds.add(b.taskId);
    }
    const virtual: Block[] = [];
    for (const t of tasks) {
      if (t.done) continue;
      if (linkedTaskIds.has(t.id)) continue;
      const date = dateOf(t.startAt);
      if (!date) continue;
      const start = timeOf(t.startAt) ?? '09:00';
      const dur = t.estMin && t.estMin > 0 ? t.estMin : 60;
      const end = addMinutesHHMM(start, dur);
      virtual.push({
        id: `task:${t.id}`,
        date,
        start,
        end,
        title: t.title,
        kind: 'write',
        attendees: [],
        done: false,
        source: 'local',
        taskId: t.id,
        createdAt: t.createdAt,
      });
    }
    return virtual.length === 0 ? real : [...real, ...virtual];
  }, [blocks, tasks]);

  const readQueue = useMemo(() => {
    if (!glean) return [];
    return glean
      .filter((g) => g.status === 'unread')
      .sort((a, b) => (a.fetchedAt < b.fetchedAt ? 1 : -1))
      .slice(0, 6);
  }, [glean]);

  const rangeLabel = useMemo(() => formatRangeLabel(range), [range]);
  const weekNumber = useMemo(() => isoWeekNumber(anchor), [anchor]);

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

  const upsertTaskDone = useCallback(
    async (id: string, done: boolean) => {
      const updated = await updateTask(id, { done });
      upsertTaskInState(updated);
    },
    [upsertTaskInState],
  );

  const saveEditingTask = useCallback(
    async (patch: { title: string; notes: string | null; subtasks: Subtask[] }) => {
      if (!editingTask) return;
      const updated = await updateTask(editingTask.id, {
        title: patch.title,
        notes: patch.notes,
        subtasks: patch.subtasks,
      });
      upsertTaskInState(updated);
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
          const updated = await updateTask(taskId, { startAt: null });
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
          const updated = await updateTask(b.taskId, { startAt: null });
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

  const createTask = useCallback(
    async (input: {
      title: string;
      startDate?: string;
      startTime?: string;
      dueDate?: string;
      dueTime?: string;
      estMin?: number;
      tags?: string[];
    }) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const startAt = input.startDate
        ? makeIso(input.startDate, input.startTime)
        : input.startTime && /^\d{1,2}:\d{2}$/.test(input.startTime)
          ? input.startTime
          : undefined;
      const due = input.dueDate ? makeIso(input.dueDate, input.dueTime) : undefined;
      const created = await addTask({
        id,
        title: input.title,
        due: due || undefined,
        estMin: input.estMin,
        startAt: startAt || undefined,
        tags: input.tags && input.tags.length > 0 ? input.tags : undefined,
      });
      setTasks((prev) => (prev ? [...prev, created] : [created]));
    },
    [],
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

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      <aside
        style={{
          flex: '0 0 280px',
          borderRight: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--line)' }}>
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
          <TaskQuickAdd onAdd={createTask} />
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {taskInbox.map((t) => (
                <TaskInboxRow
                  key={t.id}
                  task={t}
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
            </div>
          )}
        </div>

        <div style={{ padding: '16px 18px 8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Eyebrow>읽기 큐 → 시간에 꽂기</Eyebrow>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              {readQueue.length}
            </Mono>
          </div>
          {readQueue.length === 0 ? (
            <SidebarEmpty text="안 읽은 캡처가 없습니다" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {readQueue.map((g) => (
                <ClipRow
                  key={g.id}
                  item={g}
                  onSchedule={() => {
                    setEditingBlock(null);
                    setDialogInitial({
                      date: firstDayKey,
                      start: '14:00',
                      end: '15:00',
                      title: g.title || hostname(g.url),
                      kind: 'read',
                    });
                    setDialogOpen(true);
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
            height: 48,
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 18px',
            gap: 12,
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
                    : anchorForToday(view, new Date()),
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
                setAnchor(anchorForToday(next, anchor));
              }}
            />
          )}
          <span style={{ flex: 1 }} />
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

        {displayMode === 'ticket' ? (
          <TicketPlannerView
            anchor={anchor}
            now={now}
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
              setEditingBlock(null);
              setDialogInitial({ date, start: '09:00', end: '10:00' });
              setDialogOpen(true);
            }}
            onTaskClick={(t) => setEditingTask(t)}
            onTaskDone={(id, done) => upsertTaskDone(id, done)}
          />
        ) : view === 'month' ? (
          <MonthGrid
            anchor={anchor}
            now={now}
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
          />
        )}
      </div>

      <AddBlockDialog
        open={dialogOpen}
        initial={dialogInitial}
        editingId={editingBlock?.id}
        source={editingBlock?.source}
        onSubmit={handleSubmit}
        onClose={closeDialog}
        onDelete={editingBlock ? handleDelete : undefined}
      />

      <TaskEditor
        open={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSave={saveEditingTask}
        onDelete={removeEditingTask}
      />
    </div>
  );
}

function TaskQuickAdd({
  onAdd,
}: {
  onAdd: (input: {
    title: string;
    startDate?: string;
    startTime?: string;
    dueDate?: string;
    dueTime?: string;
    estMin?: number;
    tags?: string[];
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estMin, setEstMin] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const cancel = () => {
    setTitle('');
    setStartDate('');
    setStartTime('');
    setDueDate('');
    setDueTime('');
    setEstMin(null);
    setTags([]);
    setOpen(false);
  };

  const submit = async () => {
    const text = title.trim();
    if (!text) return;
    setBusy(true);
    try {
      await onAdd({
        title: text,
        startDate: startDate || undefined,
        startTime: startTime || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        estMin: estMin ?? undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      notifyTagsChanged('tasks');
      cancel();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
      {open && (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cancel();
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: 'min(460px, 92vw)',
              background: 'var(--bg-soft)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-pop)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Eyebrow>새 할 일</Eyebrow>
              <button
                onClick={cancel}
                title="닫기 (ESC)"
                style={{
                  width: 22,
                  height: 22,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink-mute)',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 16,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  cancel();
                }
              }}
              placeholder="할 일 제목"
              style={{ padding: '8px 10px', background: 'var(--bg)' }}
            />
            <DateTimeRow
              label="시작"
              date={startDate}
              time={startTime}
              onDateChange={setStartDate}
              onTimeChange={setStartTime}
            />
            <DateTimeRow
              label="마감"
              date={dueDate}
              time={dueTime}
              onDateChange={setDueDate}
              onTimeChange={setDueTime}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', width: 28, flexShrink: 0 }}>
                est
              </Mono>
              {EST_OPTIONS.map((o) => {
                const sel = estMin === o.min;
                return (
                  <button
                    key={o.min}
                    onClick={() => setEstMin(sel ? null : o.min)}
                    style={{
                      padding: '3px 8px',
                      fontSize: 10.5,
                      fontFamily: 'inherit',
                      border: '1px solid var(--line)',
                      background: sel ? 'var(--ink)' : 'transparent',
                      color: sel ? 'var(--on-accent)' : 'var(--ink-soft)',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    {o.label}
                  </button>
                );
              })}
              <div style={{ flex: 1, minWidth: 90 }}>
                <EstSelect value={estMin} onChange={setEstMin} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', width: 28, flexShrink: 0 }}>
                tags
              </Mono>
              <div style={{ flex: 1, minWidth: 0 }}>
                <TagInput value={tags} onChange={setTags} size="sm" />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                marginTop: 4,
              }}
            >
              <button
                onClick={cancel}
                style={{
                  padding: '7px 14px',
                  fontSize: 12,
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--ink-soft)',
                  borderRadius: 6,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={submit}
                disabled={busy || !title.trim()}
                style={{
                  padding: '7px 14px',
                  fontSize: 12,
                  border: 'none',
                  background: title.trim() ? 'var(--ink)' : 'var(--bg-shade)',
                  color: title.trim() ? 'var(--on-accent)' : 'var(--ink-mute)',
                  borderRadius: 6,
                  cursor: title.trim() && !busy ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                  fontWeight: 500,
                }}
              >
                {busy ? '…' : '담기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DateTimeRow({
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
}: {
  label: string;
  date: string;
  time: string;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', width: 28, flexShrink: 0 }}>
        {label}
      </Mono>
      <Input
        sm
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        style={{
          flex: 1,
          minWidth: 0,
          border: `1px ${date === '' ? 'dashed' : 'solid'} var(--line)`,
          color: date === '' ? 'var(--ink-mute)' : 'var(--ink)',
        }}
      />
      <div style={{ width: 96, flexShrink: 0 }}>
        <TimeSelect value={time} onChange={onTimeChange} title={`${label} 시간`} />
      </div>
    </div>
  );
}

function TaskInboxRow({
  task,
  onDone,
  onSchedule,
  onEdit,
  onDragStartTask,
  onDragEndTask,
}: {
  task: Task;
  onDone: (done: boolean) => void;
  onSchedule: () => void;
  onEdit: () => void;
  onDragStartTask?: (task: Task) => void;
  onDragEndTask?: () => void;
}) {
  const subDone = (task.subtasks ?? []).filter((s) => s.done).length;
  const subTotal = (task.subtasks ?? []).length;
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
        {task.title}
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
            style={{ fontSize: 10, color: 'var(--ink-mute)' }}
            title="메모 있음"
          >
            ✎
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
    </div>
  );
}

function ClipRow({
  item,
  onSchedule,
}: {
  item: GleanItem;
  onSchedule: () => void;
}) {
  return (
    <button
      onClick={onSchedule}
      style={{
        padding: '10px 12px',
        border: '1px dashed var(--line-strong)',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        textAlign: 'left',
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          fontSize: 12.5,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {item.title || '(제목 없음)'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
          {hostname(item.url)}
        </Mono>
        <Mono
          style={{
            fontSize: 10,
            color: 'var(--blue)',
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <ArrowRightIcon size={11} /> 꽂기
        </Mono>
      </div>
    </button>
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

function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
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

function buildRange(view: ViewMode, anchor: Date, now: Date): CalendarRange {
  const todayK = isoKey(now);
  if (view === 'day') {
    const d = stripTime(anchor);
    const day: CalendarDay = {
      date: isoKey(d),
      label: DAY_LABELS[(d.getDay() + 6) % 7] ?? '',
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
  const span = view === '2week' ? 10 : 5;
  const start = mondayOf(anchor);
  const days: CalendarDay[] = [];
  for (let i = 0; i < span; i++) {
    const d = addDays(start, i);
    days.push({
      date: isoKey(d),
      label: DAY_LABELS[(d.getDay() + 6) % 7] ?? '',
      dayNumber: d.getDate(),
      isToday: isoKey(d) === todayK,
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
  if (view === 'week') return addDays(anchor, 7 * dir);
  if (view === '2week') return addDays(anchor, 14 * dir);
  const next = new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
  return next;
}

function anchorForToday(view: ViewMode, today: Date): Date {
  if (view === 'day') return stripTime(today);
  if (view === 'month') return new Date(today.getFullYear(), today.getMonth(), 1);
  return mondayOf(today);
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

function hostname(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
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

