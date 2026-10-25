export type DocState = 'seed' | 'sprout' | 'draft' | 'published';

export type DocSource =
  | { kind: 'manual' }
  | { kind: 'glean'; gleanId: string; url?: string; fetchedAt?: string }
  | { kind: 'capture'; via: 'hotkey' | 'menubar' | 'share' };

export interface DocMeta {
  slug: string;
  dek?: string;
  publishedAt?: string;
  coverImage?: string;
  series?: string;
}

export interface DocLinks {
  in: string[];
  out: string[];
}

export interface Doc {
  id: string;
  state: DocState;
  title: string;
  body: string;
  tags: string[];

  source: DocSource;

  parentId?: string;
  sproutScore?: number;

  meta?: DocMeta;

  createdAt: string;
  updatedAt: string;
  links: DocLinks;
  words: number;
}

export interface GleanHighlight {
  range: [number, number];
  note?: string;
}

export type GleanSource = 'web' | 'rss' | 'youtube' | 'paste' | 'threads';
export type GleanStatus = 'unread' | 'read' | 'archived' | 'promoted';

export interface GleanItem {
  id: string;
  url: string;
  source: GleanSource;
  title: string;
  excerpt: string;
  body: string;
  fetchedAt: string;
  status: GleanStatus;
  promotedDocId?: string;
  highlights: GleanHighlight[];
  digest?: string;
  feedId?: string;
  externalId?: string;
  publishedAt?: string;
}

export interface GleanSummary {
  id: string;
  url: string;
  source: GleanSource;
  title: string;
  excerpt: string;
  fetchedAt: string;
  status: GleanStatus;
  promotedDocId?: string;
  digest?: string;
  feedId?: string;
  externalId?: string;
  publishedAt?: string;
  preview?: string;
  hasImage: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  due?: string;
  docId?: string;
  estMin?: number;
  startAt?: string;
  tags?: string[];
  notes?: string;
  subtasks?: Subtask[];
  color?: string;
  kind?: string;
  folderId?: string;
  group?: string;
  createdAt: string;
  /** done이 true로 바뀐 시각. 반복 규칙이 같은 날 새 회차를 만들지 않는 기준 */
  doneAt?: string;
  /** 이 할 일을 만든 반복 규칙 id */
  repeatId?: string;
  /** 반복 회차 날짜 (YYYY-MM-DD) */
  repeatKey?: string;
}

export interface TaskFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

export type TaskRepeatFreq = 'daily' | 'weekly' | 'monthly';

export interface TaskRepeatRule {
  freq: TaskRepeatFreq;
  /** daily: N일마다, weekly: N주마다 (monthly는 1) */
  interval: number;
  /** weekly 전용. 0=일 … 6=토 (Date#getDay) */
  weekdays: number[];
  /** monthly 전용. 1..31, 그 달에 없는 날은 말일 */
  monthDay: number;
}

export interface TaskRepeat {
  id: string;
  title: string;
  rule: TaskRepeatRule;
  /** HH:MM. 있으면 생성된 할 일의 due에 시간이 붙는다 */
  time?: string;
  estMin?: number;
  folderId?: string;
  group?: string;
  kind?: string;
  color?: string;
  enabled: boolean;
  /** YYYY-MM-DD. 반복 기준일이자 첫 회차 가능일 */
  startDate: string;
  /** 마지막으로 만든(또는 건너뛴) 회차 날짜 */
  lastKey?: string;
  createdAt: string;
}

/** 루틴(습관) 색상 키. 화면에서는 `var(--routine-<key>)`로 칠한다 */
export type RoutineColor = 'blue' | 'orange' | 'aqua' | 'yellow' | 'magenta' | 'violet';

export type RoutineSlot = 'morning' | 'afternoon' | 'evening' | 'anytime';

export type RoutineFreq = 'daily' | 'weekly';

export interface RoutineSchedule {
  freq: RoutineFreq;
  /** weekly 전용. 0=일 … 6=토 (Date#getDay) */
  weekdays: number[];
}

/** 보관했다가 다시 꺼낸 구간(양 끝 포함). 이 날들은 예정일로 치지 않는다 */
export interface RoutinePause {
  from: string;
  to: string;
}

export interface Routine {
  id: string;
  title: string;
  color: RoutineColor;
  slot: RoutineSlot;
  schedule: RoutineSchedule;
  /** 하루 목표 시간(분). 채우면 자동 완료 */
  goalMin?: number;
  /** YYYY-MM-DD. 이날부터 예정일을 센다 */
  startDate: string;
  /** YYYY-MM-DD. 보관한 날. 이날부터 예정일이 아니다 */
  archivedAt?: string;
  pauses?: RoutinePause[];
  order: number;
  createdAt: string;
}

export interface RoutineSession {
  start: string;
  end: string;
  secs: number;
}

/** 루틴 × 날짜 기록 */
export interface RoutineLog {
  routineId: string;
  /** YYYY-MM-DD (로컬 날짜) */
  date: string;
  done: boolean;
  doneAt?: string;
  /** 그날 기록한 시간(초) */
  secs: number;
  sessions?: RoutineSession[];
  updatedAt: string;
}

/** 지금 돌아가는 타이머. 한 번에 하나 */
export interface RoutineTimer {
  routineId: string;
  /** 시작한 로컬 날짜. 자정을 넘겨도 이 날짜에 기록 */
  date: string;
  /** RFC 3339 UTC */
  startedAt: string;
}

export interface DocSummary {
  id: string;
  state: DocState;
  title: string;
  slug?: string;
  path: string;
  collection: 'articles' | 'notes';
  tags: string[];
  updatedAt: string;
  createdAt: string;
  excerpt?: string;
  words: number;
}

export interface DocFile {
  path: string;
  raw: string;
  exists: boolean;
}

export interface VaultInfo {
  root: string;
  articleCount: number;
  noteCount: number;
}

export type BlockKind = string;

export const KNOWN_BLOCK_KINDS = [
  'routine',
  'health',
  'deep',
  'people',
  'meal',
  'leisure',
  'meet',
  'write',
  'read',
  'build',
  'publish',
  'life',
] as const;

export type KnownBlockKind = (typeof KNOWN_BLOCK_KINDS)[number];

export type BlockSource = 'local' | 'gcal' | 'applecal';

export interface Block {
  id: string;
  date: string;
  start: string;
  end: string;
  title: string;
  kind: BlockKind;
  endDate?: string;
  customLabel?: string;
  src?: string;
  attendees: string[];
  done: boolean;
  source: BlockSource;
  externalId?: string;
  taskId?: string;
  notes?: string;
  location?: string;
  calendarName?: string;
  organizer?: string;
  url?: string;
  recurring?: boolean;
  actualStart?: string;
  actualEnd?: string;
  doneAt?: string;
  color?: string;
  tags?: string[];
  createdAt: string;
}

export interface Mood {
  date: string;
  energy?: number;
  mood?: number;
  note?: string;
  retrospectiveNote?: string;
  retrospectiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type SummaryKind = 'weekly' | 'monthly';

export interface Summary {
  id: string;
  kind: SummaryKind;
  period: string;
  text: string;
  metricsJson?: string;
  generatedAt: string;
  readAt?: string;
  model?: string;
}

export type ReportPeriod = 'day' | 'week' | 'month';

export interface ReportSummary {
  id: string;
  period: ReportPeriod;
  generatedAt: string;
  model: string;
  path: string;
  preview: string;
}

export interface Report extends ReportSummary {
  body: string;
  metrics?: Record<string, unknown>;
}
