import { useRef, useEffect, useState, useMemo, type CSSProperties } from 'react';
import { Mono } from '../../components/atoms/Atoms';
import type { Goal, RadarTask } from './types';
import { GOAL_TYPE_LABELS, GOAL_STATUS_LABELS, GOAL_STATUS_TONES } from './types';
import { parseTitle, breadcrumbKey } from './parseTitle';
import { ConfirmDialog } from './GoalForm';

interface GoalPanelProps {
  goals: Goal[];
  tasksByGoal: Map<string, RadarTask[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (folder?: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTokenSettings: () => void;
  onReorder: (newOrder: Goal[]) => void;
}

const STATUS_COLOR: Record<string, string> = {
  on_track: 'var(--ok)',
  at_risk: 'var(--warn)',
  blocked: 'var(--err)',
  done: 'var(--ink-mute)',
};

const STATUS_BG: Record<string, string> = {
  on_track: 'var(--ok-soft, rgba(74,222,128,0.12))',
  at_risk: 'var(--warn-soft, rgba(251,191,36,0.12))',
  blocked: 'var(--err-soft, rgba(239,68,68,0.12))',
  done: 'var(--bg-shade)',
};

const ORDER_KEY = 'bento.radar.goalOrder';

function loadOrder(): string[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveOrder(ids: string[]) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function applyOrder(goals: Goal[], ids: string[]): Goal[] {
  if (ids.length === 0) return goals;
  const map = new Map(goals.map((g) => [g.id, g]));
  const ordered: Goal[] = [];
  for (const id of ids) {
    const g = map.get(id);
    if (g) ordered.push(g);
  }
  // ids에 없는 신규 goal은 뒤에 붙임
  for (const g of goals) {
    if (!ids.includes(g.id)) ordered.push(g);
  }
  return ordered;
}

export function GoalPanel({
  goals,
  tasksByGoal,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onTokenSettings,
  onReorder,
}: GoalPanelProps) {
  const [orderedGoals, setOrderedGoals] = useState<Goal[]>(() => applyOrder(goals, loadOrder()));
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [hideDone, setHideDone] = useState(false);

  // goals prop 변경 시 로컬 order 유지하며 재정렬
  useEffect(() => {
    setOrderedGoals((prev) => {
      const prevIds = prev.map((g) => g.id);
      return applyOrder(goals, prevIds);
    });
  }, [goals]);

  const activeGoals = useMemo(() => orderedGoals.filter((g) => g.status !== 'done'), [orderedGoals]);
  const doneGoals = useMemo(() => orderedGoals.filter((g) => g.status === 'done'), [orderedGoals]);

  const folderGroups = useMemo(() => {
    const map = new Map<string, Goal[]>();
    for (const g of activeGoals) {
      const { breadcrumbs } = parseTitle(g.title);
      const key = breadcrumbKey(breadcrumbs);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(g);
    }
    return map;
  }, [activeGoals]);

  const hasFolders = folderGroups.size > 1 || (folderGroups.size === 1 && !folderGroups.has(''));

  const overallProgress = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const arr of tasksByGoal.values()) {
      for (const t of arr) {
        total += 1;
        if (t.status === 'done') done += 1;
      }
    }
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { total, done, pct };
  }, [tasksByGoal]);

  function toggleCollapse(folder: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(folder)) {
        next.delete(folder);
      } else {
        next.add(folder);
      }
      return next;
    });
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setOrderedGoals((prev) => {
      const next = [...prev];
      const fromIdx = next.findIndex((g) => g.id === dragId);
      const toIdx = next.findIndex((g) => g.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const removed = next.splice(fromIdx, 1);
      const item = removed[0];
      if (!item) return prev;
      next.splice(toIdx, 0, item);
      saveOrder(next.map((g) => g.id));
      onReorder(next);
      return next;
    });
  }

  const folderEntries = [...folderGroups.entries()];

  return (
    <aside
      style={{
        flex: '0 0 232px',
        width: 232,
        borderRight: '1px solid var(--line)',
        background: 'var(--bg-soft)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <style>{`
        @keyframes marquee-scroll {
          0%, 20% { transform: translateX(0); }
          75%, 90% { transform: translateX(var(--radar-scroll)); }
          100% { transform: translateX(0); }
        }
      `}</style>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--gap-lg) var(--gap-lg) var(--gap)',
          borderBottom: '1px solid var(--line)',
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
          목표
        </Mono>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={onTokenSettings}
            title="연동 설정"
            style={iconBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--ink)';
              e.currentTarget.style.background = 'var(--bg-shade)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--ink-soft)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            &#9881;
          </button>
          <button
            onClick={() => setHideDone((v) => !v)}
            title={hideDone ? '완료 표시' : '완료 숨기기'}
            style={{
              ...iconBtnStyle,
              color: hideDone ? 'var(--blue)' : 'var(--ink-soft)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = hideDone ? 'var(--blue)' : 'var(--ink)';
              e.currentTarget.style.background = 'var(--bg-shade)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = hideDone ? 'var(--blue)' : 'var(--ink-soft)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {hideDone ? '◎' : '○'}
          </button>
          <button
            onClick={() => onAdd()}
            title="목표 추가"
            style={iconBtnStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--ink)';
              e.currentTarget.style.background = 'var(--bg-shade)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--ink-soft)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            +
          </button>
        </div>
      </header>
      {overallProgress.total > 0 && (
        <div
          style={{
            padding: '6px var(--gap-lg) 8px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', display: 'block', marginBottom: 4 }}>
            완료 {overallProgress.done}/{overallProgress.total} · {overallProgress.pct}%
          </Mono>
          <div
            style={{
              height: 2,
              background: 'var(--line)',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${overallProgress.pct}%`,
                height: '100%',
                background: 'var(--ink)',
                transition: 'width 200ms',
              }}
            />
          </div>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--gap) 0', display: 'flex', flexDirection: 'column' }}>
        {orderedGoals.length === 0 && (
          <div
            style={{
              padding: 'var(--gap-lg)',
              color: 'var(--ink-mute)',
              fontSize: 12,
              textAlign: 'center',
              fontStyle: 'italic',
            }}
          >
            목표를 추가해보세요
          </div>
        )}
        <div style={{ flex: 1 }}>
          {hasFolders
            ? folderEntries.map(([folder, folderGoals]) => (
                <div key={folder}>
                  <div
                    onClick={() => toggleCollapse(folder)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ fontSize: 9, color: 'var(--ink-mute)', width: 10 }}>
                      {collapsed.has(folder) ? '▸' : '▾'}
                    </span>
                    <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', flex: 1 }}>
                      {folder || '미분류'}
                    </Mono>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAdd(folder || undefined);
                      }}
                      style={{
                        ...iconBtnStyle,
                        width: 16,
                        height: 16,
                        fontSize: 12,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--ink)';
                        e.currentTarget.style.background = 'var(--bg-shade)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--ink-soft)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      +
                    </button>
                  </div>
                  {!collapsed.has(folder) &&
                    folderGoals.map((goal) => (
                      <GoalCard
                        key={goal.id}
                        goal={goal}
                        tasks={tasksByGoal.get(goal.id) ?? []}
                        isActive={selectedId === goal.id}
                        isDragOver={dragOverId === goal.id}
                        onSelect={onSelect}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onDragStart={() => setDragId(goal.id)}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverId(goal.id);
                        }}
                        onDrop={() => handleDrop(goal.id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setDragOverId(null);
                        }}
                      />
                    ))}
                </div>
              ))
            : activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  tasks={tasksByGoal.get(goal.id) ?? []}
                  isActive={selectedId === goal.id}
                  isDragOver={dragOverId === goal.id}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDragStart={() => setDragId(goal.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverId(goal.id);
                  }}
                  onDrop={() => handleDrop(goal.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setDragOverId(null);
                  }}
                />
              ))}
        </div>
        {doneGoals.length > 0 && !hideDone && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 4 }}>
            {doneGoals.map((goal) => (
              <CompactGoalCard
                key={goal.id}
                goal={goal}
                isActive={selectedId === goal.id}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

interface GoalCardProps {
  goal: Goal;
  tasks: RadarTask[];
  isActive: boolean;
  isDragOver: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

function GoalCard({
  goal,
  tasks,
  isActive,
  isDragOver,
  onSelect,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: GoalCardProps) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const ratio = total === 0 ? 0 : Math.round((done / total) * 100);
  const dday = computeDday(goal.deadline);
  const statusColor = STATUS_COLOR[goal.status] ?? 'var(--ink-mute)';
  const statusBg = STATUS_BG[goal.status] ?? 'var(--bg-shade)';
  const tone = GOAL_STATUS_TONES[goal.status];
  void tone;

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

  return (
    <>
    <button
      draggable
      onClick={() => onSelect(goal.id)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPos({ x: e.clientX, y: e.clientY });
      }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        width: '100%',
        padding: '8px 12px',
        paddingLeft: isActive ? 10 : 12,
        background: isDragOver
          ? 'var(--bg-shade)'
          : isActive
            ? 'var(--bg-shade)'
            : 'transparent',
        borderLeft: isActive ? '2px solid var(--blue)' : '2px solid transparent',
        border: 'none',
        borderTop: 'none',
        color: 'var(--ink)',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
        transition: 'background 120ms',
        outline: isDragOver ? '1px solid var(--line-strong)' : 'none',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'var(--bg)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: goal.color,
            flex: '0 0 8px',
          }}
        />
        <ScrollingTitle title={parseTitle(goal.title).displayTitle} isActive={isActive} />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingLeft: 16,
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: statusColor,
            background: statusBg,
            padding: '1px 5px',
            borderRadius: 3,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {GOAL_STATUS_LABELS[goal.status]}
        </span>
        <span
          style={{
            fontSize: 10,
            color: 'var(--ink-mute)',
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            padding: '1px 5px',
            borderRadius: 3,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {GOAL_TYPE_LABELS[goal.goalType]}
        </span>
        {dday && (
          <Mono style={{ fontSize: 10, color: dday.tone }}>{dday.label}</Mono>
        )}
      </div>
      {total > 0 && (() => {
        const mineCount = tasks.filter((t) => t.isMine && t.status !== 'done').length;
        const delegatedCount = tasks.filter((t) => !t.isMine && t.status !== 'done').length;
        const doneCount = tasks.filter((t) => t.status === 'done').length;
        return (
          <div
            style={{
              display: 'flex',
              gap: 6,
              paddingLeft: 16,
              flexWrap: 'nowrap',
              overflow: 'hidden',
            }}
          >
            {mineCount > 0 && <Mono style={{ fontSize: 9.5, color: 'var(--blue)' }}>내 {mineCount}</Mono>}
            {delegatedCount > 0 && <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>위임 {delegatedCount}</Mono>}
            {doneCount > 0 && <Mono style={{ fontSize: 9.5, color: 'var(--ok)' }}>완료 {doneCount}</Mono>}
          </div>
        );
      })()}
      <div
        style={{
          marginLeft: 16,
          marginTop: 2,
          height: 3,
          background: 'var(--line)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${ratio}%`,
            height: '100%',
            background: goal.color,
            transition: 'width 200ms',
          }}
        />
      </div>
    </button>
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
        <ContextMenuItem
          label="상세 보기"
          onClick={() => { setMenuPos(null); onSelect(goal.id); }}
        />
        <ContextMenuItem
          label="편집"
          onClick={() => { setMenuPos(null); onEdit(goal.id); }}
        />
        <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
        <ContextMenuItem
          label="삭제"
          danger
          onClick={() => { setMenuPos(null); setPendingDelete(() => () => onDelete(goal.id)); }}
        />
      </div>
    )}
    {pendingDelete && (
      <ConfirmDialog
        message="목표와 연관된 할 일이 모두 삭제됩니다. 계속하시겠습니까?"
        onConfirm={() => { pendingDelete(); setPendingDelete(null); }}
        onCancel={() => setPendingDelete(null)}
      />
    )}
    </>
  );
}

interface CompactGoalCardProps {
  goal: Goal;
  isActive: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function CompactGoalCard({ goal, isActive, onSelect, onEdit, onDelete }: CompactGoalCardProps) {
  const { displayTitle } = parseTitle(goal.title);
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

  return (
    <>
      <button
        onClick={() => onSelect(goal.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuPos({ x: e.clientX, y: e.clientY });
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '4px 12px',
          paddingLeft: isActive ? 10 : 12,
          background: isActive ? 'var(--bg-shade)' : 'transparent',
          borderLeft: isActive ? '2px solid var(--blue)' : '2px solid transparent',
          border: 'none',
          borderTop: 'none',
          color: 'var(--ink)',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          opacity: 0.55,
          transition: 'background 120ms',
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = 'var(--bg)';
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.opacity = '0.55';
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: goal.color,
            flex: '0 0 6px',
          }}
        />
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 400,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: 'var(--ink-mute)',
          }}
        >
          {displayTitle}
        </span>
        <span
          style={{
            fontSize: 9.5,
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-mute)',
            background: 'var(--bg-shade)',
            padding: '1px 4px',
            borderRadius: 3,
            flexShrink: 0,
          }}
        >
          완료
        </span>
      </button>
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
          <ContextMenuItem
            label="상세 보기"
            onClick={() => { setMenuPos(null); onSelect(goal.id); }}
          />
          <ContextMenuItem
            label="편집"
            onClick={() => { setMenuPos(null); onEdit(goal.id); }}
          />
          <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
          <ContextMenuItem
            label="삭제"
            danger
            onClick={() => { setMenuPos(null); setPendingDelete(() => () => onDelete(goal.id)); }}
          />
        </div>
      )}
      {pendingDelete && (
        <ConfirmDialog
          message="목표와 연관된 할 일이 모두 삭제됩니다. 계속하시겠습니까?"
          onConfirm={() => { pendingDelete(); setPendingDelete(null); }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  );
}

function ContextMenuItem({
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

const iconBtnStyle: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 4,
  border: 'none',
  background: 'transparent',
  color: 'var(--ink-soft)',
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'inherit',
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 120ms, background 120ms',
};

function ScrollingTitle({ title, isActive }: { title: string; isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);

  useEffect(() => {
    if (!isActive || !containerRef.current || !textRef.current) {
      setOverflow(0);
      return;
    }
    const cw = containerRef.current.clientWidth;
    const tw = textRef.current.scrollWidth;
    setOverflow(Math.max(0, tw - cw + 4));
  }, [isActive, title]);

  return (
    <div ref={containerRef} style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
      <span
        ref={textRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize: 13,
          fontWeight: 500,
          animation: overflow > 0 ? 'marquee-scroll 5s ease-in-out infinite' : 'none',
          '--radar-scroll': `-${overflow}px`,
        } as React.CSSProperties}
      >
        {title}
      </span>
    </div>
  );
}

function computeDday(deadline?: string): { label: string; tone: string } | null {
  if (!deadline) return null;
  const t = Date.parse(deadline);
  if (!Number.isFinite(t)) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(t);
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const diffDays = Math.round((targetDay - today) / 86400000);
  if (diffDays === 0) return { label: 'D-Day', tone: 'var(--warn)' };
  if (diffDays > 0) {
    const tone =
      diffDays <= 3 ? 'var(--err)' : diffDays <= 7 ? 'var(--warn)' : 'var(--ink-mute)';
    return { label: `D-${diffDays}`, tone };
  }
  return { label: `D+${Math.abs(diffDays)}`, tone: 'var(--ink-mute)' };
}
