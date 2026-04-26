import { useEffect, useMemo, useState } from 'react';
import type { DocSummary } from '@vallista/content-core';
import { listDocs, readDoc } from '../../lib/tauri';
import {
  Button,
  Card,
  CardTitle,
  Eyebrow,
  Mono,
  PageHead,
} from '../../components/atoms/Atoms';
import { DeployDialog } from './DeployDialog';

type Range = '7d' | '30d' | '90d' | 'all';

const RANGES: { id: Range; label: string }[] = [
  { id: '7d', label: '7일' },
  { id: '30d', label: '30일' },
  { id: '90d', label: '90일' },
  { id: 'all', label: '전체' },
];

interface PublishedDoc {
  doc: DocSummary;
  publishedAt: string;
  slug: string;
}

export function Publish() {
  const [docs, setDocs] = useState<DocSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('30d');
  const [deployOpen, setDeployOpen] = useState(false);
  const [enriched, setEnriched] = useState<PublishedDoc[] | null>(null);

  useEffect(() => {
    listDocs()
      .then(setDocs)
      .catch((e: unknown) => setError(String(e)));
  }, []);

  useEffect(() => {
    if (!docs) return;
    const candidates = docs.filter((d) => d.state === 'published');
    if (candidates.length === 0) {
      setEnriched([]);
      return;
    }
    let alive = true;
    Promise.all(
      candidates.map(async (doc) => {
        try {
          const file = await readDoc(doc.path);
          const fm = parseFrontmatter(file.raw);
          const publishedAt = fm.publishedAt ?? doc.updatedAt;
          const slug = fm.slug ?? doc.slug ?? slugFromPath(doc.path);
          return { doc, publishedAt, slug };
        } catch {
          return {
            doc,
            publishedAt: doc.updatedAt,
            slug: doc.slug ?? slugFromPath(doc.path),
          };
        }
      }),
    ).then((rows) => {
      if (alive) setEnriched(rows);
    });
    return () => {
      alive = false;
    };
  }, [docs]);

  const filtered = useMemo(() => filterByRange(enriched ?? [], range), [enriched, range]);
  const series = useMemo(() => buildPublishSeries(filtered, range), [filtered, range]);
  const kpi = useMemo(() => computeKpi(filtered, enriched ?? []), [filtered, enriched]);
  const recentPosts = useMemo(
    () =>
      filtered
        .slice()
        .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
        .slice(0, 8),
    [filtered],
  );

  if (error && !docs) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="발행" sub="docs 읽기 실패" />
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

  if (!docs || enriched === null) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="발행" sub="발행된 글 읽는 중…" />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '32px 48px 80px', maxWidth: 1180, margin: '0 auto' }}>
          <PageHead
            title="발행"
            sub={`vallista.kr · ${rangeLabel(range)}`}
            right={
              <>
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
                  {RANGES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRange(r.id)}
                      style={{
                        padding: '4px 12px',
                        border: 'none',
                        background:
                          range === r.id ? 'var(--bg-shade)' : 'transparent',
                        color: range === r.id ? 'var(--ink)' : 'var(--ink-soft)',
                        fontSize: 11.5,
                        cursor: 'pointer',
                        borderRadius: 4,
                        fontFamily: 'inherit',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <Button sm ghost onClick={() => setDeployOpen(true)}>
                  ↗ 배포
                </Button>
              </>
            }
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <KPI
              label="발행"
              value={String(kpi.publishedCount)}
              unit="편"
              sub={kpi.firstSub}
              tone="ok"
            />
            <KPI
              label="총 단어"
              value={kpi.wordsLabel}
              unit=""
              sub={`평균 ${kpi.wordsAvg.toLocaleString()}자/편`}
              tone="blue"
            />
            <KPI
              label="씨앗"
              value={String(kpi.seedCount)}
              unit="개"
              sub={`작성중 ${kpi.draftCount}편`}
              tone="violet"
            />
            <KPI
              label="발행 주기"
              value={kpi.cadenceValue}
              unit={kpi.cadenceUnit}
              sub={kpi.cadenceSub}
              tone="amber"
            />
          </div>

          <Card padded style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: 14,
              }}
            >
              <div>
                <CardTitle>발행 추이</CardTitle>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 26,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    fontVariantNumeric: 'tabular-nums',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {series.totalPublished.toLocaleString()}
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--ink-soft)',
                      marginLeft: 6,
                    }}
                  >
                    {rangeLabel(range)} 누적
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--ink-mute)' }}>
                <Stat label="피크" value={`${series.peak} ${series.peakUnit}`} />
                <Stat label="평균" value={`${series.avg.toFixed(1)} ${series.peakUnit}`} />
                <Stat
                  label={series.peakUnit === '편/주' ? '주' : '일'}
                  value={`${series.bins.length}`}
                />
              </div>
            </div>
            {series.totalPublished === 0 ? (
              <EmptyChart>{rangeLabel(range)} 동안 발행이 없습니다</EmptyChart>
            ) : (
              <PublishChart series={series} />
            )}
          </Card>

          <Card padded={false} style={{ marginBottom: 20 }}>
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <CardTitle>최근 발행 글</CardTitle>
              <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                총 {filtered.length}편 · 전체 {enriched.length}편
              </Mono>
            </div>
            {recentPosts.length === 0 ? (
              <EmptyChart>{rangeLabel(range)} 동안 발행 없음</EmptyChart>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-soft)' }}>
                    <Th style={{ width: '50%' }}>제목</Th>
                    <Th right>발행</Th>
                    <Th right>단어</Th>
                    <Th right>태그</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentPosts.map((p, i) => (
                    <tr
                      key={p.doc.id}
                      style={{
                        borderBottom:
                          i < recentPosts.length - 1
                            ? '1px solid var(--line-subtle)'
                            : 'none',
                      }}
                    >
                      <td style={{ padding: '12px 18px' }}>
                        <div
                          style={{
                            color: 'var(--ink)',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginBottom: 3,
                          }}
                        >
                          {p.doc.title}
                        </div>
                        <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
                          /{p.slug} · {p.doc.collection}
                        </Mono>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <Mono style={{ color: 'var(--ink-2)' }}>
                          {formatDate(p.publishedAt)}
                        </Mono>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <Mono
                          style={{
                            color: 'var(--ink)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {p.doc.words.toLocaleString()}
                        </Mono>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <Mono
                          style={{
                            fontSize: 10.5,
                            color: 'var(--ink-mute)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'inline-block',
                            maxWidth: 200,
                          }}
                        >
                          {p.doc.tags.length > 0 ? p.doc.tags.slice(0, 3).join(', ') : '—'}
                        </Mono>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card padded>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <Mono style={{ fontSize: 10.5, color: 'var(--blue)', letterSpacing: '0.06em' }}>
                배포 안내
              </Mono>
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--ink)', lineHeight: 1.7 }}>
              <Mono style={{ color: 'var(--blue)' }}>main</Mono> 브랜치로 푸시하면{' '}
              <Mono style={{ color: 'var(--ink)' }}>GitHub Actions</Mono>이 자동으로 빌드·배포합니다.
              로컬에서 <Mono>pnpm run deploy</Mono>를 직접 돌리지 않아도 됩니다.
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <Button sm onClick={() => setDeployOpen(true)}>
                ↗ 배포 다이얼로그
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <DeployDialog open={deployOpen} onClose={() => setDeployOpen(false)} />
    </div>
  );
}

function KPI({
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
  tone: 'ok' | 'blue' | 'violet' | 'amber';
}) {
  const c =
    tone === 'ok'
      ? 'var(--ok)'
      : tone === 'blue'
        ? 'var(--blue)'
        : tone === 'violet'
          ? 'var(--hl-violet)'
          : 'var(--hl-amber)';
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
          fontSize: 26,
          fontWeight: 700,
          color: c,
          letterSpacing: '-0.4px',
          fontVariantNumeric: 'tabular-nums',
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ink-soft)',
            }}
          >
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <Mono
          style={{
            marginTop: 6,
            fontSize: 10.5,
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Mono
        style={{
          fontSize: 9.5,
          color: 'var(--ink-mute)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'block',
          marginBottom: 2,
        }}
      >
        {label}
      </Mono>
      <Mono style={{ fontSize: 13, color: 'var(--ink-2)' }}>{value}</Mono>
    </div>
  );
}

function Th({
  children,
  right,
  style,
}: {
  children?: React.ReactNode;
  right?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={{
        textAlign: right ? 'right' : 'left',
        padding: '10px 18px',
        fontSize: 10.5,
        fontWeight: 500,
        color: 'var(--ink-mute)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        borderBottom: '1px solid var(--line)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </th>
  );
}

function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '32px 0',
        color: 'var(--ink-mute)',
        fontSize: 13,
        fontStyle: 'italic',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}

interface PublishSeries {
  bins: { label: string; count: number }[];
  peak: number;
  peakUnit: string;
  avg: number;
  totalPublished: number;
}

function PublishChart({ series }: { series: PublishSeries }) {
  const W = 1000;
  const H = 140;
  const max = Math.max(1, ...series.bins.map((b) => b.count));
  const barWidth = series.bins.length > 0 ? W / series.bins.length : W;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((p, i) => (
        <line
          key={i}
          x1="0"
          x2={W}
          y1={H * p}
          y2={H * p}
          stroke="var(--line-subtle)"
          strokeWidth="1"
        />
      ))}
      {series.bins.map((b, i) => {
        const h = (b.count / max) * (H - 16);
        const x = i * barWidth + 2;
        const y = H - h - 4;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={Math.max(2, barWidth - 4)}
            height={Math.max(0, h)}
            fill="var(--blue)"
            opacity="0.78"
            rx="1.5"
          />
        );
      })}
    </svg>
  );
}

function filterByRange(rows: PublishedDoc[], range: Range): PublishedDoc[] {
  if (range === 'all') return rows;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = Date.now() - days * 86_400_000;
  return rows.filter((r) => {
    const t = Date.parse(r.publishedAt);
    return Number.isFinite(t) && t >= cutoff;
  });
}

function buildPublishSeries(rows: PublishedDoc[], range: Range): PublishSeries {
  const useWeeks = range === '90d' || range === 'all';
  const totalPublished = rows.length;
  if (useWeeks) {
    const weeks =
      range === '90d' ? 13 : Math.max(1, computeWeeksFor(rows));
    const bins: { label: string; count: number; key: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastMonday = mondayOf(today);
    for (let i = weeks - 1; i >= 0; i--) {
      const d = addDays(lastMonday, -7 * i);
      bins.push({ label: shortDate(d), count: 0, key: isoKey(d) });
    }
    for (const r of rows) {
      const t = Date.parse(r.publishedAt);
      if (!Number.isFinite(t)) continue;
      const m = mondayOf(new Date(t));
      const key = isoKey(m);
      const found = bins.find((b) => b.key === key);
      if (found) found.count += 1;
    }
    const peak = Math.max(0, ...bins.map((b) => b.count));
    const avg = bins.length > 0 ? totalPublished / bins.length : 0;
    return { bins, peak, peakUnit: '편/주', avg, totalPublished };
  }
  const days = range === '7d' ? 7 : 30;
  const bins: { label: string; count: number; key: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(today, -i);
    bins.push({ label: shortDate(d), count: 0, key: isoKey(d) });
  }
  for (const r of rows) {
    const t = Date.parse(r.publishedAt);
    if (!Number.isFinite(t)) continue;
    const key = isoKey(new Date(t));
    const found = bins.find((b) => b.key === key);
    if (found) found.count += 1;
  }
  const peak = Math.max(0, ...bins.map((b) => b.count));
  const avg = bins.length > 0 ? totalPublished / bins.length : 0;
  return { bins, peak, peakUnit: '편/일', avg, totalPublished };
}

function computeWeeksFor(rows: PublishedDoc[]): number {
  if (rows.length === 0) return 1;
  let earliest = Date.now();
  for (const r of rows) {
    const t = Date.parse(r.publishedAt);
    if (Number.isFinite(t) && t < earliest) earliest = t;
  }
  const weeks = Math.ceil((Date.now() - earliest) / (7 * 86_400_000));
  return Math.max(1, Math.min(52, weeks));
}

interface Kpi {
  publishedCount: number;
  seedCount: number;
  draftCount: number;
  wordsLabel: string;
  wordsAvg: number;
  cadenceValue: string;
  cadenceUnit: string;
  cadenceSub: string;
  firstSub: string;
}

function computeKpi(filtered: PublishedDoc[], all: PublishedDoc[]): Kpi {
  const totalWords = filtered.reduce((acc, r) => acc + r.doc.words, 0);
  const wordsAvg =
    filtered.length > 0 ? Math.round(totalWords / filtered.length) : 0;
  const wordsLabel =
    totalWords >= 10000
      ? `${(totalWords / 10000).toFixed(1)}만`
      : totalWords.toLocaleString();
  const sorted = filtered
    .slice()
    .sort((a, b) => (a.publishedAt < b.publishedAt ? -1 : 1));
  let cadenceValue = '—';
  let cadenceUnit = '';
  let cadenceSub = '데이터 부족';
  if (sorted.length >= 2) {
    const first = Date.parse(sorted[0]!.publishedAt);
    const last = Date.parse(sorted[sorted.length - 1]!.publishedAt);
    if (Number.isFinite(first) && Number.isFinite(last) && last > first) {
      const days = (last - first) / 86_400_000;
      const intervals = sorted.length - 1;
      const avgGap = days / intervals;
      cadenceValue = avgGap.toFixed(1);
      cadenceUnit = '일/편';
      cadenceSub = `${sorted.length}편 사이 평균 간격`;
    }
  } else if (sorted.length === 1) {
    cadenceValue = '1';
    cadenceUnit = '편';
    cadenceSub = '한 편만 발행됨';
  }
  const seedCount = all.length === 0 ? 0 : 0;
  return {
    publishedCount: filtered.length,
    seedCount,
    draftCount: 0,
    wordsLabel,
    wordsAvg,
    cadenceValue,
    cadenceUnit,
    cadenceSub,
    firstSub:
      filtered.length === 0
        ? '발행 없음'
        : `최근 ${formatDate(sorted[sorted.length - 1]?.publishedAt ?? '')}`,
  };
}

function rangeLabel(range: Range): string {
  switch (range) {
    case '7d':
      return '지난 7일';
    case '30d':
      return '지난 30일';
    case '90d':
      return '지난 90일';
    case 'all':
      return '전체 기간';
  }
}

function parseFrontmatter(raw: string): { publishedAt?: string; slug?: string } {
  const match = /^---\s*\n([\s\S]*?)\n---\s*\n?/m.exec(raw);
  if (!match) return {};
  const body = match[1] ?? '';
  const out: { publishedAt?: string; slug?: string } = {};
  for (const line of body.split(/\n/)) {
    const m = /^(publishedAt|slug)\s*:\s*(.+?)\s*$/.exec(line);
    if (!m) continue;
    const key = m[1] as 'publishedAt' | 'slug';
    let value = m[2] ?? '';
    value = value.replace(/^["']|["']$/g, '');
    out[key] = value;
  }
  return out;
}

function slugFromPath(p: string): string {
  const last = p.split('/').pop() ?? p;
  return last.replace(/\.(md|mdx)$/, '');
}

function isoKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function shortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function formatDate(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso.slice(0, 10);
  const d = new Date(t);
  return `${d.getFullYear().toString().slice(2)}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
