import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Block, Task } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import { CheckIcon, ClockIcon } from '../../components/atoms/Icons';
import { blockColor, isLocal, isUnscheduledBlock } from './blockMeta';
import { resolveLabel } from './labelCatalog';
import {
  eventNoteKeysFromBlock,
  listAllEventSubtaskCounts,
  type EventSubtaskCount,
} from '../../lib/tauri';
import { weekdayLabel } from '../../lib/weekStart';

export type IncompleteGrouping = 'date' | 'task';

export interface IncompleteItems {
  /** 미완료 할 일 전체 */
  tasks: Task[];
  /** 미완료 로컬 블록. 외부 캘린더·가상 task 블록 제외 */
  blocks: Block[];
  /** taskId → 연결된 실제 블록(완료 포함, 날짜순) */
  linkedBlocks: Map<string, Block[]>;
  /** 티켓 수. 미완료 블록이 대신 서 있는 할 일은 중복 계산하지 않는다 */
  count: number;
}

export function collectIncomplete(blocks: Block[], tasks: Task[]): IncompleteItems {
  const linkedBlocks = new Map<string, Block[]>();
  const openBlocks: Block[] = [];
  for (const b of blocks) {
    if (!isLocal(b) || isVirtualTaskBlock(b)) continue;
    if (b.taskId) {
      const arr = linkedBlocks.get(b.taskId);
      if (arr) arr.push(b);
      else linkedBlocks.set(b.taskId, [b]);
    }
    if (!b.done) openBlocks.push(b);
  }
  for (const arr of linkedBlocks.values()) arr.sort(compareBlocks);
  const openTasks = tasks.filter((t) => !t.done);
  const represented = new Set<string>();
  for (const b of openBlocks) {
    if (b.taskId) represented.add(b.taskId);
  }
  const count = openBlocks.length + openTasks.filter((t) => !represented.has(t.id)).length;
  return { tasks: openTasks, blocks: openBlocks, linkedBlocks, count };
}

interface Props {
  items: IncompleteItems;
  todayKey: string;
  rangeDays: number;
  onJumpToDate: (date: string) => void;
  onTaskClick?: (task: Task) => void;
  onTaskDone?: (taskId: string, done: boolean) => void;
  onBlockDone?: (id: string, done: boolean) => void;
}

export function IncompletePanel({
  items,
  todayKey,
  rangeDays,
  onJumpToDate,
  onTaskClick,
  onTaskDone,
  onBlockDone,
}: Props) {
  const [grouping, setGrouping] = useState<IncompleteGrouping>('date');
  const [counts, setCounts] = useState<Map<string, EventSubtaskCount>>(() => new Map());

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      listAllEventSubtaskCounts().then((rows) => {
        if (cancelled) return;
        setCounts(new Map(rows.map((r) => [r.eventKey, r])));
      });
    };
    load();
    window.addEventListener('bento:subtasks-changed', load);
    return () => {
      cancelled = true;
      window.removeEventListener('bento:subtasks-changed', load);
    };
  }, []);

  const sections = useMemo(() => groupByDate(buildDateEntries(items), todayKey), [items, todayKey]);
  const taskGroups = useMemo(() => groupByTask(items), [items]);

  const openTask = (t: Task, date: string | null) => {
    if (date) onJumpToDate(date);
    else onTaskClick?.(t);
  };

  const renderTaskTrailing = (t: Task) => {
    const est = estLabel(t.estMin);
    const progress = progressOf(counts, `task:${t.id}`);
    if (!est && !progress) return null;
    return (
      <>
        {est && (
          <Mono
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontSize: 10,
              color: 'var(--ink-mute)',
              flexShrink: 0,
            }}
          >
            <ClockIcon size={10} /> {est}
          </Mono>
        )}
        {progress && <ProgressLabel done={progress.done} total={progress.total} />}
      </>
    );
  };

  const renderBlockTrailing = (b: Block) => {
    const progress = progressOf(counts, eventNoteKeysFromBlock(b).eventKey);
    return progress ? <ProgressLabel done={progress.done} total={progress.total} /> : null;
  };

  const renderEntry = (e: Entry) => {
    if (e.block) {
      const b = e.block;
      return (
        <IncompleteRow
          key={e.key}
          meta={blockTimeLabel(b)}
          metaColor={blockColor(b).ink}
          accent={blockColor(b).ink}
          dashed={false}
          title={b.title}
          done={b.done}
          tooltip={`${b.title} · 클릭하면 ${b.date}로 이동`}
          trailing={renderBlockTrailing(b)}
          onClick={() => onJumpToDate(b.date)}
          onDone={onBlockDone ? () => onBlockDone(b.id, !b.done) : undefined}
        />
      );
    }
    const t = e.task!;
    return (
      <IncompleteRow
        key={e.key}
        meta={e.time ? `TODO · ${e.time}` : 'TODO'}
        metaColor="var(--blue)"
        accent={resolveLabel(t.kind, t.color).color}
        dashed
        title={t.title}
        done={t.done}
        tooltip={
          e.date
            ? `${t.title} · 클릭하면 ${e.date}로 이동`
            : `${t.title} · 날짜 없음, 클릭하면 편집`
        }
        trailing={renderTaskTrailing(t)}
        onClick={() => openTask(t, e.date)}
        onDone={onTaskDone ? () => onTaskDone(t.id, !t.done) : undefined}
      />
    );
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '6px var(--card-pad)',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <SegmentedToggle
          value={grouping}
          onChange={setGrouping}
          options={[
            { value: 'date', label: '날짜별', title: '지연 → 오늘 → 예정 → 미정 순으로 묶어 보기' },
            {
              value: 'task',
              label: '할 일별',
              title: '할 일 아래에 연결된 블록과 서브태스크 진행률',
            },
          ]}
        />
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>클릭하면 해당 날짜로</span>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '10px var(--card-pad) 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {items.count === 0 ? (
          <div
            style={{
              padding: '24px 0',
              textAlign: 'center',
              color: 'var(--ink-mute)',
              fontSize: 11.5,
              fontStyle: 'italic',
            }}
          >
            미완료 티켓 없음
          </div>
        ) : grouping === 'date' ? (
          sections.map((section) => (
            <section
              key={section.bucket}
              style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
            >
              <SectionHeader label={section.label} color={section.color} count={section.total} />
              {section.groups.map((g) => {
                const date = g.date;
                return (
                  <div
                    key={date ?? 'undated'}
                    style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                  >
                    {date && (
                      <button
                        onClick={() => onJumpToDate(date)}
                        title={`${date}로 이동`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: 'transparent',
                          border: 'none',
                          padding: '2px 0',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          color: date === todayKey ? 'var(--blue)' : 'var(--ink-soft)',
                        }}
                      >
                        <Mono style={{ fontSize: 10.5, fontWeight: 600 }}>
                          {formatDate(date, todayKey)}
                        </Mono>
                        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                          {g.entries.length}
                        </Mono>
                      </button>
                    )}
                    {g.entries.map(renderEntry)}
                  </div>
                );
              })}
            </section>
          ))
        ) : (
          <>
            {taskGroups.groups.length > 0 && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SectionHeader label="할 일" color="var(--blue)" count={taskGroups.groups.length} />
                {taskGroups.groups.map((g) => {
                  const bucket = bucketOfDate(g.date, null, todayKey);
                  return (
                    <div
                      key={g.task.id}
                      style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                    >
                      <IncompleteRow
                        meta={g.date ? formatDate(g.date, todayKey) : '미정'}
                        metaColor={bucketColor(bucket)}
                        accent={resolveLabel(g.task.kind, g.task.color).color}
                        dashed
                        title={g.task.title}
                        done={g.task.done}
                        tooltip={
                          g.date
                            ? `${g.task.title} · 클릭하면 ${g.date}로 이동`
                            : `${g.task.title} · 날짜 없음, 클릭하면 편집`
                        }
                        trailing={renderTaskTrailing(g.task)}
                        onClick={() => openTask(g.task, g.date)}
                        onDone={onTaskDone ? () => onTaskDone(g.task.id, !g.task.done) : undefined}
                      />
                      {g.blocks.map((b) => (
                        <IncompleteRow
                          key={b.id}
                          indent
                          meta={`${formatDate(b.date, todayKey)} · ${blockTimeLabel(b)}`}
                          metaColor={blockColor(b).ink}
                          accent={blockColor(b).ink}
                          dashed={false}
                          title={b.title}
                          done={b.done}
                          tooltip={`${b.title} · 클릭하면 ${b.date}로 이동`}
                          trailing={renderBlockTrailing(b)}
                          onClick={() => onJumpToDate(b.date)}
                          onDone={onBlockDone ? () => onBlockDone(b.id, !b.done) : undefined}
                        />
                      ))}
                    </div>
                  );
                })}
              </section>
            )}
            {taskGroups.orphans.length > 0 && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SectionHeader
                  label="할 일 미연결 블록"
                  color="var(--ink-soft)"
                  count={taskGroups.orphans.length}
                />
                {taskGroups.orphans.map((b) => (
                  <IncompleteRow
                    key={b.id}
                    meta={`${formatDate(b.date, todayKey)} · ${blockTimeLabel(b)}`}
                    metaColor={bucketColor(bucketOfDate(b.date, b.endDate ?? null, todayKey))}
                    accent={blockColor(b).ink}
                    dashed={false}
                    title={b.title}
                    done={b.done}
                    tooltip={`${b.title} · 클릭하면 ${b.date}로 이동`}
                    trailing={renderBlockTrailing(b)}
                    onClick={() => onJumpToDate(b.date)}
                    onDone={onBlockDone ? () => onBlockDone(b.id, !b.done) : undefined}
                  />
                ))}
              </section>
            )}
          </>
        )}
        <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
          블록은 표시 범위(±{rangeDays}일) 안의 것만 포함. 할 일은 전체.
        </span>
      </div>
    </div>
  );
}

export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  compact,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (next: T) => void;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 2,
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 6,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            title={o.title}
            style={{
              padding: compact ? '2px 8px' : '3px 9px',
              border: 'none',
              background: active ? 'var(--bg-shade)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-soft)',
              fontSize: compact ? 10.5 : 11,
              cursor: 'pointer',
              borderRadius: 4,
              fontFamily: 'inherit',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({ label, color, count }: { label: string; color: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: color, flexShrink: 0 }} />
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
        }}
      >
        {label}
      </span>
      <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{count}</Mono>
    </div>
  );
}

function ProgressLabel({ done, total }: { done: number; total: number }) {
  return (
    <Mono
      style={{
        fontSize: 10,
        color: done === total ? 'var(--ok)' : 'var(--ink-mute)',
        flexShrink: 0,
      }}
      title={`서브태스크 ${done}/${total}`}
    >
      {done}/{total}
    </Mono>
  );
}

function IncompleteRow({
  meta,
  metaColor,
  accent,
  dashed,
  title,
  done,
  tooltip,
  trailing,
  indent,
  onClick,
  onDone,
}: {
  meta: string;
  metaColor: string;
  accent: string;
  dashed: boolean;
  title: string;
  done: boolean;
  tooltip: string;
  trailing?: ReactNode;
  indent?: boolean;
  onClick?: () => void;
  onDone?: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onClick?.();
      }}
      title={tooltip}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        marginLeft: indent ? 16 : 0,
        border: dashed ? '1px dashed var(--line-strong, var(--line))' : '1px solid var(--line)',
        borderLeft: `3px ${dashed ? 'dashed' : 'solid'} ${accent}`,
        borderRadius: 5,
        background: 'var(--bg)',
        cursor: onClick ? 'pointer' : 'default',
        opacity: done ? 0.55 : 1,
        minWidth: 0,
      }}
    >
      <Mono style={{ fontSize: 9.5, color: metaColor, letterSpacing: '0.04em', flexShrink: 0 }}>
        {meta}
      </Mono>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 12,
          fontWeight: 500,
          color: 'var(--ink)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textDecoration: done ? 'line-through' : 'none',
        }}
      >
        {title}
      </span>
      {trailing}
      {onDone && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
          title={done ? '완료 취소' : '완료'}
          style={{
            background: 'transparent',
            border: 'none',
            color: done ? 'var(--ok)' : 'var(--ink-mute)',
            cursor: 'pointer',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            opacity: done ? 1 : 0.55,
            flexShrink: 0,
          }}
        >
          <CheckIcon size={11} />
        </button>
      )}
    </div>
  );
}

type Bucket = 'overdue' | 'today' | 'upcoming' | 'undated';

const BUCKETS: { id: Bucket; label: string; color: string }[] = [
  { id: 'overdue', label: '지연', color: 'var(--err)' },
  { id: 'today', label: '오늘', color: 'var(--blue)' },
  { id: 'upcoming', label: '예정', color: 'var(--ink-soft)' },
  { id: 'undated', label: '미정', color: 'var(--ink-mute)' },
];

function bucketColor(bucket: Bucket): string {
  return BUCKETS.find((b) => b.id === bucket)?.color ?? 'var(--ink-soft)';
}

interface Entry {
  key: string;
  date: string | null;
  time: string;
  task?: Task;
  block?: Block;
}

interface DateGroup {
  date: string | null;
  entries: Entry[];
}

interface BucketSection {
  bucket: Bucket;
  label: string;
  color: string;
  total: number;
  groups: DateGroup[];
}

interface TaskGroup {
  task: Task;
  date: string | null;
  blocks: Block[];
}

/** 날짜별 항목. 미완료 블록이 연결된 할 일은 스트립과 마찬가지로 블록이 대신 선다. */
function buildDateEntries(items: IncompleteItems): Entry[] {
  const represented = new Set<string>();
  const out: Entry[] = [];
  for (const b of items.blocks) {
    if (b.taskId) represented.add(b.taskId);
    out.push({ key: `block:${b.id}`, date: b.date, time: b.start, block: b });
  }
  for (const t of items.tasks) {
    if (represented.has(t.id)) continue;
    out.push({ key: `task:${t.id}`, date: taskDate(t), time: taskTime(t), task: t });
  }
  return out;
}

function groupByDate(entries: Entry[], todayKey: string): BucketSection[] {
  const byBucket = new Map<Bucket, Map<string, Entry[]>>();
  for (const e of entries) {
    const bucket = bucketOfDate(e.date, e.block?.endDate ?? null, todayKey);
    let dates = byBucket.get(bucket);
    if (!dates) {
      dates = new Map();
      byBucket.set(bucket, dates);
    }
    const k = e.date ?? '';
    const arr = dates.get(k);
    if (arr) arr.push(e);
    else dates.set(k, [e]);
  }
  const out: BucketSection[] = [];
  for (const def of BUCKETS) {
    const dates = byBucket.get(def.id);
    if (!dates) continue;
    const groups: DateGroup[] = Array.from(dates.entries())
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([date, list]) => ({ date: date || null, entries: list.sort(compareEntries) }));
    out.push({
      bucket: def.id,
      label: def.label,
      color: def.color,
      total: groups.reduce((n, g) => n + g.entries.length, 0),
      groups,
    });
  }
  return out;
}

/** 할 일별 그룹. 날짜는 미완료 연결 블록 → 할 일 자체 날짜 순으로 잡는다. */
function groupByTask(items: IncompleteItems): { groups: TaskGroup[]; orphans: Block[] } {
  const openTaskIds = new Set(items.tasks.map((t) => t.id));
  const groups: TaskGroup[] = items.tasks.map((t) => {
    const linked = items.linkedBlocks.get(t.id) ?? [];
    const firstOpen = linked.find((b) => !b.done);
    return { task: t, date: firstOpen?.date ?? taskDate(t), blocks: linked };
  });
  groups.sort((a, b) => {
    const ad = a.date ?? '9999-99-99';
    const bd = b.date ?? '9999-99-99';
    if (ad !== bd) return ad < bd ? -1 : 1;
    return a.task.title.localeCompare(b.task.title);
  });
  const orphans = items.blocks.filter((b) => !b.taskId || !openTaskIds.has(b.taskId));
  return { groups, orphans };
}

function bucketOfDate(date: string | null, endDate: string | null, todayKey: string): Bucket {
  if (!date) return 'undated';
  const end = endDate && endDate > date ? endDate : date;
  if (end < todayKey) return 'overdue';
  if (date <= todayKey) return 'today';
  return 'upcoming';
}

/** 스트립과 같은 순서: 미정 블록 → 시간순 → 시간 없는 할 일. */
function compareEntries(a: Entry, b: Entry): number {
  const ra = entryRank(a);
  const rb = entryRank(b);
  if (ra !== rb) return ra - rb;
  if (a.time !== b.time) return a.time < b.time ? -1 : 1;
  if (!!a.block !== !!b.block) return a.block ? -1 : 1;
  return 0;
}

function entryRank(e: Entry): number {
  if (e.time) return 1;
  return e.block ? 0 : 2;
}

function compareBlocks(a: Block, b: Block): number {
  if (a.date !== b.date) return a.date < b.date ? -1 : 1;
  if (a.start !== b.start) return a.start < b.start ? -1 : 1;
  return 0;
}

function progressOf(
  counts: Map<string, EventSubtaskCount>,
  eventKey: string,
): { done: number; total: number } | null {
  const c = counts.get(eventKey);
  return c && c.total > 0 ? { done: c.done, total: c.total } : null;
}

function isVirtualTaskBlock(b: Block): boolean {
  return b.id.startsWith('task:');
}

function blockTimeLabel(b: Block): string {
  return isUnscheduledBlock(b) ? '미정' : `${b.start}–${b.end}`;
}

function taskDate(t: Task): string | null {
  return dateOf(t.startAt) ?? dateOf(t.due);
}

function taskTime(t: Task): string {
  return timeOf(t.startAt) ?? timeOf(t.due) ?? '';
}

/** `MM-DD 요일`. 올해가 아니면 연도를 앞에 붙인다. */
function formatDate(key: string, todayKey: string): string {
  const d = parseKey(key);
  if (!d) return key;
  const md = `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${weekdayLabel(d)}`;
  return key.slice(0, 4) === todayKey.slice(0, 4) ? md : `${d.getFullYear()}-${md}`;
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
