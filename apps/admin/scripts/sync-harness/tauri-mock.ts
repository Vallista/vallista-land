// 동기화 시험용 가짜 lib/tauri.ts — Rust 커맨드(tasks.rs · task_folders.rs · event_notes.rs ·
// event_subtasks.rs)의 규칙을 메모리 위에서 흉내 낸다. 진짜 tauri.ts 처럼 고칠 때마다 syncOutbox 에 적고,
// 동기화 엔진 전용 `…Raw` 변형과 setEventSubtasks 는 적지 않는다.
//
// 기기 여러 대를 한 프로세스에서 흉내 내려고 저장소를 `useDevice()` 로 갈아 끼운다.

import type { Task, TaskFolder } from '@vallista/content-core';
import {
  markFolderChanged,
  markFolderDeleted,
  markTaskChanged,
  markTaskDeleted,
  taskIdFromEventKey,
} from '../../src/lib/syncOutbox';

export interface TaskPatch {
  title?: string;
  done?: boolean;
  due?: string | null;
  estMin?: number | null;
  startAt?: string | null;
  tags?: string[];
  color?: string | null;
  kind?: string | null;
  folderId?: string;
  group?: string;
}

interface Note {
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
interface Sub {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface Store {
  tasks: Task[];
  folders: TaskFolder[];
  notes: Note[];
  subs: Record<string, Sub[]>;
  token: string | null;
}

export function emptyStore(token: string | null): Store {
  return { tasks: [], folders: [], notes: [], subs: {}, token };
}

let store: Store = emptyStore(null);
export function useDevice(next: Store): void {
  store = next;
}

let seq = 0;
const now = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

type RawHook = (writtenId: string) => Promise<void>;
let rawHook: RawHook | null = null;

/** 엔진이 `…Raw`·setEventSubtasks 로 쓴 직후마다 부른다 — 받은 것을 쓰는 사이에 사용자가 고치는 상황을 만든다. */
export function onRawWrite(fn: RawHook | null): void {
  rawHook = fn;
}

async function afterRaw(id: string): Promise<void> {
  if (rawHook) await rawHook(id);
}

export async function syncTokenGet(): Promise<string | null> {
  return store.token;
}

export async function listTasks(): Promise<Task[]> {
  return clone(store.tasks);
}

type TaskInput = Partial<Task> & { id: string; title: string };

function insertTask(input: TaskInput): Task {
  if (store.tasks.some((t) => t.id === input.id))
    throw new Error(`task already exists: ${input.id}`);
  const task: Task = {
    id: input.id,
    title: input.title,
    done: false,
    due: input.due || undefined,
    estMin: input.estMin && input.estMin > 0 ? input.estMin : undefined,
    startAt: input.startAt || undefined,
    tags: input.tags ?? [],
    color: input.color || undefined,
    kind: input.kind || undefined,
    folderId: input.folderId || undefined,
    group: input.group || undefined,
    createdAt: now(),
  };
  store.tasks.push(task);
  return task;
}

export async function addTaskRaw(input: TaskInput): Promise<Task> {
  const task = clone(insertTask(input));
  await afterRaw(task.id);
  return task;
}

export async function addTask(input: TaskInput): Promise<Task> {
  const task = clone(insertTask(input));
  markTaskChanged(task.id);
  return task;
}

/** Rust 의 TaskPatch: undefined/null = 그대로, '' = 지우기 (Option<Option<String>>). estMin 은 0 이하 = 지우기. */
function patchTask(id: string, patch: TaskPatch): Task {
  const task = store.tasks.find((t) => t.id === id);
  if (!task) throw new Error(`task not found: ${id}`);
  const str = (v: string | null | undefined, cur: string | undefined) =>
    v === undefined || v === null ? cur : v === '' ? undefined : v;
  if (patch.title !== undefined) task.title = patch.title;
  if (patch.done !== undefined) task.done = patch.done;
  task.due = str(patch.due, task.due);
  task.startAt = str(patch.startAt, task.startAt);
  task.color = str(patch.color, task.color);
  task.kind = str(patch.kind, task.kind);
  task.folderId = str(patch.folderId, task.folderId);
  task.group = str(patch.group, task.group);
  if (patch.estMin !== undefined && patch.estMin !== null)
    task.estMin = patch.estMin > 0 ? patch.estMin : undefined;
  if (patch.tags !== undefined) task.tags = patch.tags;
  return task;
}

export async function updateTaskRaw(id: string, patch: TaskPatch): Promise<Task> {
  const task = clone(patchTask(id, patch));
  await afterRaw(id);
  return task;
}

export async function updateTask(id: string, patch: TaskPatch): Promise<Task> {
  const task = clone(patchTask(id, patch));
  markTaskChanged(id);
  return task;
}

export async function deleteTaskRaw(id: string): Promise<void> {
  store.tasks = store.tasks.filter((t) => t.id !== id);
  await afterRaw(id);
}

export async function deleteTask(id: string): Promise<void> {
  store.tasks = store.tasks.filter((t) => t.id !== id);
  markTaskDeleted(id);
}

export async function listTaskFolders(): Promise<TaskFolder[]> {
  return clone(store.folders);
}

type FolderInput = { id: string; name: string; parentId?: string };

function insertFolder(input: FolderInput): TaskFolder {
  if (store.folders.some((f) => f.id === input.id))
    throw new Error(`folder already exists: ${input.id}`);
  const parentId = input.parentId || undefined;
  if (parentId && !store.folders.some((f) => f.id === parentId))
    throw new Error(`parent folder not found: ${parentId}`);
  if (
    store.folders.some(
      (f) => (f.parentId ?? undefined) === parentId && f.name === input.name.trim(),
    )
  ) {
    throw new Error(`folder name exists: ${input.name}`);
  }
  const folder: TaskFolder = { id: input.id, name: input.name.trim(), parentId, createdAt: now() };
  store.folders.push(folder);
  return folder;
}

export async function addTaskFolderRaw(input: FolderInput): Promise<TaskFolder> {
  const folder = clone(insertFolder(input));
  await afterRaw(folder.id);
  return folder;
}

export async function addTaskFolder(input: FolderInput): Promise<TaskFolder> {
  const folder = clone(insertFolder(input));
  markFolderChanged(folder.id);
  return folder;
}

function renameFolder(id: string, name: string): TaskFolder {
  const folder = store.folders.find((f) => f.id === id);
  if (!folder) throw new Error(`folder not found: ${id}`);
  folder.name = name.trim();
  return folder;
}

export async function renameTaskFolderRaw(id: string, name: string): Promise<TaskFolder> {
  const folder = clone(renameFolder(id, name));
  await afterRaw(id);
  return folder;
}

export async function renameTaskFolder(id: string, name: string): Promise<TaskFolder> {
  const folder = clone(renameFolder(id, name));
  markFolderChanged(id);
  return folder;
}

/** Rust 처럼: 지운 폴더의 하위 폴더·할 일은 지운 폴더의 부모로 올라간다. 없는 폴더면 false. */
function removeFolder(id: string): boolean {
  const folder = store.folders.find((f) => f.id === id);
  if (!folder) return false;
  for (const f of store.folders) if (f.parentId === id) f.parentId = folder.parentId;
  for (const t of store.tasks) if (t.folderId === id) t.folderId = folder.parentId;
  store.folders = store.folders.filter((f) => f.id !== id);
  return true;
}

export async function deleteTaskFolderRaw(id: string): Promise<void> {
  if (removeFolder(id)) await afterRaw(id);
}

export async function deleteTaskFolder(id: string): Promise<void> {
  if (removeFolder(id)) markFolderDeleted(id);
}

export async function listEventNotesByEvent(eventKey: string): Promise<Note[]> {
  return clone(store.notes.filter((n) => n.eventKey === eventKey));
}

type NoteInput = {
  id?: string;
  eventKey: string;
  seriesKey: string;
  eventTitleSnapshot: string;
  eventDateSnapshot: string;
  body: string;
  tags?: string[];
};

function writeNote(input: NoteInput): Note {
  let note = input.id ? store.notes.find((n) => n.id === input.id) : undefined;
  if (note) {
    note.body = input.body;
    note.updatedAt = now();
  } else {
    note = {
      ...input,
      id: `note_${(seq += 1)}`,
      tags: input.tags ?? [],
      createdAt: now(),
      updatedAt: now(),
    };
    store.notes.push(note);
  }
  return note;
}

export async function upsertEventNoteRaw(input: NoteInput): Promise<Note> {
  const note = clone(writeNote(input));
  await afterRaw(taskIdFromEventKey(input.eventKey) ?? input.eventKey);
  return note;
}

export async function upsertEventNote(input: NoteInput): Promise<Note> {
  const note = clone(writeNote(input));
  const taskId = taskIdFromEventKey(input.eventKey);
  if (taskId) markTaskChanged(taskId);
  return note;
}

export async function listEventSubtasks(eventKey: string): Promise<Sub[]> {
  return clone(store.subs[eventKey] ?? []);
}

/**
 * Rust set_event_subtasks 처럼: 받은 id 그대로 통째로 맞춘다. 빈 id·공백뿐인 제목은 버리고 같은 id 는
 * 앞의 것만, 이미 같으면 쓰지 않는다. 엔진 전용이라 보낼 것에 적지 않는다.
 */
export async function setEventSubtasks(input: {
  eventKey: string;
  seriesKey: string;
  eventTitleSnapshot: string;
  eventDateSnapshot: string;
  items: { id: string; title: string; done: boolean }[];
}): Promise<Sub[]> {
  const existing = store.subs[input.eventKey];
  const seen = new Set<string>();
  const items: Sub[] = [];
  for (const it of input.items) {
    const title = it.title.trim();
    if (!it.id.trim() || !title || seen.has(it.id)) continue;
    seen.add(it.id);
    items.push({
      id: it.id,
      title,
      done: it.done,
      createdAt: existing?.find((s) => s.id === it.id)?.createdAt ?? now(),
    });
  }
  if (!existing) {
    if (items.length === 0) return [];
  } else if (
    existing.length === items.length &&
    existing.every((a, i) => {
      const b = items[i];
      return b !== undefined && a.id === b.id && a.title === b.title && a.done === b.done;
    })
  ) {
    return clone(existing);
  }
  store.subs[input.eventKey] = items;
  const result = clone(items);
  await afterRaw(taskIdFromEventKey(input.eventKey) ?? input.eventKey);
  return result;
}

export async function addEventSubtask(input: { eventKey: string; title: string }): Promise<Sub> {
  const sub: Sub = { id: `sub_${(seq += 1)}`, title: input.title, done: false, createdAt: now() };
  (store.subs[input.eventKey] ??= []).push(sub);
  const taskId = taskIdFromEventKey(input.eventKey);
  if (taskId) markTaskChanged(taskId);
  return clone(sub);
}

export async function toggleEventSubtask(
  eventKey: string,
  id: string,
  done: boolean,
): Promise<Sub> {
  const sub = (store.subs[eventKey] ?? []).find((s) => s.id === id);
  if (!sub) throw new Error(`subtask not found: ${id}`);
  sub.done = done;
  const taskId = taskIdFromEventKey(eventKey);
  if (taskId) markTaskChanged(taskId);
  return clone(sub);
}

export async function deleteEventSubtask(eventKey: string, id: string): Promise<void> {
  store.subs[eventKey] = (store.subs[eventKey] ?? []).filter((s) => s.id !== id);
  const taskId = taskIdFromEventKey(eventKey);
  if (taskId) markTaskChanged(taskId);
}
