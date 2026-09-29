export type GoalType = 'personal' | 'team' | 'solo';
export type GoalStatus = 'on_track' | 'at_risk' | 'blocked' | 'done';
export type TaskStatus = 'not_started' | 'in_progress' | 'in_review' | 'done' | 'blocked';

export interface Goal {
  id: string;
  title: string;
  goalType: GoalType;
  startDate?: string;
  deadline?: string;
  color: string;
  status: GoalStatus;
  slackChannels: string[];
  gitlabProjects: string[];
  jiraUrls: string[];
  confluenceUrls: string[];
  lastPolledAt?: string;
  createdAt: string;
  updatedAt: string;
  folder?: string;
}

export interface RadarTask {
  id: string;
  goalId: string;
  title: string;
  assignee?: string;
  isMine: boolean;
  status: TaskStatus;
  deadline?: string;
  planTaskId?: string;
  docPath?: string;
  notes?: string;
  parentTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RadarActivity {
  id: string;
  goalId: string;
  taskId?: string;
  sourceType: 'slack' | 'gitlab' | 'confluence' | 'app';
  activityType: 'status_change' | 'mr_opened' | 'mr_merged' | 'page_updated' | 'checkin_needed';
  message: string;
  isAlert: boolean;
  alertDismissed: boolean;
  suggestedTaskTitle?: string;
  createdAt: string;
}

export interface GoalInput {
  id: string;
  title: string;
  goalType: GoalType;
  startDate?: string;
  deadline?: string;
  color: string;
  status: GoalStatus;
  slackChannels: string[];
  gitlabProjects: string[];
  jiraUrls: string[];
  confluenceUrls: string[];
  folder?: string;
}

export interface GoalPatch {
  title?: string;
  goalType?: GoalType;
  startDate?: string | null;
  deadline?: string | null;
  color?: string;
  status?: GoalStatus;
  slackChannels?: string[];
  gitlabProjects?: string[];
  jiraUrls?: string[];
  confluenceUrls?: string[];
  folder?: string | null;
}

export interface RadarTaskInput {
  id: string;
  goalId: string;
  title: string;
  assignee?: string;
  isMine: boolean;
  status: TaskStatus;
  deadline?: string;
  planTaskId?: string;
  docPath?: string;
  notes?: string;
  parentTaskId?: string;
}

export interface RadarTaskPatch {
  title?: string;
  assignee?: string | null;
  isMine?: boolean;
  status?: TaskStatus;
  deadline?: string | null;
  planTaskId?: string | null;
  docPath?: string | null;
  notes?: string | null;
  parentTaskId?: string | null;
}

export const GOAL_COLORS: { value: string; label: string }[] = [
  { value: '#60a5fa', label: 'blue' },
  { value: '#4ade80', label: 'green' },
  { value: '#67e8f9', label: 'teal' },
  { value: '#c4b5fd', label: 'purple' },
  { value: '#fbbf24', label: 'yellow' },
  { value: '#fb923c', label: 'orange' },
];

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  personal: '개인',
  team: '팀',
  solo: '혼자',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  on_track: '진행중',
  at_risk: '주의',
  blocked: '블록',
  done: '완료',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: '대기중',
  in_progress: '진행',
  in_review: '리뷰',
  done: '완료',
  blocked: '블록',
};

export const TASK_STATUS_TONES: Record<TaskStatus, 'mute' | 'blue' | 'warn' | 'ok' | 'err'> = {
  not_started: 'mute',
  in_progress: 'blue',
  in_review: 'warn',
  done: 'ok',
  blocked: 'err',
};

export const GOAL_STATUS_TONES: Record<GoalStatus, 'ok' | 'warn' | 'err' | 'mute'> = {
  on_track: 'ok',
  at_risk: 'warn',
  blocked: 'err',
  done: 'mute',
};

export const TASK_STATUS_CYCLE: TaskStatus[] = [
  'not_started',
  'in_progress',
  'in_review',
  'done',
  'blocked',
];

/** nodeId가 ancestorId의 자손인지 확인 (순환 의존성 방지용) */
export function isDescendantOf(nodeId: string, ancestorId: string, allTasks: RadarTask[]): boolean {
  const visited = new Set<string>();
  let current = allTasks.find((t) => t.id === nodeId);
  while (current?.parentTaskId) {
    if (visited.has(current.id)) break;
    visited.add(current.id);
    if (current.parentTaskId === ancestorId) return true;
    current = allTasks.find((t) => t.id === current!.parentTaskId);
  }
  return false;
}
