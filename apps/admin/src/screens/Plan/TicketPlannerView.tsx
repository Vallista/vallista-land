import { useEffect, useMemo, useRef, useState } from 'react';
import type { Block, BlockSource, KnownBlockKind, Task } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import { CheckIcon, ClockIcon, PlusIcon } from '../../components/atoms/Icons';
import { WeekCalendar, type CalendarDay } from './WeekCalendar';

const SOURCE_LABEL: Record<BlockSource, string> = {
  local: '내 블록',
  gcal: 'GCAL',
  applecal: 'APPLE',
};

function isLocal(b: Block): boolean {
  return !b.source || b.source === 'local';
}

const STRIP_RADIUS_DAYS = 60;
const COLUMN_WIDTH = 184;
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

const KIND_INK: Record<KnownBlockKind, string> = {
  meet: 'var(--hl-violet)',
  write: 'var(--blue)',
  read: 'var(--hl-rose)',
  deep: 'var(--ok)',
  build: 'var(--hl-amber)',
  publish: 'var(--blue)',
  health: 'var(--ok)',
  meal: 'var(--hl-amber)',
  leisure: 'var(--hl-rose)',
  people: 'var(--hl-violet)',
  routine: 'var(--ink-mute)',
  life: 'var(--ink-mute)',
};

interface Props {
  anchor: Date;
  now: Date;
  blocks: Block[];
  tasks?: Task[];
  draggingTask?: { id: string; title: string; estMin?: number } | null;
  inboxRef?: React.RefObject<HTMLElement | null>;
  onSlotClick: (date: string, hour: number) => void;
  onBlockClick: (b: Block) => void;
  onRangeSelect: (date: string, start: string, end: string) => void;
  onBlockMove: (id: string, date: string, start: string, end: string) => void;
  onTaskDrop?: (taskId: string, date: string, start: string, end: string) => void;
  onBlockMoveToInbox?: (blockId: string) => void;
  onInboxHoverChange?: (over: boolean) => void;
  onBlockDragChange?: (block: Block | null) => void;
  onCreateForDay: (date: string) => void;
  onTaskClick?: (task: Task) => void;
  onTaskDone?: (taskId: string, done: boolean) => void;
}

export function TicketPlannerView({
  anchor,
  now,
  blocks,
  tasks,
  draggingTask,
  inboxRef,
  onSlotClick,
  onBlockClick,
  onRangeSelect,
  onBlockMove,
  onTaskDrop,
  onBlockMoveToInbox,
  onInboxHoverChange,
  onBlockDragChange,
  onCreateForDay,
  onTaskClick,
  onTaskDone,
}: Props) {
  const todayKey = isoKey(now);
  const [selectedKey, setSelectedKey] = useState<string>(todayKey);
  const stripRef = useRef<HTMLDivElement | null>(null);

  const stripDays = useMemo(() => buildStrip(anchor, todayKey), [anchor, todayKey]);

  const blocksByDate = useMemo(() => {
    const map = new Map<string, Block[]>();
    for (const b of blocks) {
      const arr = map.get(b.date);
      if (arr) arr.push(b);
      else map.set(b.date, [b]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
    }
    return map;
  }, [blocks]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    if (!tasks) return map;
    const linkedTaskIds = new Set<string>();
    for (const b of blocks) {
      if (b.taskId) linkedTaskIds.add(b.taskId);
    }
    for (const t of tasks) {
      if (linkedTaskIds.has(t.id)) continue;
      const date = dateOf(t.startAt) ?? dateOf(t.due);
      if (!date) continue;
      const arr = map.get(date);
      if (arr) arr.push(t);
      else map.set(date, [t]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => {
        const at = timeOf(a.startAt) ?? timeOf(a.due) ?? '';
        const bt = timeOf(b.startAt) ?? timeOf(b.due) ?? '';
        if (at && bt) return at < bt ? -1 : at > bt ? 1 : 0;
        if (at) return -1;
        if (bt) return 1;
        return 0;
      });
    }
    return map;
  }, [tasks, blocks]);

  useEffect(() => {
    const container = stripRef.current;
    if (!container) return;
    const key = isoKey(anchor);
    const target = container.querySelector<HTMLElement>(`[data-day="${key}"]`);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const left = container.scrollLeft + (rect.left - containerRect.left);
    container.scrollTo({ left, behavior: 'smooth' });
  }, [anchor]);

  const selectedDay = useMemo<CalendarDay>(() => {
    const d = parseKey(selectedKey) ?? now;
    return {
      date: isoKey(d),
      label: DAY_LABELS[(d.getDay() + 6) % 7] ?? '',
      dayNumber: d.getDate(),
      isToday: isoKey(d) === todayKey,
    };
  }, [selectedKey, now, todayKey]);

  const selectedBlocks = useMemo(
    () => blocks.filter((b) => b.date === selectedDay.date),
    [blocks, selectedDay.date],
  );

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <div
        ref={stripRef}
        style={{
          flex: 1,
          minWidth: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          background: 'var(--bg)',
          borderRight: '1px solid var(--line)',
        }}
      >
        {stripDays.map((d) => {
          const list = blocksByDate.get(d.date) ?? [];
          const taskList = tasksByDate.get(d.date) ?? [];
          const selected = d.date === selectedDay.date;
          return (
            <DayTicketColumn
              key={d.date}
              day={d}
              blocks={list}
              tasks={taskList}
              selected={selected}
              draggingTask={draggingTask ?? null}
              onSelect={() => setSelectedKey(d.date)}
              onCreate={() => onCreateForDay(d.date)}
              onBlockClick={onBlockClick}
              onTaskClick={onTaskClick}
              onTaskDone={onTaskDone}
              onTaskDrop={
                onTaskDrop
                  ? (taskId) => {
                      const t = tasks?.find((x) => x.id === taskId);
                      const startStr =
                        timeOf(t?.startAt) ?? timeOf(t?.due) ?? '09:00';
                      const dur = t?.estMin && t.estMin > 0 ? t.estMin : 60;
                      const endStr = addMinutesHHMM(startStr, dur);
                      onTaskDrop(taskId, d.date, startStr, endStr);
                    }
                  : undefined
              }
            />
          );
        })}
      </div>

      <div
        style={{
          flex: '0 0 380px',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-soft)',
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            background: 'var(--bg-soft)',
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--ink-soft)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {selectedDay.label}
          </span>
          <Mono
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: selectedDay.isToday ? 'var(--blue)' : 'var(--ink)',
            }}
          >
            {selectedDay.date}
          </Mono>
          <span style={{ flex: 1 }} />
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
            00:00 — 23:59
          </Mono>
        </div>

        <WeekCalendar
          days={[selectedDay]}
          blocks={selectedBlocks}
          tasks={tasks}
          now={now}
          hourStart={0}
          hourEnd={23}
          draggingTask={draggingTask}
          inboxRef={inboxRef}
          onSlotClick={onSlotClick}
          onBlockClick={onBlockClick}
          onRangeSelect={onRangeSelect}
          onBlockMove={onBlockMove}
          onTaskDrop={onTaskDrop}
          onBlockMoveToInbox={onBlockMoveToInbox}
          onInboxHoverChange={onInboxHoverChange}
          onBlockDragChange={onBlockDragChange}
        />
      </div>
    </div>
  );
}

function DayTicketColumn({
  day,
  blocks,
  tasks,
  selected,
  draggingTask,
  onSelect,
  onCreate,
  onBlockClick,
  onTaskClick,
  onTaskDone,
  onTaskDrop,
}: {
  day: CalendarDay & { isWeekStart?: boolean };
  blocks: Block[];
  tasks: Task[];
  selected: boolean;
  draggingTask?: { id: string; title: string; estMin?: number } | null;
  onSelect: () => void;
  onCreate: () => void;
  onBlockClick: (b: Block) => void;
  onTaskClick?: (t: Task) => void;
  onTaskDone?: (id: string, done: boolean) => void;
  onTaskDrop?: (taskId: string) => void;
}) {
  const [dropOver, setDropOver] = useState(false);
  const localBlocks = blocks.filter(isLocal);
  const externalBlocks = blocks.filter((b) => !isLocal(b));
  const isEmpty =
    localBlocks.length === 0 && externalBlocks.length === 0 && tasks.length === 0;
  const hinted = !!draggingTask && !!onTaskDrop;
  return (
    <div
      data-day={day.date}
      onDragOver={
        onTaskDrop
          ? (e) => {
              if (!hasTaskTransfer(e)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              if (!dropOver) setDropOver(true);
            }
          : undefined
      }
      onDragLeave={
        onTaskDrop
          ? (e) => {
              const next = e.relatedTarget as Node | null;
              if (next && e.currentTarget.contains(next)) return;
              setDropOver(false);
            }
          : undefined
      }
      onDrop={
        onTaskDrop
          ? (e) => {
              const taskId = readTaskIdFromDataTransfer(e);
              setDropOver(false);
              if (!taskId) return;
              e.preventDefault();
              onTaskDrop(taskId);
            }
          : undefined
      }
      style={{
        flex: `0 0 ${COLUMN_WIDTH}px`,
        width: COLUMN_WIDTH,
        borderRight: '1px solid var(--line)',
        borderLeft: day.isWeekStart ? '1px solid var(--line-strong)' : 'none',
        background: dropOver
          ? 'rgba(96,165,250,0.10)'
          : selected
            ? 'var(--bg-soft)'
            : 'var(--bg)',
        outline: dropOver
          ? '1.5px dashed var(--blue)'
          : hinted
            ? '1px dashed var(--line-strong)'
            : 'none',
        outlineOffset: -2,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        transition: 'background 120ms, outline 120ms',
      }}
    >
      <button
        onClick={onSelect}
        title="이 날짜를 오른쪽 타임라인에 표시"
        style={{
          padding: '10px 12px',
          borderBottom: '1px solid var(--line)',
          background: selected ? 'var(--bg-shade)' : 'var(--bg-soft)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          cursor: 'pointer',
          border: 'none',
          borderTop: 'none',
          width: '100%',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--ink-soft)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {day.label}
        </span>
        <Mono
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: day.isToday ? 'var(--blue)' : 'var(--ink)',
          }}
        >
          {day.dayNumber}
        </Mono>
        {day.isToday && (
          <span
            style={{
              fontSize: 9,
              color: 'var(--blue)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              marginLeft: 'auto',
            }}
          >
            ● TODAY
          </span>
        )}
      </button>

      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: 6,
        }}
      >
        {isEmpty ? (
          <button
            onClick={onCreate}
            style={{
              flex: 1,
              minHeight: 80,
              border: '1px dashed var(--line)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--ink-mute)',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <PlusIcon size={11} /> 비어 있음
          </button>
        ) : (
          <>
            {localBlocks.map((b) => (
              <TicketCard key={b.id} block={b} onClick={() => onBlockClick(b)} />
            ))}
            {tasks.map((t) => (
              <TaskTicketCard
                key={t.id}
                task={t}
                onClick={onTaskClick ? () => onTaskClick(t) : undefined}
                onDone={onTaskDone ? (done) => onTaskDone(t.id, done) : undefined}
              />
            ))}
            <button
              onClick={onCreate}
              style={{
                marginTop: 2,
                padding: '6px 8px',
                border: '1px dashed var(--line)',
                borderRadius: 5,
                background: 'transparent',
                color: 'var(--ink-mute)',
                fontSize: 10.5,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                justifyContent: 'center',
              }}
            >
              <PlusIcon size={10} /> 추가
            </button>
            {externalBlocks.length > 0 && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 6,
                  borderTop: '1px dashed var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <Mono
                  style={{
                    fontSize: 8.5,
                    color: 'var(--ink-mute)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  외부 캘린더 · {externalBlocks.length}
                </Mono>
                {externalBlocks.map((b) => (
                  <ExternalTicketCard
                    key={b.id}
                    block={b}
                    onClick={() => onBlockClick(b)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TaskTicketCard({
  task,
  onClick,
  onDone,
}: {
  task: Task;
  onClick?: () => void;
  onDone?: (done: boolean) => void;
}) {
  const startTime = timeOf(task.startAt);
  const dueTime = timeOf(task.due);
  const dueDate = dateOf(task.due);
  const startDate = dateOf(task.startAt);
  const dueDiffersFromStart = dueDate && dueDate !== startDate;
  const est = estLabel(task.estMin);
  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onClick?.();
      }}
      title={`${task.title}${startTime ? ` · ${startTime}` : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '7px 9px',
        border: '1px dashed var(--line-strong, var(--line))',
        borderLeft: `3px dashed var(--blue)`,
        borderRadius: 5,
        background: 'var(--bg)',
        cursor: onClick ? 'pointer' : 'default',
        textAlign: 'left',
        fontFamily: 'inherit',
        opacity: task.done ? 0.55 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Mono style={{ fontSize: 9.5, color: 'var(--blue)', letterSpacing: '0.04em' }}>
          {startTime ? `TODO · ${startTime}` : 'TODO'}
        </Mono>
        <span style={{ flex: 1 }} />
        {onDone && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDone(!task.done);
            }}
            title={task.done ? '완료 취소' : '완료'}
            style={{
              background: 'transparent',
              border: 'none',
              color: task.done ? 'var(--ok)' : 'var(--ink-mute)',
              cursor: 'pointer',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <CheckIcon size={11} />
          </button>
        )}
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textDecoration: task.done ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </span>
      {(est || dueDiffersFromStart || dueTime) && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 10,
            color: 'var(--ink-mute)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {est && (
            <Mono
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 10,
              }}
            >
              <ClockIcon size={10} /> {est}
            </Mono>
          )}
          {dueDiffersFromStart && (
            <Mono style={{ fontSize: 10 }}>~{dueDate}</Mono>
          )}
          {!dueDiffersFromStart && dueTime && (
            <Mono style={{ fontSize: 10 }}>~{dueTime}</Mono>
          )}
        </span>
      )}
    </div>
  );
}

function ExternalTicketCard({
  block,
  onClick,
}: {
  block: Block;
  onClick: () => void;
}) {
  const sourceLabel =
    block.source && block.source !== 'local' ? SOURCE_LABEL[block.source] : '';
  return (
    <button
      onClick={onClick}
      title={`${block.start}–${block.end} · ${block.title} (외부 캘린더 — TODO 회수 불가)`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        padding: '6px 8px',
        border: '1px dashed var(--line)',
        borderRadius: 5,
        background: 'transparent',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        opacity: block.done ? 0.5 : 0.9,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Mono
          style={{
            fontSize: 9,
            color: 'var(--ink-mute)',
            letterSpacing: '0.04em',
          }}
        >
          {block.start} – {block.end}
        </Mono>
        <span style={{ flex: 1 }} />
        {sourceLabel && (
          <Mono
            style={{
              fontSize: 8,
              color: 'var(--ink-mute)',
              letterSpacing: '0.06em',
            }}
          >
            {sourceLabel}
          </Mono>
        )}
      </div>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          color: 'var(--ink-soft)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textDecoration: block.done ? 'line-through' : 'none',
        }}
      >
        {block.title}
      </span>
      {block.attendees.length > 0 && (
        <span
          style={{
            fontSize: 10,
            color: 'var(--ink-mute)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {block.attendees.join(', ')}
        </span>
      )}
    </button>
  );
}

function TicketCard({ block, onClick }: { block: Block; onClick: () => void }) {
  const isVirtualTask = block.id.startsWith('task:');
  const ink = isVirtualTask
    ? 'var(--blue)'
    : (KIND_INK[block.kind as KnownBlockKind] ?? 'var(--ink-mute)');
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/x-bento-block', block.id);
        e.dataTransfer.setData('text/plain', block.title);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '7px 9px',
        border: isVirtualTask ? '1px dashed var(--line-strong, var(--line))' : '1px solid var(--line)',
        borderLeft: isVirtualTask ? `3px dashed ${ink}` : `3px solid ${ink}`,
        borderRadius: 5,
        background: 'var(--bg)',
        cursor: 'grab',
        textAlign: 'left',
        fontFamily: 'inherit',
        opacity: block.done ? 0.55 : 1,
      }}
      title={
        isVirtualTask
          ? `${block.start}–${block.end} · ${block.title} (TODO — 인박스로 끌면 회수)`
          : `${block.start}–${block.end} · ${block.title}`
      }
    >
      <Mono style={{ fontSize: 9.5, color: ink, letterSpacing: '0.04em' }}>
        {isVirtualTask ? `TODO · ${block.start}` : `${block.start} – ${block.end}`}
      </Mono>
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textDecoration: block.done ? 'line-through' : 'none',
        }}
      >
        {block.title}
      </span>
      {block.attendees.length > 0 && (
        <span
          style={{
            fontSize: 10,
            color: 'var(--ink-mute)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {block.attendees.join(', ')}
        </span>
      )}
    </button>
  );
}

function buildStrip(
  anchor: Date,
  todayKey: string,
): (CalendarDay & { isWeekStart: boolean })[] {
  const start = addDays(stripTime(anchor), -STRIP_RADIUS_DAYS);
  const total = STRIP_RADIUS_DAYS * 2 + 1;
  const out: (CalendarDay & { isWeekStart: boolean })[] = [];
  for (let i = 0; i < total; i++) {
    const d = addDays(start, i);
    const wd = (d.getDay() + 6) % 7;
    out.push({
      date: isoKey(d),
      label: DAY_LABELS[wd] ?? '',
      dayNumber: d.getDate(),
      isToday: isoKey(d) === todayKey,
      isWeekStart: wd === 0,
    });
  }
  return out;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isoKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseKey(k: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
  if (!m || !m[1] || !m[2] || !m[3]) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function dateOf(s: string | undefined | null): string | null {
  if (!s) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  return m ? m[1]! : null;
}

function timeOf(s: string | undefined | null): string | null {
  if (!s) return null;
  const hhmm = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (hhmm && hhmm[1] && hhmm[2]) return `${pad(Number(hhmm[1]))}:${hhmm[2]}`;
  const iso = /T(\d{2}):(\d{2})/.exec(s);
  return iso ? `${iso[1]}:${iso[2]}` : null;
}

function estLabel(min?: number): string | null {
  if (!min || min <= 0) return null;
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h}h` : `${h}h${r}m`;
}

function addMinutesHHMM(hhmm: string, minutes: number): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m || !m[1] || !m[2]) return hhmm;
  const total = Number(m[1]) * 60 + Number(m[2]) + minutes;
  const clamped = Math.max(0, Math.min(24 * 60, total));
  const h = Math.floor(clamped / 60);
  const mm = clamped % 60;
  return `${pad(h)}:${pad(mm)}`;
}

function hasTaskTransfer(e: React.DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes('application/x-bento-task');
}

function readTaskIdFromDataTransfer(e: React.DragEvent): string | null {
  if (!hasTaskTransfer(e)) return null;
  return e.dataTransfer.getData('application/x-bento-task') || null;
}
