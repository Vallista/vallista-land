import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import {
  addGoal,
  addRadarTask,
  addTask,
  deleteGoal,
  deleteRadarTask,
  dismissRadarAlert,
  listGoals,
  listRadarActivities,
  listRadarTasks,
  listTasks,
  radarHasToken,
  radarSaveToken,
  triggerRadarPollGoal,
  updateGoal,
  updateRadarTask,
  updateTask,
} from '../../lib/tauri';
import type { Task } from '@vallista/content-core';
import type {
  Goal,
  GoalInput,
  GoalStatus,
  RadarActivity,
  RadarTask,
  RadarTaskInput,
  RadarTaskPatch,
  TaskStatus,
} from './types';
import { GoalPanel } from './GoalPanel';
import { GoalDetail } from './GoalDetail';
import { TaskList } from './TaskList';
import { SidePanel } from './SidePanel';
import { ConfirmDialog, GoalForm, ModalShell } from './GoalForm';
import { TaskForm } from './TaskForm';
import { ActivityFeed } from './ActivityFeed';
import { RadarTimeline } from './RadarTimeline';

export function Radar() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasksByGoal, setTasksByGoal] = useState<Map<string, RadarTask[]>>(new Map());
  const [tasks, setTasks] = useState<RadarTask[]>([]);
  const [activities, setActivities] = useState<RadarActivity[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [sidePanelTaskId, setSidePanelTaskId] = useState<string | null>(null);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<RadarTask | null>(null);
  const [pendingParentTaskId, setPendingParentTaskId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [showCompleteGoalDialog, setShowCompleteGoalDialog] = useState(false);
  const dismissedGoalCompletionRef = useRef<Set<string>>(new Set());

  const refreshGoals = useCallback(async () => {
    const all = await listGoals().catch(() => [] as Goal[]);
    setGoals(all);
    setLoading(false);
    if (all.length > 0 && selectedGoalId === null) {
      setSelectedGoalId(all[0]?.id ?? null);
    } else if (all.length === 0) {
      setSelectedGoalId(null);
    } else if (selectedGoalId && !all.some((g) => g.id === selectedGoalId)) {
      setSelectedGoalId(all[0]?.id ?? null);
    }
    // 모든 goal의 task를 가져와 panel 진행률 계산용으로 캐시
    try {
      const allTasks = await listRadarTasks();
      const map = new Map<string, RadarTask[]>();
      allTasks.forEach((t) => {
        const arr = map.get(t.goalId) ?? [];
        arr.push(t);
        map.set(t.goalId, arr);
      });
      setTasksByGoal(map);
    } catch {
      setTasksByGoal(new Map());
    }
  }, [selectedGoalId]);

  useEffect(() => {
    void refreshGoals();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selectedGoalId) {
      setTasks([]);
      setActivities([]);
      return;
    }
    Promise.all([
      listRadarTasks(selectedGoalId),
      listRadarActivities(selectedGoalId),
    ])
      .then(async ([ts, acts]) => {
        if (cancelled) return;
        // Plan → Radar sync: if linked Plan task is done, mark Radar task done
        try {
          const planTasks = await listTasks();
          const planMap = new Map<string, Task>(planTasks.map((t) => [t.id, t]));
          const synced = await Promise.all(
            ts.map(async (rt) => {
              if (rt.planTaskId) {
                const pt = planMap.get(rt.planTaskId);
                if (pt?.done && rt.status !== 'done') {
                  await updateRadarTask(rt.id, { status: 'done' });
                  return { ...rt, status: 'done' as import('./types').TaskStatus };
                }
              }
              return rt;
            }),
          );
          if (!cancelled) setTasks(synced);
        } catch {
          if (!cancelled) setTasks(ts);
        }
        if (!cancelled) setActivities(acts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      })
      .catch(() => {
        if (cancelled) return;
        setTasks([]);
        setActivities([]);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedGoalId]);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    listen('bento:radar-synced', () => {
      void refreshGoals();
      if (selectedGoalId) {
        listRadarActivities(selectedGoalId)
          .then((acts) =>
            setActivities(acts.sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
          )
          .catch(() => {});
      }
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});
    return () => {
      unlisten?.();
    };
  }, [refreshGoals, selectedGoalId]);

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) ?? null,
    [goals, selectedGoalId],
  );
  const sidePanelTask = useMemo(
    () => tasks.find((t) => t.id === sidePanelTaskId) ?? null,
    [tasks, sidePanelTaskId],
  );
  const sidePanelActivities = useMemo(() => {
    if (!sidePanelTaskId) return [] as RadarActivity[];
    return activities.filter((a) => a.taskId === sidePanelTaskId);
  }, [activities, sidePanelTaskId]);

  const handleAddGoal = (_folder?: string) => {
    setEditingGoal(null);
    setGoalFormOpen(true);
  };

  const handleReorder = (_newOrder: Goal[]) => {
    // GoalPanel 내부에서 localStorage에 저장. 부모 state는 서버 source of truth 유지.
  };

  const handleEditGoal = (id: string) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    setEditingGoal(goal);
    setGoalFormOpen(true);
  };

  const handleSaveGoal = async (input: GoalInput) => {
    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, {
          title: input.title,
          goalType: input.goalType,
          startDate: input.startDate ?? null,
          deadline: input.deadline ?? null,
          color: input.color,
          status: input.status,
          slackChannels: input.slackChannels,
          gitlabProjects: input.gitlabProjects,
          jiraUrls: input.jiraUrls,
          confluenceUrls: input.confluenceUrls,
          folder: input.folder ?? null,
        });
      } else {
        await addGoal(input);
        setSelectedGoalId(input.id);
      }
      setGoalFormOpen(false);
      setEditingGoal(null);
      await refreshGoals();
    } catch (err) {
      console.error('failed to save goal', err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await deleteGoal(id);
      setGoalFormOpen(false);
      setEditingGoal(null);
      await refreshGoals();
    } catch (err) {
      console.error('failed to delete goal', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteRadarTask(id);
      if (selectedGoalId) {
        const ts = await listRadarTasks(selectedGoalId);
        setTasks(ts);
        setTasksByGoal((prev) => {
          const next = new Map(prev);
          next.set(selectedGoalId, ts);
          return next;
        });
      }
      if (sidePanelTaskId === id) setSidePanelTaskId(null);
    } catch (err) {
      console.error('failed to delete task', err);
    }
  };

  const handleAddTask = (parentId?: string) => {
    if (!selectedGoalId) return;
    setEditingTask(null);
    setPendingParentTaskId(parentId);
    setTaskFormOpen(true);
  };

  const handleSaveTask = async (input: RadarTaskInput) => {
    try {
      if (editingTask) {
        await updateRadarTask(editingTask.id, {
          title: input.title,
          assignee: input.assignee ?? null,
          isMine: input.isMine,
          status: input.status,
          deadline: input.deadline ?? null,
          planTaskId: input.planTaskId ?? null,
          docPath: input.docPath ?? null,
          notes: input.notes ?? null,
        });
      } else {
        await addRadarTask(input);
      }
      setTaskFormOpen(false);
      setEditingTask(null);
      setPendingParentTaskId(undefined);
      // 현재 선택된 goal task만 갱신
      if (selectedGoalId) {
        const ts = await listRadarTasks(selectedGoalId);
        setTasks(ts);
        setTasksByGoal((prev) => {
          const next = new Map(prev);
          next.set(selectedGoalId, ts);
          return next;
        });
      }
    } catch (err) {
      console.error('failed to save task', err);
    }
  };

  const handleTaskClick = (id: string) => {
    setSidePanelTaskId(id);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      await updateRadarTask(id, { status });
      if (selectedGoalId) {
        const ts = await listRadarTasks(selectedGoalId);
        setTasks(ts);
        setTasksByGoal((prev) => {
          const next = new Map(prev);
          next.set(selectedGoalId, ts);
          return next;
        });
      }
    } catch (err) {
      console.error('failed to update task status', err);
    }
  };

  const handleDone = async (id: string, done: boolean) => {
    await handleStatusChange(id, done ? 'done' : 'in_progress');
    const task = tasks.find((t) => t.id === id);
    if (task?.planTaskId) {
      await updateTask(task.planTaskId, { done }).catch(() => {});
    }
  };

  const handleSidePanelDone = async (id: string) => {
    await handleStatusChange(id, 'done');
  };

  const handleSidePanelFieldChange = async (taskId: string, patch: RadarTaskPatch) => {
    try {
      await updateRadarTask(taskId, patch);
      if (selectedGoalId) {
        const ts = await listRadarTasks(selectedGoalId);
        setTasks(ts);
        setTasksByGoal((prev) => {
          const next = new Map(prev);
          next.set(selectedGoalId, ts);
          return next;
        });
      }
    } catch (err) {
      console.error('failed to update task field', err);
    }
  };

  const handleDismissAlert = async (id: string) => {
    try {
      await dismissRadarAlert(id);
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, alertDismissed: true } : a)),
      );
    } catch (err) {
      console.error('failed to dismiss alert', err);
    }
  };

  const handleAddSuggestion = async (activity: import('./types').RadarActivity) => {
    if (!activity.suggestedTaskTitle || !selectedGoal) return;
    try {
      const planTask = await addTask({
        id: `plan_${Date.now()}`,
        title: activity.suggestedTaskTitle,
        due: selectedGoal.deadline,
        kind: 'task',
      });
      await addRadarTask({
        id: `radar_task_${Date.now()}`,
        goalId: selectedGoal.id,
        title: activity.suggestedTaskTitle,
        isMine: true,
        status: 'not_started',
        planTaskId: planTask.id,
      });
      await dismissRadarAlert(activity.id);
      if (selectedGoalId) {
        const [ts, acts] = await Promise.all([
          listRadarTasks(selectedGoalId),
          listRadarActivities(selectedGoalId),
        ]);
        setTasks(ts);
        setActivities(acts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        setTasksByGoal((prev) => {
          const next = new Map(prev);
          next.set(selectedGoalId, ts);
          return next;
        });
      }
    } catch (err) {
      console.error('failed to add suggestion', err);
    }
  };

  const handleReparent = async (id: string, parentTaskId: string | null) => {
    try {
      await updateRadarTask(id, { parentTaskId: parentTaskId ?? null });
      if (selectedGoalId) {
        const ts = await listRadarTasks(selectedGoalId);
        setTasks(ts);
        setTasksByGoal((prev) => {
          const next = new Map(prev);
          next.set(selectedGoalId, ts);
          return next;
        });
      }
    } catch (err) {
      console.error('failed to reparent task', err);
    }
  };

  const handleGoalStatusChange = async (status: GoalStatus) => {
    if (!selectedGoal) return;
    try {
      await updateGoal(selectedGoal.id, { status });
      await refreshGoals();
    } catch (err) {
      console.error('failed to update goal status', err);
    }
  };

  // 모든 tasks가 완료되고 selectedGoal이 done이 아니면 팝업 표시
  useEffect(() => {
    if (!selectedGoal || selectedGoal.status === 'done') return;
    if (tasks.length === 0) return;
    const allDone = tasks.every((t) => t.status === 'done');
    if (!allDone) {
      // tasks 변경 시 해당 goalId dismiss 기록 제거
      dismissedGoalCompletionRef.current.delete(selectedGoal.id);
      return;
    }
    if (dismissedGoalCompletionRef.current.has(selectedGoal.id)) return;
    setShowCompleteGoalDialog(true);
  }, [tasks, selectedGoal]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}
    >
      {/* View toggle bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
          padding: '6px 12px',
          borderBottom: '1px solid var(--line)',
          flexShrink: 0,
        }}
      >
        {(['list', 'timeline'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              borderRadius: 4,
              border: '1px solid var(--line)',
              background: viewMode === mode ? 'var(--bg-shade)' : 'transparent',
              color: viewMode === mode ? 'var(--ink)' : 'var(--ink-mute)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: viewMode === mode ? 500 : 400,
              transition: 'background 120ms, color 120ms',
            }}
          >
            {mode === 'list' ? '목록' : '타임라인'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {viewMode === 'timeline' ? (
          <RadarTimeline
            goals={goals}
            tasksByGoal={tasksByGoal}
            selectedGoalId={selectedGoalId}
            onSelectGoal={setSelectedGoalId}
            onAddGoal={() => {
              setEditingGoal(null);
              setGoalFormOpen(true);
            }}
          />
        ) : (
          <>
            <GoalPanel
              goals={goals}
              tasksByGoal={tasksByGoal}
              selectedId={selectedGoalId}
              onSelect={setSelectedGoalId}
              onAdd={handleAddGoal}
              onEdit={handleEditGoal}
              onDelete={(id) => void handleDeleteGoal(id)}
              onTokenSettings={() => setSettingsOpen(true)}
              onReorder={handleReorder}
            />

            <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              {loading ? (
                <EmptyState text="불러오는 중…" />
              ) : !selectedGoal ? (
                <EmptyState text="좌측에서 목표를 만들거나 선택해주세요" />
              ) : (
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  <GoalDetail
                    goal={selectedGoal}
                    tasks={tasks}
                    activities={activities}
                    onDismissAlert={handleDismissAlert}
                    onEditGoal={() => handleEditGoal(selectedGoal.id)}
                    onAddSuggestion={handleAddSuggestion}
                    onStatusChange={handleGoalStatusChange}
                    onSync={async (goalId) => {
                      try {
                        await triggerRadarPollGoal(goalId);
                      } catch (err) {
                        console.error('sync failed', err);
                      }
                    }}
                  />
                  <TaskList
                    tasks={tasks}
                    onTaskClick={handleTaskClick}
                    onStatusChange={handleStatusChange}
                    onDone={handleDone}
                    onAdd={handleAddTask}
                    onAddSubTask={(parentId) => handleAddTask(parentId)}
                    onTaskDelete={(id) => void handleDeleteTask(id)}
                    onReparent={(id, parentId) => void handleReparent(id, parentId)}
                  />
                  <ActivityFeed activities={activities.filter((a) => !a.isAlert)} />
                </div>
              )}
            </main>

            <SidePanel
              task={sidePanelTask}
              activities={sidePanelActivities}
              allTasks={tasks}
              onClose={() => setSidePanelTaskId(null)}
              onDone={handleSidePanelDone}
              onAddSubTask={(parentId) => {
                setSidePanelTaskId(null);
                handleAddTask(parentId);
              }}
              onChangeParent={(taskId, parentId) => void handleReparent(taskId, parentId)}
              onFieldChange={(taskId, patch) => void handleSidePanelFieldChange(taskId, patch)}
            />
          </>
        )}
      </div>

      {goalFormOpen && (
        <GoalForm
          goal={editingGoal ?? undefined}
          onSave={handleSaveGoal}
          onClose={() => {
            setGoalFormOpen(false);
            setEditingGoal(null);
          }}
          onDelete={editingGoal ? () => void handleDeleteGoal(editingGoal.id) : undefined}
        />
      )}

      {taskFormOpen && selectedGoalId && (
        <TaskForm
          goalId={selectedGoalId}
          task={editingTask ?? undefined}
          parentTaskId={pendingParentTaskId}
          onSave={handleSaveTask}
          onClose={() => {
            setTaskFormOpen(false);
            setEditingTask(null);
            setPendingParentTaskId(undefined);
          }}
        />
      )}

      {settingsOpen && (
        <TokenSettingsModal onClose={() => setSettingsOpen(false)} />
      )}

      {showCompleteGoalDialog && selectedGoal && (
        <ConfirmDialog
          message="모든 할 일이 완료되었습니다. 목표를 완료하시겠습니까?"
          onConfirm={async () => {
            setShowCompleteGoalDialog(false);
            await handleGoalStatusChange('done');
          }}
          onCancel={() => {
            setShowCompleteGoalDialog(false);
            if (selectedGoal) {
              dismissedGoalCompletionRef.current.add(selectedGoal.id);
            }
          }}
        />
      )}
    </div>
  );
}

function TokenSettingsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell onClose={onClose} title="Radar 연동 설정">
      <p
        style={{
          margin: '0 0 12px',
          fontSize: 11.5,
          color: 'var(--ink-mute)',
          lineHeight: 1.5,
        }}
      >
        토큰은 macOS 키체인에 저장됩니다. 앱 외부로 전송되지 않습니다.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <TokenRow label="Slack User" tokenKey="bento_slack_user_token" hint="xoxp- · 내 채널 전체" />
        <TokenRow label="Slack Bot" tokenKey="bento_slack_bot_token" hint="xoxb- · 봇 초대 채널만" />
        <TokenRow label="GitLab" tokenKey="bento_gitlab_token" />
        <TokenRow label="Confluence" tokenKey="bento_confluence_token" />
      </div>
    </ModalShell>
  );
}

function TokenRow({ label, tokenKey, hint }: { label: string; tokenKey: string; hint?: string }) {
  const [hasToken, setHasToken] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  useEffect(() => {
    radarHasToken(tokenKey).then(setHasToken).catch(() => {});
  }, [tokenKey]);

  const handleSave = async () => {
    if (!value.trim()) return;
    try {
      await radarSaveToken(tokenKey, value.trim());
      setHasToken(true);
      setEditing(false);
      setValue('');
    } catch (err) {
      console.error('token save failed', err);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--ink-mute)',
    fontFamily: 'var(--font-mono)',
    flex: '0 0 86px',
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '6px 10px',
    borderRadius: 5,
    border: '1px solid var(--line)',
    background: 'var(--bg-input)',
    color: 'var(--ink)',
    fontSize: 12.5,
    fontFamily: 'inherit',
    outline: 'none',
  };

  const primaryBtn: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 5,
    border: 'none',
    background: 'var(--ink)',
    color: 'var(--on-accent)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 500,
    minWidth: 44,
  };

  const ghostBtn: React.CSSProperties = {
    padding: '6px 10px',
    borderRadius: 5,
    border: '1px solid var(--line-strong)',
    background: 'transparent',
    color: 'var(--ink-2)',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  const labelBlock = (
    <div style={{ ...labelStyle, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span>{label}</span>
      {hint && <span style={{ fontSize: 10, color: 'var(--ink-faint)', letterSpacing: 0 }}>{hint}</span>}
    </div>
  );

  if (hasToken && !editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {labelBlock}
        <span
          style={{
            flex: 1,
            padding: '6px 10px',
            borderRadius: 5,
            border: '1px solid var(--line)',
            background: 'var(--bg-shade)',
            color: 'var(--ok)',
            fontSize: 12.5,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.1em',
          }}
        >
          ●●●●●●●●●●●●●●●●
        </span>
        <button type="button" onClick={() => setEditing(true)} style={ghostBtn}>
          변경
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {labelBlock}
      <input
        autoFocus={editing}
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="토큰 붙여넣기"
        style={inputStyle}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void handleSave();
          if (e.key === 'Escape' && editing) { setEditing(false); setValue(''); }
        }}
      />
      {editing && (
        <button type="button" onClick={() => { setEditing(false); setValue(''); }} style={ghostBtn}>
          취소
        </button>
      )}
      <button type="button" onClick={() => void handleSave()} style={primaryBtn}>
        저장
      </button>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink-mute)',
        fontSize: 13,
        fontStyle: 'italic',
      }}
    >
      {text}
    </div>
  );
}
