import type { Block, DocSummary, Mood } from '@vallista/content-core';
import type { Insights as InsightsData } from '../../lib/tauri';
import { readDoc, writeDoc } from '../../lib/tauri';
import { serializeDoc } from '../Atelier/save';

export interface ReportInput {
  rangeLabel: string;
  rangeKey: string;
  startKey: string;
  endKey: string;
  blocks: Block[];
  moods: Mood[];
  docs: DocSummary[];
  publishedDocs: DocSummary[];
  totalHours: number;
  deepHours: number;
  deepRatio: number;
  topKindHours: { kind: string; hours: number }[];
  topPeople: { name: string; count: number }[];
  topTags: { tag: string; n: number }[];
  vault: InsightsData | null;
}

export interface ReportSaveResult {
  path: string;
  alreadyExisted: boolean;
}

export async function saveReport(input: ReportInput): Promise<ReportSaveResult> {
  const docId = `report_${input.endKey.replace(/-/g, '')}_${input.rangeKey}`;
  const slug = `${input.endKey}-${input.rangeKey}`;
  const path = `contents/notes/reports/${slug}.md`;
  const existing = await readDoc(path);
  const now = new Date().toISOString();
  const front: Record<string, unknown> = {
    id: docId,
    title: `돌아보기 · ${input.rangeLabel}`,
    state: 'seed',
    tags: ['report', 'insights', input.rangeKey],
    source: { kind: 'report', range: input.rangeKey, startKey: input.startKey, endKey: input.endKey },
    createdAt: existing.exists ? extractCreatedAt(existing.raw) ?? now : now,
    updatedAt: now,
  };
  const md = serializeDoc(front, buildBody(input));
  await writeDoc(path, md);
  return { path, alreadyExisted: existing.exists };
}

function extractCreatedAt(raw: string): string | null {
  const m = /createdAt:\s*['"]?([^'"\n]+)['"]?/.exec(raw);
  if (!m || !m[1]) return null;
  return m[1].trim();
}

function buildBody(input: ReportInput): string {
  const lines: string[] = [];
  lines.push(`# 돌아보기 — ${input.rangeLabel}`);
  lines.push('');
  lines.push(`> 범위 \`${input.startKey}\` → \`${input.endKey}\` · 생성 \`${shortNow()}\``);
  lines.push('');

  lines.push('## KPI');
  lines.push('');
  lines.push('| 지표 | 값 | 비고 |');
  lines.push('| --- | --- | --- |');
  lines.push(
    `| 총 기록 시간 | ${input.totalHours.toFixed(1)}h | ${input.blocks.length}개 블록 |`,
  );
  lines.push(
    `| 딥워크 비율 | ${(input.deepRatio * 100).toFixed(1)}% | ${input.deepHours.toFixed(1)}h / ${input.totalHours.toFixed(1)}h |`,
  );
  lines.push(`| 발행 | ${input.publishedDocs.length}편 | ${publishedSub(input)} |`);
  const seedCount = input.docs.filter((d) => d.state === 'seed').length;
  const sproutCount = input.docs.filter((d) => d.state === 'sprout').length;
  lines.push(`| 메모 / 초안 | ${seedCount} / ${sproutCount} | ${input.docs.length}개 노트 |`);
  const energies = input.moods
    .map((m) => m.energy)
    .filter((v): v is number => typeof v === 'number');
  const valences = input.moods
    .map((m) => m.mood)
    .filter((v): v is number => typeof v === 'number');
  if (energies.length > 0 && valences.length > 0) {
    const energy = avg(energies);
    const valence = avg(valences);
    lines.push(
      `| 기분 평균 | E ${energy.toFixed(1)} · V ${valence.toFixed(1)} | ${energies.length}회 기록 |`,
    );
  }
  lines.push('');

  if (input.topKindHours.length > 0) {
    lines.push('## 시간 분포');
    lines.push('');
    for (const k of input.topKindHours.filter((x) => x.hours > 0).slice(0, 8)) {
      lines.push(`- **${k.kind}** — ${k.hours.toFixed(1)}h`);
    }
    lines.push('');
  }

  if (input.publishedDocs.length > 0) {
    lines.push('## 발행한 글');
    lines.push('');
    for (const d of input.publishedDocs.slice(0, 20)) {
      lines.push(`- \`${d.updatedAt.slice(0, 10)}\` ${d.title || '(제목 없음)'}`);
    }
    lines.push('');
  }

  if (input.topPeople.length > 0) {
    lines.push('## 함께한 사람');
    lines.push('');
    for (const p of input.topPeople.slice(0, 8)) {
      lines.push(`- ${p.name} — ${p.count}회`);
    }
    lines.push('');
  }

  if (input.topTags.length > 0) {
    lines.push('## 자주 등장한 태그');
    lines.push('');
    const top = input.topTags.slice(0, 12);
    lines.push(top.map((t) => `\`${t.tag}\`(${t.n})`).join(' · '));
    lines.push('');
  }

  if (input.vault) {
    lines.push('## 볼트 패턴');
    lines.push('');
    const sc = input.vault.stateCounts;
    lines.push(
      `- 상태 — 메모 ${sc.seed ?? 0} · 초안 ${sc.sprout ?? 0} · 교정 ${sc.draft ?? 0} · 공개 ${sc.published ?? 0}`,
    );
    if (input.vault.orphans.length > 0) {
      lines.push(`- 고립된 노트 ${input.vault.orphans.length}개 — 첫 3개:`);
      for (const o of input.vault.orphans.slice(0, 3)) {
        lines.push(`  - ${o.title || '(제목 없음)'}`);
      }
    }
    if (input.vault.staleSeeds.length > 0) {
      lines.push(`- 30일 넘게 멈춘 메모 ${input.vault.staleSeeds.length}개`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('> 자동 생성 리포트. 한 줄 회고를 아래에 더해도 좋습니다.');
  lines.push('');
  lines.push('### 한 줄 회고');
  lines.push('');
  return lines.join('\n');
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function publishedSub(input: ReportInput): string {
  const days = daysBetween(input.startKey, input.endKey) + 1;
  if (input.publishedDocs.length === 0) return `${days}일간 무발행`;
  return `평균 ${(days / input.publishedDocs.length).toFixed(1)}일/편`;
}

function daysBetween(startKey: string, endKey: string): number {
  const a = Date.parse(startKey);
  const b = Date.parse(endKey);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / (24 * 3600 * 1000)));
}

function shortNow(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
