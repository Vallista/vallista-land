// 냥노션 동기화 — Bento 의 할 일·폴더·메모·하위 항목을 냥노션 체크리스트 하나와 맞춘다.
//
// 서버(냥노션)가 원본이고 Bento 는 오프라인 사본이다. 서버 쪽 규칙은 Nyanotion 저장소의
// docs/13-sync.md. 요약:
//   - 한 바퀴 = **올리기 → 받기.** 올릴 것은 lib/syncOutbox.ts 가 고친 시각과 함께 모아 둔다.
//   - 나중에 고친 쪽이 이긴다. 서버 것이 더 새로우면 올린 것은 버려지고(stale), 받기에서 서버 값으로 맞춰진다.
//   - 받기는 변경 번호(cursor) 다음에 바뀐 것만. 지운 것도 "지웠다"로 온다.
//   - Bento 의 할 일 id 를 서버도 그대로 쓴다 — 블록·메모·하위 항목이 그 id 로 가리키므로.
//
// 1단계에서 안 되는 것: 폴더를 **다른 폴더 아래로 옮기기**는 Bento 에 그 명령이 없어 서버 쪽 이동이
// 여기 반영되지 않는다(이름 바꾸기·지우기는 된다). 하위 항목은 Bento 가 id 를 정하므로 목록째 맞춘다.

import type { Task, TaskFolder } from '@vallista/content-core';
import {
  addEventSubtask,
  addTask,
  addTaskFolder,
  deleteEventSubtask,
  deleteTask,
  deleteTaskFolder,
  listEventNotesByEvent,
  listEventSubtasks,
  listTaskFolders,
  listTasks,
  renameTaskFolder,
  syncTokenGet,
  toggleEventSubtask,
  updateTask,
  upsertEventNote,
  type TaskPatch,
} from './tauri';
import {
  clearSent,
  markEverything,
  outboxSize,
  quietly,
  readOutbox,
  type Outbox,
} from './syncOutbox';

const CONFIG_KEY = 'bento.sync.v1';
export const SYNC_STATUS_EVENT = 'bento:sync-status';
export const DEFAULT_SERVER = 'https://nyanotion.party';

export interface SyncConfig {
  enabled: boolean;
  serverUrl: string;
  /** 맞출 냥노션 체크리스트. */
  checklistId: string | null;
  /** 받은 데까지의 서버 변경 번호. */
  cursor: number;
  /** 처음 연결 때 로컬 전부를 올릴 것으로 적었는가 (한 체크리스트당 한 번). */
  linked: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
  /** 마지막 한 바퀴에서 올리고 받은 수 — 화면에 보여 준다. */
  lastResult: { pushed: number; stale: number; rejected: number; pulled: number } | null;
}

const DEFAULTS: SyncConfig = {
  enabled: false,
  serverUrl: DEFAULT_SERVER,
  checklistId: null,
  cursor: 0,
  linked: false,
  lastSyncAt: null,
  lastError: null,
  lastResult: null,
};

export function readSyncConfig(): SyncConfig {
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SyncConfig>) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

export function writeSyncConfig(patch: Partial<SyncConfig>): SyncConfig {
  const next = { ...readSyncConfig(), ...patch };
  try {
    window.localStorage.setItem(CONFIG_KEY, JSON.stringify(next));
  } catch {
    // 무시 — 다음 바퀴에 다시 적는다.
  }
  window.dispatchEvent(new CustomEvent(SYNC_STATUS_EVENT));
  return next;
}

/** 체크리스트를 바꾸면 처음부터 다시 맞춘다. */
export function chooseChecklist(checklistId: string): SyncConfig {
  return writeSyncConfig({
    checklistId,
    cursor: 0,
    linked: false,
    lastError: null,
    lastResult: null,
  });
}

/* ------------------------------------------------------------------ 서버 */

interface ServerFolder {
  id: string;
  parentId: string | null;
  name: string;
  deleted: boolean;
  updatedAt: string;
  rev: number;
}

interface ServerSubtask {
  id: string;
  title: string;
  done: boolean;
}

interface ServerItem {
  id: string;
  title: string;
  done: boolean;
  dueOn: string | null;
  dueTime: string | null;
  startAt: string | null;
  estMin: number | null;
  tags: string[];
  color: string | null;
  kind: string | null;
  groupName: string | null;
  notes: string;
  subtasks: ServerSubtask[];
  folderId: string | null;
  createdAt: string;
  deleted: boolean;
  updatedAt: string;
  rev: number;
}

export interface SyncMe {
  user: { id: string; name: string; email: string };
  primaryChecklistId: string | null;
  checklists: {
    id: string;
    title: string;
    spaceKind: 'personal' | 'org';
    spaceName: string;
    open: number;
  }[];
}

async function api<T>(
  serverUrl: string,
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(`${serverUrl.replace(/\/+$/, '')}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (!res.ok) throw new Error(body?.error ?? `서버가 ${res.status} 을 돌려줬습니다.`);
    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError')
      throw new Error('서버가 응답하지 않습니다.');
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

async function token(): Promise<string> {
  const t = await syncTokenGet().catch(() => null);
  if (!t) throw new Error('토큰이 없습니다. 설정 → 냥노션에서 개인 토큰을 넣으세요.');
  return t;
}

/** 설정 화면에서 — 토큰이 맞는지, 어떤 체크리스트와 맞출 수 있는지. */
export async function fetchSyncMe(serverUrl: string): Promise<SyncMe> {
  return api<SyncMe>(serverUrl, await token(), '/api/sync/me');
}

export async function createServerChecklist(serverUrl: string, title: string): Promise<string> {
  const res = await api<{ id: string }>(serverUrl, await token(), '/api/sync/checklists', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  return res.id;
}

/* ------------------------------------------------------------------ 모양 바꾸기 */

/** Bento 의 `due` (`YYYY-MM-DD` 또는 `YYYY-MM-DDTHH:MM:00`) → 서버의 날짜·시간. */
function splitDue(due: string | undefined): { dueOn: string | null; dueTime: string | null } {
  if (!due) return { dueOn: null, dueTime: null };
  const m = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/.exec(due);
  if (!m) return { dueOn: null, dueTime: null };
  return { dueOn: m[1] ?? null, dueTime: m[2] ?? null };
}

function joinDue(dueOn: string | null, dueTime: string | null): string {
  if (!dueOn) return '';
  return dueTime ? `${dueOn}T${dueTime}:00` : dueOn;
}

const taskKey = (id: string) => `task:${id}`;

async function localExtras(task: Task): Promise<{ notes: string; subtasks: ServerSubtask[] }> {
  const [notes, subs] = await Promise.all([
    listEventNotesByEvent(taskKey(task.id)).catch(() => []),
    listEventSubtasks(taskKey(task.id)).catch(() => []),
  ]);
  return {
    notes: notes[0]?.body ?? task.notes ?? '',
    subtasks: subs.map((s) => ({ id: s.id, title: s.title, done: s.done })),
  };
}

/* ------------------------------------------------------------------ 올리기 */

async function push(
  cfg: SyncConfig,
  t: string,
): Promise<{ pushed: number; stale: number; rejected: number }> {
  const snapshot: Outbox = readOutbox();
  const [tasks, folders] = await Promise.all([listTasks(), listTaskFolders()]);
  const taskById = new Map(tasks.map((x) => [x.id, x]));
  const folderById = new Map(folders.map((x) => [x.id, x]));

  const outFolders: Record<string, unknown>[] = [];
  // 부모가 먼저 가게 — 서버는 순서가 뒤바뀌어도 받지만, 화면은 부모를 먼저 아는 편이 낫다.
  const depth = (f: TaskFolder): number =>
    f.parentId && folderById.has(f.parentId) ? 1 + depth(folderById.get(f.parentId)!) : 0;
  const changedFolders = Object.entries(snapshot.folders)
    .map(([id, at]) => ({ folder: folderById.get(id), at }))
    .filter((x): x is { folder: TaskFolder; at: string } => x.folder !== undefined)
    .sort((a, b) => depth(a.folder) - depth(b.folder));
  for (const { folder, at } of changedFolders) {
    outFolders.push({
      id: folder.id,
      name: folder.name,
      parentId: folder.parentId ?? null,
      updatedAt: at,
    });
  }
  for (const [id, at] of Object.entries(snapshot.deletedFolders)) {
    outFolders.push({ id, deleted: true, updatedAt: at });
  }

  const outItems: Record<string, unknown>[] = [];
  for (const [id, at] of Object.entries(snapshot.tasks)) {
    const task = taskById.get(id);
    if (!task) continue; // 그새 지워졌다 — deletedTasks 쪽이 보낸다.
    const extra = await localExtras(task);
    outItems.push({
      id: task.id,
      title: task.title,
      done: task.done,
      ...splitDue(task.due),
      startAt: task.startAt || null,
      estMin: task.estMin ?? null,
      tags: task.tags ?? [],
      color: task.color || null,
      kind: task.kind || null,
      groupName: task.group || null,
      notes: extra.notes,
      subtasks: extra.subtasks,
      folderId: task.folderId && folderById.has(task.folderId) ? task.folderId : null,
      createdAt: task.createdAt,
      updatedAt: at,
    });
  }
  for (const [id, at] of Object.entries(snapshot.deletedTasks)) {
    outItems.push({ id, deleted: true, updatedAt: at });
  }

  if (outFolders.length + outItems.length === 0) return { pushed: 0, stale: 0, rejected: 0 };

  // 서버가 한 번에 2000개까지 받는다. 폴더를 먼저 다 보내고 항목을 나눠 보낸다.
  const totals = { pushed: 0, stale: 0, rejected: 0 };
  const chunks: { folders: unknown[]; items: unknown[] }[] = [];
  chunks.push({ folders: outFolders, items: [] });
  for (let i = 0; i < outItems.length; i += 1500)
    chunks.push({ folders: [], items: outItems.slice(i, i + 1500) });
  for (const chunk of chunks) {
    if (chunk.folders.length + chunk.items.length === 0) continue;
    const res = await api<{
      applied: number;
      stale: string[];
      rejected: { id: string; reason: string }[];
      current?: { folders: ServerFolder[]; items: ServerItem[] };
    }>(cfg.serverUrl, t, `/api/sync/checklists/${cfg.checklistId}/changes`, {
      method: 'POST',
      body: JSON.stringify(chunk),
    });
    totals.pushed += res.applied;
    totals.stale += res.stale.length;
    totals.rejected += res.rejected.length;
    if (res.rejected.length > 0) console.warn('[냥노션 동기화] 서버가 받지 않은 것', res.rejected);
    // 서버 것이 더 새로워 버려진 것 — 서버가 지금 값을 같이 준다. 곧바로 덮어써야 이 기기에 옛 값이 안 남는다
    // (받기 커서는 이미 그 변경을 지나갔을 수 있다).
    if (res.current && res.current.folders.length + res.current.items.length > 0) {
      const current = res.current;
      await quietly(async () => {
        await applyFolders(current.folders);
        await applyItems(current.items);
      });
    }
  }
  clearSent(snapshot);
  return totals;
}

/* ------------------------------------------------------------------ 받기 */

async function applyFolders(incoming: ServerFolder[]): Promise<void> {
  let local = await listTaskFolders();
  const has = (id: string) => local.some((f) => f.id === id);
  // 부모가 먼저 오게 몇 번 돈다 (자식이 먼저 와도 다음 바퀴에 부모가 생긴다).
  let pending = incoming.filter((f) => !f.deleted);
  for (let round = 0; round < 5 && pending.length > 0; round += 1) {
    const later: ServerFolder[] = [];
    for (const f of pending) {
      const mine = local.find((x) => x.id === f.id);
      if (mine) {
        if (mine.name !== f.name)
          await renameTaskFolder(f.id, f.name).catch((e) =>
            console.warn('[냥노션 동기화] 폴더 이름', e),
          );
        continue;
      }
      if (
        f.parentId &&
        !has(f.parentId) &&
        incoming.some((x) => x.id === f.parentId && !x.deleted)
      ) {
        later.push(f);
        continue;
      }
      await addTaskFolder({
        id: f.id,
        name: f.name,
        parentId: f.parentId && has(f.parentId) ? f.parentId : undefined,
      }).catch((e) => console.warn('[냥노션 동기화] 폴더 만들기', f.name, e));
      local = await listTaskFolders();
    }
    pending = later;
  }
  for (const f of incoming.filter((x) => x.deleted)) {
    if (has(f.id))
      await deleteTaskFolder(f.id).catch((e) => console.warn('[냥노션 동기화] 폴더 지우기', e));
  }
}

async function applySubtasks(
  task: { id: string; title: string; due?: string },
  wanted: ServerSubtask[],
): Promise<void> {
  const key = taskKey(task.id);
  const have = await listEventSubtasks(key).catch(() => []);
  const same =
    have.length === wanted.length &&
    have.every((h, i) => {
      const w = wanted[i];
      return w !== undefined && h.id === w.id && h.title === w.title && h.done === w.done;
    });
  if (same) return;
  for (const h of have) {
    if (!wanted.some((w) => w.id === h.id)) await deleteEventSubtask(key, h.id);
  }
  for (const w of wanted) {
    const mine = have.find((h) => h.id === w.id);
    if (mine) {
      if (mine.done !== w.done) await toggleEventSubtask(key, w.id, w.done);
      continue;
    }
    // Bento 가 id 를 정하므로 새로 만든 것은 id 가 바뀐다. 다음 올리기에서 서버도 그 id 로 맞춰진다.
    const made = await addEventSubtask({
      eventKey: key,
      seriesKey: key,
      eventTitleSnapshot: task.title,
      eventDateSnapshot: task.due ?? '',
      title: w.title,
    });
    if (w.done) await toggleEventSubtask(key, made.id, true);
  }
}

async function applyItems(incoming: ServerItem[]): Promise<void> {
  const tasks = await listTasks();
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const folderIds = new Set((await listTaskFolders()).map((f) => f.id));

  for (const it of incoming) {
    const mine = byId.get(it.id);
    if (it.deleted) {
      if (mine) await deleteTask(it.id).catch((e) => console.warn('[냥노션 동기화] 지우기', e));
      continue;
    }
    const due = joinDue(it.dueOn, it.dueTime);
    const folderId = it.folderId && folderIds.has(it.folderId) ? it.folderId : '';
    if (!mine) {
      await addTask({
        id: it.id,
        title: it.title,
        due: due || undefined,
        startAt: it.startAt ?? undefined,
        estMin: it.estMin ?? undefined,
        tags: it.tags,
        color: it.color ?? undefined,
        kind: it.kind ?? undefined,
        folderId: folderId || undefined,
        group: it.groupName ?? undefined,
      }).catch((e) => console.warn('[냥노션 동기화] 만들기', it.title, e));
      if (it.done) await updateTask(it.id, { done: true }).catch(() => undefined);
    } else {
      // TaskPatch 규칙: null 은 "그대로", '' 는 "지우기" (serde Option<Option>).
      const patch: TaskPatch = {};
      if (mine.title !== it.title) patch.title = it.title;
      if (mine.done !== it.done) patch.done = it.done;
      if ((mine.due ?? '') !== due) patch.due = due;
      if ((mine.startAt ?? '') !== (it.startAt ?? '')) patch.startAt = it.startAt ?? '';
      if (it.estMin !== null && mine.estMin !== it.estMin) patch.estMin = it.estMin;
      if (JSON.stringify(mine.tags ?? []) !== JSON.stringify(it.tags)) patch.tags = it.tags;
      if ((mine.color ?? '') !== (it.color ?? '')) patch.color = it.color ?? '';
      if ((mine.kind ?? '') !== (it.kind ?? '')) patch.kind = it.kind ?? '';
      if ((mine.folderId ?? '') !== folderId) patch.folderId = folderId;
      if ((mine.group ?? '') !== (it.groupName ?? '')) patch.group = it.groupName ?? '';
      if (Object.keys(patch).length > 0) {
        await updateTask(it.id, patch).catch((e) =>
          console.warn('[냥노션 동기화] 고치기', it.title, e),
        );
      }
    }

    // 메모 (EventNote task:<id>)
    const key = taskKey(it.id);
    const notes = await listEventNotesByEvent(key).catch(() => []);
    const current = notes[0];
    if ((current?.body ?? '') !== it.notes && (it.notes !== '' || current !== undefined)) {
      await upsertEventNote({
        id: current?.id,
        eventKey: key,
        seriesKey: key,
        eventTitleSnapshot: it.title,
        eventDateSnapshot: due,
        body: it.notes,
        tags: current?.tags ?? [],
      }).catch((e) => console.warn('[냥노션 동기화] 메모', e));
    }
    await applySubtasks({ id: it.id, title: it.title, due }, it.subtasks).catch((e) =>
      console.warn('[냥노션 동기화] 하위 항목', e),
    );
  }
}

async function pull(cfg: SyncConfig, t: string): Promise<{ pulled: number; cursor: number }> {
  let cursor = cfg.cursor;
  let pulled = 0;
  for (let page = 0; page < 50; page += 1) {
    const res = await api<{
      folders: ServerFolder[];
      items: ServerItem[];
      cursor: number;
      more: boolean;
    }>(cfg.serverUrl, t, `/api/sync/checklists/${cfg.checklistId}/changes?since=${cursor}`);
    if (res.folders.length + res.items.length > 0) {
      await quietly(async () => {
        await applyFolders(res.folders);
        await applyItems(res.items);
      });
      pulled += res.folders.length + res.items.length;
    }
    cursor = res.cursor;
    // 한 쪽씩 진행을 남긴다 — 도중에 끊겨도 받은 데까지는 다시 받지 않게.
    writeSyncConfig({ cursor });
    if (!res.more) break;
  }
  if (pulled > 0) {
    window.dispatchEvent(new CustomEvent('bento:tasks-changed'));
    window.dispatchEvent(new CustomEvent('bento:task-folders-changed'));
    window.dispatchEvent(new CustomEvent('bento:subtasks-changed'));
  }
  return { pulled, cursor };
}

/* ------------------------------------------------------------------ 한 바퀴 */

let running: Promise<void> | null = null;

/** 한 바퀴 돈다. 이미 돌고 있으면 그것을 기다린다. */
export function syncNow(): Promise<void> {
  if (running) return running;
  running = (async () => {
    const cfg = readSyncConfig();
    if (!cfg.enabled || !cfg.checklistId) return;
    try {
      const t = await token();
      if (!cfg.linked) {
        // 처음 붙을 때 — 로컬의 할 일·폴더 전부를 올릴 것으로 적는다 (서버로 옮기기).
        const [tasks, folders] = await Promise.all([listTasks(), listTaskFolders()]);
        markEverything(
          tasks.map((x) => x.id),
          folders.map((x) => x.id),
        );
        writeSyncConfig({ linked: true });
      }
      const pushed = await push(readSyncConfig(), t);
      const { pulled } = await pull(readSyncConfig(), t);
      writeSyncConfig({
        lastSyncAt: new Date().toISOString(),
        lastError: null,
        lastResult: { ...pushed, pulled },
      });
    } catch (error) {
      writeSyncConfig({ lastError: error instanceof Error ? error.message : String(error) });
    }
  })().finally(() => {
    running = null;
  });
  return running;
}

/** 앱이 켜질 때 한 번 부른다. 1분마다, 고친 뒤 몇 초 뒤에, 다시 온라인이 됐을 때 돈다. */
export function startNyanotionSync(): () => void {
  let debounce: number | undefined;
  const soon = () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => void syncNow(), 4000);
  };
  const interval = window.setInterval(() => void syncNow(), 60_000);
  window.addEventListener('bento:sync-dirty', soon);
  window.addEventListener('online', soon);
  void syncNow();
  return () => {
    window.clearInterval(interval);
    window.clearTimeout(debounce);
    window.removeEventListener('bento:sync-dirty', soon);
    window.removeEventListener('online', soon);
  };
}

export { outboxSize };
