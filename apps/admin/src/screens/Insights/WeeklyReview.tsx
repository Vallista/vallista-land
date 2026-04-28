import { useEffect, useState } from 'react';
import type { Block, DocSummary, Mood, Summary, SummaryKind } from '@vallista/content-core';
import { getSummary } from '../../lib/tauri';
import {
  generateMonthlySummary,
  generateWeeklySummary,
  previousMonthRange,
  previousWeekRange,
  type WeekStartDay,
} from '../../lib/autoSummary';
import { Button, Mono } from '../../components/atoms/Atoms';

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

export function SummaryReview({ kind }: { kind: SummaryKind }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodLabel, setPeriodLabel] = useState<string>('');

  useEffect(() => {
    const ws = readWeekStartDay();
    const now = new Date();
    if (kind === 'weekly') {
      const r = previousWeekRange(now, ws);
      setPeriodLabel(`${r.key} · ${r.label}`);
      getSummary('weekly', r.key)
        .then(setSummary)
        .catch(() => {});
    } else {
      const r = previousMonthRange(now);
      setPeriodLabel(`${r.key} · ${r.label}`);
      getSummary('monthly', r.key)
        .then(setSummary)
        .catch(() => {});
    }
  }, [kind]);

  const regenerate = async () => {
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
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '18px 22px',
        background: 'var(--blue-soft)',
        border: '1px solid rgba(96,165,250,0.22)',
        borderLeft: '3px solid var(--blue)',
        borderRadius: 8,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
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
        <Mono style={{ fontSize: 11.5, color: 'var(--err)', display: 'block' }}>
          {error}
        </Mono>
      )}

      {!summary && !error && !loading && (
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          {EMPTY_HINT[kind]}
        </div>
      )}

      {summary && (
        <div
          className="psm-selectable"
          style={{
            fontSize: 14,
            color: 'var(--ink)',
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
          }}
        >
          {summary.text}
        </div>
      )}
    </div>
  );
}

export function WeeklyReview(_props?: { input?: WeeklyReviewInput }) {
  return <SummaryReview kind="weekly" />;
}

export function MonthlyReview() {
  return <SummaryReview kind="monthly" />;
}
