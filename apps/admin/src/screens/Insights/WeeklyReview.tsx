import { useEffect, useState } from 'react';
import type { Block, DocSummary, Mood, Summary, SummaryKind } from '@vallista/content-core';
import { getSummary, listBlocksInRange, listMoodInRange } from '../../lib/tauri';
import {
  formatISODate,
  generateMonthlySummary,
  generateWeeklySummary,
  previousMonthRange,
  previousWeekRange,
  type WeekStartDay,
} from '../../lib/autoSummary';
import { acquireAutoSummaryLock, releaseAutoSummaryLock } from '../../lib/useAutoSummary';
import { Button, Eyebrow, Mono } from '../../components/atoms/Atoms';
import { FocusDistribution } from './FocusDistribution';
import { MoodPanel } from './MoodPanel';

const WEEK_START_KEY = 'bento.summary.weekStartDay';

function readWeekStartDay(): WeekStartDay {
  try {
    const v = localStorage.getItem(WEEK_START_KEY);
    return v === 'sun' ? 'sun' : 'mon';
  } catch {
    return 'mon';
  }
}

export interface WeeklyReviewInput {
  rangeLabel: string;
  blocks: Block[];
  moods: Mood[];
  publishedDocs: DocSummary[];
  totalDocs: DocSummary[];
  totalHours: number;
  deepHours: number;
  topKindHours: { kind: string; hours: number }[];
  topPeople: { name: string; count: number }[];
  topTags: { tag: string; n: number }[];
}

const TITLE: Record<SummaryKind, string> = {
  weekly: '전 주 자동 정리',
  monthly: '전 달 자동 정리',
};

const EMPTY_HINT: Record<SummaryKind, string> = {
  weekly: '새 주가 시작되면 자동으로 전 주를 돌아봐 줍니다. 지금 바로 생성도 가능합니다.',
  monthly: '새 달이 시작되면 자동으로 전 달을 돌아봐 줍니다. 지금 바로 생성도 가능합니다.',
};

interface ParsedMetrics {
  totalHours?: number;
  deepHours?: number;
  moodCount?: number;
  publishedCount?: number;
  weeklyCount?: number;
}

function parseMetrics(json?: string): ParsedMetrics {
  if (!json) return {};
  try {
    return JSON.parse(json) as ParsedMetrics;
  } catch {
    return {};
  }
}

function fmtH(h: number): string {
  return h.toFixed(1);
}

function MiniKpi({
  label,
  value,
  unit,
  sub,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  tone?: 'ok' | 'blue';
}) {
  const valueColor =
    tone === 'ok' ? 'var(--ok)' : tone === 'blue' ? 'var(--blue)' : 'var(--ink)';
  return (
    <div
      style={{
        padding: '14px 16px',
        border: '1px solid var(--line)',
        borderRadius: 10,
        background: 'var(--bg)',
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      <div
        style={{
          marginTop: 8,
          fontSize: 22,
          fontWeight: 700,
          color: valueColor,
          letterSpacing: '-0.4px',
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-soft)' }}>{unit}</span>
        )}
      </div>
      {sub && (
        <Mono style={{ marginTop: 4, fontSize: 10.5, color: 'var(--ink-mute)', display: 'block' }}>
          {sub}
        </Mono>
      )}
    </div>
  );
}

export function SummaryReview({ kind }: { kind: SummaryKind }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState<string>('');

  useEffect(() => {
    const ws = readWeekStartDay();
    const now = new Date();
    let start: string;
    let end: string;
    let key: string;
    let label: string;

    if (kind === 'weekly') {
      const r = previousWeekRange(now, ws);
      start = formatISODate(r.start);
      end = formatISODate(r.end);
      key = r.key;
      label = `${r.key} · ${r.label}`;
    } else {
      const r = previousMonthRange(now);
      start = formatISODate(r.start);
      end = formatISODate(r.end);
      key = r.key;
      label = `${r.key} · ${r.label}`;
    }

    setPeriodLabel(label);

    let alive = true;
    Promise.all([
      getSummary(kind, key).catch(() => null),
      listBlocksInRange(start, end).catch(() => []),
      listMoodInRange(start, end).catch(() => []),
    ]).then(([s, bs, ms]) => {
      if (!alive) return;
      setSummary(s);
      setBlocks(bs);
      setMoods(ms);
    });
    return () => {
      alive = false;
    };
  }, [kind]);

  const regenerate = async () => {
    if (!acquireAutoSummaryLock()) {
      setError('자동 생성이 진행 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ws = readWeekStartDay();
      const now = new Date();
      const result =
        kind === 'weekly'
          ? await generateWeeklySummary(now, ws, { force: true })
          : await generateMonthlySummary(now, ws, { force: true });
      if (result) setSummary(result);
      else setError('LLM 미가용 또는 데이터 부족.');
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      releaseAutoSummaryLock();
      setLoading(false);
    }
  };

  const metrics = parseMetrics(summary?.metricsJson);
  const totalH = metrics.totalHours ?? blocks.reduce((a, b) => a + blockHours(b), 0);
  const deepH = metrics.deepHours ?? 0;
  const deepRatio = totalH > 0 ? (deepH / totalH) * 100 : 0;
  const hasData = blocks.length > 0 || moods.length > 0;

  return (
    <div
      style={{
        marginBottom: 'var(--gap-lg)',
      }}
    >
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <Mono
          style={{
            fontSize: 10.5,
            color: 'var(--blue)',
            letterSpacing: '0.06em',
          }}
        >
          {TITLE[kind]} · LLM
        </Mono>
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{periodLabel}</Mono>
        <span style={{ flex: 1 }} />
        <Button sm ghost onClick={regenerate} disabled={loading}>
          {loading ? '생성 중…' : summary ? '다시 생성' : '지금 생성'}
        </Button>
      </div>

      {error && (
        <Mono style={{ fontSize: 11.5, color: 'var(--err)', display: 'block', marginBottom: 12 }}>
          {error}
        </Mono>
      )}

      {/* 데이터 없음 + 회고도 없음 */}
      {!hasData && !summary && !error && !loading && (
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 8 }}>
          {EMPTY_HINT[kind]}
        </div>
      )}

      {/* 미니 KPI 카드 */}
      {(hasData || summary) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <MiniKpi
            label="총 기록 시간"
            value={fmtH(totalH)}
            unit="h"
            sub={`${blocks.length}개 블록`}
          />
          <MiniKpi
            label="딥워크 비율"
            value={deepRatio.toFixed(1)}
            unit="%"
            sub={`${fmtH(deepH)}h / ${fmtH(totalH)}h`}
            tone="ok"
          />
          <MiniKpi
            label="기분 기록"
            value={String(metrics.moodCount ?? moods.length)}
            unit="일"
            sub={
              (metrics.publishedCount ?? 0) > 0
                ? `발행 ${metrics.publishedCount}편`
                : kind === 'monthly' && (metrics.weeklyCount ?? 0) > 0
                  ? `주간 회고 ${metrics.weeklyCount}개`
                  : undefined
            }
            tone="blue"
          />
        </div>
      )}

      {/* FocusDistribution + MoodPanel */}
      {hasData && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <FocusDistribution blocks={blocks} />
          <MoodPanel moods={moods} />
        </div>
      )}

      {/* LLM 텍스트 */}
      {summary && (
        <div
          style={{
            padding: 'var(--card-pad) calc(var(--card-pad) + 2px)',
            background: 'var(--blue-soft)',
            border: '1px solid rgba(96,165,250,0.22)',
            borderLeft: '3px solid var(--blue)',
            borderRadius: 8,
          }}
        >
          <Mono
            style={{
              fontSize: 10,
              color: 'var(--blue)',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: 8,
            }}
          >
            AI 요약
          </Mono>
          <div
            className="psm-selectable"
            style={{
              fontSize: 13.5,
              color: 'var(--ink)',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {summary.text}
          </div>
        </div>
      )}

      {/* 회고 없음 힌트 (데이터는 있지만 summary 없음) */}
      {hasData && !summary && !loading && (
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--bg-soft)',
            border: '1px dashed var(--line)',
            borderRadius: 8,
            fontSize: 12.5,
            color: 'var(--ink-mute)',
          }}
        >
          {EMPTY_HINT[kind]}
        </div>
      )}
    </div>
  );
}

function blockHours(b: Block): number {
  const parse = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    if (h === undefined || m === undefined || Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h + m / 60;
  };
  const s = parse(b.start);
  let e = parse(b.end);
  if (e < s) e += 24;
  return Math.max(0, e - s);
}

export function WeeklyReview(_props?: { input?: WeeklyReviewInput }) {
  return <SummaryReview kind="weekly" />;
}

export function MonthlyReview() {
  return <SummaryReview kind="monthly" />;
}
