import { useEffect, useRef, useState } from 'react';
import { TimeSelect } from '../../components/TimeSelect';
import type { Block, Task } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import { CheckIcon } from '../../components/atoms/Icons';
import { BlockInfoView } from './BlockInfoView';
import { eventNoteKeysFromBlock } from '../../lib/tauri';
import {
  SOURCE_LABEL,
  blockColor,
  dayOffset,
  isAllDayBlock,
  isLocal,
  isUnscheduledBlock,
  spanDayCount,
} from './blockMeta';

const DAY_BUDGET_PREFIX = 'bento.plan.dayBudget.';
const GLOBAL_ACTIVE_START_KEY = 'bento.plan.activeStart';
const GLOBAL_ACTIVE_END_KEY = 'bento.plan.activeEnd';
const GLOBAL_SLEEP_START_KEY = 'bento.plan.sleepStart';
const GLOBAL_SLEEP_END_KEY = 'bento.plan.sleepEnd';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getDayActive(date: string, globalStart?: string, globalEnd?: string, _tick?: number): { start: string; end: string } {
  const raw = typeof window !== 'undefined' ? window.localStorage.getItem(DAY_BUDGET_PREFIX + date) : null;
  if (raw) {
    try {
      const d = JSON.parse(raw) as Record<string, string>;
      return { start: d['activeStart'] ?? globalStart ?? '09:00', end: d['activeEnd'] ?? globalEnd ?? '21:00' };
    } catch { /* fall through */ }
  }
  return { start: globalStart ?? '09:00', end: globalEnd ?? '21:00' };
}

function hasDayCustomBudget(date: string): boolean {
  return typeof window !== 'undefined' && !!window.localStorage.getItem(DAY_BUDGET_PREFIX + date);
}

const DEFAULT_HOUR_START = 0;
const DEFAULT_HOUR_END = 23;
const HOUR_HEIGHT = 56;
const HEADER_HEIGHT = 38;
const SNAP_MIN = 15;
const SNAP_FRAC = SNAP_MIN / 60;
const CLICK_THRESHOLD_PX = 5;

export interface CalendarDay {
  date: string;
  label: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend?: boolean;
}

type DragState =
  | {
      kind: 'create';
      startDate: string;
      startFrac: number;
      startClientX: number;
      startClientY: number;
      currentDate: string;
      currentFrac: number;
      moved: boolean;
    }
  | {
      kind: 'move';
      block: Block;
      durFrac: number;
      offsetFrac: number;
      startClientX: number;
      startClientY: number;
      currentDate: string;
      currentFrac: number;
      moved: boolean;
    };

export function WeekCalendar({
  days,
  blocks,
  tasks,
  now,
  hourStart = DEFAULT_HOUR_START,
  hourEnd = DEFAULT_HOUR_END,
  draggingTask,
  inboxRef,
  onSlotClick,
  onBlockClick,
  onRangeSelect,
  onAllDayCreate,
  onBlockMove,
  onTaskDrop,
  onBlockMoveToInbox,
  onInboxHoverChange,
  onBlockDragChange,
  onBlockDone,
  activeStart,
  activeEnd,
  subtaskCounts,
  excludedBlockKeys,
}: {
  days: CalendarDay[];
  blocks: Block[];
  tasks?: Task[];
  now: Date;
  hourStart?: number;
  hourEnd?: number;
  draggingTask?: { id: string; title: string; estMin?: number } | null;
  inboxRef?: React.RefObject<HTMLElement | null>;
  onSlotClick: (date: string, hour: number) => void;
  onBlockClick: (b: Block) => void;
  onRangeSelect: (date: string, start: string, end: string) => void;
  onAllDayCreate?: (date: string, endDate?: string) => void;
  onBlockMove: (id: string, date: string, start: string, end: string) => void;
  onTaskDrop?: (taskId: string, date: string, start: string, end: string) => void;
  onBlockMoveToInbox?: (blockId: string) => void;
  onInboxHoverChange?: (over: boolean) => void;
  onBlockDragChange?: (block: Block | null) => void;
  onBlockDone?: (id: string, done: boolean) => void;
  activeStart?: string;
  activeEnd?: string;
  subtaskCounts?: Map<string, { total: number; done: number }>;
  excludedBlockKeys?: Set<string>;
}) {
  const HOUR_START = hourStart;
  const HOUR_END = hourEnd;
  const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => i + HOUR_START);
  const clampLocal = (frac: number): number => {
    if (frac < HOUR_START) return HOUR_START;
    if (frac > HOUR_END + 1) return HOUR_END + 1;
    return frac;
  };
  const snapLocal = (frac: number): number => {
    const q = Math.round(frac / SNAP_FRAC) * SNAP_FRAC;
    return clampLocal(q);
  };
  const nowH = now.getHours() + now.getMinutes() / 60;
  const todayKey = isoKey(now);
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const allDayCellRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const didInitialScrollRef = useRef(false);
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    didInitialScrollRef.current = true;
    const target = Math.max(
      0,
      (nowH - HOUR_START) * HOUR_HEIGHT - el.clientHeight / 3,
    );
    el.scrollTop = target;
  }, [nowH, HOUR_START]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [allDayDrag, setAllDayDrag] = useState<{
    startDate: string;
    currentDate: string;
    startClientX: number;
    startClientY: number;
    moved: boolean;
  } | null>(null);
  const [dropHover, setDropHover] = useState<{
    taskId: string;
    date: string;
    startFrac: number;
    durFrac: number;
    title: string;
  } | null>(null);
  const [floatPos, setFloatPos] = useState<{ x: number; y: number } | null>(null);
  const [overInboxNow, setOverInboxNow] = useState(false);
  const [hover, setHover] = useState<{
    block: Block;
    segment: { start: string; end: string; isMulti: boolean };
    dayDate: string;
    x: number;
    y: number;
  } | null>(null);
  const dragActive = !!drag || !!allDayDrag;
  const [budgetPopover, setBudgetPopover] = useState<{ date: string; left: number; top: number } | null>(null);
  const [budgetTick, setBudgetTick] = useState(0);
  useEffect(() => {
    const onBudget = () => setBudgetTick((t) => t + 1);
    window.addEventListener('bento:budget-changed', onBudget);
    window.addEventListener('storage', onBudget);
    return () => {
      window.removeEventListener('bento:budget-changed', onBudget);
      window.removeEventListener('storage', onBudget);
    };
  }, []);
  useEffect(() => {
    if (dragActive && hover) setHover(null);
  }, [dragActive, hover]);

  useEffect(() => {
    if (!drag) return;
    const isOverInbox = (clientX: number, clientY: number): boolean => {
      const el = inboxRef?.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return (
        clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
      );
    };
    const onMove = (e: MouseEvent) => {
      if (drag.kind === 'move') {
        setFloatPos({ x: e.clientX, y: e.clientY });
      }
      const overInbox = drag.kind === 'move' && isOverInbox(e.clientX, e.clientY);
      setOverInboxNow(overInbox);
      onInboxHoverChange?.(overInbox);
      const hit = findDayHit(dayRefs.current, e.clientX, e.clientY);
      const moved =
        Math.abs(e.clientX - drag.startClientX) > CLICK_THRESHOLD_PX ||
        Math.abs(e.clientY - drag.startClientY) > CLICK_THRESHOLD_PX;
      if (overInbox) {
        if (moved !== drag.moved) setDrag({ ...drag, moved });
        return;
      }
      if (!hit) {
        if (moved !== drag.moved) {
          setDrag({ ...drag, moved });
        }
        return;
      }
      if (drag.kind === 'create') {
        const frac = snapLocal(HOUR_START + hit.y / HOUR_HEIGHT);
        setDrag({
          ...drag,
          currentDate: hit.date,
          currentFrac: frac,
          moved,
        });
      } else {
        const frac = snapLocal(HOUR_START + hit.y / HOUR_HEIGHT - drag.offsetFrac);
        setDrag({
          ...drag,
          currentDate: hit.date,
          currentFrac: frac,
          moved,
        });
      }
    };
    const onUp = (e: MouseEvent) => {
      const overInbox = drag.kind === 'move' && isOverInbox(e.clientX, e.clientY);
      onInboxHoverChange?.(false);
      setOverInboxNow(false);
      setFloatPos(null);
      if (drag.kind === 'move') {
        onBlockDragChange?.(null);
      }
      const hit = findDayHit(dayRefs.current, e.clientX, e.clientY);
      const moved =
        drag.moved ||
        Math.abs(e.clientX - drag.startClientX) > CLICK_THRESHOLD_PX ||
        Math.abs(e.clientY - drag.startClientY) > CLICK_THRESHOLD_PX;
      const final = drag;
      setDrag(null);
      if (final.kind === 'move' && overInbox && moved && onBlockMoveToInbox) {
        onBlockMoveToInbox(final.block.id);
        return;
      }
      if (final.kind === 'create') {
        if (!moved) {
          const hour = Math.floor(final.startFrac);
          onSlotClick(final.startDate, Math.max(HOUR_START, Math.min(HOUR_END, hour)));
          return;
        }
        const targetDate = hit?.date ?? final.startDate;
        const endFrac = hit
          ? snapLocal(HOUR_START + hit.y / HOUR_HEIGHT)
          : final.currentFrac;
        const a = clampLocal(Math.min(final.startFrac, endFrac));
        const bRaw = clampLocal(Math.max(final.startFrac, endFrac));
        const b = Math.max(a + SNAP_FRAC, bRaw);
        onRangeSelect(targetDate, fracToHHMM(a), fracToHHMM(b));
      } else {
        if (!moved) {
          onBlockClick(final.block);
          return;
        }
        const newFrac = clampLocal(
          hit
            ? snapLocal(HOUR_START + hit.y / HOUR_HEIGHT - final.offsetFrac)
            : final.currentFrac,
        );
        const newEnd = Math.min(HOUR_END + 1, newFrac + final.durFrac);
        const start = newEnd - final.durFrac;
        onBlockMove(
          final.block.id,
          hit?.date ?? final.currentDate,
          fracToHHMM(start),
          fracToHHMM(newEnd),
        );
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [
    drag,
    onSlotClick,
    onRangeSelect,
    onBlockClick,
    onBlockMove,
    onBlockMoveToInbox,
    onInboxHoverChange,
    onBlockDragChange,
    inboxRef,
    HOUR_START,
    HOUR_END,
  ]);

  useEffect(() => {
    if (!allDayDrag) return;
    const onMove = (e: MouseEvent) => {
      const hit = findAllDayHit(allDayCellRefs.current, e.clientX, e.clientY);
      const moved =
        Math.abs(e.clientX - allDayDrag.startClientX) > CLICK_THRESHOLD_PX ||
        Math.abs(e.clientY - allDayDrag.startClientY) > CLICK_THRESHOLD_PX;
      if (hit && hit !== allDayDrag.currentDate) {
        setAllDayDrag({ ...allDayDrag, currentDate: hit, moved });
      } else if (moved !== allDayDrag.moved) {
        setAllDayDrag({ ...allDayDrag, moved });
      }
    };
    const onUp = (e: MouseEvent) => {
      const hit = findAllDayHit(allDayCellRefs.current, e.clientX, e.clientY);
      const finalDate = hit ?? allDayDrag.currentDate;
      const startDate = allDayDrag.startDate;
      setAllDayDrag(null);
      const [a, b] =
        startDate <= finalDate ? [startDate, finalDate] : [finalDate, startDate];
      if (a === b) {
        onAllDayCreate?.(a);
      } else {
        onAllDayCreate?.(a, b);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [allDayDrag, onAllDayCreate]);

  const floatingBlock =
    drag?.kind === 'move' && drag.moved && floatPos ? drag.block : null;

  const allDayByDate = new Map<string, Block[]>();
  for (const d of days) {
    allDayByDate.set(
      d.date,
      blocks.filter(
        (b) => spansDay(b, d.date) && (isAllDayBlock(b) || isUnscheduledBlock(b)),
      ),
    );
  }
  const hasAnyAllDay = Array.from(allDayByDate.values()).some(
    (arr) => arr.length > 0,
  );

  return (
    <>
    <div ref={scrollRef} onMouseDown={(e) => e.stopPropagation()} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      {hasAnyAllDay && (
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            position: 'sticky',
            top: 0,
            zIndex: 3,
          }}
        >
          <div
            style={{
              flex: '0 0 56px',
              borderRight: '1px solid var(--line)',
              padding: '6px 8px',
              textAlign: 'right',
              position: 'sticky',
              left: 0,
              background: 'var(--bg-soft)',
              zIndex: 1,
            }}
          >
            <Mono
              style={{
                fontSize: 9,
                color: 'var(--ink-mute)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              종일
            </Mono>
          </div>
          <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
            {days.map((d) => {
              const inDrag =
                !!allDayDrag &&
                ((allDayDrag.startDate <= d.date && d.date <= allDayDrag.currentDate) ||
                  (allDayDrag.currentDate <= d.date && d.date <= allDayDrag.startDate));
              return (
                <AllDayCell
                  key={d.date}
                  day={d}
                  blocks={allDayByDate.get(d.date) ?? []}
                  highlight={inDrag}
                  onChipClick={onBlockClick}
                  onChipHover={(b, ev) => {
                    if (dragActive) return;
                    const seg = blockSegment(b, d.date);
                    if (!seg) return;
                    setHover({
                      block: b,
                      segment: seg,
                      dayDate: d.date,
                      x: ev.clientX,
                      y: ev.clientY,
                    });
                  }}
                  onChipHoverLeave={() => setHover(null)}
                  registerRef={(el) => {
                    if (el) allDayCellRefs.current.set(d.date, el);
                    else allDayCellRefs.current.delete(d.date);
                  }}
                  onCellMouseDown={
                    onAllDayCreate
                      ? (ev) => {
                          if (ev.button !== 0) return;
                          const target = ev.target as HTMLElement;
                          if (target.closest('[data-allday-chip]')) return;
                          ev.preventDefault();
                          setAllDayDrag({
                            startDate: d.date,
                            currentDate: d.date,
                            startClientX: ev.clientX,
                            startClientY: ev.clientY,
                            moved: false,
                          });
                        }
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
      <div
        style={{
          flex: '0 0 56px',
          borderRight: '1px solid var(--line)',
          background: 'var(--bg-soft)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: HEADER_HEIGHT + 4,
          position: 'sticky',
          left: 0,
          zIndex: 2,
        }}
      >
        {HOURS.map((h) => (
          <div
            key={h}
            style={{
              height: HOUR_HEIGHT,
              padding: '0 8px',
              textAlign: 'right',
            }}
          >
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              {pad(h)}:00
            </Mono>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
        {days.map((d) => {
          const dayAll = blocks.filter((b) => spansDay(b, d.date));
          const dayBlocks = dayAll.filter((b) => !isAllDayBlock(b) && !isUnscheduledBlock(b));
          const showNow = d.date === todayKey;
          const ghost = buildGhost(drag, d.date, HOUR_START, HOUR_END);
          const dropGhost =
            dropHover && dropHover.date === d.date
              ? {
                  topFrac: dropHover.startFrac,
                  bottomFrac: Math.min(
                    HOUR_END + 1,
                    dropHover.startFrac + dropHover.durFrac,
                  ),
                  label: `${dropHover.title} · ${fracToHHMM(dropHover.startFrac)}`,
                  tone: 'create' as const,
                }
              : null;
          return (
            <DayColumn
              key={d.date}
              day={d}
              blocks={dayBlocks}
              showNow={showNow}
              nowH={nowH}
              ghost={ghost ?? dropGhost}
              hourStart={HOUR_START}
              hourEnd={HOUR_END}
              hours={HOURS}
              hidingBlockId={
                drag?.kind === 'move' && drag.currentDate !== d.date
                  ? drag.block.id
                  : null
              }
              fadingBlockId={
                drag?.kind === 'move' && drag.currentDate === d.date
                  ? drag.block.id
                  : null
              }
              dayDate={d.date}
              onTaskDragOver={
                onTaskDrop
                  ? (date, y, ev) => {
                      if (!hasTaskTransfer(ev)) return;
                      ev.preventDefault();
                      ev.dataTransfer.dropEffect = 'copy';
                      const startFrac = snapLocal(HOUR_START + y / HOUR_HEIGHT);
                      const estMin =
                        draggingTask?.estMin && draggingTask.estMin > 0
                          ? draggingTask.estMin
                          : 60;
                      const durFrac = estMin / 60;
                      const title = draggingTask?.title ?? '할 일';
                      const taskId = draggingTask?.id ?? '';
                      setDropHover({ taskId, date, startFrac, durFrac, title });
                    }
                  : undefined
              }
              onTaskDragLeave={
                onTaskDrop ? () => setDropHover(null) : undefined
              }
              onTaskDrop={
                onTaskDrop
                  ? (date, y, ev) => {
                      const taskId = readTaskIdFromDataTransfer(ev);
                      if (!taskId) return;
                      ev.preventDefault();
                      const t = tasks?.find((x) => x.id === taskId);
                      const dur = (t?.estMin && t.estMin > 0 ? t.estMin : 60) / 60;
                      const startFrac = snapLocal(HOUR_START + y / HOUR_HEIGHT);
                      const endFrac = Math.min(HOUR_END + 1, startFrac + dur);
                      setDropHover(null);
                      onTaskDrop(
                        taskId,
                        date,
                        fracToHHMM(startFrac),
                        fracToHHMM(endFrac),
                      );
                    }
                  : undefined
              }
              onGridMouseDown={(date, frac, ev) => {
                setDrag({
                  kind: 'create',
                  startDate: date,
                  startFrac: frac,
                  startClientX: ev.clientX,
                  startClientY: ev.clientY,
                  currentDate: date,
                  currentFrac: frac,
                  moved: false,
                });
              }}
              onBlockMouseDown={(b, ev, gridY) => {
                if (!isLocal(b)) {
                  ev.preventDefault();
                  onBlockClick(b);
                  return;
                }
                const startFrac = parseTime(b.start) ?? HOUR_START;
                const endFrac = parseTime(b.end) ?? startFrac + 1;
                const dur = Math.max(SNAP_FRAC, endFrac - startFrac);
                const offsetFrac = gridY / HOUR_HEIGHT - (startFrac - HOUR_START);
                setDrag({
                  kind: 'move',
                  block: b,
                  durFrac: dur,
                  offsetFrac,
                  startClientX: ev.clientX,
                  startClientY: ev.clientY,
                  currentDate: b.date,
                  currentFrac: startFrac,
                  moved: false,
                });
                setFloatPos({ x: ev.clientX, y: ev.clientY });
                onBlockDragChange?.(b);
              }}
              onBlockHover={(b, seg, ev) => {
                if (dragActive) return;
                setHover({
                  block: b,
                  segment: seg,
                  dayDate: d.date,
                  x: ev.clientX,
                  y: ev.clientY,
                });
              }}
              onBlockHoverLeave={() => setHover(null)}
              onBlockDone={onBlockDone}
              activeStart={getDayActive(d.date, activeStart, activeEnd, budgetTick).start}
              activeEnd={getDayActive(d.date, activeStart, activeEnd, budgetTick).end}
              hasCustomBudget={hasDayCustomBudget(d.date)}
              onHeaderClick={(date, rect) =>
                setBudgetPopover({ date, left: rect.left, top: rect.bottom + 4 })
              }
              subtaskCounts={subtaskCounts}
              excludedBlockKeys={excludedBlockKeys}
              registerRef={(el) => {
                if (el) dayRefs.current.set(d.date, el);
                else dayRefs.current.delete(d.date);
              }}
            />
          );
        })}
      </div>
    </div>
    </div>
    {floatingBlock && floatPos && (
      <FloatingTicket
        block={floatingBlock}
        x={floatPos.x}
        y={floatPos.y}
        toInbox={overInboxNow}
      />
    )}
    {hover && !dragActive && (
      <HoverCard
        block={hover.block}
        segment={hover.segment}
        dayDate={hover.dayDate}
        x={hover.x}
        y={hover.y}
      />
    )}
    {budgetPopover && (
      <DayBudgetPopover
        date={budgetPopover.date}
        left={budgetPopover.left}
        top={budgetPopover.top}
        onClose={() => setBudgetPopover(null)}
      />
    )}
    </>
  );
}

function FloatingTicket({
  block,
  x,
  y,
  toInbox,
}: {
  block: Block;
  x: number;
  y: number;
  toInbox: boolean;
}) {
  const c = blockColor(block);
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        transform: 'translate(12px, 8px) rotate(-1.5deg)',
        zIndex: 9999,
        pointerEvents: 'none',
        minWidth: 160,
        maxWidth: 240,
        padding: '7px 10px',
        background: 'var(--bg)',
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.ink}`,
        borderRadius: 6,
        boxShadow:
          '0 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        opacity: 0.96,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Mono
          style={{
            fontSize: 9.5,
            color: c.ink,
            letterSpacing: '0.04em',
          }}
        >
          {block.start} – {block.end}
        </Mono>
        {toInbox && (
          <Mono
            style={{
              fontSize: 9,
              color: 'var(--blue)',
              marginLeft: 'auto',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            → TODO
          </Mono>
        )}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {block.title}
      </div>
    </div>
  );
}

interface Ghost {
  topFrac: number;
  bottomFrac: number;
  label: string;
  tone: 'create' | 'move';
}

function buildGhost(
  drag: DragState | null,
  date: string,
  hourStart: number,
  hourEnd: number,
): Ghost | null {
  if (!drag) return null;
  if (drag.kind === 'create') {
    if (drag.startDate !== date && drag.currentDate !== date) return null;
    if (drag.startDate === date && drag.currentDate === date) {
      const a = Math.min(drag.startFrac, drag.currentFrac);
      const b = Math.max(drag.startFrac, drag.currentFrac);
      return {
        topFrac: a,
        bottomFrac: Math.max(a + SNAP_FRAC, b),
        label: `${fracToHHMM(a)} – ${fracToHHMM(Math.max(a + SNAP_FRAC, b))}`,
        tone: 'create',
      };
    }
    return null;
  }
  if (drag.currentDate !== date) return null;
  const top = clampFrac(drag.currentFrac, hourStart, hourEnd);
  const bottom = Math.min(hourEnd + 1, top + drag.durFrac);
  return {
    topFrac: top,
    bottomFrac: bottom,
    label: `${drag.block.title} · ${fracToHHMM(top)}`,
    tone: 'move',
  };
}

function DayColumn({
  day,
  blocks,
  showNow,
  nowH,
  ghost,
  hourStart,
  hourEnd,
  hours,
  hidingBlockId,
  fadingBlockId,
  dayDate,
  onGridMouseDown,
  onBlockMouseDown,
  onBlockHover,
  onBlockHoverLeave,
  onBlockDone,
  onTaskDragOver,
  onTaskDragLeave,
  onTaskDrop,
  activeStart,
  activeEnd,
  hasCustomBudget,
  onHeaderClick,
  subtaskCounts,
  excludedBlockKeys,
  registerRef,
}: {
  day: CalendarDay;
  blocks: Block[];
  showNow: boolean;
  nowH: number;
  ghost: Ghost | null;
  hourStart: number;
  hourEnd: number;
  hours: number[];
  hidingBlockId: string | null;
  fadingBlockId: string | null;
  dayDate: string;
  onGridMouseDown: (date: string, frac: number, ev: React.MouseEvent) => void;
  onBlockMouseDown: (b: Block, ev: React.MouseEvent, gridY: number) => void;
  onBlockHover: (
    b: Block,
    segment: { start: string; end: string; isMulti: boolean },
    ev: React.MouseEvent,
  ) => void;
  onBlockHoverLeave: () => void;
  onBlockDone?: (id: string, done: boolean) => void;
  onTaskDragOver?: (date: string, y: number, ev: React.DragEvent) => void;
  onTaskDragLeave?: () => void;
  onTaskDrop?: (date: string, y: number, ev: React.DragEvent) => void;
  activeStart?: string;
  activeEnd?: string;
  hasCustomBudget?: boolean;
  onHeaderClick?: (date: string, rect: DOMRect) => void;
  subtaskCounts?: Map<string, { total: number; done: number }>;
  excludedBlockKeys?: Set<string>;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        background: day.isWeekend ? 'color-mix(in srgb, var(--bg-shade) 40%, transparent)' : undefined,
      }}
    >
      <div
        onClick={onHeaderClick ? (e) => onHeaderClick(day.date, e.currentTarget.getBoundingClientRect()) : undefined}
        style={{
          padding: '10px 12px',
          height: HEADER_HEIGHT,
          borderBottom: '1px solid var(--line)',
          background: day.isWeekend ? 'var(--bg-shade)' : 'var(--bg-soft)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          position: 'sticky',
          top: 0,
          zIndex: 1,
          cursor: onHeaderClick ? 'pointer' : 'default',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: day.isWeekend ? 'var(--ink-mute)' : 'var(--ink-soft)',
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
            color: day.isToday ? 'var(--blue)' : day.isWeekend ? 'var(--ink-mute)' : 'var(--ink)',
          }}
        >
          {day.dayNumber}
        </Mono>
        {hasCustomBudget && (
          <span
            title="하루 예산 커스텀"
            style={{
              fontSize: 7,
              color: 'var(--blue)',
              lineHeight: 1,
              marginBottom: 2,
            }}
          >
            ●
          </span>
        )}
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
      </div>
      <div
        ref={registerRef}
        data-day-date={day.date}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          const target = e.target as HTMLElement;
          if (target.closest('[data-block-bar]')) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const frac = snap(hourStart + y / HOUR_HEIGHT, hourStart, hourEnd);
          onGridMouseDown(day.date, frac, e);
        }}
        onDragOver={
          onTaskDragOver
            ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onTaskDragOver(day.date, e.clientY - rect.top, e);
              }
            : undefined
        }
        onDragLeave={
          onTaskDragLeave
            ? (e) => {
                const next = e.relatedTarget as Node | null;
                if (next && e.currentTarget.contains(next)) return;
                onTaskDragLeave();
              }
            : undefined
        }
        onDrop={
          onTaskDrop
            ? (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                onTaskDrop(day.date, e.clientY - rect.top, e);
              }
            : undefined
        }
        style={{
          position: 'relative',
          flex: 1,
          minHeight: hours.length * HOUR_HEIGHT,
          cursor: 'crosshair',
          userSelect: 'none',
        }}
      >
        {(() => {
          if (!activeStart && !activeEnd) return null;
          const parseH = (s: string) => {
            const m = /^(\d{1,2}):(\d{2})$/.exec(s);
            return m ? Number(m[1]) + Number(m[2]) / 60 : null;
          };
          const sh = activeStart ? parseH(activeStart) : null;
          const eh = activeEnd ? parseH(activeEnd) : null;
          return (
            <>
              {sh !== null && sh > hourStart && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: (sh - hourStart) * HOUR_HEIGHT,
                  background: 'repeating-linear-gradient(45deg, var(--cal-inactive-stripe) 0, var(--cal-inactive-stripe) 1.5px, var(--cal-inactive-fill) 0, var(--cal-inactive-fill) 50%)',
                  backgroundSize: '7px 7px',
                  pointerEvents: 'none',
                  zIndex: 1,
                }} />
              )}
              {eh !== null && eh < hourEnd + 1 && (
                <div style={{
                  position: 'absolute',
                  top: (eh - hourStart) * HOUR_HEIGHT,
                  left: 0,
                  right: 0,
                  height: (hourEnd + 1 - eh) * HOUR_HEIGHT,
                  background: 'repeating-linear-gradient(45deg, var(--cal-inactive-stripe) 0, var(--cal-inactive-stripe) 1.5px, var(--cal-inactive-fill) 0, var(--cal-inactive-fill) 50%)',
                  backgroundSize: '7px 7px',
                  pointerEvents: 'none',
                  zIndex: 1,
                }} />
              )}
            </>
          );
        })()}
        {hours.map((_, i) =>
          i === 0 ? null : (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: i * HOUR_HEIGHT,
                left: 0,
                right: 0,
                height: 0,
                borderTop: '1px solid var(--line-subtle)',
                pointerEvents: 'none',
              }}
            />
          ),
        )}
        {showNow && nowH >= hourStart && nowH <= hourEnd + 1 && (
          <div
            style={{
              position: 'absolute',
              top: (nowH - hourStart) * HOUR_HEIGHT,
              left: 0,
              right: 0,
              height: 0,
              borderTop: '1.5px solid var(--blue)',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: -5,
                top: -5,
                width: 8,
                height: 8,
                borderRadius: 999,
                background: 'var(--blue)',
              }}
            />
          </div>
        )}
        {layoutDayBlocks(blocks, dayDate, hourStart, hourEnd, hidingBlockId).map((it) => {
          const fading = it.block.id === fadingBlockId;
          const external = !isLocal(it.block);
          const eventKey = eventNoteKeysFromBlock(it.block, dayDate).eventKey;
          const statsExcluded = excludedBlockKeys?.has(eventKey) ?? false;
          return (
            <BlockBar
              key={it.block.id}
              block={it.block}
              segment={it.segment}
              startFrac={it.startFrac}
              endFrac={it.endFrac}
              col={it.col}
              totalCols={it.totalCols}
              fading={fading}
              external={external}
              hourStart={hourStart}
              subtaskCount={subtaskCounts?.get(eventKey)}
              statsExcluded={statsExcluded}
              onMouseDown={(ev, gridY) => onBlockMouseDown(it.block, ev, gridY)}
              onHover={(ev) => onBlockHover(it.block, it.segment, ev)}
              onHoverLeave={onBlockHoverLeave}
              onDone={statsExcluded ? undefined : onBlockDone}
            />
          );
        })}
        {ghost && <GhostOverlay ghost={ghost} hourStart={hourStart} />}
      </div>
    </div>
  );
}

function GhostOverlay({ ghost, hourStart }: { ghost: Ghost; hourStart: number }) {
  const top = (ghost.topFrac - hourStart) * HOUR_HEIGHT;
  const h = Math.max(16, (ghost.bottomFrac - ghost.topFrac) * HOUR_HEIGHT - 2);
  const tone =
    ghost.tone === 'create' ? 'rgba(96,165,250,0.30)' : 'rgba(96,165,250,0.42)';
  const border = ghost.tone === 'create' ? 'var(--blue)' : 'var(--blue)';
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 4,
        right: 4,
        height: h,
        background: tone,
        border: `1px dashed ${border}`,
        borderRadius: 5,
        display: 'flex',
        alignItems: 'flex-start',
        padding: '4px 8px',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <Mono style={{ fontSize: 10, color: 'var(--blue)' }}>{ghost.label}</Mono>
    </div>
  );
}

function AllDayCell({
  day,
  blocks,
  highlight,
  onChipClick,
  onChipHover,
  onChipHoverLeave,
  onCellMouseDown,
  registerRef,
}: {
  day: CalendarDay;
  blocks: Block[];
  highlight: boolean;
  onChipClick: (b: Block) => void;
  onChipHover: (b: Block, ev: React.MouseEvent) => void;
  onChipHoverLeave: () => void;
  onCellMouseDown?: (ev: React.MouseEvent) => void;
  registerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={registerRef}
      data-allday-date={day.date}
      onMouseDown={onCellMouseDown}
      style={{
        flex: 1,
        minWidth: 0,
        borderRight: '1px solid var(--line)',
        padding: '5px 6px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        background: highlight ? 'rgba(96,165,250,0.18)' : 'transparent',
        cursor: onCellMouseDown ? 'pointer' : 'default',
        userSelect: 'none',
        minHeight: 28,
      }}
    >
      {blocks.map((b) => (
        <ExternalChip
          key={b.id}
          block={b}
          dayDate={day.date}
          onClick={() => onChipClick(b)}
          onHover={(ev) => onChipHover(b, ev)}
          onHoverLeave={onChipHoverLeave}
        />
      ))}
    </div>
  );
}

function ExternalChip({
  block,
  dayDate,
  onClick,
  onHover,
  onHoverLeave,
}: {
  block: Block;
  dayDate: string;
  onClick: () => void;
  onHover: (ev: React.MouseEvent) => void;
  onHoverLeave: () => void;
}) {
  const sourceLabel =
    block.source && block.source !== 'local' ? SOURCE_LABEL[block.source] : '';
  const seg = blockSegment(block, dayDate);
  const totalDays = spanDayCount(block);
  const dayIndex = totalDays > 1 ? dayOffset(block.date, dayDate) + 1 : 1;
  const allDay = isAllDayBlock(block);
  const unscheduled = isUnscheduledBlock(block);
  const timeLabel = unscheduled
    ? '미정'
    : !seg
      ? block.start
      : totalDays > 1
        ? allDay
          ? '종일'
          : seg.start === '00:00' && seg.end === '24:00'
            ? '종일'
            : `${seg.start}–${seg.end === '24:00' ? '24:00' : seg.end}`
        : allDay
          ? '종일'
          : block.start;
  return (
    <button
      data-allday-chip="1"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseMove={onHover}
      onMouseLeave={onHoverLeave}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 7px',
        border: '1px dashed var(--line)',
        borderRadius: 4,
        background: 'transparent',
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
        opacity: block.done ? 0.55 : 0.9,
      }}
    >
      <Mono
        style={{
          fontSize: 9,
          color: 'var(--ink-mute)',
          letterSpacing: '0.04em',
          flexShrink: 0,
        }}
      >
        {timeLabel}
      </Mono>
      <span
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--ink-soft)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
          minWidth: 0,
          textDecoration: block.done ? 'line-through' : 'none',
        }}
      >
        {block.title}
      </span>
      {totalDays > 1 && (
        <Mono
          style={{
            fontSize: 8,
            color: 'var(--ink-mute)',
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}
        >
          {dayIndex}/{totalDays}
        </Mono>
      )}
      {sourceLabel && (
        <Mono
          style={{
            fontSize: 8,
            color: 'var(--ink-mute)',
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}
        >
          {sourceLabel}
        </Mono>
      )}
    </button>
  );
}

function BlockBar({
  block,
  segment,
  startFrac,
  endFrac,
  col,
  totalCols,
  fading,
  external,
  hourStart,
  subtaskCount,
  onMouseDown,
  onHover,
  onHoverLeave,
  onDone,
  statsExcluded = false,
}: {
  block: Block;
  segment: { start: string; end: string; isMulti: boolean };
  startFrac: number;
  endFrac: number;
  col: number;
  totalCols: number;
  fading: boolean;
  external: boolean;
  hourStart: number;
  subtaskCount?: { total: number; done: number };
  statsExcluded?: boolean;
  onMouseDown: (ev: React.MouseEvent, gridY: number) => void;
  onHover: (ev: React.MouseEvent) => void;
  onHoverLeave: () => void;
  onDone?: (id: string, done: boolean) => void;
}) {
  const top = (startFrac - hourStart) * HOUR_HEIGHT;
  const h = Math.max(20, (endFrac - startFrac) * HOUR_HEIGHT - 4);
  const c = blockColor(block);
  const sourceTag =
    external && block.source && block.source !== 'local'
      ? SOURCE_LABEL[block.source]
      : null;
  const sliced = totalCols > 1;
  const colFormula = `((100% - 8px - ${totalCols - 1}px) / ${totalCols})`;
  const leftStyle: number | string = sliced
    ? `calc(4px + ${col} * (${colFormula} + 1px))`
    : 4;
  const widthStyle: number | string | undefined = sliced
    ? `calc(${colFormula})`
    : undefined;
  const rightStyle: number | undefined = sliced ? undefined : 4;
  return (
    <div
      data-block-bar="1"
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const grid = (e.currentTarget.parentElement as HTMLDivElement | null);
        const rect = grid?.getBoundingClientRect();
        const gridY = rect ? e.clientY - rect.top : 0;
        onMouseDown(e, gridY);
      }}
      onMouseEnter={onHover}
      onMouseMove={onHover}
      onMouseLeave={onHoverLeave}
      style={{
        position: 'absolute',
        top,
        left: leftStyle,
        right: rightStyle,
        width: widthStyle,
        height: h,
        background: c.bg,
        border: external ? `1px dashed ${c.border}` : `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.ink}`,
        borderRadius: 5,
        padding: sliced ? '4px 6px' : '5px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        overflow: 'hidden',
        cursor: external ? 'pointer' : 'grab',
        textAlign: 'left',
        fontFamily: 'inherit',
        opacity: statsExcluded ? 0.3 : fading ? 0.25 : block.done ? 0.55 : external ? 0.92 : 1,
        filter: statsExcluded ? 'grayscale(0.75)' : undefined,
        userSelect: 'none',
      }}
    >
      {onDone && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDone(block.id, !block.done);
          }}
          title={block.done ? '완료 취소' : '완료'}
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            width: 16,
            height: 16,
            border: `1px solid ${block.done ? c.ink : c.border}`,
            borderRadius: 3,
            background: block.done ? c.ink : 'transparent',
            color: block.done ? 'var(--on-accent, #fff)' : c.ink,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            opacity: block.done ? 0.85 : 0.5,
            zIndex: 2,
          }}
        >
          {block.done && <CheckIcon size={10} />}
        </button>
      )}
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 500,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textDecoration: block.done ? 'line-through' : 'none',
          paddingRight: onDone ? 20 : 0,
        }}
      >
        {block.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Mono
          style={{
            fontSize: 9.5,
            color: c.ink,
            letterSpacing: '0.04em',
          }}
        >
          {segment.isMulti ? `${segment.start}–${segment.end}` : block.start}
        </Mono>
        {block.attendees.length > 0 && (
          <span
            style={{
              fontSize: 9.5,
              color: 'var(--ink-mute)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              minWidth: 0,
            }}
          >
            {block.attendees.join(', ')}
          </span>
        )}
        {subtaskCount && subtaskCount.total > 0 && (
          <Mono
            style={{
              fontSize: 9,
              color:
                subtaskCount.done === subtaskCount.total
                  ? 'var(--ok)'
                  : 'var(--ink-mute)',
              flexShrink: 0,
            }}
            title="체크리스트"
          >
            ☐ {subtaskCount.done}/{subtaskCount.total}
          </Mono>
        )}
        {sourceTag && (
          <Mono
            style={{
              marginLeft: 'auto',
              fontSize: 8.5,
              color: 'var(--ink-mute)',
              letterSpacing: '0.08em',
              flexShrink: 0,
              opacity: 0.8,
            }}
          >
            {sourceTag}
          </Mono>
        )}
      </div>
    </div>
  );
}

function HoverCard({
  block,
  segment,
  dayDate,
  x,
  y,
}: {
  block: Block;
  segment: { start: string; end: string; isMulti: boolean };
  dayDate: string;
  x: number;
  y: number;
}) {
  const W = 320;
  const H_EST = 260;
  const margin = 12;
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  let left = x + 14;
  let top = y + 14;
  if (left + W + margin > winW) left = Math.max(margin, x - W - 14);
  if (top + H_EST + margin > winH) top = Math.max(margin, y - H_EST - 14);

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 9998,
        pointerEvents: 'none',
        width: W,
        maxHeight: H_EST,
        overflow: 'hidden',
        borderRadius: 6,
        boxShadow:
          '0 10px 30px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.14)',
      }}
    >
      <BlockInfoView block={block} dayDate={dayDate} segment={segment} compact />
    </div>
  );
}

function DayBudgetPopover({
  date,
  left,
  top,
  onClose,
}: {
  date: string;
  left: number;
  top: number;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  const gs = (key: string, def: string) =>
    typeof window !== 'undefined' ? (window.localStorage.getItem(key) ?? def) : def;

  const getDayVal = (field: string, globalKey: string, def: string) => {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(DAY_BUDGET_PREFIX + date) : null;
    if (raw) {
      try {
        return (JSON.parse(raw) as Record<string, string>)[field] ?? gs(globalKey, def);
      } catch { /* fall through */ }
    }
    return gs(globalKey, def);
  };

  const [sleepEnd, setSleepEnd] = useState(() => getDayVal('sleepEnd', GLOBAL_SLEEP_END_KEY, '07:00'));
  const [sleepStart, setSleepStart] = useState(() => getDayVal('sleepStart', GLOBAL_SLEEP_START_KEY, '23:00'));
  const [activeStart, setActiveStart] = useState(() => getDayVal('activeStart', GLOBAL_ACTIVE_START_KEY, '09:00'));
  const [activeEnd, setActiveEnd] = useState(() => getDayVal('activeEnd', GLOBAL_ACTIVE_END_KEY, '21:00'));
  const [isCustom, setIsCustom] = useState(
    () => typeof window !== 'undefined' && !!window.localStorage.getItem(DAY_BUDGET_PREFIX + date),
  );

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (e.target instanceof Node && ref.current.contains(e.target)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [onClose]);

  const save = (next: { sleepStart: string; sleepEnd: string; activeStart: string; activeEnd: string }) => {
    window.localStorage.setItem(DAY_BUDGET_PREFIX + date, JSON.stringify(next));
    setIsCustom(true);
    window.dispatchEvent(new CustomEvent('bento:budget-changed'));
  };

  const reset = () => {
    window.localStorage.removeItem(DAY_BUDGET_PREFIX + date);
    setSleepEnd(gs(GLOBAL_SLEEP_END_KEY, '07:00'));
    setSleepStart(gs(GLOBAL_SLEEP_START_KEY, '23:00'));
    setActiveStart(gs(GLOBAL_ACTIVE_START_KEY, '09:00'));
    setActiveEnd(gs(GLOBAL_ACTIVE_END_KEY, '21:00'));
    setIsCustom(false);
    window.dispatchEvent(new CustomEvent('bento:budget-changed'));
  };

  const W = 240;
  const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const clampedLeft = Math.min(left, winW - W - 8);
  const clampedTop = Math.min(top, winH - 240);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: clampedLeft,
        top: clampedTop,
        zIndex: 10000,
        width: W,
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.12)',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Mono style={{ fontSize: 10.5, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
          {date} 예산
        </Mono>
        {isCustom && (
          <Mono style={{ fontSize: 8.5, color: 'var(--blue)', letterSpacing: '0.04em' }}>
            커스텀
          </Mono>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>기상 / 취침</Mono>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <TimeSelect
            value={sleepEnd}
            onChange={(v) => {
              setSleepEnd(v);
              save({ sleepStart, sleepEnd: v, activeStart, activeEnd });
            }}
            style={{ flex: 1 }}
          />
          <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>–</Mono>
          <TimeSelect
            value={sleepStart}
            onChange={(v) => {
              setSleepStart(v);
              save({ sleepStart: v, sleepEnd, activeStart, activeEnd });
            }}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>활동 시간</Mono>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <TimeSelect
            value={activeStart}
            onChange={(v) => {
              setActiveStart(v);
              save({ sleepStart, sleepEnd, activeStart: v, activeEnd });
            }}
            style={{ flex: 1 }}
          />
          <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>–</Mono>
          <TimeSelect
            value={activeEnd}
            onChange={(v) => {
              setActiveEnd(v);
              save({ sleepStart, sleepEnd, activeStart, activeEnd: v });
            }}
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {isCustom && (
        <button
          onClick={reset}
          style={{
            marginTop: 2,
            padding: '5px 0',
            background: 'transparent',
            border: '1px solid var(--line)',
            borderRadius: 4,
            color: 'var(--ink-mute)',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.02em',
          }}
        >
          기본값으로 초기화
        </button>
      )}
    </div>
  );
}

interface LaidOutBlock {
  block: Block;
  segment: { start: string; end: string; isMulti: boolean };
  startFrac: number;
  endFrac: number;
  col: number;
  totalCols: number;
}

function layoutDayBlocks(
  blocks: Block[],
  dayDate: string,
  hourStart: number,
  hourEnd: number,
  hidingBlockId: string | null,
): LaidOutBlock[] {
  type Item = {
    block: Block;
    segment: { start: string; end: string; isMulti: boolean };
    startFrac: number;
    endFrac: number;
  };
  const items: Item[] = [];
  for (const b of blocks) {
    if (hidingBlockId && b.id === hidingBlockId) continue;
    const seg = blockSegment(b, dayDate);
    if (!seg) continue;
    const s = parseTime(seg.start);
    const e = parseTime(seg.end);
    if (s === null || e === null) continue;
    const sClamp = Math.max(hourStart, s);
    const eClamp = Math.min(hourEnd + 1, e);
    if (eClamp <= sClamp) continue;
    items.push({ block: b, segment: seg, startFrac: sClamp, endFrac: eClamp });
  }
  items.sort((a, b) => a.startFrac - b.startFrac || b.endFrac - a.endFrac);

  const result: LaidOutBlock[] = [];
  let cluster: Item[] = [];
  let clusterMaxEnd = -Infinity;

  const flush = () => {
    if (cluster.length === 0) return;
    const colEnd: number[] = [];
    const colOf: number[] = [];
    for (const it of cluster) {
      let placed = -1;
      for (let i = 0; i < colEnd.length; i++) {
        if ((colEnd[i] ?? -Infinity) <= it.startFrac + 1e-9) {
          colEnd[i] = it.endFrac;
          placed = i;
          break;
        }
      }
      if (placed === -1) {
        placed = colEnd.length;
        colEnd.push(it.endFrac);
      }
      colOf.push(placed);
    }
    const totalCols = Math.max(1, colEnd.length);
    for (let i = 0; i < cluster.length; i++) {
      const it = cluster[i]!;
      result.push({
        block: it.block,
        segment: it.segment,
        startFrac: it.startFrac,
        endFrac: it.endFrac,
        col: colOf[i] ?? 0,
        totalCols,
      });
    }
    cluster = [];
    clusterMaxEnd = -Infinity;
  };

  for (const it of items) {
    if (cluster.length > 0 && it.startFrac >= clusterMaxEnd - 1e-9) {
      flush();
    }
    cluster.push(it);
    clusterMaxEnd = Math.max(clusterMaxEnd, it.endFrac);
  }
  flush();
  return result;
}

function findDayHit(
  refs: Map<string, HTMLDivElement>,
  clientX: number,
  clientY: number,
): { date: string; y: number } | null {
  for (const [date, el] of refs.entries()) {
    const rect = el.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return { date, y: clientY - rect.top };
    }
  }
  return null;
}

function findAllDayHit(
  refs: Map<string, HTMLDivElement>,
  clientX: number,
  clientY: number,
): string | null {
  for (const [date, el] of refs.entries()) {
    const rect = el.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return date;
    }
  }
  return null;
}

function snap(frac: number, hourStart: number, hourEnd: number): number {
  const q = Math.round(frac / SNAP_FRAC) * SNAP_FRAC;
  return clampFrac(q, hourStart, hourEnd);
}

function clampFrac(frac: number, hourStart: number, hourEnd: number): number {
  if (frac < hourStart) return hourStart;
  if (frac > hourEnd + 1) return hourEnd + 1;
  return frac;
}

function fracToHHMM(frac: number): string {
  const total = Math.round(frac * 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${pad(h)}:${pad(m)}`;
}

function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function hasTaskTransfer(e: React.DragEvent): boolean {
  const types = Array.from(e.dataTransfer.types);
  return types.includes('application/x-bento-task');
}

function readTaskIdFromDataTransfer(e: React.DragEvent): string | null {
  if (!hasTaskTransfer(e)) return null;
  const id = e.dataTransfer.getData('application/x-bento-task');
  return id || null;
}

function spansDay(b: Block, day: string): boolean {
  const startDay = b.date;
  const endDay = b.endDate ?? b.date;
  return day >= startDay && day <= endDay;
}

function blockSegment(
  b: Block,
  day: string,
): { start: string; end: string; isMulti: boolean } | null {
  const startDay = b.date;
  const endDay = b.endDate ?? b.date;
  if (day < startDay || day > endDay) return null;
  const isMulti = startDay !== endDay;
  if (!isMulti) return { start: b.start, end: b.end, isMulti: false };
  const isStart = day === startDay;
  const isEnd = day === endDay;
  const start = isStart ? b.start : '00:00';
  const end = isEnd ? b.end : '24:00';
  return { start, end, isMulti: true };
}

