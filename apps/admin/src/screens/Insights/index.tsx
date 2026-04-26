import { useEffect, useState } from 'react';
import { computeInsights } from '../../lib/tauri';
import type { Insights as InsightsData } from '../../lib/tauri';
import { Mono, PageHead } from '../../components/atoms/Atoms';
import { StateBar } from './StateBar';
import { DocSection } from './DocSection';
import { TagCloud } from './TagCloud';
import { HubList } from './HubList';

export function Insights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await computeInsights();
      setData(d);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

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

  if (!data) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="돌아보기" sub="vault 스캔 중…" />
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 48px 48px', maxWidth: 1040, margin: '0 auto' }}>
      <PageHead
        title="돌아보기"
        sub={`${data.total}개 노트의 패턴 — 상태 · 연결 · 흩어짐 · 자라남`}
        right={
          <button
            onClick={refresh}
            disabled={loading}
            style={{
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink-soft)',
              fontSize: 11.5,
              padding: '4px 10px',
              borderRadius: 6,
              cursor: loading ? 'wait' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {loading ? '…' : '다시 계산'}
          </button>
        }
      />

      <StateBar counts={data.stateCounts} total={data.total} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 18,
          marginTop: 24,
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
        <Section title="태그 클러스터" subtitle={`상위 ${data.tagCounts.length}개 태그`}>
          <TagCloud tags={data.tagCounts} />
        </Section>
      </div>

      <Section
        title="최근 업데이트"
        subtitle="가장 최근에 손이 닿은 노트"
        style={{ marginTop: 24 }}
      >
        <DocList docs={data.recentUpdates} />
      </Section>
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
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{subtitle}</Mono>
          )}
        </div>
      </header>
      {children}
    </section>
  );
}

function DocList({ docs }: { docs: { id: string; title: string; path: string; state: string; updatedAt: string }[] }) {
  if (docs.length === 0) {
    return (
      <div
        style={{
          padding: '24px 0',
          color: 'var(--ink-mute)',
          fontSize: 13,
          fontStyle: 'italic',
          textAlign: 'center',
        }}
      >
        없음
      </div>
    );
  }
  return (
    <div>
      {docs.map((d) => (
        <div
          key={d.id || d.path}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 4px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 13,
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={d.path}
          >
            {d.title || d.path}
          </span>
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{stateLabel(d.state)}</Mono>
          <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>{formatRel(d.updatedAt)}</Mono>
        </div>
      ))}
    </div>
  );
}

function stateLabel(state: string): string {
  if (state === 'seed') return '씨앗';
  if (state === 'sprout') return '새싹';
  if (state === 'draft') return '초안';
  if (state === 'published') return '공개';
  return state;
}

function formatRel(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '방금';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
