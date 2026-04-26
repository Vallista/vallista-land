import { useEffect, useMemo, useState } from 'react';
import type { Block, DocSummary, Mood } from '@vallista/content-core';
import {
  computeInsights,
  listBlocksInRange,
  listDocs,
  listMoodInRange,
} from '../../lib/tauri';
import type { Insights as InsightsData } from '../../lib/tauri';
import { Eyebrow, Mono, PageHead } from '../../components/atoms/Atoms';
import { StateBar } from './StateBar';
import { DocSection } from './DocSection';
import { TagCloud } from './TagCloud';
import { HubList } from './HubList';
import { FocusDistribution, bucketBlocks } from './FocusDistribution';
import { MoodPanel } from './MoodPanel';
import { HourHeatmap } from './HourHeatmap';
import { PeoplePanel } from './PeoplePanel';
import { ClusterPanel } from './ClusterPanel';
import { WeeklyReview, type WeeklyReviewInput } from './WeeklyReview';

type RangeKey = '7d' | '30d' | '12w' | '1y';

const RANGE_LABEL: Record<RangeKey, string> = {
  '7d': '7일',
  '30d': '30일',
  '12w': '12주',
  '1y': '1년',
};

const RANGE_DAYS: Record<RangeKey, number> = {
  '7d': 7,
  '30d': 30,
  '12w': 84,
  '1y': 365,
};

const DEEP_KINDS = new Set(['deep', 'write', 'build']);

export function Insights() {
  const [range, setRange] = useState<RangeKey>('7d');
  const [data, setData] = useState<InsightsData | null>(null);
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    const today = new Date();
    const days = RANGE_DAYS[range];
    const start = new Date(today);
    start.setDate(start.getDate() - (days - 1));
    const startKey = isoKey(start);
    const endKey = isoKey(today);

    setLoading(true);
    setError(null);
    Promise.all([
      computeInsights(),
      listDocs(),
      listBlocksInRange(startKey, endKey),
      listMoodInRange(startKey, endKey),
    ])
      .then(([d, allDocs, bs, ms]) => {
        if (!alive) return;
        setData(d);
        setDocs(allDocs);
        setBlocks(bs);
        setMoods(ms);
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [range]);

  const today = useMemo(() => isoKey(new Date()), []);

  const stats = useMemo(() => {
    const totalH = blocks.reduce(
      (a, b) => a + Math.max(0, durationHours(b.start, b.end)),
      0,
    );
    const deepH = blocks
      .filter((b) => DEEP_KINDS.has(b.kind))
      .reduce((a, b) => a + Math.max(0, durationHours(b.start, b.end)), 0);

    const start = new Date();
    start.setDate(start.getDate() - (RANGE_DAYS[range] - 1));
    const startKey = isoKey(start);
    const publishedThisRange = (docs ?? []).filter(
      (d) => d.state === 'published' && d.updatedAt.slice(0, 10) >= startKey,
    );
    const seedDocs = (docs ?? []).filter((d) => d.state === 'seed');
    const sproutDocs = (docs ?? []).filter((d) => d.state === 'sprout');
    return {
      totalH,
      deepH,
      deepRatio: totalH > 0 ? deepH / totalH : 0,
      publishedCount: publishedThisRange.length,
      seedCount: seedDocs.length,
      sproutCount: sproutDocs.length,
    };
  }, [blocks, docs, range]);

  const reviewInput: WeeklyReviewInput | null = useMemo(() => {
    if (!docs) return null;
    const buckets = bucketBlocks(blocks);
    const start = new Date();
    start.setDate(start.getDate() - (RANGE_DAYS[range] - 1));
    const startKey = isoKey(start);
    const publishedThisRange = docs.filter(
      (d) => d.state === 'published' && d.updatedAt.slice(0, 10) >= startKey,
    );
    const peopleMap = new Map<string, number>();
    for (const b of blocks) {
      for (const p of b.attendees ?? []) {
        peopleMap.set(p, (peopleMap.get(p) ?? 0) + 1);
      }
    }
    const tagMap = new Map<string, number>();
    for (const d of docs) {
      for (const t of d.tags ?? []) {
        tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
      }
    }
    return {
      rangeLabel: rangeLabelText(range),
      blocks,
      moods,
      publishedDocs: publishedThisRange,
      totalDocs: docs,
      totalHours: stats.totalH,
      deepHours: stats.deepH,
      topKindHours: buckets.map((b) => ({ kind: b.label, hours: b.hours })),
      topPeople: Array.from(peopleMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      topTags: Array.from(tagMap.entries())
        .map(([tag, n]) => ({ tag, n }))
        .sort((a, b) => b.n - a.n),
    };
  }, [blocks, docs, moods, range, stats]);

  if (error && !data) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="돌아보기" sub="insights 계산 실패" />
        <div
          style={{
            padding: 16,
            border: '1px solid var(--err-soft)',
            background: 'var(--err-soft)',
            color: 'var(--err)',
            borderRadius: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        background: 'var(--bg)',
      }}
    >
      <div style={{ padding: '32px 48px 80px', maxWidth: 1120 }}>
        <PageHead
          title="돌아보기"
          sub={
            data
              ? `${data.total}개 노트 · ${rangeLabelText(range)}`
              : 'vault 스캔 중…'
          }
          right={
            <div
              style={{
                display: 'flex',
                gap: 0,
                padding: 2,
                background: 'var(--bg-soft)',
                border: '1px solid var(--line)',
                borderRadius: 6,
              }}
            >
              {(Object.keys(RANGE_LABEL) as RangeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setRange(k)}
                  style={{
                    padding: '4px 12px',
                    border: 'none',
                    background: k === range ? 'var(--bg-shade)' : 'transparent',
                    color: k === range ? 'var(--ink)' : 'var(--ink-soft)',
                    fontSize: 11.5,
                    cursor: 'pointer',
                    borderRadius: 4,
                    fontFamily: 'inherit',
                  }}
                >
                  {RANGE_LABEL[k]}
                </button>
              ))}
            </div>
          }
        />

        {loading && !data && (
          <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
            데이터 불러오는 중…
          </Mono>
        )}

        {/* KPI cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Kpi
            label="총 기록 시간"
            value={stats.totalH.toFixed(1)}
            unit="h"
            sub={`${blocks.length}개 블록`}
          />
          <Kpi
            label="딥워크 비율"
            value={(stats.deepRatio * 100).toFixed(1)}
            unit="%"
            sub={`${stats.deepH.toFixed(1)}h / ${stats.totalH.toFixed(1)}h`}
            tone="ok"
          />
          <Kpi
            label="발행"
            value={String(stats.publishedCount)}
            unit="편"
            sub={publishedSub(stats.publishedCount, RANGE_DAYS[range])}
          />
          <Kpi
            label="씨앗 / 새싹"
            value={`${stats.seedCount}`}
            unit={`/${stats.seedCount + stats.sproutCount}`}
            sub={`${stats.sproutCount}개 자라는 중`}
            tone="blue"
          />
        </div>

        {/* AI weekly review */}
        {reviewInput && <WeeklyReview input={reviewInput} />}

        {/* Two-col: focus / mood */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: 20,
            marginBottom: 20,
          }}
        >
          <FocusDistribution blocks={blocks} />
          <MoodPanel moods={moods} />
        </div>

        {/* Heatmap */}
        <HourHeatmap blocks={blocks} />

        {/* People + clusters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            marginBottom: 24,
          }}
        >
          <PeoplePanel blocks={blocks} today={today} />
          <ClusterPanel docs={docs ?? []} />
        </div>

        {/* Vault patterns (legacy section preserved at bottom) */}
        {data && (
          <section style={{ marginTop: 8 }}>
            <header
              style={{
                marginBottom: 12,
                paddingBottom: 6,
                borderBottom: '1px solid var(--line)',
              }}
            >
              <Eyebrow>볼트 패턴</Eyebrow>
              <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
                상태 · 연결 · 흩어짐
              </Mono>
            </header>
            <StateBar counts={data.stateCounts} total={data.total} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 18,
                marginTop: 16,
              }}
            >
              <DocSection
                title="고립된 노트"
                subtitle="아무 곳에도 연결되지 않은 글"
                emptyText="고립된 노트가 없습니다 ✓"
                docs={data.orphans}
              />
              <DocSection
                title="자라지 못한 씨앗"
                subtitle="30일 넘게 손이 닿지 않은 씨앗"
                emptyText="모든 씨앗이 최근에 손이 닿았습니다 ✓"
                docs={data.staleSeeds}
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.1fr 1fr',
                gap: 18,
                marginTop: 18,
              }}
            >
              <Section title="링크 허브" subtitle="가장 많이 이어진 노트">
                <HubList hubs={data.hubs} />
              </Section>
              <Section
                title="태그 클러스터"
                subtitle={`상위 ${data.tagCounts.length}개`}
              >
                <TagCloud tags={data.tagCounts} />
              </Section>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Kpi({
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
        padding: '20px 22px',
        border: '1px solid var(--line)',
        borderRadius: 12,
        background: 'var(--bg)',
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      <div
        style={{
          marginTop: 10,
          fontSize: 30,
          fontWeight: 700,
          color: valueColor,
          letterSpacing: '-0.6px',
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        {value}
        {unit && (
          <span
            style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-soft)' }}
          >
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <Mono
          style={{
            marginTop: 6,
            fontSize: 11,
            color: 'var(--ink-mute)',
            display: 'block',
          }}
        >
          {sub}
        </Mono>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section style={style}>
      <header
        style={{
          marginBottom: 8,
          paddingBottom: 4,
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--ink-soft)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              {subtitle}
            </Mono>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

function durationHours(start: string, end: string): number {
  const a = parseTime(start);
  const b = parseTime(end);
  if (a === null || b === null) return 0;
  return Math.max(0, b - a);
}

function parseTime(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  return Number(m[1]) + Number(m[2]) / 60;
}

function isoKey(d: Date): string {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  return `${y}-${m}-${day}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function rangeLabelText(range: RangeKey): string {
  const days = RANGE_DAYS[range];
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - (days - 1));
  return `${shortDate(isoKey(start))} → ${shortDate(isoKey(today))}`;
}

function shortDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[2]}월 ${m[3]}일`;
}

function publishedSub(count: number, days: number): string {
  if (count === 0) return `${days}일간 무발행`;
  const avgDays = days / count;
  return `평균 ${avgDays.toFixed(1)}일/편`;
}
