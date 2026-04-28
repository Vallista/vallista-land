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

export type GleanSource = 'web' | 'rss' | 'youtube' | 'paste';
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
  createdAt: string;
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
  url?: string;
  recurring?: boolean;
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
