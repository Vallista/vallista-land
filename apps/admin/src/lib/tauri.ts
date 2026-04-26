import { Channel, invoke } from '@tauri-apps/api/core';
import type {
  Block,
  BlockKind,
  BlockSource,
  DocSummary,
  DocFile,
  Mood,
  Report,
  ReportSummary,
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

export interface BlockInput {
  id: string;
  date: string;
  start: string;
  end: string;
  title: string;
  kind: BlockKind;
  src?: string;
  attendees?: string[];
  source?: BlockSource;
  externalId?: string;
}

export interface BlockPatch {
  date?: string;
  start?: string;
  end?: string;
  title?: string;
  kind?: BlockKind;
  src?: string | null;
  attendees?: string[];
  done?: boolean;
  externalId?: string | null;
}

export async function listBlocks(): Promise<Block[]> {
  return invoke<Block[]>('list_blocks');
}

export async function listBlocksByDate(date: string): Promise<Block[]> {
  return invoke<Block[]>('list_blocks_by_date', { date });
}

export async function listBlocksInRange(startDate: string, endDate: string): Promise<Block[]> {
  return invoke<Block[]>('list_blocks_in_range', { startDate, endDate });
}

export async function addBlock(input: BlockInput): Promise<Block> {
  return invoke<Block>('add_block', { input });
}

export async function updateBlock(id: string, patch: BlockPatch): Promise<Block> {
  return invoke<Block>('update_block', { id, patch });
}

export async function deleteBlock(id: string): Promise<void> {
  await invoke('delete_block', { id });
}

export interface MoodInput {
  date: string;
  energy: number;
  mood: number;
  note?: string;
}

export async function listMood(): Promise<Mood[]> {
  return invoke<Mood[]>('list_mood');
}

export async function listMoodInRange(startDate: string, endDate: string): Promise<Mood[]> {
  return invoke<Mood[]>('list_mood_in_range', { startDate, endDate });
}

export async function getMood(date: string): Promise<Mood | null> {
  return invoke<Mood | null>('get_mood', { date });
}

export async function setMood(input: MoodInput): Promise<Mood> {
  return invoke<Mood>('set_mood', { input });
}

export async function deleteMood(date: string): Promise<void> {
  await invoke('delete_mood', { date });
}

export async function listReports(): Promise<ReportSummary[]> {
  return invoke<ReportSummary[]>('list_reports');
}

export async function readReport(path: string): Promise<Report> {
  return invoke<Report>('read_report', { path });
}

export interface LlmModelInfo {
  name: string;
  path: string;
  size: number;
}

export interface LlmStatus {
  dataDir: string;
  binPath: string;
  binPresent: boolean;
  modelsDir: string;
  models: LlmModelInfo[];
  running: boolean;
  port: number | null;
  currentModel: string | null;
}

export interface LlmStartInput {
  modelName: string;
  contextSize?: number;
  threads?: number;
}

export interface LlmChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmChatInput {
  messages: LlmChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export async function llmStatus(): Promise<LlmStatus> {
  return invoke<LlmStatus>('llm_status');
}

export async function llmStart(input: LlmStartInput): Promise<number> {
  return invoke<number>('llm_start', { input });
}

export async function llmStop(): Promise<void> {
  await invoke('llm_stop');
}

export async function llmHealth(): Promise<boolean> {
  return invoke<boolean>('llm_health');
}

export async function llmChat(input: LlmChatInput): Promise<string> {
  return invoke<string>('llm_chat', { input });
}

export type LlmDownloadEvent =
  | { kind: 'started'; data: { total: number | null } }
  | { kind: 'progress'; data: { downloaded: number; total: number | null } }
  | { kind: 'finished'; data: { path: string } }
  | { kind: 'failed'; data: { message: string } };

export async function llmDownloadModel(
  url: string,
  fileName: string,
  onEvent: (event: LlmDownloadEvent) => void,
): Promise<string> {
  const channel = new Channel<LlmDownloadEvent>();
  channel.onmessage = onEvent;
  return invoke<string>('llm_download_model', { url, fileName, onEvent: channel });
}

export async function llmDeleteModel(fileName: string): Promise<void> {
  await invoke('llm_delete_model', { fileName });
}

export async function llmInstallBinary(sourcePath: string): Promise<string> {
  return invoke<string>('llm_install_binary', { sourcePath });
}

export async function llmOpenDataDir(): Promise<void> {
  await invoke('llm_open_data_dir');
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
    listBlocks,
    listBlocksByDate,
    listBlocksInRange,
    addBlock,
    updateBlock,
    deleteBlock,
    listMood,
    listMoodInRange,
    getMood,
    setMood,
    deleteMood,
    listReports,
    readReport,
    llmStatus,
    llmStart,
    llmStop,
    llmHealth,
    llmChat,
    llmDownloadModel,
    llmDeleteModel,
    llmInstallBinary,
    llmOpenDataDir,
    gitStatus,
    gitLog,
    gitCommitPush,
    computeInsights,
    vaultInfo,
  };
}
