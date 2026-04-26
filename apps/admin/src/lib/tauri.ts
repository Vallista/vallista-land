import { invoke } from '@tauri-apps/api/core';
import type {
  DocSummary,
  DocFile,
  VaultInfo,
  GleanItem,
  GleanHighlight,
  GleanSource,
  GleanStatus,
  Task,
} from '@vallista/content-core';

export interface AssetData {
  mime: string;
  base64: string;
}

export interface GleanInput {
  id: string;
  url: string;
  source: GleanSource;
  title: string;
  excerpt: string;
  body: string;
}

export async function listDocs(): Promise<DocSummary[]> {
  return invoke<DocSummary[]>('list_docs');
}

export async function readDoc(path: string): Promise<DocFile> {
  return invoke<DocFile>('read_doc', { path });
}

export async function writeDoc(path: string, content: string): Promise<void> {
  await invoke('write_doc', { path, content });
}

export async function readAsset(path: string): Promise<AssetData> {
  return invoke<AssetData>('read_asset', { path });
}

export async function listGlean(): Promise<GleanItem[]> {
  return invoke<GleanItem[]>('list_glean');
}

export async function readGlean(id: string): Promise<GleanItem> {
  return invoke<GleanItem>('read_glean', { id });
}

export async function addGlean(input: GleanInput): Promise<GleanItem> {
  return invoke<GleanItem>('add_glean', { input });
}

export async function updateGleanStatus(
  id: string,
  status: GleanStatus,
  promotedDocId?: string,
): Promise<GleanItem> {
  return invoke<GleanItem>('update_glean_status', {
    id,
    status,
    promotedDocId: promotedDocId ?? null,
  });
}

export async function updateGleanHighlights(
  id: string,
  highlights: GleanHighlight[],
): Promise<GleanItem> {
  return invoke<GleanItem>('update_glean_highlights', { id, highlights });
}

export async function deleteGlean(id: string): Promise<void> {
  await invoke('delete_glean', { id });
}

export interface FetchedContent {
  url: string;
  title: string;
  excerpt: string;
  body: string;
  sourceGuess: GleanSource;
}

export async function fetchUrl(url: string): Promise<FetchedContent> {
  return invoke<FetchedContent>('fetch_url', { url });
}

export interface TaskInput {
  id: string;
  title: string;
  due?: string;
  docId?: string;
}

export interface TaskPatch {
  title?: string;
  done?: boolean;
  due?: string | null;
  docId?: string | null;
}

export async function listTasks(): Promise<Task[]> {
  return invoke<Task[]>('list_tasks');
}

export async function addTask(input: TaskInput): Promise<Task> {
  return invoke<Task>('add_task', { input });
}

export async function updateTask(id: string, patch: TaskPatch): Promise<Task> {
  return invoke<Task>('update_task', { id, patch });
}

export async function deleteTask(id: string): Promise<void> {
  await invoke('delete_task', { id });
}

export async function vaultInfo(): Promise<VaultInfo> {
  return invoke<VaultInfo>('vault_info');
}

export interface GitFile {
  path: string;
  status: string;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
}

export interface GitCommit {
  hash: string;
  subject: string;
  author: string;
  time: string;
}

export interface GitState {
  branch: string;
  upstream: string | null;
  ahead: number;
  behind: number;
  files: GitFile[];
  lastCommit: GitCommit | null;
}

export interface CommitInput {
  message: string;
  paths: string[];
  push: boolean;
}

export async function gitStatus(): Promise<GitState> {
  return invoke<GitState>('git_status');
}

export async function gitLog(limit: number): Promise<GitCommit[]> {
  return invoke<GitCommit[]>('git_log', { limit });
}

export async function gitCommitPush(input: CommitInput): Promise<GitCommit> {
  return invoke<GitCommit>('git_commit_push', { input });
}

export interface InsightsDocRef {
  id: string;
  title: string;
  path: string;
  state: string;
  updatedAt: string;
  tags: string[];
}

export interface InsightsDocWithDegree extends InsightsDocRef {
  inCount: number;
  outCount: number;
}

export interface InsightsStateCounts {
  seed: number;
  sprout: number;
  draft: number;
  published: number;
}

export interface InsightsTagCount {
  tag: string;
  count: number;
}

export interface Insights {
  total: number;
  stateCounts: InsightsStateCounts;
  orphans: InsightsDocRef[];
  staleSeeds: InsightsDocRef[];
  tagCounts: InsightsTagCount[];
  hubs: InsightsDocWithDegree[];
  recentUpdates: InsightsDocRef[];
}

export async function computeInsights(): Promise<Insights> {
  return invoke<Insights>('compute_insights');
}

if (typeof window !== 'undefined') {
  (window as unknown as { pensmith?: unknown }).pensmith = {
    listDocs,
    readDoc,
    writeDoc,
    readAsset,
    listGlean,
    readGlean,
    addGlean,
    updateGleanStatus,
    updateGleanHighlights,
    deleteGlean,
    fetchUrl,
    listTasks,
    addTask,
    updateTask,
    deleteTask,
    gitStatus,
    gitLog,
    gitCommitPush,
    computeInsights,
    vaultInfo,
  };
}
