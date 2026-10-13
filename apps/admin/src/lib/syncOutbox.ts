// 냥노션 동기화 — 보낼 것 목록(outbox).
//
// Bento 의 할 일·폴더에는 updatedAt 이 없다. 그래서 **고친 순간을 여기 적어 두고**, 그 시각을
// 서버에 "언제 고쳤는가"로 보낸다(나중에 고친 쪽이 이긴다). 적는 자리는 lib/tauri.ts 의 래퍼들이다 —
// 모든 IPC 가 거기를 지나므로 화면 코드를 하나도 고치지 않아도 빠짐없이 잡힌다.
//
// 동기화 엔진이 서버에서 받은 것을 로컬에 쓰는 동안은 `quietly()` 로 감싸서 적지 않는다 — 안 그러면
// 받은 것을 다시 올리는 메아리가 생긴다(해롭진 않지만 쓸데없다).

const OUTBOX_KEY = 'bento.sync.outbox.v1';

export interface Outbox {
  /** 할 일 id → 고친 시각(ISO). 메모·하위 항목을 고쳐도 그 할 일이 적힌다. */
  tasks: Record<string, string>;
  /** 지운 할 일 id → 지운 시각. */
  deletedTasks: Record<string, string>;
  folders: Record<string, string>;
  deletedFolders: Record<string, string>;
}

const EMPTY: Outbox = { tasks: {}, deletedTasks: {}, folders: {}, deletedFolders: {} };

let quiet = 0;

export function readOutbox(): Outbox {
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY);
    if (!raw) return { ...EMPTY, tasks: {}, deletedTasks: {}, folders: {}, deletedFolders: {} };
    const parsed = JSON.parse(raw) as Partial<Outbox>;
    return {
      tasks: parsed.tasks ?? {},
      deletedTasks: parsed.deletedTasks ?? {},
      folders: parsed.folders ?? {},
      deletedFolders: parsed.deletedFolders ?? {},
    };
  } catch {
    return { tasks: {}, deletedTasks: {}, folders: {}, deletedFolders: {} };
  }
}

function write(box: Outbox): void {
  try {
    window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(box));
  } catch {
    // 저장소가 막혀도 할 일 저장 자체는 실패시키지 않는다. 다음 전체 동기화가 메운다.
  }
  window.dispatchEvent(new CustomEvent('bento:sync-dirty'));
}

function mark(kind: keyof Outbox, id: string, opposite?: keyof Outbox): void {
  // 동기화가 꺼져 있어도 적는다 — 잠시 꺼 둔 사이에 고친 것을 다시 켰을 때 잃지 않게.
  if (quiet > 0 || !id) return;
  const box = readOutbox();
  box[kind][id] = new Date().toISOString();
  if (opposite) delete box[opposite][id];
  write(box);
}

export const markTaskChanged = (id: string) => mark('tasks', id, 'deletedTasks');
export const markTaskDeleted = (id: string) => mark('deletedTasks', id, 'tasks');
export const markFolderChanged = (id: string) => mark('folders', id, 'deletedFolders');
export const markFolderDeleted = (id: string) => mark('deletedFolders', id, 'folders');

/** 메모·하위 항목의 키(`task:<id>`)에서 할 일 id 를 꺼낸다. 블록 메모 등은 1단계 동기화 대상이 아니다. */
export function taskIdFromEventKey(eventKey: string): string | null {
  return eventKey.startsWith('task:') ? eventKey.slice(5) : null;
}

/** 서버에서 받은 것을 쓰는 동안은 적지 않는다. */
export async function quietly<T>(work: () => Promise<T>): Promise<T> {
  quiet += 1;
  try {
    return await work();
  } finally {
    quiet -= 1;
  }
}

/** 보낸 것을 지운다 — **보낸 뒤에 다시 고친 것은 남긴다** (시각이 다르면). */
export function clearSent(sent: Outbox): void {
  const box = readOutbox();
  for (const kind of Object.keys(sent) as (keyof Outbox)[]) {
    for (const [id, at] of Object.entries(sent[kind])) {
      if (box[kind][id] === at) delete box[kind][id];
    }
  }
  write(box);
}

/**
 * 처음 연결할 때 — 로컬의 할 일·폴더 전부를 보낼 것으로 적는다 (서버로 옮기기).
 * 이미 적힌 것(최근에 고친 것)은 그 시각을 지킨다. 나머지는 **오래된 시각**으로 적는다 — 서버에 같은 id 가
 * 있으면 서버 것이 이기고(이미 옮겨 둔 것을 옛 값으로 덮지 않게), 서버에 없는 것만 새로 올라간다.
 */
export function markEverything(
  taskIds: string[],
  folderIds: string[],
  at = '2000-01-01T00:00:00.000Z',
): void {
  const box = readOutbox();
  for (const id of taskIds) box.tasks[id] = box.tasks[id] ?? at;
  for (const id of folderIds) box.folders[id] = box.folders[id] ?? at;
  write(box);
}

export function outboxSize(): number {
  const box = readOutbox();
  return (
    Object.keys(box.tasks).length +
    Object.keys(box.deletedTasks).length +
    Object.keys(box.folders).length +
    Object.keys(box.deletedFolders).length
  );
}
