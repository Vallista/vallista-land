import { convertFileSrc, invoke as _invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { logError, logInfo } from './errorLog';
import { dispatchToast } from '../components/NotifToast';

// 백그라운드 자동 실행 커맨드 — 에러 시 로그만 적재, 토스트 없음
const SILENT_COMMANDS = new Set([
  'app_setup_status',
  'read_global_keybindings',
  'set_global_shortcuts',
  'migrate_task_notes_to_event_notes',
  'migrate_block_notes_to_event_notes',
  'migrate_task_groups',
  'read_glean_thumb',
  'sync_ical_feeds',
  'macos_cal_status',
  'macos_cal_list',
  'macos_cal_import',
  // 사이드바가 1분마다 부르는 루틴 카운트
  'list_routines',
  'list_routine_logs',
  'get_routine_timer',
]);

async function invoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
  opts?: { silent?: boolean },
): Promise<T> {
  const silent = opts?.silent ?? SILENT_COMMANDS.has(cmd);
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
  GleanSummary,
  Routine,
  RoutineColor,
  RoutineLog,
  RoutineSchedule,
  RoutineSlot,
  RoutineTimer,
  Task,
  TaskFolder,
  TaskRepeat,
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

export interface DeletedDoc {
  removed: string;
  unit: 'folder' | 'file';
  files: number;
  backupPath: string;
}

export async function deleteDoc(path: string): Promise<DeletedDoc> {
  return invoke<DeletedDoc>('delete_doc', { path });
}

export async function readAsset(path: string): Promise<AssetData> {
  return invoke<AssetData>('read_asset', { path });
}

export async function writeAsset(path: string, base64: string): Promise<void> {
  await invoke('write_asset', { path, base64 });
}

export interface GleanPage {
  items: GleanSummary[];
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
  excludeStatus?: string;
  offset: number;
  limit: number;
}): Promise<GleanPage> {
  return invoke<GleanPage>('list_glean', {
    status: params.status ?? null,
    source: params.source ?? null,
    excludeStatus: params.excludeStatus ?? null,
    offset: params.offset,
    limit: params.limit,
  });
}

export async function searchGlean(query: string, limit: number): Promise<GleanSummary[]> {
  return invoke<GleanSummary[]>('search_glean', { query, limit });
}

export async function gleanCounts(): Promise<GleanCounts> {
  return invoke<GleanCounts>('glean_counts');
}

export async function readGlean(id: string): Promise<GleanItem> {
  return invoke<GleanItem>('read_glean', { id });
}

export async function readGleanThumb(id: string): Promise<string | null> {
  return invoke<string | null>('read_glean_thumb', { id });
}

/** 분리 저장된 줍기 이미지 바이트. 승격처럼 파일로 다시 써야 할 때만 쓴다. */
export async function readGleanAsset(id: string, file: string): Promise<AssetData> {
  return invoke<AssetData>('read_glean_asset', { id, file });
}

/** 분리 저장된 줍기 이미지는 glean:// 커스텀 프로토콜로 Rust가 직접 서빙한다(IPC 페이로드 없음). */
export function gleanAssetUrl(itemId: string, file: string): string {
  return convertFileSrc(`${itemId}/${file}`, 'glean');
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
  folderId?: string;
  group?: string;
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
  folderId?: string; // '' = 루트로 이동 (null은 serde에서 "변경 없음"으로 읽힘)
  group?: string; // '' = 구분 해제
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

export interface TaskFolderInput {
  id: string;
  name: string;
  parentId?: string;
}

export interface TaskGroupMigration {
  skipped: boolean;
  migrated: number;
  removedFolders: number;
  backupPath: string | null;
}

export async function listTaskFolders(): Promise<TaskFolder[]> {
  return invoke<TaskFolder[]>('list_task_folders');
}

export async function addTaskFolder(input: TaskFolderInput): Promise<TaskFolder> {
  return invoke<TaskFolder>('add_task_folder', { input });
}

export async function renameTaskFolder(id: string, name: string): Promise<TaskFolder> {
  return invoke<TaskFolder>('rename_task_folder', { id, name });
}

export async function deleteTaskFolder(id: string): Promise<void> {
  await invoke('delete_task_folder', { id });
}

export async function migrateTaskGroups(): Promise<TaskGroupMigration> {
  return invoke<TaskGroupMigration>('migrate_task_groups');
}

export type TaskRepeatInput = Omit<TaskRepeat, 'id' | 'lastKey' | 'createdAt' | 'enabled'> & {
  enabled?: boolean;
};

export interface TaskRepeatView extends TaskRepeat {
  /** 다음 회차 날짜. 비활성이거나 미완료 회차가 있으면 없음 */
  nextKey?: string;
  /** 아직 완료하지 않은 생성 할 일 id */
  pendingTaskId?: string;
}

export async function listTaskRepeats(): Promise<TaskRepeatView[]> {
  return invoke<TaskRepeatView[]>('list_task_repeats');
}

export async function addTaskRepeat(input: TaskRepeatInput): Promise<TaskRepeat> {
  return invoke<TaskRepeat>('add_task_repeat', { input });
}

export async function updateTaskRepeat(id: string, input: TaskRepeatInput): Promise<TaskRepeat> {
  return invoke<TaskRepeat>('update_task_repeat', { id, input });
}

export async function deleteTaskRepeat(id: string): Promise<void> {
  await invoke('delete_task_repeat', { id });
}

// === routines (습관 트래커) ===

/** 루틴 데이터가 바뀌면 화면끼리(루틴·사이드바) 알리는 창 이벤트 */
export const ROUTINES_CHANGED_EVENT = 'bento:routines-changed';

export function notifyRoutinesChanged(): void {
  window.dispatchEvent(new CustomEvent(ROUTINES_CHANGED_EVENT));
}

export interface RoutineInput {
  title: string;
  color?: RoutineColor;
  slot?: RoutineSlot;
  schedule: RoutineSchedule;
  goalMin?: number;
  startDate: string;
}

export interface RoutineTimerCommit {
  log: RoutineLog;
  addedSecs: number;
  /** 12시간 상한에 걸려 잘렸는지 */
  capped: boolean;
  /** 이번 기록으로 목표 시간을 채워 자동 완료됐는지 */
  reachedGoal: boolean;
}

export interface RoutineTimerStart {
  timer: RoutineTimer;
  /** 다른 루틴 타이머가 돌고 있었다면 그 기록 */
  committed?: RoutineTimerCommit;
}

export interface RoutineLogUpdate {
  log: RoutineLog;
  reachedGoal: boolean;
}

export interface DeletedRoutine {
  removedLogs: number;
  backupPath: string;
}

export async function listRoutines(): Promise<Routine[]> {
  return invoke<Routine[]>('list_routines');
}

export async function addRoutine(input: RoutineInput): Promise<Routine> {
  return invoke<Routine>('add_routine', { input });
}

export async function updateRoutine(id: string, input: RoutineInput): Promise<Routine> {
  return invoke<Routine>('update_routine', { id, input });
}

export async function setRoutineArchived(id: string, archived: boolean): Promise<Routine> {
  return invoke<Routine>('set_routine_archived', { id, archived });
}

export async function deleteRoutine(id: string): Promise<DeletedRoutine> {
  return invoke<DeletedRoutine>('delete_routine', { id });
}

export async function reorderRoutines(ids: string[]): Promise<Routine[]> {
  return invoke<Routine[]>('reorder_routines', { ids });
}

export async function listRoutineLogs(
  range: { startDate?: string; endDate?: string } = {},
): Promise<RoutineLog[]> {
  return invoke<RoutineLog[]>('list_routine_logs', {
    startDate: range.startDate ?? null,
    endDate: range.endDate ?? null,
  });
}

export async function setRoutineCheck(
  routineId: string,
  date: string,
  done: boolean,
): Promise<RoutineLog> {
  return invoke<RoutineLog>('set_routine_check', { routineId, date, done });
}

export async function setRoutineMinutes(
  routineId: string,
  date: string,
  minutes: number,
): Promise<RoutineLogUpdate> {
  return invoke<RoutineLogUpdate>('set_routine_minutes', {
    routineId,
    date,
    minutes: Math.max(0, Math.round(minutes)),
  });
}

export async function getRoutineTimer(): Promise<RoutineTimer | null> {
  return invoke<RoutineTimer | null>('get_routine_timer', undefined, { silent: true });
}

export async function startRoutineTimer(routineId: string): Promise<RoutineTimerStart> {
  return invoke<RoutineTimerStart>('start_routine_timer', { routineId });
}

export async function stopRoutineTimer(discard = false): Promise<RoutineTimerCommit | null> {
  return invoke<RoutineTimerCommit | null>('stop_routine_timer', { discard });
}

// === routine sync (냥노션 · iOS 루틴 앱과 맞추기) ===

/** 받은 것으로 로컬 루틴이 바뀌었다 (Rust emit) */
export const ROUTINES_SYNCED_EVENT = 'bento:routines-synced';
/** 동기화 시작·끝·설정 변경 (Rust emit, payload = 지금 도는 중인지) */
export const ROUTINE_SYNC_STATUS_EVENT = 'bento:routine-sync-status';

export interface RoutineSyncResult {
  pushed: number;
  stale: number;
  rejected: number;
  pulled: number;
}

export interface RoutineSyncStatus {
  enabled: boolean;
  serverUrl: string;
  hasToken: boolean;
  linked: boolean;
  /** 아직 올리지 못한 변경 수 */
  pending: number;
  running: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  lastResult: RoutineSyncResult | null;
  firstLinkBackup: string | null;
}

export async function routineSyncStatus(): Promise<RoutineSyncStatus> {
  return invoke<RoutineSyncStatus>('routine_sync_status', undefined, { silent: true });
}

export async function routineSyncConfigure(patch: {
  enabled?: boolean;
  serverUrl?: string;
}): Promise<RoutineSyncStatus> {
  return invoke<RoutineSyncStatus>('routine_sync_configure', { patch });
}

/** 키체인 `nyanotion-sync` 자리에 저장. 빈 문자열이면 지우고 다음 연결을 처음부터. */
export async function routineSyncSetToken(token: string): Promise<RoutineSyncStatus> {
  return invoke<RoutineSyncStatus>('routine_sync_set_token', { token });
}

/** 한 바퀴(올리기 → 받기). 이미 돌고 있으면 null. */
export async function routineSyncNow(): Promise<RoutineSyncResult | null> {
  return invoke<RoutineSyncResult | null>('routine_sync_now', undefined, { silent: true });
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

export interface GleanImageStats {
  items: number;
  markers: number;
  bytes: number;
}

export interface ExternalizeGleanImagesReport {
  items: number;
  markers: number;
  bytesBefore: number;
  bytesAfter: number;
  failed: number;
  backupPath?: string;
}

/** 아직 본문에 base64로 남아 있는 줍기 이미지 통계(항목 수·장 수·JSON 바이트). */
export async function gleanImageStats(): Promise<GleanImageStats> {
  return invoke<GleanImageStats>('glean_image_stats');
}

/** 설정 › 데이터에서 2클릭 확인 뒤에만 호출. Rust가 항목별 JSON을 backups/glean-images-<ts>/에 복사한 뒤 변환한다. */
export async function externalizeGleanImages(): Promise<ExternalizeGleanImagesReport> {
  return invoke<ExternalizeGleanImagesReport>('externalize_glean_images');
}

export async function listStatsExcluded(): Promise<string[]> {
  return invoke<string[]>('list_stats_excluded');
}

export async function setStatsExclusions(keys: string[]): Promise<void> {
  await invoke('set_stats_exclusions', { keys });
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

export async function llmChat(input: LlmChatInput): Promise<string> {
  return invoke<string>('llm_chat', { input });
}

export interface LlmSettings {
  claudeModel: string;
}

export async function llmGetSettings(): Promise<LlmSettings> {
  return invoke<LlmSettings>('llm_get_settings');
}

export async function llmSaveSettings(settings: LlmSettings): Promise<void> {
  await invoke('llm_save_settings', { settings });
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

export async function gitStatus(opts?: { silent?: boolean }): Promise<GitState> {
  return invoke<GitState>('git_status', undefined, opts);
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

if (typeof window !== 'undefined') {
  (window as unknown as { bento?: unknown }).bento = {
    listDocs,
    readDoc,
    writeDoc,
    deleteDoc,
    readAsset,
    writeAsset,
    listGlean,
    searchGlean,
    gleanCounts,
    readGlean,
    readGleanThumb,
    readGleanAsset,
    gleanImageStats,
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
    listTaskFolders,
    addTaskFolder,
    renameTaskFolder,
    deleteTaskFolder,
    migrateTaskGroups,
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
    llmChat,
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
