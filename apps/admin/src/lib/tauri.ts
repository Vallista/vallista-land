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
  Summary,
  SummaryKind,
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

export async function updateGleanDigest(
  id: string,
  digest: string | null,
): Promise<GleanItem> {
  return invoke<GleanItem>('update_glean_digest', { id, digest });
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
  estMin?: number;
  startAt?: string;
  tags?: string[];
  notes?: string;
  subtasks?: import('@vallista/content-core').Subtask[];
}

export interface TaskPatch {
  title?: string;
  done?: boolean;
  due?: string | null;
  docId?: string | null;
  estMin?: number | null;
  startAt?: string | null;
  tags?: string[];
  notes?: string | null;
  subtasks?: import('@vallista/content-core').Subtask[];
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
  endDate?: string;
  customLabel?: string;
  src?: string;
  attendees?: string[];
  source?: BlockSource;
  externalId?: string;
  taskId?: string;
}

export interface BlockPatch {
  date?: string;
  start?: string;
  end?: string;
  title?: string;
  kind?: BlockKind;
  endDate?: string | null;
  customLabel?: string | null;
  src?: string | null;
  attendees?: string[];
  done?: boolean;
  externalId?: string | null;
  taskId?: string | null;
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

export interface IcalImportResult {
  added: number;
  updated: number;
  skipped: number;
  total: number;
}

export interface IcalFeed {
  id: string;
  label: string;
  url: string;
  lastSyncedAt?: string | null;
  lastResult?: IcalImportResult | null;
}

export async function importIcalUrl(url: string): Promise<IcalImportResult> {
  return invoke<IcalImportResult>('import_ical_url', { url });
}

export async function listIcalFeeds(): Promise<IcalFeed[]> {
  return invoke<IcalFeed[]>('list_ical_feeds');
}

export async function addIcalFeed(label: string, url: string): Promise<IcalFeed> {
  return invoke<IcalFeed>('add_ical_feed', { input: { label, url } });
}

export async function removeIcalFeed(id: string): Promise<void> {
  await invoke('remove_ical_feed', { id });
}

export async function syncIcalFeeds(): Promise<IcalFeed[]> {
  return invoke<IcalFeed[]>('sync_ical_feeds');
}

export interface RssSyncResult {
  added: number;
  updated: number;
  skipped: number;
  total: number;
  error?: string;
}

export interface RssFeed {
  id: string;
  label: string;
  url: string;
  sourceKind: string;
  intervalMin: number;
  enabled: boolean;
  lastSyncedAt?: string | null;
  lastResult?: RssSyncResult | null;
  lastEtag?: string | null;
  lastModified?: string | null;
}

export interface RssConfig {
  defaultIntervalMin: number;
  runOnAppStart: boolean;
  maxConcurrent: number;
  timeoutSec: number;
  respectEtag: boolean;
  autoSyncEnabled: boolean;
}

export interface RssFeedInput {
  label: string;
  url: string;
  sourceKind?: string;
  intervalMin?: number;
}

export interface RssFeedPatch {
  label?: string;
  intervalMin?: number;
  enabled?: boolean;
  sourceKind?: string;
}

export async function listRssFeeds(): Promise<RssFeed[]> {
  return invoke<RssFeed[]>('list_rss_feeds');
}

export async function addRssFeed(input: RssFeedInput): Promise<RssFeed> {
  return invoke<RssFeed>('add_rss_feed', { input });
}

export async function removeRssFeed(id: string): Promise<void> {
  await invoke('remove_rss_feed', { id });
}

export async function updateRssFeed(id: string, patch: RssFeedPatch): Promise<RssFeed> {
  return invoke<RssFeed>('update_rss_feed', { id, patch });
}

export async function syncRssFeed(id: string): Promise<RssSyncResult> {
  return invoke<RssSyncResult>('sync_rss_feed', { id });
}

export async function syncRssFeeds(): Promise<Array<[string, RssSyncResult]>> {
  return invoke<Array<[string, RssSyncResult]>>('sync_rss_feeds');
}

export async function getRssConfig(): Promise<RssConfig> {
  return invoke<RssConfig>('get_rss_config');
}

export async function setRssConfig(input: RssConfig): Promise<RssConfig> {
  return invoke<RssConfig>('set_rss_config', { input });
}

export interface MacosCalStatus {
  available: boolean;
  authorization:
    | 'notDetermined'
    | 'restricted'
    | 'denied'
    | 'writeOnly'
    | 'fullAccess'
    | 'unsupported'
    | 'unknown';
  message: string;
}

export interface MacosCalEvent {
  title: string;
  date: string;
  start: string;
  end: string;
  calendar?: string | null;
  location?: string | null;
  uid?: string | null;
  allDay: boolean;
}

export interface MacosCalImportReport {
  total: number;
  added: number;
  updated: number;
  skipped: number;
  events: MacosCalEvent[];
}

export interface MacosCalImportArgs {
  calendars?: string[];
  daysBack?: number;
  daysForward?: number;
  dryRun?: boolean;
}

export async function macosCalStatus(): Promise<MacosCalStatus> {
  return invoke<MacosCalStatus>('macos_cal_status');
}

export async function macosCalList(): Promise<string[]> {
  return invoke<string[]>('macos_cal_list');
}

export async function macosCalImport(
  args: MacosCalImportArgs,
): Promise<MacosCalImportReport> {
  return invoke<MacosCalImportReport>('macos_cal_import', { args });
}

export async function macosCalRequestAccess(): Promise<MacosCalStatus> {
  return invoke<MacosCalStatus>('macos_cal_request_access');
}

export async function macosCalOpenPrivacy(): Promise<void> {
  return invoke<void>('macos_cal_open_privacy');
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

export async function setRetrospective(date: string, note: string): Promise<Mood> {
  return invoke<Mood>('set_retrospective', { input: { date, note } });
}

export async function deleteMood(date: string): Promise<void> {
  await invoke('delete_mood', { date });
}

export interface SummaryUpsertInput {
  kind: SummaryKind;
  period: string;
  text: string;
  metricsJson?: string;
  model?: string;
}

export async function listSummaries(): Promise<Summary[]> {
  return invoke<Summary[]>('list_summaries');
}

export async function getSummary(
  kind: SummaryKind,
  period: string,
): Promise<Summary | null> {
  return invoke<Summary | null>('get_summary', { kind, period });
}

export async function latestUnreadSummary(): Promise<Summary | null> {
  return invoke<Summary | null>('latest_unread_summary');
}

export async function upsertSummary(input: SummaryUpsertInput): Promise<Summary> {
  return invoke<Summary>('upsert_summary', { input });
}

export async function markSummaryRead(id: string): Promise<Summary> {
  return invoke<Summary>('mark_summary_read', { id });
}

export async function listReports(): Promise<ReportSummary[]> {
  return invoke<ReportSummary[]>('list_reports');
}

export async function readReport(path: string): Promise<Report> {
  return invoke<Report>('read_report', { path });
}

export interface MigrateReportsReport {
  copied: number;
  skipped: number;
  backupPath: string;
}

export async function migrateReports(): Promise<MigrateReportsReport> {
  return invoke<MigrateReportsReport>('migrate_reports');
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

export async function llmDownloadServer(
  onEvent: (event: LlmDownloadEvent) => void,
): Promise<string> {
  const channel = new Channel<LlmDownloadEvent>();
  channel.onmessage = onEvent;
  return invoke<string>('llm_download_server', { onEvent: channel });
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

export interface ContentRootStatus {
  configured: boolean;
  path: string | null;
}

export async function contentRootStatus(): Promise<ContentRootStatus> {
  return invoke<ContentRootStatus>('content_root_status');
}

export async function pickContentRoot(): Promise<string | null> {
  return invoke<string | null>('pick_content_root');
}

export async function setContentRoot(path: string): Promise<void> {
  await invoke('set_content_root', { path });
}

export interface AppSetupStatus {
  blogEnabled: boolean;
  blogReady: boolean;
  contentPath: string | null;
  gitRemote: string | null;
  gitBranch: string | null;
  gitEmail: string | null;
  gitName: string | null;
  reportsMigrated: boolean;
}

export interface BlogConfigInput {
  enabled: boolean;
  contentPath?: string | null;
  gitRemote?: string | null;
  gitBranch?: string | null;
  gitEmail?: string | null;
  gitName?: string | null;
}

export async function appSetupStatus(): Promise<AppSetupStatus> {
  return invoke<AppSetupStatus>('app_setup_status');
}

export async function setBlogConfig(input: BlogConfigInput): Promise<AppSetupStatus> {
  return invoke<AppSetupStatus>('set_blog_config', { input });
}

export async function keychainSetToken(remote: string, token: string): Promise<void> {
  await invoke('keychain_set_token', { remote, token });
}

export async function keychainHasToken(remote: string): Promise<boolean> {
  return invoke<boolean>('keychain_has_token', { remote });
}

export async function keychainDeleteToken(remote: string): Promise<void> {
  await invoke('keychain_delete_token', { remote });
}

export async function showQuick(kind: string): Promise<void> {
  await invoke('show_quick_window', { kind });
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

export async function blogSetupWorkspace(): Promise<string> {
  return invoke<string>('blog_setup_workspace');
}

export async function blogPull(): Promise<string> {
  return invoke<string>('blog_pull');
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
  (window as unknown as { bento?: unknown }).bento = {
    listDocs,
    readDoc,
    writeDoc,
    readAsset,
    listGlean,
    readGlean,
    addGlean,
    updateGleanStatus,
    updateGleanHighlights,
    updateGleanDigest,
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
    importIcalUrl,
    listIcalFeeds,
    addIcalFeed,
    removeIcalFeed,
    syncIcalFeeds,
    listRssFeeds,
    addRssFeed,
    removeRssFeed,
    updateRssFeed,
    syncRssFeed,
    syncRssFeeds,
    getRssConfig,
    setRssConfig,
    macosCalStatus,
    macosCalRequestAccess,
    macosCalList,
    macosCalImport,
    listMood,
    listMoodInRange,
    getMood,
    setMood,
    setRetrospective,
    deleteMood,
    listSummaries,
    getSummary,
    latestUnreadSummary,
    upsertSummary,
    markSummaryRead,
    listReports,
    readReport,
    llmStatus,
    llmStart,
    llmStop,
    llmHealth,
    llmChat,
    llmDownloadModel,
    llmDownloadServer,
    llmDeleteModel,
    llmInstallBinary,
    llmOpenDataDir,
    gitStatus,
    gitLog,
    gitCommitPush,
    blogSetupWorkspace,
    blogPull,
    computeInsights,
    vaultInfo,
    appSetupStatus,
    setBlogConfig,
  };
}
