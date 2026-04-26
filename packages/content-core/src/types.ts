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
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  due?: string;
  docId?: string;
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
