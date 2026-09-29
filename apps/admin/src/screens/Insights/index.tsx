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
import { useBlogEnabled } from '../../shell/blogContext';
import { StateBar } from './StateBar';
import { DocSection } from './DocSection';
import { TagCloud } from './TagCloud';
import { HubList } from './HubList';
import { FocusDistribution, bucketBlocks } from './FocusDistribution';
import { MoodPanel } from './MoodPanel';
import { HourHeatmap } from './HourHeatmap';
import { PeoplePanel } from './PeoplePanel';
import { ClusterPanel } from './ClusterPanel';
import { type WeeklyReviewInput } from './WeeklyReview';
import { WeeklyTable, KindGrid } from './WeeklyTable';
import { SummaryTimeline } from './SummaryTimeline';
import { saveReport, type ReportInput } from './exportReport';
import { avgMoodStats, filterThisWeek, filterThisMonth } from '../../lib/moodStats';
import type { WeekStartDay } from '../../lib/autoSummary';
import { buildTimeStats, fmtMin } from '../../lib/timeStats';
import { filterStatsBlocks, STATS_EXCLUDED_EVENT } from '../Plan/blockMeta';

const WEEK_START_KEY = 'bento.summary.weekStartDay';

function readWeekStartDay(): WeekStartDay {
  try {
    const v = localStorage.getItem(WEEK_START_KEY);
    return v === 'sun' ? 'sun' : 'mon';
  } catch {
    return 'mon';
  }
}

type RangeKey = '7d' | '30d' | '12w' | '1y';

type ExportState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'done'; path: string; alreadyExisted: boolean }
  | { kind: 'error'; message: string };

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

const DELTA_LABEL: Record<RangeKey, string> = {
  '7d': '전주',
  '30d': '전달',
  '12w': '전전 12주',
  '1y': '전년',
};

const DEEP_KINDS = new Set(['deep', 'write', 'build']);

export function Insights() {
  const blogEnabled = useBlogEnabled();
  const [range, setRange] = useState<RangeKey>('7d');
  const [data, setData] = useState<InsightsData | null>(null);
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [monthlyMoods, setMonthlyMoods] = useState<Mood[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exportState, setExportState] = useState<ExportState>({ kind: 'idle' });
  const [prevBlocks, setPrevBlocks] = useState<Block[]>([]);

  useEffect(() => {
    const today = new Date();
    const todayKey = isoKey(today);
    const monthStart = `${todayKey.slice(0, 7)}-01`;
    listMoodInRange(monthStart, todayKey)
      .then(setMonthlyMoods)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let alive = true;
    const days = RANGE_DAYS[range];
    const today = new Date();
    const prevEnd = new Date(today);
    prevEnd.setDate(prevEnd.getDate() - days);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (days - 1));
    listBlocksInRange(isoKey(prevStart), isoKey(prevEnd))
      .then((bs) => { if (alive) setPrevBlocks(bs); })
      .catch(() => {});
    return () => { alive = false; };
  }, [range]);

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
    const docPromise: Promise<[InsightsData | null, DocSummary[]]> = blogEnabled
      ? Promise.all([computeInsights(), listDocs()]).catch(
          () => [null, []] as [InsightsData | null, DocSummary[]],
        )
      : Promise.resolve([null, []] as [InsightsData | null, DocSummary[]]);
    Promise.all([
      docPromise,
      listBlocksInRange(startKey, endKey),
      listMoodInRange(startKey, endKey),
    ])
      .then(([[d, allDocs], bs, ms]) => {
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
  }, [range, blogEnabled]);

  useEffect(() => {
    setExportState({ kind: 'idle' });
  }, [range]);

  const today = useMemo(() => isoKey(new Date()), []);

  const conditionStats = useMemo(() => {
    const ws = readWeekStartDay();
    const week = filterThisWeek(monthlyMoods, today, ws);
    const month = filterThisMonth(monthlyMoods, today);
    return {
      week: avgMoodStats(week),
      month: avgMoodStats(month),
    };
  }, [monthlyMoods, today]);

  const [statsExcludedVersion, setStatsExcludedVersion] = useState(0);

  useEffect(() => {
    const onChanged = () => setStatsExcludedVersion((v) => v + 1);
    window.addEventListener(STATS_EXCLUDED_EVENT, onChanged);
    return () => window.removeEventListener(STATS_EXCLUDED_EVENT, onChanged);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const statsBlocks = useMemo(
    () => filterStatsBlocks(blocks),
    [blocks, statsExcludedVersion],
  );

  const efficiency = useMemo(() => buildTimeStats(statsBlocks), [statsBlocks]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const statsPrevBlocks = useMemo(
    () => filterStatsBlocks(prevBlocks),
    [prevBlocks, statsExcludedVersion],
  );

  const prevStats = useMemo(() => {
    const totalH = statsPrevBlocks.reduce(
      (a, b) => a + Math.max(0, durationHours(b.start, b.end)),
      0,
    );
    const deepH = statsPrevBlocks
      .filter((b) => DEEP_KINDS.has(b.kind))
      .reduce((a, b) => a + Math.max(0, durationHours(b.start, b.end)), 0);
    const meetMin = statsPrevBlocks
      .filter((b) => b.kind === 'meet')
      .reduce((a, b) => a + Math.max(0, durationHours(b.start, b.end)) * 60, 0);
    const focusMin = statsPrevBlocks
      .filter((b) => DEEP_KINDS.has(b.kind))
      .reduce((a, b) => a + Math.max(0, durationHours(b.start, b.end)) * 60, 0);
    return {
      totalH,
      deepH,
      deepRatio: totalH > 0 ? deepH / totalH : 0,
      meetH: meetMin / 60,
      focusH: focusMin / 60,
    };
  }, [statsPrevBlocks]);

  const deltaLabel = DELTA_LABEL[range];

  const stats = useMemo(() => {
    const totalH = statsBlocks.reduce(
      (a, b) => a + Math.max(0, durationHours(b.start, b.end)),
      0,
    );
    const deepH = statsBlocks
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
  }, [statsBlocks, docs, range]);

  const reviewInput: WeeklyReviewInput | null = useMemo(() => {
    if (!docs) return null;
    const buckets = bucketBlocks(statsBlocks);
    const start = new Date();
    start.setDate(start.getDate() - (RANGE_DAYS[range] - 1));
    const startKey = isoKey(start);
    const publishedThisRange = docs.filter(
      (d) => d.state === 'published' && d.updatedAt.slice(0, 10) >= startKey,
    );
    const peopleMap = new Map<string, number>();
    for (const b of statsBlocks) {
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
      blocks: statsBlocks,
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
  }, [statsBlocks, docs, moods, range, stats]);

  const handleExport = async () => {
    if (!docs || !reviewInput) return;
    if (exportState.kind === 'saving') return;
    setExportState({ kind: 'saving' });
    const start = new Date();
    start.setDate(start.getDate() - (RANGE_DAYS[range] - 1));
    const startKey = isoKey(start);
    const endKey = today;
    const publishedDocs = docs.filter(
      (d) => d.state === 'published' && d.updatedAt.slice(0, 10) >= startKey,
    );
    const input: ReportInput = {
      rangeLabel: rangeLabelText(range),
      rangeKey: range,
      startKey,
      endKey,
      blocks,
      moods,
      docs,
      publishedDocs,
      totalHours: stats.totalH,
      deepHours: stats.deepH,
      deepRatio: stats.deepRatio,
      topKindHours: reviewInput.topKindHours,
      topPeople: reviewInput.topPeople,
      topTags: reviewInput.topTags,
      vault: data,
    };
    try {
      const r = await saveReport(input);
      setExportState({ kind: 'done', path: r.path, alreadyExisted: r.alreadyExisted });
    } catch (e) {
      setExportState({ kind: 'error', message: String(e) });
    }
  };

  if (error && !data) {
    return (
      <div style={{ padding: 'calc(var(--gap-lg) * 2) calc(var(--gap-lg) * 3)', maxWidth: 1120 }}>
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
      <div style={{ padding: 'calc(var(--gap-lg) * 2) calc(var(--gap-lg) * 3) 80px', maxWidth: 1120 }}>
        <PageHead
          title="돌아보기"
          sub={
            data
              ? `${data.total}개 노트 · ${rangeLabelText(range)}`
              : blogEnabled
                ? 'vault 스캔 중…'
                : rangeLabelText(range)
          }
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={handleExport}
                disabled={!reviewInput || exportState.kind === 'saving'}
                title="리포트를 contents/notes/reports 에 마크다운으로 저장"
                style={{
                  padding: '5px 12px',
                  fontSize: 11.5,
                  fontFamily: 'inherit',
                  color: 'var(--ink)',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  cursor: reviewInput ? 'pointer' : 'not-allowed',
                  opacity: !reviewInput || exportState.kind === 'saving' ? 0.5 : 1,
                }}
              >
                {exportState.kind === 'saving' ? '저장 중…' : '리포트 내보내기'}
              </button>
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
            </div>
          }
        />

        {exportState.kind === 'done' && (
          <Mono
            style={{
              display: 'block',
              marginTop: -8,
              marginBottom: 16,
              fontSize: 11,
              color: 'var(--ok)',
            }}
          >
            {exportState.alreadyExisted ? '갱신' : '저장'} → {exportState.path}
          </Mono>
        )}
        {exportState.kind === 'error' && (
          <Mono
            style={{
              display: 'block',
              marginTop: -8,
              marginBottom: 16,
              fontSize: 11,
              color: 'var(--err)',
            }}
          >
            저장 실패: {exportState.message}
          </Mono>
        )}

        {loading && !data && (
          <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
            데이터 불러오는 중…
          </Mono>
        )}

        {/* KPI cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: blogEnabled ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Kpi
            label="총 기록 시간"
            value={stats.totalH.toFixed(1)}
            unit="h"
            sub={`${blocks.length}개 블록`}
            delta={makeDelta(stats.totalH, prevStats.totalH, deltaLabel)}
          />
          <Kpi
            label="딥워크 비율"
            value={(stats.deepRatio * 100).toFixed(1)}
            unit="%"
            sub={`${stats.deepH.toFixed(1)}h / ${stats.totalH.toFixed(1)}h`}
            tone="ok"
            delta={makeDelta(stats.deepRatio * 100, prevStats.deepRatio * 100, deltaLabel)}
          />
          {blogEnabled && (
            <>
              <Kpi
                label="발행"
                value={String(stats.publishedCount)}
                unit="편"
                sub={publishedSub(stats.publishedCount, RANGE_DAYS[range])}
              />
              <Kpi
                label="메모 / 초안"
                value={`${stats.seedCount}`}
                unit={`/${stats.seedCount + stats.sproutCount}`}
                sub={`${stats.sproutCount}개 진행 중`}
                tone="blue"
              />
            </>
          )}
        </div>

        {/* Condition KPI */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Kpi
            label="이번 주 평균 컨디션"
            value={conditionAverageDisplay(conditionStats.week)}
            unit={conditionStats.week.count > 0 ? '%' : ''}
            sub={conditionSub(conditionStats.week)}
            tone="blue"
          />
          <Kpi
            label="이번 달 평균 컨디션"
            value={conditionAverageDisplay(conditionStats.month)}
            unit={conditionStats.month.count > 0 ? '%' : ''}
            sub={conditionSub(conditionStats.month)}
            tone="blue"
          />
        </div>

        {/* Efficiency KPI */}
        {efficiency.totalCount > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <Kpi
              label="완료율"
              value={`${
                efficiency.totalCount > 0
                  ? Math.round((efficiency.doneCount / efficiency.totalCount) * 100)
                  : 0
              }`}
              unit="%"
              sub={`${efficiency.doneCount}/${efficiency.totalCount} 블록`}
              tone="ok"
            />
            <Kpi
              label="시간 정확도"
              value={
                efficiency.meanAbsDriftMin !== null
                  ? `±${Math.round(efficiency.meanAbsDriftMin)}`
                  : '—'
              }
              unit={efficiency.meanAbsDriftMin !== null ? '분' : ''}
              sub={
                efficiency.hasActual
                  ? `계획 ${fmtMin(efficiency.plannedMin)} · 실제 ${fmtMin(efficiency.actualMin)}`
                  : '실제 시간 미기록'
              }
            />
            <Kpi
              label="회의 시간"
              value={(efficiency.byCategory.meet / 60).toFixed(1)}
              unit="h"
              sub={`전체 중 ${
                efficiency.plannedMin > 0
                  ? Math.round((efficiency.byCategory.meet / efficiency.plannedMin) * 100)
                  : 0
              }%`}
              delta={makeDelta(efficiency.byCategory.meet / 60, prevStats.meetH, deltaLabel, false)}
            />
            <Kpi
              label="집중 시간"
              value={(efficiency.byCategory.focus / 60).toFixed(1)}
              unit="h"
              sub={`전체 중 ${
                efficiency.plannedMin > 0
                  ? Math.round((efficiency.byCategory.focus / efficiency.plannedMin) * 100)
                  : 0
              }%`}
              tone="ok"
              delta={makeDelta(efficiency.byCategory.focus / 60, prevStats.focusH, deltaLabel)}
            />
          </div>
        )}

        {/* Two-col: focus / mood */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.1fr 0.9fr',
            gap: 'var(--gap-lg)',
            marginBottom: 'var(--gap-lg)',
          }}
        >
          <FocusDistribution blocks={blocks} />
          <MoodPanel moods={moods} />
        </div>

        {/* Heatmap */}
        <HourHeatmap blocks={blocks} />

        {/* 날짜별 상세 + 종류×날짜 그리드 (7일 범위) */}
        {range === '7d' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--gap-lg)',
              marginTop: 'var(--gap-lg)',
            }}
          >
            <WeeklyTable blocks={blocks} />
            <KindGrid blocks={blocks} />
          </div>
        )}

        {/* People + clusters */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: blogEnabled ? '1fr 1fr' : '1fr',
            gap: 'var(--gap-lg)',
            marginBottom: 'calc(var(--gap-lg) + 4px)',
          }}
        >
          <PeoplePanel blocks={blocks} today={today} />
          {blogEnabled && <ClusterPanel docs={docs ?? []} />}
        </div>

        {/* 회고 타임라인 */}
        <section style={{ marginTop: 8, marginBottom: 32 }}>
          <header
            style={{
              marginBottom: 20,
              paddingBottom: 6,
              borderBottom: '1px solid var(--line)',
            }}
          >
            <Eyebrow>회고 타임라인</Eyebrow>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              주간 · 월간 자동 정리 · 최신순
            </Mono>
          </header>
          <SummaryTimeline />
        </section>

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
                title="멈춘 메모"
                subtitle="30일 넘게 손이 닿지 않은 메모"
                emptyText="모든 메모가 최근에 손이 닿았습니다 ✓"
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

interface KpiDelta {
  diff: number;
  pct: number;
  label: string;
  higherIsBetter?: boolean;
}

function Kpi({
  label,
  value,
  unit,
  sub,
  tone,
  delta,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  tone?: 'ok' | 'blue';
  delta?: KpiDelta;
}) {
  const valueColor =
    tone === 'ok' ? 'var(--ok)' : tone === 'blue' ? 'var(--blue)' : 'var(--ink)';

  const deltaEl = (() => {
    if (!delta || delta.diff === 0 || delta.pct === 0) return null;
    const up = delta.diff > 0;
    const good = delta.higherIsBetter === false ? !up : up;
    const color = good ? 'var(--ok)' : 'var(--hl-rose)';
    const arrow = up ? '↑' : '↓';
    const absPct = Math.abs(delta.pct).toFixed(0);
    return (
      <Mono
        style={{
          marginTop: 5,
          fontSize: 10.5,
          color,
          display: 'flex',
          alignItems: 'center',
          gap: 3,
        }}
      >
        {arrow} {delta.label} 대비 {up ? '+' : ''}{delta.diff.toFixed(1)}{unit ?? ''}
        <span style={{ color: 'var(--ink-mute)', marginLeft: 2 }}>({up ? '+' : '-'}{absPct}%)</span>
      </Mono>
    );
  })();

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
      {deltaEl}
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

function makeDelta(curr: number, prev: number, label: string, higherIsBetter = true): KpiDelta {
  const diff = curr - prev;
  const pct = prev > 0 ? (diff / prev) * 100 : 0;
  return { diff, pct, label, higherIsBetter };
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

function conditionAverageDisplay(s: {
  energy: number | null;
  mood: number | null;
  count: number;
}): string {
  if (s.count === 0) return '—';
  const vals = [s.energy, s.mood].filter((v): v is number => typeof v === 'number');
  if (vals.length === 0) return '—';
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return String(Math.round(avg * 100));
}

function conditionSub(s: {
  energy: number | null;
  mood: number | null;
  count: number;
}): string {
  if (s.count === 0) return '아직 기록 없음';
  const parts: string[] = [];
  if (typeof s.energy === 'number') parts.push(`E ${Math.round(s.energy * 100)}`);
  if (typeof s.mood === 'number') parts.push(`M ${Math.round(s.mood * 100)}`);
  return `${parts.join(' · ')} · ${s.count}일`;
}
