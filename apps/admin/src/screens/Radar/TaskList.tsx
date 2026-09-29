import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Mono } from '../../components/atoms/Atoms';
import type { RadarTask, TaskStatus } from './types';
import { TASK_STATUS_LABELS, TASK_STATUS_TONES, isDescendantOf } from './types';
import { parseTitle } from './parseTitle';
import { ConfirmDialog } from './GoalForm';

interface TaskListProps {
  tasks: RadarTask[];
  onTaskClick: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDone: (id: string, done: boolean) => void;
  onAdd: () => void;
  onAddSubTask: (parentId: string) => void;
  onTaskDelete: (id: string) => void;
  onReparent: (id: string, parentTaskId: string | null) => void;
}

const TONE_COLOR: Record<'mute' | 'blue' | 'warn' | 'ok' | 'err', string> = {
  mute: 'var(--ink-mute)',
  blue: 'var(--blue)',
  warn: 'var(--warn)',
  ok: 'var(--ok)',
  err: 'var(--err)',
};

const TONE_BG: Record<'mute' | 'blue' | 'warn' | 'ok' | 'err', string> = {
  mute: 'var(--bg-shade)',
  blue: 'var(--blue-soft)',
  warn: 'var(--warn-soft)',
  ok: 'var(--ok-soft)',
  err: 'var(--err-soft)',
};

export function TaskList({
  tasks,
  onTaskClick,
  onStatusChange,
  onDone,
  onAdd,
  onAddSubTask,
  onTaskDelete,
  onReparent,
}: TaskListProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [hideCompleted, setHideCompleted] = useState(false);

  const onToggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 최상위 task = parentTaskId가 없는 task
  const topLevel = tasks.filter((t) => !t.parentTaskId);
  const mine = topLevel.filter((t) => t.isMine && t.status !== 'done');
  const delegated = topLevel.filter((t) => !t.isMine && t.status !== 'done');
  // 완료: updatedAt 내림차순(최근 완료 먼저)
  const finished = topLevel
    .filter((t) => t.status === 'done')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: 'var(--gap-lg) calc(var(--gap-lg) + 6px) var(--gap-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--gap)',
          gap: 6,
        }}
      >
        <Mono
          style={{
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-mute)',
          }}
        >
          할 일
        </Mono>
        <button
          onClick={() => setHideCompleted((v) => !v)}
          style={{
            marginLeft: 'auto',
            background: 'transparent',
            color: hideCompleted ? 'var(--blue)' : 'var(--ink-mute)',
            border: `1px solid ${hideCompleted ? 'var(--blue)' : 'var(--line)'}`,
            borderRadius: 5,
            fontSize: 11,
            padding: '3px 8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {hideCompleted ? '완료 표시' : '완료 숨기기'}
        </button>
        <button
          onClick={() => onAdd()}
          style={{
            background: 'var(--ink)',
            color: 'var(--on-accent)',
            border: 'none',
            borderRadius: 5,
            fontSize: 11.5,
            padding: '4px 10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontWeight: 500,
          }}
        >
          + 추가
        </button>
      </div>

      <Group title={`내 할 일 · ${mine.length}`}>
        {mine.length === 0 ? (
          <EmptyRow text="할 일이 없어요" />
        ) : (
          renderTree(mine, tasks, {
            onTaskClick,
            onStatusChange,
            onDone: (id) => onDone(id, true),
            onAddSubTask,
            onTaskDelete,
            onReparent,
            collapsedIds,
            onToggleCollapse,
            hideCompleted,
            draggingId,
            dragOverId,
            setDraggingId,
            setDragOverId,
          })
        )}
      </Group>

      <Group title={`위임한 일 · ${delegated.length}`} style={{ marginTop: 'var(--gap-lg)' }}>
        {delegated.length === 0 ? (
          <EmptyRow text="위임한 일이 없어요" />
        ) : (
          renderTree(delegated, tasks, {
            onTaskClick,
            onStatusChange,
            onDone: (id) => onDone(id, true),
            onAddSubTask,
            onTaskDelete,
            onReparent,
            collapsedIds,
            onToggleCollapse,
            hideCompleted,
            draggingId,
            dragOverId,
            setDraggingId,
            setDragOverId,
          })
        )}
      </Group>

      {!hideCompleted && finished.length > 0 && (
        <Group title={`완료 · ${finished.length}`} style={{ marginTop: 'var(--gap-lg)' }}>
          <div style={{ opacity: 0.5 }}>
            {renderTree(finished, tasks, {
              onTaskClick,
              onStatusChange,
              onDone: (id) => onDone(id, false),
              onAddSubTask,
              onTaskDelete,
              onReparent,
              collapsedIds,
              onToggleCollapse,
              hideCompleted,
              draggingId,
              dragOverId,
              setDraggingId,
              setDragOverId,
            })}
          </div>
        </Group>
      )}
    </div>
  );
}

interface TreeHandlers {
  onTaskClick: (id: string) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDone: (id: string) => void;
  onAddSubTask: (parentId: string) => void;
  onTaskDelete: (id: string) => void;
  onReparent: (id: string, parentTaskId: string | null) => void;
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
  hideCompleted: boolean;
  draggingId: string | null;
  dragOverId: string | null;
  setDraggingId: (id: string | null) => void;
  setDragOverId: (id: string | null) => void;
}

function renderTree(
  roots: RadarTask[],
  allTasks: RadarTask[],
  handlers: TreeHandlers,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  for (const root of roots) {
    appendTaskWithChildren(nodes, root, allTasks, 0, handlers);
  }
  return nodes;
}

function appendTaskWithChildren(
  nodes: React.ReactNode[],
  task: RadarTask,
  allTasks: RadarTask[],
  depth: number,
  handlers: TreeHandlers,
) {
  const allChildren = allTasks.filter((t) => t.parentTaskId === task.id);
  const children = handlers.hideCompleted
    ? allChildren.filter((c) => c.status !== 'done')
    : [
        ...allChildren.filter((c) => c.status === 'done').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        ...allChildren.filter((c) => c.status !== 'done'),
      ];
  const isCollapsed = handlers.collapsedIds.has(task.id);
  nodes.push(
    <TaskRow
      key={task.id}
      task={task}
      allTasks={allTasks}
      depth={depth}
      hasChildren={children.length > 0}
      isCollapsed={isCollapsed && children.length > 0}
      onClick={() => handlers.onTaskClick(task.id)}
      onStatusChange={handlers.onStatusChange}
      onDone={() => handlers.onDone(task.id)}
      onAddSubTask={handlers.onAddSubTask}
      onDelete={() => handlers.onTaskDelete(task.id)}
      onReparent={handlers.onReparent}
      onToggleCollapse={() => handlers.onToggleCollapse(task.id)}
      draggingId={handlers.draggingId}
      dragOverId={handlers.dragOverId}
      setDraggingId={handlers.setDraggingId}
      setDragOverId={handlers.setDragOverId}
    />,
  );
  if (!isCollapsed) {
    for (const child of children) {
      appendTaskWithChildren(nodes, child, allTasks, depth + 1, handlers);
    }
  }
}

function Group({
  title,
  children,
  style,
}: {
  title: string;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section style={style}>
      <Mono
        style={{
          fontSize: 10,
          color: 'var(--ink-mute)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          padding: '0 4px 4px',
          display: 'block',
        }}
      >
        {title}
      </Mono>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 6,
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '12px',
        color: 'var(--ink-mute)',
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
      }}
    >
      {text}
    </div>
  );
}

function isTaskOverdue(task: RadarTask): boolean {
  if (!task.deadline || task.status === 'done') return false;
  const t = Date.parse(task.deadline);
  if (!Number.isFinite(t)) return false;
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() < today.getTime();
}

function TaskRow({
  task,
  allTasks,
  depth = 0,
  hasChildren = false,
  isCollapsed = false,
  onClick,
  onStatusChange,
  onDone,
  onAddSubTask,
  onDelete,
  onReparent,
  onToggleCollapse,
  draggingId,
  dragOverId,
  setDraggingId,
  setDragOverId,
}: {
  task: RadarTask;
  allTasks: RadarTask[];
  depth?: number;
  hasChildren?: boolean;
  isCollapsed?: boolean;
  onClick: () => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDone: () => void;
  onAddSubTask: (parentId: string) => void;
  onDelete: () => void;
  onReparent: (id: string, parentTaskId: string | null) => void;
  onToggleCollapse: () => void;
  draggingId: string | null;
  dragOverId: string | null;
  setDraggingId: (id: string | null) => void;
  setDragOverId: (id: string | null) => void;
}) {
  const done = task.status === 'done';
  const title = parseTitle(task.title).displayTitle;
  const isOverdue = isTaskOverdue(task);
  const children = allTasks.filter((t) => t.parentTaskId === task.id);
  const completedChildren = children.filter((c) => c.status === 'done').length;
  const totalChildren = children.length;
  const progress = totalChildren > 0 ? completedChildren / totalChildren : 0;
  const [hovered, setHovered] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<(() => void) | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuPos) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPos(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuPos]);

  const isBeingDragged = draggingId === task.id;
  const isDropTarget = dragOverId === task.id;
  const canDrop =
    draggingId !== null &&
    draggingId !== task.id &&
    !isDescendantOf(task.id, draggingId, allTasks);

  return (
    <>
    <div
      draggable
      onDragStart={(e) => {
        setDraggingId(task.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('taskId', task.id);
      }}
      onDragEnd={() => {
        setDraggingId(null);
        setDragOverId(null);
      }}
      onDragOver={(e) => {
        if (!canDrop) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverId(task.id);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setDragOverId(null);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (draggingId && canDrop) {
          onReparent(draggingId, task.id);
        }
        setDraggingId(null);
        setDragOverId(null);
      }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: isDropTarget ? 'var(--blue-soft)' : 'var(--bg)',
        borderTop: '1px solid var(--line)',
        borderLeft: isOverdue ? '2px solid var(--err)' : isDropTarget ? '2px solid var(--blue)' : 'none',
        opacity: isBeingDragged ? 0.4 : 1,
        outline: isDropTarget ? '1px solid var(--blue)' : 'none',
        transition: 'background 80ms, opacity 80ms',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          paddingLeft: 10 + depth * 16,
          cursor: 'pointer',
        }}
        onClick={onClick}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); if (hasChildren) onToggleCollapse(); }}
          style={{
            width: 12,
            height: 12,
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: 'var(--ink-mute)',
            fontSize: 8,
            cursor: hasChildren ? 'pointer' : 'default',
            opacity: hasChildren ? 1 : 0,
            lineHeight: 1,
          }}
          tabIndex={-1}
        >
          {isCollapsed ? '▶' : '▼'}
        </button>
        <input
          type="checkbox"
          checked={done}
          onChange={(e) => {
            e.stopPropagation();
            onDone();
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 14,
            height: 14,
            margin: 0,
            accentColor: 'var(--ink)',
            cursor: 'pointer',
            flex: '0 0 14px',
          }}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontSize: 13,
              color: 'var(--ink)',
              textDecoration: done ? 'line-through' : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
          {(task.planTaskId || task.docPath) && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {task.planTaskId && <LinkedChip icon="📅" label="Plan" />}
              {task.docPath && <LinkedChip icon="📝" label="Blog" />}
            </div>
          )}
        </div>
        {!done && (
          <button
            type="button"
            title="서브태스크 추가"
            onClick={(e) => {
              e.stopPropagation();
              onAddSubTask(task.id);
            }}
            style={{
              opacity: hovered ? 1 : 0,
              transition: 'opacity 120ms',
              width: 18,
              height: 18,
              borderRadius: 3,
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink-mute)',
              fontSize: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            +
          </button>
        )}
        <AssigneeBadge task={task} />
        <StatusDropdown task={task} onStatusChange={onStatusChange} isOverdue={isOverdue} />
        {task.deadline && (
          <Mono
            style={{
              fontSize: 10.5,
              color: isOverdue ? 'var(--err)' : 'var(--ink-mute)',
              minWidth: 56,
              textAlign: 'right',
              fontWeight: isOverdue ? 600 : 400,
            }}
          >
            {fmtDeadline(task.deadline)}
          </Mono>
        )}
      </div>
      {totalChildren > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 10px 6px',
            paddingLeft: 10 + depth * 16 + 22,
          }}
        >
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
            ▌ 서브태스크 · 완료 {completedChildren}/{totalChildren}
          </Mono>
          <div
            style={{
              flex: 1,
              height: 2,
              background: 'var(--bg-shade)',
              borderRadius: 1,
              overflow: 'hidden',
              maxWidth: 120,
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                background: 'var(--blue)',
                transition: 'width 200ms ease',
              }}
            />
          </div>
        </div>
      )}
    </div>
    {menuPos && (
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          left: menuPos.x,
          top: menuPos.y,
          zIndex: 2000,
          background: 'var(--bg)',
          border: '1px solid var(--line-strong)',
          borderRadius: 7,
          boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          padding: '4px 0',
          minWidth: 140,
        }}
      >
        <TaskContextItem label="상세 보기" onClick={() => { setMenuPos(null); onClick(); }} />
        <TaskContextItem label="서브태스크 추가" onClick={() => { setMenuPos(null); onAddSubTask(task.id); }} />
        {task.parentTaskId && (
          <TaskContextItem
            label="최상위로 이동"
            onClick={() => { setMenuPos(null); onReparent(task.id, null); }}
          />
        )}
        <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
        <TaskContextItem
          label="삭제"
          danger
          onClick={() => { setMenuPos(null); setPendingDelete(() => onDelete); }}
        />
      </div>
    )}
    {pendingDelete && (
      <ConfirmDialog
        message={`"${title}" 할 일을 삭제하시겠습니까?`}
        onConfirm={() => { pendingDelete(); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    )}
    </>
  );
}

function TaskContextItem({
  label,
  danger,
  onClick,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        padding: '7px 14px',
        background: 'transparent',
        border: 'none',
        textAlign: 'left',
        fontSize: 13,
        color: danger ? 'var(--err)' : 'var(--ink)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-shade)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {label}
    </button>
  );
}

function StatusDropdown({
  task,
  onStatusChange,
  isOverdue,
}: {
  task: RadarTask;
  onStatusChange: (id: string, status: TaskStatus) => void;
  isOverdue: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tone = TASK_STATUS_TONES[task.status];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const triggerBg = isOverdue && task.status !== 'blocked' ? 'var(--warn-soft)' : TONE_BG[tone];
  const triggerColor =
    isOverdue && task.status !== 'blocked' ? 'var(--warn)' : TONE_COLOR[tone];

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!open) {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setMenuPos({ top: rect.bottom + 4, left: rect.left });
      }
    }
    setOpen((v) => !v);
  };

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        title="상태 변경"
        style={{
          padding: '2px 8px',
          borderRadius: 999,
          border: 'none',
          background: triggerBg,
          color: triggerColor,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.04em',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {TASK_STATUS_LABELS[task.status]}
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            top: menuPos?.top ?? 0,
            left: menuPos?.left ?? 0,
            zIndex: 200,
            background: 'var(--bg)',
            border: '1px solid var(--line-strong)',
            borderRadius: 7,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            padding: '4px',
            minWidth: 110,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => {
            const t = TASK_STATUS_TONES[s];
            const active = task.status === s;
            return (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(task.id, s);
                  setOpen(false);
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: 5,
                  border: 'none',
                  background: active ? TONE_BG[t] : 'transparent',
                  color: active ? TONE_COLOR[t] : 'var(--ink-2)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  letterSpacing: '0.03em',
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = 'var(--bg-shade)';
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent';
                }}
              >
                {TASK_STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssigneeBadge({ task }: { task: RadarTask }) {
  const label = task.isMine ? '나' : task.assignee ?? '?';
  const initial = label.trim().slice(0, 1).toUpperCase() || '?';
  return (
    <span
      title={label}
      style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        background: task.isMine ? 'var(--blue-soft)' : 'var(--bg-shade)',
        color: task.isMine ? 'var(--blue)' : 'var(--ink-2)',
        fontSize: 10.5,
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 22px',
      }}
    >
      {initial}
    </span>
  );
}

function LinkedChip({ icon, label }: { icon: string; label: string }) {
  return (
    <Mono
      style={{
        fontSize: 10,
        color: 'var(--ink-mute)',
        background: 'var(--bg-shade)',
        border: '1px solid var(--line)',
        borderRadius: 3,
        padding: '0 4px',
        lineHeight: '16px',
      }}
    >
      {icon} {label}
    </Mono>
  );
}

function fmtDeadline(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(0, 10);
  const d = new Date(t);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
