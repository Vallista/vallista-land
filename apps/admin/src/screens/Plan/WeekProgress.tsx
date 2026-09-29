import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Block } from '@vallista/content-core';
import { listBlocksInRange } from '../../lib/tauri';
import {
  buildWeekLabelStats,
  buildWeekProgress,
  diffMin,
  fmtMin,
  type LabelStat,
} from '../../lib/timeStats';
import { LABELS_CHANGED_EVENT } from './labelCatalog';
import { filterStatsBlocks, STATS_EXCLUDED_EVENT } from './blockMeta';
import { Eyebrow, Mono } from '../../components/atoms/Atoms';

const ACTIVE_START_KEY = 'bento.plan.activeStart';
const ACTIVE_END_KEY = 'bento.plan.activeEnd';
const EXCLUDED_CALS_KEY = 'bento.plan.excludedCalendars';
const EXCLUDE_EXT_KEY = 'bento.plan.statsExcludeExternal';

function readExcludedCals(): Set<string> {
  try {
    const raw = window.localStorage.getItem(EXCLUDED_CALS_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function readExcludeExternal(): boolean {
  return window.localStorage.getItem(EXCLUDE_EXT_KEY) === 'true';
}

function readDailyBudgetMin(): number {
  if (typeof window === 'undefined') return 720;
  const s = window.localStorage.getItem(ACTIVE_START_KEY) ?? '09:00';
  const e = window.localStorage.getItem(ACTIVE_END_KEY) ?? '21:00';
  return Math.max(0, diffMin(s, e) ?? 0);
}

interface Props {
  now: Date;
}

export function WeekProgress({ now }: Props) {
  const range = useMemo(() => weekRange(now), [now]);
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [dailyBudgetMin, setDailyBudgetMin] = useState(readDailyBudgetMin);
  const [excludedCalendars, setExcludedCalendars] = useState<Set<string>>(() => readExcludedCals());
  const [excludeExternal, setExcludeExternal] = useState(readExcludeExternal);

  const refresh = useCallback(() => {
    listBlocksInRange(range.startKey, range.endKey)
      .then(setBlocks)
      .catch(() => setBlocks([]));
  }, [range.startKey, range.endKey]);

  useEffect(() => {
    refresh();
    const onChanged = () => refresh();
    window.addEventListener('bento:blocks-changed', onChanged);
    window.addEventListener('bento:ical-synced', onChanged);
    return () => {
      window.removeEventListener('bento:blocks-changed', onChanged);
      window.removeEventListener('bento:ical-synced', onChanged);
    };
  }, [refresh]);

  useEffect(() => {
    const onBudget = () => setDailyBudgetMin(readDailyBudgetMin());
    window.addEventListener('bento:budget-changed', onBudget);
    window.addEventListener('storage', onBudget);
    return () => {
      window.removeEventListener('bento:budget-changed', onBudget);
      window.removeEventListener('storage', onBudget);
    };
  }, []);

  useEffect(() => {
    const onFilterChanged = () => setExcludedCalendars(readExcludedCals());
    window.addEventListener('bento:calendar-filter-changed', onFilterChanged);
    return () => window.removeEventListener('bento:calendar-filter-changed', onFilterChanged);
  }, []);

  const toggleExcludeExternal = () => {
    setExcludeExternal((prev) => {
      const next = !prev;
      window.localStorage.setItem(EXCLUDE_EXT_KEY, String(next));
      return next;
    });
  };

  const filteredBlocks = useMemo(
    () =>
      (blocks ?? []).filter((b) => {
        if (b.calendarName && excludedCalendars.has(b.calendarName)) return false;
        if (excludeExternal && b.source !== 'local') return false;
        return true;
      }),
    [blocks, excludedCalendars, excludeExternal],
  );

  const [labelVersion, setLabelVersion] = useState(0);
  const [statsExcludedVersion, setStatsExcludedVersion] = useState(0);

  useEffect(() => {
    const onLabels = () => setLabelVersion((v) => v + 1);
    window.addEventListener(LABELS_CHANGED_EVENT, onLabels);
    return () => window.removeEventListener(LABELS_CHANGED_EVENT, onLabels);
  }, []);

  useEffect(() => {
    const onChanged = () => setStatsExcludedVersion((v) => v + 1);
    window.addEventListener(STATS_EXCLUDED_EVENT, onChanged);
    return () => window.removeEventListener(STATS_EXCLUDED_EVENT, onChanged);
  }, []);

  const statsBlocks = useMemo(
    () => filterStatsBlocks(filteredBlocks),
    // statsExcludedVersion forces recompute when exclusion list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredBlocks, statsExcludedVersion],
  );

  const stats = useMemo(
    () => buildWeekProgress(statsBlocks, range.startKey, range.endKey),
    [statsBlocks, range],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const labelStats = useMemo(
    () => buildWeekLabelStats(statsBlocks, range.startKey, range.endKey),
    [statsBlocks, range, labelVersion],
  );

  const weekBudgetMin = dailyBudgetMin * 7;
  const budgetRef = Math.max(weekBudgetMin, stats.plannedMin, 1);
  const plannedPct = Math.min(100, (stats.plannedMin / budgetRef) * 100);
  const donePct = Math.min(100, (stats.doneMin / budgetRef) * 100);

  const loading = blocks === null;
  const empty = !loading && stats.totalCount === 0;
  const topLabels: LabelStat[] = labelStats.slice(0, 6);
  const maxLabelMin = topLabels[0]?.plannedMin ?? 0;

  return (
    <div
      style={{
        padding: '14px 18px 14px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg-soft)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <Eyebrow>이번 주 진행</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={toggleExcludeExternal}
            title={excludeExternal ? '외부 일정 제외 중 (클릭하면 포함)' : '외부 일정 포함 중 (클릭하면 제외)'}
            style={{
              border: `1px solid ${excludeExternal ? 'var(--blue)' : 'var(--line)'}`,
              borderRadius: 3,
              background: excludeExternal ? 'var(--blue)' : 'transparent',
              color: excludeExternal ? 'var(--bg)' : 'var(--ink-mute)',
              fontSize: 9.5,
              padding: '1px 5px',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.5,
            }}
          >
            외부 제외
          </button>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
            {loading
              ? '…'
              : empty
                ? '0'
                : `${stats.doneCount}/${stats.totalCount}`}
          </Mono>
        </div>
      </div>

      {loading ? (
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>읽는 중…</Mono>
      ) : empty ? (
        <Mono
          style={{
            fontSize: 11.5,
            color: 'var(--ink-mute)',
            fontStyle: 'italic',
          }}
        >
          이번 주 블록 없음
        </Mono>
      ) : (
        <>
          {/* 숫자 요약 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 6,
              marginBottom: 6,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--ok)',
                letterSpacing: '-0.3px',
                lineHeight: 1.1,
              }}
            >
              {fmtMin(stats.doneMin)}
            </span>
            <Mono style={{ fontSize: 10.5, color: 'var(--blue)' }}>
              / {fmtMin(stats.plannedMin)}
            </Mono>
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              · {fmtMin(weekBudgetMin)}
            </Mono>
          </div>

          {/* 3단계 바: 회색 배경 → 파란 계획 → 초록 완료 */}
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--bg-shade)',
              overflow: 'hidden',
              marginBottom: 12,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${plannedPct}%`,
                height: '100%',
                background: 'var(--blue)',
                opacity: 0.45,
                transition: 'width 200ms',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: `${donePct}%`,
                height: '100%',
                background: 'var(--ok)',
                transition: 'width 200ms',
              }}
            />
          </div>

          {/* 태그 섹션 헤더: 주 예산 설명 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
            }}
          >
            <Mono style={{ fontSize: 9.5, color: 'var(--ink-faint)', flexShrink: 0 }}>
              주 예산
            </Mono>
            <div style={{ flex: 1, height: 1, background: 'var(--line-subtle)' }} />
            <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)', flexShrink: 0 }}>
              {fmtMin(dailyBudgetMin)}/일 × 7 = {fmtMin(weekBudgetMin)}
            </Mono>
          </div>

          {/* 라벨별 행 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {topLabels.map((l) => {
              const widthPct =
                maxLabelMin > 0 ? (l.plannedMin / maxLabelMin) * 100 : 0;
              const doneRatio =
                l.plannedMin > 0 ? Math.min(1, l.doneMin / l.plannedMin) : 0;
              return (
                <div
                  key={l.labelId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) 60px auto',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: l.color,
                        flex: '0 0 6px',
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11.5,
                        color: 'var(--ink-soft)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {l.name}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: 'var(--bg-shade)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${widthPct}%`,
                        background: l.color,
                        opacity: 0.28,
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${widthPct * doneRatio}%`,
                        background: l.color,
                        opacity: 0.9,
                      }}
                    />
                  </div>
                  <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', whiteSpace: 'nowrap' }}>
                    {fmtMin(l.plannedMin)}
                  </Mono>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function weekRange(now: Date): { startKey: string; endKey: string } {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return {
    startKey: isoKey(monday),
    endKey: isoKey(sunday),
  };
}

function isoKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
