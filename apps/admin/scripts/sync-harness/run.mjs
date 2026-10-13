// 냥노션 동기화 시나리오 실행기 — scenario.ts 를 묶되 `./tauri` 를 가짜(tauri-mock)로 바꿔 끼운다.
//
//   SYNC_BASE=http://localhost:3100 SYNC_TOKEN=nyt_… node apps/admin/scripts/sync-harness/run.mjs
//
// 맥 없이도(Windows·CI) 진짜 서버를 상대로 동기화 엔진을 돌려 볼 수 있다. 시험 체크리스트를 하나 만든다.

import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// esbuild 는 vite 가 들고 있다 — admin 의 직접 의존이 아니므로 vite 를 거쳐 찾는다.
const requireFromVite = createRequire(createRequire(import.meta.url).resolve('vite'));
const { build } = requireFromVite('esbuild');
const mock = path.join(here, 'tauri-mock.ts');

const result = await build({
  entryPoints: [path.join(here, 'scenario.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  write: false,
  logLevel: 'error',
  plugins: [
    {
      name: 'tauri-mock',
      setup(b) {
        // nyanotionSync.ts 의 `./tauri` 만 가짜로. syncOutbox 는 진짜를 쓴다.
        b.onResolve({ filter: /^\.\/tauri$/ }, () => ({ path: mock }));
      },
    },
  ],
});

const out = path.join(mkdtempSync(path.join(tmpdir(), 'bento-sync-')), 'scenario.mjs');
writeFileSync(out, result.outputFiles[0].text);
const run = spawnSync(process.execPath, [out], { stdio: 'inherit', env: process.env });
process.exit(run.status ?? 1);
