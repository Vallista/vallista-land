// 냥노션 동기화 시나리오 — 진짜 nyanotionSync.ts 를, 가짜 Rust 계층(tauri-mock)을 끼워 진짜 서버에 붙인다.
// 맥 두 대(A·B)와 웹(서버 API 를 직접)이 오가며 맞는지 본다. 실행: scripts/sync-harness/run.mjs

import { emptyStore, useDevice, type Store } from './tauri-mock';

const BASE = process.env.SYNC_BASE ?? 'http://localhost:3100';
const TOKEN = process.env.SYNC_TOKEN ?? '';
if (!TOKEN) throw new Error('SYNC_TOKEN 이 필요합니다.');

/* ── 브라우저 흉내 — 기기마다 localStorage 를 따로 ─────────────────────── */
type Device = { name: string; store: Store; storage: Map<string, string> };
let current: Device;
const g = globalThis as unknown as Record<string, unknown>;
g.window = {
  get localStorage() {
    const s = current.storage;
    return {
      getItem: (k: string) => (s.has(k) ? s.get(k)! : null),
      setItem: (k: string, v: string) => void s.set(k, String(v)),
      removeItem: (k: string) => void s.delete(k),
    };
  },
  dispatchEvent: () => true,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
};

const sync = await import('../../src/lib/nyanotionSync');

function device(name: string): Device {
  return { name, store: emptyStore(TOKEN), storage: new Map() };
}
function use(d: Device): void {
  current = d;
  useDevice(d.store);
}

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail?: unknown): void {
  if (ok) {
    pass += 1;
    console.log(`  ok   ${label}`);
  } else {
    fail += 1;
    console.log(
      `  FAIL ${label}${detail === undefined ? '' : ` — ${JSON.stringify(detail).slice(0, 400)}`}`,
    );
  }
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  });
  return res.json() as Promise<any>;
}

/** fn 동안 엔진이 받는 응답(`changes?since=`)을 mangle 로 고쳐서 넘긴다 — 서버가 걸러 주지 않는 경우를 흉내 낸다. */
async function withPulled(mangle: (body: any) => void, fn: () => Promise<void>): Promise<void> {
  const real = globalThis.fetch;
  g.fetch = async (input: string, init?: RequestInit) => {
    const res = await real(input, init);
    if ((init?.method ?? 'GET') !== 'GET' || !String(input).includes('/changes?since=')) return res;
    const body = await res.json();
    mangle(body);
    return new Response(JSON.stringify(body), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    await fn();
  } finally {
    g.fetch = real;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run(d: Device): Promise<void> {
  use(d);
  await sync.syncNow();
  const cfg = sync.readSyncConfig();
  if (cfg.lastError) throw new Error(`${d.name} 동기화 오류: ${cfg.lastError}`);
}

const tasksOf = (d: Device) => [...d.store.tasks].sort((a, b) => a.id.localeCompare(b.id));
const task = (d: Device, id: string) => d.store.tasks.find((t) => t.id === id);
const noteOf = (d: Device, id: string) =>
  d.store.notes.find((n) => n.eventKey === `task:${id}`)?.body ?? '';
const subsOf = (d: Device, id: string) =>
  (d.store.subs[`task:${id}`] ?? []).map((s) => `${s.title}:${s.done}`);
const idsOf = (d: Device, id: string) => (d.store.subs[`task:${id}`] ?? []).map((s) => s.id);
const lastResult = () => sync.readSyncConfig().lastResult;
const outboxOf = (d: Device) =>
  JSON.parse(d.storage.get('bento.sync.outbox.v1') ?? '{}') as { tasks?: Record<string, string> };

/* ── 시작 ──────────────────────────────────────────────────────────────── */
const stamp = Date.now().toString().slice(-6);
const A = device('A');
const B = device('B');

console.log('맥 A — 기존 데이터');
use(A);
const mock = await import('./tauri-mock');
const work = await mock.addTaskFolder({ id: `fold-work-${stamp}`, name: '회사' });
const meet = await mock.addTaskFolder({
  id: `fold-meet-${stamp}`,
  name: '회의',
  parentId: work.id,
});
const T1 = `t_${stamp}_report`;
const T2 = `t_${stamp}_milk`;
const T3 = `t_${stamp}_old`;
await mock.addTask({
  id: T1,
  title: '주간 보고서',
  due: '2026-10-17T15:00:00',
  startAt: '2026-10-17T14:00:00',
  estMin: 45,
  tags: ['업무'],
  group: '팀A',
  folderId: meet.id,
  kind: 'write',
  color: 'blue',
});
await mock.addTask({ id: T2, title: '우유', due: '2026-10-14' });
await mock.addTask({ id: T3, title: '끝난 일' });
await mock.updateTask(T3, { done: true });
await mock.upsertEventNote({
  eventKey: `task:${T1}`,
  seriesKey: `task:${T1}`,
  eventTitleSnapshot: '주간 보고서',
  eventDateSnapshot: '',
  body: '표 3개 넣기',
});
const s1 = await mock.addEventSubtask({ eventKey: `task:${T1}`, title: '표 정리' });
await mock.addEventSubtask({ eventKey: `task:${T1}`, title: '검토' });
await mock.toggleEventSubtask(`task:${T1}`, s1.id, true);

console.log('\n연결 — 냥노션에 체크리스트 만들고 처음 동기화 (로컬 전부 올리기)');
const listId = await sync.createServerChecklist(BASE, `시험 Bento ${stamp}`);
sync.writeSyncConfig({ serverUrl: BASE, enabled: true });
sync.chooseChecklist(listId);
await run(A);
const server0 = await api(`/api/sync/checklists/${listId}/changes?since=0`);
const s = (id: string) => server0.items.find((i: any) => i.id === id);
check(
  '폴더 둘이 올라간다 (중첩 그대로)',
  server0.folders.length === 2 &&
    server0.folders.some((f: any) => f.id === meet.id && f.parentId === work.id),
  server0.folders,
);
check('할 일 셋이 올라간다', server0.items.length === 3, server0.items.length);
check(
  'due 가 날짜·시간으로 나뉜다',
  s(T1)?.dueOn === '2026-10-17' && s(T1)?.dueTime === '15:00',
  s(T1),
);
check(
  'Bento 필드가 그대로',
  s(T1)?.startAt === '2026-10-17T14:00:00' &&
    s(T1)?.estMin === 45 &&
    s(T1)?.groupName === '팀A' &&
    s(T1)?.kind === 'write' &&
    s(T1)?.tags[0] === '업무',
);
check(
  '메모·하위 항목이 같이',
  s(T1)?.notes === '표 3개 넣기' &&
    s(T1)?.subtasks.length === 2 &&
    s(T1)?.subtasks[0].done === true,
  s(T1),
);
check('끝난 일은 끝난 채로', s(T3)?.done === true);
check('보낼 것이 비었다', sync.outboxSize() === 0, sync.outboxSize());

console.log('\n맥 B — 빈 기기에서 같은 체크리스트에 연결');
use(B);
sync.writeSyncConfig({ serverUrl: BASE, enabled: true });
sync.chooseChecklist(listId);
await run(B);
check(
  '**B 에 할 일 셋이 생긴다 (같은 id)**',
  tasksOf(B)
    .map((t) => t.id)
    .join() ===
    tasksOf(A)
      .map((t) => t.id)
      .join(),
  tasksOf(B).map((t) => t.id),
);
check(
  '폴더도 중첩 그대로',
  B.store.folders.length === 2 &&
    B.store.folders.find((f) => f.id === meet.id)?.parentId === work.id,
);
check(
  'due·startAt·구분·폴더가 같다',
  task(B, T1)?.due === '2026-10-17T15:00:00' &&
    task(B, T1)?.startAt === '2026-10-17T14:00:00' &&
    task(B, T1)?.group === '팀A' &&
    task(B, T1)?.folderId === meet.id,
  task(B, T1),
);
check('메모가 같다', noteOf(B, T1) === '표 3개 넣기');
check('하위 항목이 같다', subsOf(B, T1).join() === '표 정리:true,검토:false', subsOf(B, T1));
check('끝난 일', task(B, T3)?.done === true);
await run(B);
check(
  '**받은 것을 다시 올리지 않는다 (메아리 없음)**',
  sync.readSyncConfig().lastResult?.pushed === 0,
  sync.readSyncConfig().lastResult,
);

console.log('\nA 에서 고치면 B 로');
use(A);
await mock.updateTask(T2, { title: '우유 2개', done: true });
await mock.deleteTask(T3);
const home = await mock.addTaskFolder({ id: `fold-home-${stamp}`, name: '집' });
await mock.updateTask(T2, { folderId: home.id });
await mock.upsertEventNote({
  id: A.store.notes[0]?.id,
  eventKey: `task:${T1}`,
  seriesKey: `task:${T1}`,
  eventTitleSnapshot: '',
  eventDateSnapshot: '',
  body: '표 3개 + 그래프',
});
await run(A);
await run(B);
check(
  '제목·체크가 온다',
  task(B, T2)?.title === '우유 2개' && task(B, T2)?.done === true,
  task(B, T2),
);
check('**지운 할 일이 B 에서도 지워진다**', task(B, T3) === undefined);
check(
  '새 폴더와 옮긴 할 일',
  B.store.folders.some((f) => f.id === home.id) && task(B, T2)?.folderId === home.id,
);
check('메모 고친 것', noteOf(B, T1) === '표 3개 + 그래프');

console.log('\n웹(냥노션)에서 고치면 맥으로');
await api(`/api/sync/checklists/${listId}/changes`, {
  method: 'POST',
  body: JSON.stringify({
    items: [
      {
        id: T1,
        title: '주간 보고서 (최종)',
        dueOn: null,
        groupName: null,
        updatedAt: new Date().toISOString(),
      },
    ],
  }),
});
await run(A);
check('제목이 바뀐다', task(A, T1)?.title === '주간 보고서 (최종)', task(A, T1));
check(
  "**날짜를 지우면 Bento 에서도 지워진다 ('' 규칙)**",
  task(A, T1)?.due === undefined,
  task(A, T1)?.due,
);
check('구분도 지워진다', task(A, T1)?.group === undefined);

console.log('\n충돌 — 나중에 고친 쪽이 이긴다');
use(B);
await mock.updateTask(T1, { title: 'B 의 옛 수정' }); // 지금 시각으로 적힘
const outbox = JSON.parse(B.storage.get('bento.sync.outbox.v1') ?? '{}');
outbox.tasks[T1] = '2020-01-01T00:00:00.000Z'; // 오프라인에서 오래전에 고친 것처럼
B.storage.set('bento.sync.outbox.v1', JSON.stringify(outbox));
await run(B);
check(
  '서버가 더 새로워서 버려졌다고 센다',
  (sync.readSyncConfig().lastResult?.stale ?? 0) >= 1,
  sync.readSyncConfig().lastResult,
);
check(
  '**B 는 그 자리에서 서버 값으로 맞춰진다** (서버가 다시 바뀌길 기다리지 않는다)',
  task(B, T1)?.title === '주간 보고서 (최종)',
  task(B, T1)?.title,
);
await run(B);
check(
  '그다음 바퀴에 옛 값을 다시 올리지 않는다',
  sync.readSyncConfig().lastResult?.pushed === 0,
  sync.readSyncConfig().lastResult,
);

console.log('\n폴더 지우기 — 안의 것은 위로');
use(B);
await mock.deleteTaskFolder(work.id);
await run(B);
await run(A);
check(
  '**A 에서도 폴더가 지워지고 하위 폴더는 위로**',
  !A.store.folders.some((f) => f.id === work.id) &&
    A.store.folders.find((f) => f.id === meet.id)?.parentId === undefined,
  A.store.folders,
);

console.log('\n하위 항목 — B 에서 체크하면 A 로');
use(B);
const bsub = (B.store.subs[`task:${T1}`] ?? []).find((x) => x.title === '검토');
if (bsub) await mock.toggleEventSubtask(`task:${T1}`, bsub.id, true);
await run(B);
await run(A);
check('하위 항목 체크가 온다', subsOf(A, T1).includes('검토:true'), subsOf(A, T1));

/** 웹(냥노션 화면)에서 고친 것처럼 서버 API 로 바로 올린다. 서버가 받았는지부터 본다. */
async function webPush(label: string, items: Record<string, unknown>[]): Promise<void> {
  const res = await api(`/api/sync/checklists/${listId}/changes`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
  check(`(준비) 웹 수정을 서버가 받았다 — ${label}`, res?.applied === items.length, res);
}

console.log('\n하위 항목 id — 기기·웹 사이에서 같은 항목은 같은 id');
check(
  '**B 가 받은 하위 항목이 A 와 같은 id**',
  idsOf(A, T1).length === 2 && idsOf(A, T1).join() === idsOf(B, T1).join(),
  { A: idsOf(A, T1), B: idsOf(B, T1) },
);
const subA = (title: string) => (A.store.subs[`task:${T1}`] ?? []).find((x) => x.title === title);
const sTable = subA('표 정리');
const sReview = subA('검토');
const webSub = `web-sub-${stamp}`;
await webPush('하위 항목 순서·이름·추가', [
  {
    id: T1,
    subtasks: [
      { id: sReview?.id, title: '검토 (웹)', done: false },
      { id: sTable?.id, title: '표 정리', done: true },
      { id: webSub, title: '웹에서 추가', done: false },
    ],
    updatedAt: new Date().toISOString(),
  },
]);
await run(A);
check(
  '**웹이 바꾼 순서·이름·새 항목이 id 그대로 온다**',
  idsOf(A, T1).join() === [sReview?.id, sTable?.id, webSub].join() &&
    subsOf(A, T1).join() === '검토 (웹):false,표 정리:true,웹에서 추가:false',
  { ids: idsOf(A, T1), subs: subsOf(A, T1) },
);
await run(A);
check('받은 하위 항목을 다시 올리지 않는다', lastResult()?.pushed === 0, lastResult());
await run(B);
check('B 도 같은 id·순서', idsOf(B, T1).join() === idsOf(A, T1).join(), {
  A: idsOf(A, T1),
  B: idsOf(B, T1),
});

console.log('\n하위 항목 — 빈 제목·빈 id·겹친 id 는 받지 않는다 (서버가 걸러도 한 번 더)');
const shopSub = `ws-${stamp}`;
await webPush('하위 항목 하나', [
  {
    id: T2,
    subtasks: [{ id: shopSub, title: '장보기 목록', done: false }],
    updatedAt: new Date().toISOString(),
  },
]);
let mangled = 0;
await withPulled(
  (body) => {
    for (const it of body.items ?? []) {
      if (it.id !== T2) continue;
      it.subtasks = [
        ...(it.subtasks ?? []),
        { id: `blank-${stamp}`, title: '   ', done: false },
        { id: '', title: '빈 id', done: false },
        { id: shopSub, title: '같은 id 를 또', done: true },
      ];
      mangled += 1;
    }
  },
  () => run(A),
);
check('(준비) 받은 응답에 빈 항목을 끼웠다', mangled > 0, mangled);
check(
  '**공백 제목·빈 id·겹친 id 는 버리고 하나만 남는다**',
  subsOf(A, T2).join() === '장보기 목록:false' && idsOf(A, T2).join() === shopSub,
  { subs: subsOf(A, T2), ids: idsOf(A, T2) },
);
await run(A);
check('버린 것 때문에 다시 올리지 않는다', lastResult()?.pushed === 0, lastResult());
await run(B);
check('B 도 하나', subsOf(B, T2).join() === '장보기 목록:false', subsOf(B, T2));

console.log('\n예상 시간 — 웹에서 지우면 맥에서도 지워진다');
check('(준비) A·B 의 예상 시간 45분', task(A, T1)?.estMin === 45 && task(B, T1)?.estMin === 45, {
  A: task(A, T1)?.estMin,
  B: task(B, T1)?.estMin,
});
await webPush('예상 시간 지우기', [{ id: T1, estMin: null, updatedAt: new Date().toISOString() }]);
const server1 = await api(`/api/sync/checklists/${listId}/changes?since=0`);
const serverT1 = server1.items.find((i: any) => i.id === T1);
check('(준비) 서버에서 지워졌다', serverT1?.estMin === null, serverT1?.estMin);
await run(A);
await run(B);
check(
  '**A·B 에서도 지워진다 (estMin 0 = 지우기)**',
  task(A, T1)?.estMin === undefined && task(B, T1)?.estMin === undefined,
  { A: task(A, T1)?.estMin, B: task(B, T1)?.estMin },
);

console.log('\n받는 중에 고치기 — 받은 것보다 나중에 고친 것은 덮지 않는다');
const webTitle: Record<string, string> = {
  [T1]: '웹에서 고친 보고서',
  [T2]: '웹에서 고친 우유',
};
const webAt = new Date().toISOString();
await webPush('제목 둘', [
  { id: T1, title: webTitle[T1], updatedAt: webAt },
  { id: T2, title: webTitle[T2], updatedAt: webAt },
]);
await sleep(20);
let edited = '';
mock.onRawWrite(async (written) => {
  if (edited || (written !== T1 && written !== T2)) return;
  // 엔진이 둘 중 하나를 막 썼다 — 아직 안 쓴 쪽을 사용자가 고친다.
  edited = written === T1 ? T2 : T1;
  await mock.updateTask(edited, { title: '받는 중에 A 가 고침' });
});
try {
  await run(A);
} finally {
  mock.onRawWrite(null);
}
const other = edited === T1 ? T2 : T1;
check('(준비) 엔진이 쓰는 사이에 고쳤다', edited !== '', edited);
check(
  '**받은 것보다 나중에 고친 것은 덮지 않는다**',
  task(A, edited)?.title === '받는 중에 A 가 고침',
  task(A, edited)?.title,
);
check(
  '**그 수정이 보낼 것에 적혀 있다 (엔진이 쓰는 중이어도)**',
  outboxOf(A).tasks?.[edited] !== undefined,
  outboxOf(A),
);
check(
  '다른 할 일은 웹 값으로, 보낼 것에는 안 적힌다',
  task(A, other)?.title === webTitle[other] && outboxOf(A).tasks?.[other] === undefined,
  { title: task(A, other)?.title, outbox: outboxOf(A) },
);
await run(A);
check('다음 바퀴에 A 의 수정이 올라간다', lastResult()?.pushed === 1, lastResult());
const server2 = await api(`/api/sync/checklists/${listId}/changes?since=0`);
check(
  '서버도 A 의 수정',
  server2.items.find((i: any) => i.id === edited)?.title === '받는 중에 A 가 고침',
  server2.items.find((i: any) => i.id === edited),
);
await run(B);
check(
  'B 도 같다',
  task(B, edited)?.title === '받는 중에 A 가 고침' && task(B, other)?.title === webTitle[other],
  { edited: task(B, edited)?.title, other: task(B, other)?.title },
);

console.log('\n최종 — A 와 B 가 같다');
const shape = (d: Device) =>
  tasksOf(d).map((t) =>
    [
      t.id,
      t.title,
      t.done,
      t.due ?? '',
      t.estMin ?? '',
      t.folderId ?? '',
      t.group ?? '',
      noteOf(d, t.id),
      subsOf(d, t.id).join('|'),
      idsOf(d, t.id).join('|'),
    ].join('¦'),
  );
check('**할 일 전부가 같다**', JSON.stringify(shape(A)) === JSON.stringify(shape(B)), {
  A: shape(A),
  B: shape(B),
});

console.log(`\n${pass}개 통과, ${fail}개 실패`);
console.log(`(시험 체크리스트 id: ${listId})`);
process.stdout.write(`LIST_ID=${listId}\n`);
process.exit(fail === 0 ? 0 : 1);
