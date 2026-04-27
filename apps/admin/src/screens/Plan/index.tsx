import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Block, GleanItem, Task } from '@vallista/content-core';
import {
  addBlock,
  addTask,
  deleteBlock,
  listBlocksInRange,
  listGlean,
  listTasks,
  updateBlock,
  updateTask,
} from '../../lib/tauri';
import { Button, Eyebrow, IconBtn, Mono } from '../../components/atoms/Atoms';
import { WeekCalendar, type CalendarDay } from './WeekCalendar';
import { AddBlockDialog, blockToDraft, type AddBlockDraft } from './AddBlockDialog';
import { IcalDialog } from './IcalDialog';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export function Plan() {
  const [now, setNow] = useState<Date>(() => new Date());
  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [glean, setGlean] = useState<GleanItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitial, setDialogInitial] = useState<Partial<AddBlockDraft> | null>(null);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [icalOpen, setIcalOpen] = useState(false);

  const days = useMemo<CalendarDay[]>(() => buildDays(weekStart, now), [weekStart, now]);
  const startKey = days[0]!.date;
  const endKey = days[days.length - 1]!.date;
  const firstDayKey = days[0]!.date;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
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

  const openEdit = useCallback((b: Block) => {
    setEditingBlock(b);
    setDialogInitial(blockToDraft(b));
    setDialogOpen(true);
  }, []);

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
          title: draft.title,
          kind: draft.kind,
          attendees: draft.attendees,
        });
        upsertBlock(updated);
      } else {
        const created = await addBlock({
          id: newId(),
          date: draft.date,
          start: draft.start,
          end: draft.end,
          title: draft.title,
          kind: draft.kind,
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
      .filter((t) => !t.done)
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

  const readQueue = useMemo(() => {
    if (!glean) return [];
    return glean
      .filter((g) => g.status === 'unread')
      .sort((a, b) => (a.fetchedAt < b.fetchedAt ? 1 : -1))
      .slice(0, 6);
  }, [glean]);

  const weekLabel = useMemo(() => weekRangeLabel(weekStart), [weekStart]);
  const weekNumber = useMemo(() => isoWeekNumber(weekStart), [weekStart]);

  const upsertTaskDone = useCallback(
    async (id: string, done: boolean) => {
      const updated = await updateTask(id, { done });
      setTasks((prev) => {
        if (!prev) return [updated];
        const idx = prev.findIndex((t) => t.id === id);
        if (idx === -1) return [...prev, updated];
        const next = prev.slice();
        next[idx] = updated;
        return next;
      });
    },
    [],
  );

  const createTask = useCallback(async (title: string, due?: string) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const created = await addTask({
      id,
      title,
      due: due ? `${due}T09:00:00` : undefined,
    });
    setTasks((prev) => (prev ? [...prev, created] : [created]));
  }, []);

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
          <Eyebrow>이번 주</Eyebrow>
          <div
            style={{
              marginTop: 6,
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.3px',
            }}
          >
            {weekStart.getFullYear()}-W{pad(weekNumber)}
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
            <Mono>{weekLabel}</Mono>
          </div>
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
            <Eyebrow>TODO 인박스</Eyebrow>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              {taskInbox.length}
            </Mono>
          </div>
          <TaskQuickAdd onAdd={createTask} />
          {taskInbox.length === 0 ? (
            <SidebarEmpty text="비어 있음" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {taskInbox.map((t) => (
                <TaskInboxRow
                  key={t.id}
                  task={t}
                  onDone={(done) => upsertTaskDone(t.id, done)}
                  onSchedule={() => {
                    setEditingBlock(null);
                    setDialogInitial({
                      date: t.due
                        ? toDateKey(t.due) ?? firstDayKey
                        : firstDayKey,
                      start: '09:00',
                      end: '10:00',
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
            <Button sm ghost onClick={() => setWeekStart(mondayOf(new Date()))}>
              오늘
            </Button>
            <IconBtn title="이전 주" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              ‹
            </IconBtn>
            <IconBtn title="다음 주" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              ›
            </IconBtn>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
            {weekLabel}
          </span>
          <span style={{ flex: 1 }} />
          <Button sm ghost onClick={() => setIcalOpen(true)}>
            캘린더
          </Button>
          <Button
            sm
            onClick={() => {
              setEditingBlock(null);
              setDialogInitial({
                date: firstDayKey,
                start: '09:00',
                end: '10:00',
              });
              setDialogOpen(true);
            }}
          >
            + 블록
          </Button>
        </div>

        <WeekCalendar
          days={days}
          blocks={blocks ?? []}
          now={now}
          onSlotClick={openAddAt}
          onBlockClick={openEdit}
        />
      </div>

      <AddBlockDialog
        open={dialogOpen}
        initial={dialogInitial}
        editingId={editingBlock?.id}
        onSubmit={handleSubmit}
        onClose={closeDialog}
        onDelete={editingBlock ? handleDelete : undefined}
      />

      <IcalDialog
        open={icalOpen}
        onClose={() => setIcalOpen(false)}
        onSynced={refreshBlocks}
      />
    </div>
  );
}

function TaskQuickAdd({
  onAdd,
}: {
  onAdd: (title: string, due?: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const submit = async () => {
    const text = title.trim();
    if (!text) return;
    setBusy(true);
    try {
      await onAdd(text, due || undefined);
      setTitle('');
      setDue('');
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape') {
            setOpen(false);
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        placeholder="+ 할 일 추가"
        style={{
          padding: '7px 10px',
          fontSize: 12.5,
          border: '1px solid var(--line)',
          background: 'var(--bg)',
          color: 'var(--ink)',
          borderRadius: 6,
          fontFamily: 'inherit',
          outline: 'none',
        }}
      />
      {open && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            style={{
              padding: '5px 7px',
              fontSize: 11.5,
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              color: 'var(--ink)',
              borderRadius: 5,
              fontFamily: 'inherit',
              outline: 'none',
              flex: 1,
              minWidth: 0,
            }}
          />
          <button
            onClick={submit}
            disabled={busy || !title.trim()}
            style={{
              padding: '6px 10px',
              fontSize: 11.5,
              border: 'none',
              background: title.trim() ? 'var(--ink)' : 'var(--bg-shade)',
              color: title.trim() ? 'var(--on-accent)' : 'var(--ink-mute)',
              borderRadius: 5,
              cursor: title.trim() && !busy ? 'pointer' : 'default',
              fontFamily: 'inherit',
              fontWeight: 500,
            }}
          >
            {busy ? '…' : '담기'}
          </button>
        </div>
      )}
    </div>
  );
}

function TaskInboxRow({
  task,
  onDone,
  onSchedule,
}: {
  task: Task;
  onDone: (done: boolean) => void;
  onSchedule: () => void;
}) {
  return (
    <div
      style={{
        padding: '10px 12px',
        border: '1px solid var(--line)',
        background: 'var(--bg)',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {task.due && (
          <Mono style={{ fontSize: 10, color: 'var(--blue)' }}>
            {toDateKey(task.due) ?? '날짜'}
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
          }}
          title="완료"
        >
          ✓
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
          }}
          title="시간에 꽂기"
        >
          ⇢ 시간
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
        <Mono style={{ fontSize: 10, color: 'var(--blue)', marginLeft: 'auto' }}>
          ⇢ 꽂기
        </Mono>
      </div>
    </button>
  );
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

function buildDays(start: Date, now: Date): CalendarDay[] {
  const todayK = isoKey(now);
  const out: CalendarDay[] = [];
  for (let i = 0; i < 5; i++) {
    const d = addDays(start, i);
    out.push({
      date: isoKey(d),
      label: DAY_LABELS[i] ?? '',
      dayNumber: d.getDate(),
      isToday: isoKey(d) === todayK,
    });
  }
  return out;
}

function weekRangeLabel(start: Date): string {
  const end = addDays(start, 4);
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

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
