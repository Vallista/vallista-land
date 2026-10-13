// 동기화 시험용 가짜 lib/tauri.ts — Rust 커맨드(tasks.rs · task_folders.rs · event_notes.rs ·
// event_subtasks.rs)의 규칙을 메모리 위에서 흉내 낸다. 진짜 tauri.ts 처럼 고칠 때마다 syncOutbox 에 적는다.
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

export async function syncTokenGet(): Promise<string | null> {
  return store.token;
}

export async function listTasks(): Promise<Task[]> {
  return clone(store.tasks);
}

export async function addTask(input: Partial<Task> & { id: string; title: string }): Promise<Task> {
  if (store.tasks.some((t) => t.id === input.id))
    throw new Error(`task already exists: ${input.id}`);
  const task: Task = {
    id: input.id,
    title: input.title,
    done: false,
    due: input.due || undefined,
    estMin: input.estMin,
    startAt: input.startAt || undefined,
    tags: input.tags ?? [],
    color: input.color || undefined,
    kind: input.kind || undefined,
    folderId: input.folderId || undefined,
    group: input.group || undefined,
    createdAt: now(),
  };
  store.tasks.push(task);
  markTaskChanged(task.id);
  return clone(task);
}

/** Rust 의 TaskPatch: undefined/null = 그대로, '' = 지우기 (Option<Option<String>>). */
export async function updateTask(id: string, patch: TaskPatch): Promise<Task> {
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
  if (patch.estMin !== undefined && patch.estMin !== null) task.estMin = patch.estMin;
  if (patch.tags !== undefined) task.tags = patch.tags;
  markTaskChanged(id);
  return clone(task);
}

export async function deleteTask(id: string): Promise<void> {
  store.tasks = store.tasks.filter((t) => t.id !== id);
  markTaskDeleted(id);
}

export async function listTaskFolders(): Promise<TaskFolder[]> {
  return clone(store.folders);
}

export async function addTaskFolder(input: {
  id: string;
  name: string;
  parentId?: string;
}): Promise<TaskFolder> {
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
  markFolderChanged(folder.id);
  return clone(folder);
}

export async function renameTaskFolder(id: string, name: string): Promise<TaskFolder> {
  const folder = store.folders.find((f) => f.id === id);
  if (!folder) throw new Error(`folder not found: ${id}`);
  folder.name = name.trim();
  markFolderChanged(id);
  return clone(folder);
}

/** Rust 처럼: 지운 폴더의 하위 폴더·할 일은 지운 폴더의 부모로 올라간다. */
export async function deleteTaskFolder(id: string): Promise<void> {
  const folder = store.folders.find((f) => f.id === id);
  if (!folder) return;
  for (const f of store.folders) if (f.parentId === id) f.parentId = folder.parentId;
  for (const t of store.tasks) if (t.folderId === id) t.folderId = folder.parentId;
  store.folders = store.folders.filter((f) => f.id !== id);
  markFolderDeleted(id);
}

export async function listEventNotesByEvent(eventKey: string): Promise<Note[]> {
  return clone(store.notes.filter((n) => n.eventKey === eventKey));
}

export async function upsertEventNote(input: {
  id?: string;
  eventKey: string;
  seriesKey: string;
  eventTitleSnapshot: string;
  eventDateSnapshot: string;
  body: string;
  tags?: string[];
}): Promise<Note> {
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
  const taskId = taskIdFromEventKey(input.eventKey);
  if (taskId) markTaskChanged(taskId);
  return clone(note);
}

export async function listEventSubtasks(eventKey: string): Promise<Sub[]> {
  return clone(store.subs[eventKey] ?? []);
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
