import { Channel, invoke as _invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { logError, logInfo } from './errorLog';
import { dispatchToast } from '../components/NotifToast';

// 백그라운드 자동 실행 커맨드 — 에러 시 로그만 적재, 토스트 없음
const SILENT_COMMANDS = new Set([
  'app_setup_status',
  'llm_status',
  'llm_health',
  'read_global_keybindings',
  'set_global_shortcuts',
  'migrate_task_notes_to_event_notes',
  'migrate_block_notes_to_event_notes',
  'sync_ical_feeds',
  'macos_cal_status',
  'macos_cal_list',
  'macos_cal_import',
]);

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const silent = SILENT_COMMANDS.has(cmd);
  if (!silent) void logInfo(`→ ${cmd}`, { source: cmd });
  try {
    const result = await _invoke<T>(cmd, args);
    if (!silent) void logInfo(`← ${cmd} ok`, { source: cmd });
    return result;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e ?? '알 수 없는 오류');
    const stack = e instanceof Error ? e.stack : undefined;
    void logError(message, { source: cmd, stack });
    if (!silent) {
      dispatchToast({ title: '오류', body: `[${cmd}] ${message}`.slice(0, 120) });
    }
    throw e;
  }
}

const INTERACTIVE = 'button, input, textarea, select, a, [role="button"]';

let _dragPending = false;
let _dragStartX = 0;
let _dragStartY = 0;
let _lastMouseDownTime = 0;

function onDragMove(e: MouseEvent) {
  if (!_dragPending) return;
  const dx = e.clientX - _dragStartX;
  const dy = e.clientY - _dragStartY;
  if (dx * dx + dy * dy < 25) return;
  _dragPending = false;
  window.removeEventListener('mousemove', onDragMove);
  window.removeEventListener('mouseup', onDragCancel);
  void getCurrentWindow().startDragging();
}

function onDragCancel() {
  _dragPending = false;
  window.removeEventListener('mousemove', onDragMove);
}

export function startWindowDrag(e: { target: EventTarget | null; clientX: number; clientY: number }) {
  const now = Date.now();
  const isDouble = now - _lastMouseDownTime < 400;
  _lastMouseDownTime = now;

  if (isDouble) {
    _lastMouseDownTime = 0;
    _dragPending = false;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragCancel);
    void getCurrentWindow().toggleMaximize();
    return;
  }

  if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
  _dragPending = true;
  _dragStartX = e.clientX;
  _dragStartY = e.clientY;
  window.addEventListener('mousemove', onDragMove);
  window.addEventListener('mouseup', onDragCancel, { once: true });
}
import type {
  Block,
  BlockKind,
  BlockSource,
  BodyLog,
  BodySpec,
  DocSummary,
  DocFile,
  ExerciseEntry,
  MealEntry,
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

export type { BodyLog, BodySpec, ExerciseEntry, MealEntry };

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

export async function writeAsset(path: string, base64: string): Promise<void> {
  await invoke('write_asset', { path, base64 });
}

export interface GleanPage {
  items: GleanItem[];
  total: number;
}

export interface GleanCounts {
  total: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  todayRssCount: number;
  todayRssTitles: string[];
  byFeedId: Record<string, number>;
}

export async function listGlean(params: {
  status?: string;
  source?: string;
  offset: number;
  limit: number;
}): Promise<GleanPage> {
  return invoke<GleanPage>('list_glean', {
    status: params.status ?? null,
    source: params.source ?? null,
    offset: params.offset,
    limit: params.limit,
  });
}

export async function gleanCounts(): Promise<GleanCounts> {
  return invoke<GleanCounts>('glean_counts');
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
  color?: string;
  kind?: string;
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
  color?: string | null;
  kind?: string | null;
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
  notes?: string;
  color?: string;
  tags?: string[];
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
  actualStart?: string | null;
  actualEnd?: string | null;
  doneAt?: string | null;
  notes?: string | null;
  color?: string | null;
  tags?: string[];
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

export async function purgeStaleBlocks(): Promise<number> {
  return invoke<number>('purge_stale_blocks');
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

export interface EventNote {
  id: string;
  eventKey: string;
  seriesKey: string;
  eventTitleSnapshot: string;
  eventDateSnapshot: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EventNoteUpsertInput {
  id?: string;
  eventKey: string;
  seriesKey: string;
  eventTitleSnapshot: string;
  eventDateSnapshot: string;
  body: string;
  tags?: string[];
}

export function eventNoteKeysFromBlock(block: Block, occurrenceDate?: string): {
  eventKey: string;
  seriesKey: string;
} {
  const date = occurrenceDate ?? block.date;
  const source = block.source ?? 'local';
  if (source === 'local' || !block.externalId) {
    // task 블록은 id가 이미 "task:xxx" 형태 — TaskEditor와 키 일치를 위해 그대로 사용
    const key = block.id.startsWith('task:') ? block.id : `local:${block.id}`;
    return { eventKey: key, seriesKey: key };
  }
  const seriesKey = `${source}:${block.externalId}`;
  return { eventKey: `${seriesKey}@${date}`, seriesKey };
}

export async function listEventNotes(): Promise<EventNote[]> {
  return invoke<EventNote[]>('list_event_notes');
}

export async function listEventNotesByEvent(eventKey: string): Promise<EventNote[]> {
  return invoke<EventNote[]>('list_event_notes_by_event', { eventKey });
}

export async function listEventNotesBySeries(seriesKey: string): Promise<EventNote[]> {
  return invoke<EventNote[]>('list_event_notes_by_series', { seriesKey });
}

export async function upsertEventNote(input: EventNoteUpsertInput): Promise<EventNote> {
  return invoke<EventNote>('upsert_event_note', { input });
}

export async function deleteEventNote(id: string): Promise<void> {
  await invoke('delete_event_note', { id });
}

export async function migrateTaskNotesToEventNotes(): Promise<number> {
  return invoke<number>('migrate_task_notes_to_event_notes');
}

export async function migrateBlockNotesToEventNotes(): Promise<number> {
  return invoke<number>('migrate_block_notes_to_event_notes');
}

export interface EventSubtask {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface AddEventSubtaskInput {
  eventKey: string;
  seriesKey: string;
  eventTitleSnapshot: string;
  eventDateSnapshot: string;
  title: string;
}

export interface EventSubtaskCount {
  eventKey: string;
  total: number;
  done: number;
}

export async function listEventSubtasks(eventKey: string): Promise<EventSubtask[]> {
  return invoke<EventSubtask[]>('list_event_subtasks', { eventKey });
}

export async function addEventSubtask(input: AddEventSubtaskInput): Promise<EventSubtask> {
  return invoke<EventSubtask>('add_event_subtask', { input });
}

export async function toggleEventSubtask(eventKey: string, id: string, done: boolean): Promise<EventSubtask> {
  return invoke<EventSubtask>('toggle_event_subtask', { eventKey, id, done });
}

export async function deleteEventSubtask(eventKey: string, id: string): Promise<void> {
  await invoke('delete_event_subtask', { eventKey, id });
}

export async function listAllEventSubtaskCounts(): Promise<EventSubtaskCount[]> {
  return invoke<EventSubtaskCount[]>('list_all_event_subtask_counts');
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

export interface ChromeStatus {
  found: boolean;
  path?: string | null;
  name?: string | null;
  downloadUrl: string;
}

export async function checkChrome(): Promise<ChromeStatus> {
  return invoke<ChromeStatus>('check_chrome');
}

export async function fetchThreadsProfile(
  url: string,
  maxScrolls?: number,
): Promise<RssSyncResult> {
  return invoke<RssSyncResult>('fetch_threads_profile', {
    url,
    maxScrolls: maxScrolls ?? null,
  });
}

export interface ThreadsDebugResult {
  htmlSnippet: string;
  articleCount: number;
  postLinkCount: number;
  title: string;
  cookieCount: number;
  articleSelCounts: [string, number][];
}

export async function debugThreadsPage(url: string): Promise<ThreadsDebugResult> {
  return invoke<ThreadsDebugResult>('debug_threads_page', { url });
}

export interface ThreadsProfile {
  id: string;
  url: string;
  label: string;
  autoSync: boolean;
  lastSyncedAt?: string | null;
  lastResult?: RssSyncResult | null;
}

export async function listThreadsProfiles(): Promise<ThreadsProfile[]> {
  return invoke<ThreadsProfile[]>('list_threads_profiles');
}

export async function addThreadsProfile(
  url: string,
  label: string,
  autoSync: boolean,
  maxScrolls?: number,
): Promise<ThreadsProfile> {
  return invoke<ThreadsProfile>('add_threads_profile', {
    url,
    label,
    autoSync,
    maxScrolls: maxScrolls ?? null,
  });
}

export async function removeThreadsProfile(id: string): Promise<void> {
  await invoke('remove_threads_profile', { id });
}

export async function setThreadsAutosync(id: string, enabled: boolean): Promise<ThreadsProfile> {
  return invoke<ThreadsProfile>('set_threads_autosync', { id, enabled });
}

export async function syncThreadsProfile(id: string): Promise<ThreadsProfile> {
  return invoke<ThreadsProfile>('sync_threads_profile', { id });
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

export async function openPrivacySecurity(): Promise<void> {
  return invoke<void>('open_privacy_security');
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

export interface BodyLogInput {
  date: string;
  weight?: number;
  bodyFat?: number;
  sleepAt?: string;
  wakeAt?: string;
  exercises?: ExerciseEntry[];
  meals?: MealEntry[];
}

export async function listBodyLog(): Promise<BodyLog[]> {
  return invoke<BodyLog[]>('list_body_log');
}

export async function listBodyLogInRange(startDate: string, endDate: string): Promise<BodyLog[]> {
  return invoke<BodyLog[]>('list_body_log_in_range', { startDate, endDate });
}

export async function getBodyLog(date: string): Promise<BodyLog | null> {
  return invoke<BodyLog | null>('get_body_log', { date });
}

export async function setBodyLog(input: BodyLogInput): Promise<BodyLog> {
  return invoke<BodyLog>('set_body_log', { input });
}

export async function deleteBodyLog(date: string): Promise<void> {
  await invoke('delete_body_log', { date });
}

export async function getBodySpec(): Promise<BodySpec | null> {
  return invoke<BodySpec | null>('get_body_spec');
}

export async function setBodySpec(spec: BodySpec): Promise<BodySpec> {
  return invoke<BodySpec>('set_body_spec', { spec });
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

export async function listStatsExcluded(): Promise<string[]> {
  return invoke<string[]>('list_stats_excluded');
}

export async function setStatsExclusions(keys: string[]): Promise<void> {
  await invoke('set_stats_exclusions', { keys });
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
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return await invoke<string>('llm_chat', { input });
    } catch (e) {
      const msg = String(e);
      if (msg.includes('503') && msg.includes('Loading model') && attempt < 7) {
        await new Promise<void>((r) => setTimeout(r, 2000));
        continue;
      }
      throw e;
    }
  }
  throw new Error('llm_chat failed after retries');
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

export interface LlmSettings {
  provider: 'local' | 'claude' | 'openai' | 'gemini';
  localModel: string | null;
  claudeModel: string | null;
  openaiModel: string | null;
  geminiModel: string | null;
}

export async function llmGetSettings(): Promise<LlmSettings> {
  return invoke<LlmSettings>('llm_get_settings');
}

export async function llmSaveSettings(settings: LlmSettings): Promise<void> {
  await invoke('llm_save_settings', { settings });
}

export async function llmGetApiKey(provider: string): Promise<string | null> {
  return invoke<string | null>('llm_get_api_key', { provider });
}

export async function openUrl(url: string): Promise<void> {
  await invoke('open_url', { url });
}

export async function vaultInfo(): Promise<VaultInfo> {
  return invoke<VaultInfo>('vault_info');
}

export interface MemoryInfo {
  processRssBytes: number;
  blocksBytes: number;
  tasksBytes: number;
  eventNotesBytes: number;
  gleanBytes: number;
  otherBytes: number;
}

export async function getMemoryInfo(): Promise<MemoryInfo> {
  return invoke<MemoryInfo>('get_memory_info');
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

export interface AppPersonalization {
  appName: string;
  appUrl: string;
  keychainService: string;
  articlesDir: string;
  notesDir: string;
}

export async function getAppPersonalization(): Promise<AppPersonalization> {
  return invoke<AppPersonalization>('get_app_personalization');
}

export async function setAppPersonalization(input: AppPersonalization): Promise<void> {
  await invoke('set_app_personalization', { input });
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

export interface ClipboardEntry {
  id: string;
  text: string;
  copiedAt: string;
}

export async function clipboardReadText(): Promise<string> {
  return invoke<string>('clipboard_read_text');
}

export async function clipboardHistoryList(): Promise<ClipboardEntry[]> {
  return invoke<ClipboardEntry[]>('clipboard_history_list');
}

export async function clipboardHistoryPush(text: string, maxHistory?: number): Promise<ClipboardEntry[]> {
  return invoke<ClipboardEntry[]>('clipboard_history_push', { text, maxHistory });
}

export async function clipboardHistoryDelete(id: string): Promise<ClipboardEntry[]> {
  return invoke<ClipboardEntry[]>('clipboard_history_delete', { id });
}

export async function clipboardHistoryClear(): Promise<void> {
  await invoke('clipboard_history_clear');
}

export async function clipboardHistoryPruneByDays(days: number): Promise<ClipboardEntry[]> {
  return invoke<ClipboardEntry[]>('clipboard_history_prune_by_days', { days });
}

export async function clipboardHistoryDeleteWithinHours(hours: number): Promise<ClipboardEntry[]> {
  return invoke<ClipboardEntry[]>('clipboard_history_delete_within_hours', { hours });
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

export async function readGlobalKeybindingsFromDisk(): Promise<import('./keybindings').GlobalKeybindings> {
  return invoke('read_global_keybindings');
}

export async function writeGlobalKeybindingsToDisk(
  keybindings: import('./keybindings').GlobalKeybindings,
): Promise<void> {
  await invoke('write_global_keybindings', { keybindings });
}

export async function applyGlobalShortcuts(
  kb: import('./keybindings').GlobalKeybindings,
): Promise<void> {
  const { toRustShortcut, GLOBAL_ACTION_KINDS } = await import('./keybindings');
  const order = ['globalThought', 'globalTask', 'globalClipboard'] as const;
  const shortcuts = order.map((id) => [toRustShortcut(kb[id]), GLOBAL_ACTION_KINDS[id]]);
  await invoke('set_global_shortcuts', { shortcuts });
}

// ── Mail (IMAP) ──────────────────────────────────────
export interface MailAccount {
  id: string;
  label: string;
  host: string;
  port: number;
  tls: boolean;
  username: string;
  passwordEnc: string;
  authKind: 'password' | 'oauth2';
}

export interface MailAccountInput {
  id?: string;
  label: string;
  host: string;
  port: number;
  tls: boolean;
  username: string;
  password: string;
}

export interface MailFolder {
  name: string;
  delimiter: string;
  flags: string[];
  unread?: number;
}

export interface MailMessage {
  uid: number;
  subject: string;
  from: string;
  date: string;
  seen: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  folder?: string;
  accountId?: string;
}

export interface MailMessageFull extends MailMessage {
  to: string;
  bodyText: string;
  bodyHtml: string;
  attachments: string[];
}

export interface MailListResult {
  messages: MailMessage[];
  total: number;
  unseen: number;
}

export const mailListAccounts = () => invoke<MailAccount[]>('mail_list_accounts');
export const mailAddAccount = (input: MailAccountInput) =>
  invoke<MailAccount>('mail_add_account', { input });
export const mailUpdateAccount = (input: MailAccountInput) =>
  invoke<MailAccount>('mail_update_account', { input });
export const mailDeleteAccount = (id: string) => invoke<void>('mail_delete_account', { id });
export const mailTestConnection = (id: string) => invoke<void>('mail_test_connection', { id });
const FOLDER_CACHE_TTL = 5 * 60 * 1000; // 5분
type FolderCacheEntry = { data: MailFolder[]; at: number };
const _folderCache = new Map<string, FolderCacheEntry>();

export const mailListFolders = (accountId: string): Promise<MailFolder[]> => {
  const hit = _folderCache.get(accountId);
  if (hit && Date.now() - hit.at < FOLDER_CACHE_TTL) return Promise.resolve(hit.data);
  return invoke<MailFolder[]>('mail_list_folders', { accountId }).then((data) => {
    _folderCache.set(accountId, { data, at: Date.now() });
    return data;
  });
};

export const mailInvalidateFolderCache = (accountId?: string) => {
  if (accountId) _folderCache.delete(accountId);
  else _folderCache.clear();
};

const UNREAD_CACHE_TTL = 2 * 60 * 1000; // 2분
type UnreadCacheEntry = { data: Record<string, number>; at: number };
const _unreadCache = new Map<string, UnreadCacheEntry>();

export const mailFolderUnreadCounts = (accountId: string): Promise<Record<string, number>> => {
  const hit = _unreadCache.get(accountId);
  if (hit && Date.now() - hit.at < UNREAD_CACHE_TTL) return Promise.resolve(hit.data);
  return invoke<Record<string, number>>('mail_folder_unread_counts', { accountId }).then((data) => {
    _unreadCache.set(accountId, { data, at: Date.now() });
    return data;
  });
};

export const mailInvalidateUnreadCache = (accountId?: string) => {
  if (accountId) _unreadCache.delete(accountId);
  else _unreadCache.clear();
};
export const mailListMessages = (accountId: string, folder: string, page: number): Promise<MailListResult> =>
  invoke<MailListResult>('mail_list_messages', { accountId, folder, page }).then((result) => {
    const existing = _unreadCache.get(accountId);
    // at은 갱신하지 않음 — 한 폴더의 부분 데이터로 전체 캐시 TTL을 연장하면
    // mailFolderUnreadCounts 캐시 히트 시 다른 폴더의 unread가 0으로 보이는 버그 발생
    _unreadCache.set(accountId, {
      data: { ...(existing?.data ?? {}), [folder]: result.unseen },
      at: existing?.at ?? 0,
    });
    return result;
  });
export const mailListAllMessages = (accountId: string, page: number) =>
  invoke<MailMessage[]>('mail_list_all_messages', { accountId, page });
export const mailListAllAccountsMessages = (page: number) =>
  invoke<MailMessage[]>('mail_list_all_accounts_messages', { page });
export const mailFetchAllAccountsFull = () =>
  invoke<MailMessage[]>('mail_fetch_all_accounts_full');
export const mailListUnreadMessages = (accountId: string, folder: string): Promise<MailMessage[]> =>
  invoke<MailMessage[]>('mail_list_unread_messages', { accountId, folder });
export const mailListAllAccountsUnreadMessages = (): Promise<MailMessage[]> =>
  invoke<MailMessage[]>('mail_list_all_accounts_unread_messages');
export const mailCheckNew = (accountId: string, folder: string, sinceUid: number) =>
  invoke<MailMessage[]>('mail_check_new', { accountId, folder, sinceUid });
export const mailUnreadCountAll = () => invoke<number>('mail_unread_count_all');

const MSG_CACHE_MAX = 30;
const MSG_CACHE_TTL = 3 * 60 * 1000; // 3분
type MsgCacheEntry = { data: MailMessageFull; at: number };
const _msgCache = new Map<string, MsgCacheEntry>();
const _msgCacheKey = (accountId: string, folder: string, uid: number) =>
  `${accountId}\0${folder}\0${uid}`;
function _msgCachePut(key: string, data: MailMessageFull) {
  if (_msgCache.size >= MSG_CACHE_MAX) {
    let oldestKey = '';
    let oldestAt = Infinity;
    for (const [k, v] of _msgCache) {
      if (v.at < oldestAt) { oldestAt = v.at; oldestKey = k; }
    }
    if (oldestKey) _msgCache.delete(oldestKey);
  }
  _msgCache.set(key, { data, at: Date.now() });
}

export const mailGetMessage = (
  accountId: string,
  folder: string,
  uid: number,
): Promise<MailMessageFull> => {
  const key = _msgCacheKey(accountId, folder, uid);
  const hit = _msgCache.get(key);
  if (hit && Date.now() - hit.at < MSG_CACHE_TTL) return Promise.resolve(hit.data);
  return invoke<MailMessageFull>('mail_get_message', { accountId, folder, uid }).then((msg) => {
    _msgCachePut(key, msg);
    return msg;
  });
};
export const mailSetSeen = (
  accountId: string,
  folder: string,
  uid: number,
  seen: boolean,
) =>
  invoke<void>('mail_set_seen', { accountId, folder, uid, seen }).then((r) => {
    const key = _msgCacheKey(accountId, folder, uid);
    const hit = _msgCache.get(key);
    if (hit) _msgCache.set(key, { data: { ...hit.data, seen }, at: hit.at });
    return r;
  });
export const mailSetSeenBulk = (
  accountId: string,
  folder: string,
  uids: number[],
  seen: boolean,
) =>
  invoke<void>('mail_set_seen_bulk', { accountId, folder, uids, seen }).then((r) => {
    for (const uid of uids) {
      const key = _msgCacheKey(accountId, folder, uid);
      const hit = _msgCache.get(key);
      if (hit) _msgCache.set(key, { data: { ...hit.data, seen }, at: hit.at });
    }
    return r;
  });
export const mailSetFlagged = (
  accountId: string,
  folder: string,
  uid: number,
  flagged: boolean,
) =>
  invoke<void>('mail_set_flagged', { accountId, folder, uid, flagged }).then((r) => {
    const key = _msgCacheKey(accountId, folder, uid);
    const hit = _msgCache.get(key);
    if (hit) _msgCache.set(key, { data: { ...hit.data, flagged }, at: hit.at });
    return r;
  });
export const mailDeleteMessage = (accountId: string, folder: string, uid: number) =>
  invoke<void>('mail_delete_message', { accountId, folder, uid }).then((r) => {
    _msgCache.delete(_msgCacheKey(accountId, folder, uid));
    return r;
  });
export const mailOAuthStart = (params: {
  clientId: string;
  clientSecret: string;
  label: string;
}) => invoke<MailAccount>('mail_oauth_start', params);

// === radar ===
import type {
  Goal,
  GoalInput,
  GoalPatch,
  RadarTask,
  RadarTaskInput,
  RadarTaskPatch,
  RadarActivity,
} from '../screens/Radar/types';

export async function listGoals(): Promise<Goal[]> {
  return invoke<Goal[]>('list_goals');
}

export async function addGoal(input: GoalInput): Promise<Goal> {
  return invoke<Goal>('add_goal', { input });
}

export async function updateGoal(id: string, patch: GoalPatch): Promise<Goal> {
  return invoke<Goal>('update_goal', { id, patch });
}

export async function deleteGoal(id: string): Promise<void> {
  await invoke('delete_goal', { id });
}

export async function listRadarTasks(goalId?: string): Promise<RadarTask[]> {
  return invoke<RadarTask[]>('list_radar_tasks', { goalId: goalId ?? null });
}

export async function addRadarTask(input: RadarTaskInput): Promise<RadarTask> {
  return invoke<RadarTask>('add_radar_task', {
    input: {
      id: input.id,
      goalId: input.goalId,
      title: input.title,
      assignee: input.assignee ?? null,
      isMine: input.isMine,
      status: input.status,
      deadline: input.deadline ?? null,
      planTaskId: input.planTaskId ?? null,
      docPath: input.docPath ?? null,
      notes: input.notes ?? null,
      parentTaskId: input.parentTaskId ?? null,
    },
  });
}

export async function updateRadarTask(id: string, patch: RadarTaskPatch): Promise<RadarTask> {
  return invoke<RadarTask>('update_radar_task', { id, patch });
}

export async function deleteRadarTask(id: string): Promise<void> {
  await invoke('delete_radar_task', { id });
}

export async function listRadarActivities(goalId?: string): Promise<RadarActivity[]> {
  return invoke<RadarActivity[]>('list_radar_activities', { goalId: goalId ?? null });
}

export async function addRadarActivity(
  input: Omit<RadarActivity, 'id' | 'createdAt' | 'alertDismissed'>,
): Promise<RadarActivity> {
  return invoke<RadarActivity>('add_radar_activity', { input });
}

export async function dismissRadarAlert(id: string): Promise<void> {
  await invoke('dismiss_radar_alert', { id });
}

export async function radarSaveToken(key: string, token: string): Promise<void> {
  await invoke('radar_save_token', { key, token });
}

export async function radarHasToken(key: string): Promise<boolean> {
  return invoke<boolean>('radar_has_token', { key });
}

export async function triggerRadarPollGoal(goalId: string): Promise<void> {
  await invoke('trigger_radar_poll_goal', { goalId });
}

if (typeof window !== 'undefined') {
  (window as unknown as { bento?: unknown }).bento = {
    listDocs,
    readDoc,
    writeDoc,
    readAsset,
    writeAsset,
    listGlean,
    gleanCounts,
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
    listEventNotes,
    listEventNotesByEvent,
    listEventNotesBySeries,
    upsertEventNote,
    deleteEventNote,
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
    mailOAuthStart,
  };
}
