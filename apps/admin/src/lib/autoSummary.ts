import type { Block, DocSummary, Summary, SummaryKind } from '@vallista/content-core';
import {
  getSummary,
  listBlocksInRange,
  listDocs,
  listMoodInRange,
  listSummaries,
  llmChat,
  llmStatus,
  upsertSummary,
} from './tauri';
import { buildSummaryPrompt } from './summaryPrompt';

export type WeekStartDay = 'mon' | 'sun';

const DEEP_KINDS = new Set(['deep', 'write', 'build']);
const BACKOFF_MS = 24 * 60 * 60 * 1000;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeek(d: Date, weekStartDay: WeekStartDay): Date {
  const today = startOfDay(d);
  const startDow = weekStartDay === 'mon' ? 1 : 0;
  const dayOfWeek = today.getDay();
  const daysFromStart = (dayOfWeek - startDow + 7) % 7;
  const result = new Date(today);
  result.setDate(today.getDate() - daysFromStart);
  return result;
}

function isoWeekKey(d: Date, weekStartDay: WeekStartDay): string {
  const weekStart = startOfWeek(d, weekStartDay);
  if (weekStartDay === 'mon') {
    const thursday = new Date(weekStart);
    thursday.setDate(weekStart.getDate() + 3);
    const year = thursday.getFullYear();
    const jan4 = new Date(year, 0, 4);
    const jan4Start = startOfWeek(jan4, weekStartDay);
    const diff = thursday.getTime() - jan4Start.getTime();
    const weekNum = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${pad(weekNum)}`;
  }
  const year = weekStart.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const jan1Start = startOfWeek(jan1, weekStartDay);
  const diff = weekStart.getTime() - jan1Start.getTime();
  const weekNum = 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
  return `${year}-W${pad(weekNum)}`;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function previousWeekRange(
  now: Date,
  weekStartDay: WeekStartDay,
): { start: Date; end: Date; key: string; label: string } {
  const thisWeekStart = startOfWeek(now, weekStartDay);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
  return {
    start: lastWeekStart,
    end: lastWeekEnd,
    key: isoWeekKey(lastWeekStart, weekStartDay),
    label: `${formatISODate(lastWeekStart)} ~ ${formatISODate(lastWeekEnd)}`,
  };
}

export function previousMonthRange(now: Date): {
  start: Date;
  end: Date;
  key: string;
  label: string;
} {
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(thisMonthStart);
  lastMonthEnd.setDate(thisMonthStart.getDate() - 1);
  return {
    start: lastMonthStart,
    end: lastMonthEnd,
    key: monthKey(lastMonthStart),
    label: `${lastMonthStart.getFullYear()}년 ${lastMonthStart.getMonth() + 1}월`,
  };
}

function blockHours(b: Block): number {
  const [sh, sm] = b.start.split(':').map(Number);
  const [eh, em] = b.end.split(':').map(Number);
  if (
    sh === undefined ||
    sm === undefined ||
    eh === undefined ||
    em === undefined ||
    Number.isNaN(sh) ||
    Number.isNaN(sm) ||
    Number.isNaN(eh) ||
    Number.isNaN(em)
  )
    return 0;
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin < startMin) endMin += 24 * 60;
  return Math.max(0, (endMin - startMin) / 60);
}

function aggregateBlocks(blocks: Block[]): {
  totalHours: number;
  deepHours: number;
  topKindHours: { kind: string; hours: number }[];
} {
  let total = 0;
  let deep = 0;
  const byKind = new Map<string, number>();
  for (const b of blocks) {
    const h = blockHours(b);
    total += h;
    if (DEEP_KINDS.has(b.kind)) deep += h;
    byKind.set(b.kind, (byKind.get(b.kind) ?? 0) + h);
  }
  const topKindHours = Array.from(byKind.entries())
    .map(([kind, hours]) => ({ kind, hours }))
    .sort((a, b) => b.hours - a.hours);
  return { totalHours: total, deepHours: deep, topKindHours };
}

function filterPublishedInRange(
  docs: DocSummary[],
  startISO: string,
  endISO: string,
): DocSummary[] {
  return docs.filter((d) => {
    if (d.state !== 'published') return false;
    const dt = d.updatedAt.slice(0, 10);
    return dt >= startISO && dt <= endISO;
  });
}

interface AttemptRecord {
  attempts: number;
  lastErr?: string;
  lastAttemptAt: number;
}

function attemptKey(kind: SummaryKind, period: string): string {
  return `bento.summary.lastAttempt:${kind}:${period}`;
}

function readAttempt(kind: SummaryKind, period: string): AttemptRecord | null {
  try {
    const raw = localStorage.getItem(attemptKey(kind, period));
    if (!raw) return null;
    return JSON.parse(raw) as AttemptRecord;
  } catch {
    return null;
  }
}

function writeAttempt(kind: SummaryKind, period: string, rec: AttemptRecord): void {
  try {
    localStorage.setItem(attemptKey(kind, period), JSON.stringify(rec));
  } catch {
    // ignore
  }
}

function clearAttempt(kind: SummaryKind, period: string): void {
  try {
    localStorage.removeItem(attemptKey(kind, period));
  } catch {
    // ignore
  }
}

function isBackoffActive(kind: SummaryKind, period: string, now: number): boolean {
  const rec = readAttempt(kind, period);
  if (!rec) return false;
  return now - rec.lastAttemptAt < BACKOFF_MS;
}

async function shouldGenerate(
  kind: SummaryKind,
  period: string,
): Promise<boolean> {
  const existing = await getSummary(kind, period);
  return existing == null;
}

interface GenerateOptions {
  force?: boolean;
}

export async function generateWeeklySummary(
  now: Date,
  weekStartDay: WeekStartDay,
  opts: GenerateOptions = {},
): Promise<Summary | null> {
  const range = previousWeekRange(now, weekStartDay);
  if (!opts.force) {
    if (!(await shouldGenerate('weekly', range.key))) return null;
    if (isBackoffActive('weekly', range.key, Date.now())) return null;
  }
  const status = await llmStatus();
  if (!status.running) return null;

  const startISO = formatISODate(range.start);
  const endISO = formatISODate(range.end);

  try {
    const [moods, blocks, allDocs] = await Promise.all([
      listMoodInRange(startISO, endISO),
      listBlocksInRange(startISO, endISO),
      listDocs(),
    ]);
    const publishedDocs = filterPublishedInRange(allDocs, startISO, endISO);
    if (
      moods.length === 0 &&
      blocks.length === 0 &&
      publishedDocs.length === 0
    ) {
      writeAttempt('weekly', range.key, {
        attempts: (readAttempt('weekly', range.key)?.attempts ?? 0) + 1,
        lastErr: 'no data',
        lastAttemptAt: Date.now(),
      });
      return null;
    }
    const agg = aggregateBlocks(blocks);
    const prompt = buildSummaryPrompt({
      kind: 'weekly',
      rangeLabel: range.label,
      blocks,
      moods,
      publishedDocs,
      totalHours: agg.totalHours,
      deepHours: agg.deepHours,
      topKindHours: agg.topKindHours,
    });
    const text = await llmChat({
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: 0.7,
      maxTokens: 480,
    });
    const summary = await upsertSummary({
      kind: 'weekly',
      period: range.key,
      text: text.trim(),
      metricsJson: JSON.stringify({
        totalHours: agg.totalHours,
        deepHours: agg.deepHours,
        moodCount: moods.length,
        publishedCount: publishedDocs.length,
      }),
      model: status.currentModel ?? undefined,
    });
    clearAttempt('weekly', range.key);
    return summary;
  } catch (e: unknown) {
    writeAttempt('weekly', range.key, {
      attempts: (readAttempt('weekly', range.key)?.attempts ?? 0) + 1,
      lastErr: String(e),
      lastAttemptAt: Date.now(),
    });
    return null;
  }
}

export async function generateMonthlySummary(
  now: Date,
  _weekStartDay: WeekStartDay,
  opts: GenerateOptions = {},
): Promise<Summary | null> {
  const range = previousMonthRange(now);
  if (!opts.force) {
    if (!(await shouldGenerate('monthly', range.key))) return null;
    if (isBackoffActive('monthly', range.key, Date.now())) return null;
  }
  const status = await llmStatus();
  if (!status.running) return null;

  const startISO = formatISODate(range.start);
  const endISO = formatISODate(range.end);

  try {
    const [moods, blocks, allDocs, allSummaries] = await Promise.all([
      listMoodInRange(startISO, endISO),
      listBlocksInRange(startISO, endISO),
      listDocs(),
      listSummaries(),
    ]);
    const publishedDocs = filterPublishedInRange(allDocs, startISO, endISO);
    if (
      moods.length === 0 &&
      blocks.length === 0 &&
      publishedDocs.length === 0
    ) {
      writeAttempt('monthly', range.key, {
        attempts: (readAttempt('monthly', range.key)?.attempts ?? 0) + 1,
        lastErr: 'no data',
        lastAttemptAt: Date.now(),
      });
      return null;
    }
    const weeklySummaries = allSummaries
      .filter((s) => s.kind === 'weekly')
      .filter((s) => {
        const m = /^(\d{4})-W(\d{2})$/.exec(s.period);
        if (!m) return false;
        const year = Number(m[1]);
        if (year !== range.start.getFullYear()) return false;
        const weekNum = Number(m[2]);
        const probe = new Date(year, 0, 1 + (weekNum - 1) * 7);
        return (
          probe.getMonth() === range.start.getMonth() ||
          (probe.getMonth() + 1) % 12 === range.start.getMonth()
        );
      })
      .map((s) => ({ period: s.period, text: s.text }));

    const agg = aggregateBlocks(blocks);
    const prompt = buildSummaryPrompt({
      kind: 'monthly',
      rangeLabel: range.label,
      blocks,
      moods,
      publishedDocs,
      totalHours: agg.totalHours,
      deepHours: agg.deepHours,
      topKindHours: agg.topKindHours,
      weeklySummaries,
    });
    const text = await llmChat({
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
      temperature: 0.7,
      maxTokens: 720,
    });
    const summary = await upsertSummary({
      kind: 'monthly',
      period: range.key,
      text: text.trim(),
      metricsJson: JSON.stringify({
        totalHours: agg.totalHours,
        deepHours: agg.deepHours,
        moodCount: moods.length,
        publishedCount: publishedDocs.length,
        weeklyCount: weeklySummaries.length,
      }),
      model: status.currentModel ?? undefined,
    });
    clearAttempt('monthly', range.key);
    return summary;
  } catch (e: unknown) {
    writeAttempt('monthly', range.key, {
      attempts: (readAttempt('monthly', range.key)?.attempts ?? 0) + 1,
      lastErr: String(e),
      lastAttemptAt: Date.now(),
    });
    return null;
  }
}

export const _testing = {
  isoWeekKey,
  monthKey,
  startOfWeek,
  blockHours,
  aggregateBlocks,
};
