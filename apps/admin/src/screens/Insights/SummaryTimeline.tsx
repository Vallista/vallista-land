import { useEffect, useState } from 'react';
import type { Summary } from '@vallista/content-core';
import { listSummaries, markSummaryRead } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

function periodLabel(kind: string, period: string): string {
  if (kind === 'monthly') {
    const m = /^(\d{4})-(\d{2})$/.exec(period);
    if (m) return `${m[1]}년 ${Number(m[2])}월`;
    return period;
  }
  // "2026-W18"
  const m = /^(\d{4})-W(\d{1,2})$/.exec(period);
  if (m) return `${m[1]}년 ${Number(m[2])}주차`;
  return period;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86_400_000);
  if (d === 0) return '오늘';
  if (d === 1) return '어제';
  if (d < 7) return `${d}일 전`;
  if (d < 30) return `${Math.floor(d / 7)}주 전`;
  if (d < 365) return `${Math.floor(d / 30)}달 전`;
  return `${Math.floor(d / 365)}년 전`;
}

function firstLine(text: string, maxLen = 90): string {
  const line = text.split('\n').find((l) => l.trim().length > 0) ?? '';
  return line.length > maxLen ? line.slice(0, maxLen) + '…' : line;
}

export function SummaryTimeline() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listSummaries()
      .then((s) => {
        if (alive) setSummaries(s);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        const s = summaries.find((x) => x.id === id);
        if (s && !s.readAt) {
          markSummaryRead(id)
            .then((updated) => setSummaries((prev) => prev.map((x) => (x.id === id ? updated : x))))
            .catch(() => {});
        }
      }
      return next;
    });
  };

  if (loading && summaries.length === 0) {
    return <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>불러오는 중…</Mono>;
  }

  if (!loading && summaries.length === 0) {
    return (
      <div style={{ color: 'var(--ink-mute)', fontSize: 13, padding: '16px 0', fontStyle: 'italic' }}>
        아직 생성된 회고가 없습니다. 주간·월간 회고를 먼저 생성해 보세요.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 22 }}>
      {/* 세로 타임라인 선 */}
      <div
        style={{
          position: 'absolute',
          left: 7,
          top: 6,
          bottom: 20,
          width: 1,
          background: 'var(--line)',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {summaries.map((s) => {
          const isOpen = expanded.has(s.id);
          const isMonthly = s.kind === 'monthly';
          const accent = isMonthly ? 'var(--ok)' : 'var(--blue)';
          const kindText = isMonthly ? '월간' : '주간';

          return (
            <div key={s.id} style={{ position: 'relative' }}>
              {/* 점 마커 */}
              <div
                style={{
                  position: 'absolute',
                  left: -22 + 3,
                  top: 14,
                  width: isMonthly ? 11 : 9,
                  height: isMonthly ? 11 : 9,
                  borderRadius: '50%',
                  background: accent,
                  border: '2px solid var(--bg)',
                  boxShadow: `0 0 0 1.5px ${accent}`,
                  zIndex: 1,
                }}
              />

              <div
                role="button"
                tabIndex={0}
                onClick={() => toggle(s.id)}
                onKeyDown={(e) => e.key === 'Enter' && toggle(s.id)}
                style={{
                  cursor: 'pointer',
                  padding: '13px 16px',
                  border: '1px solid var(--line)',
                  borderLeft: `3px solid ${accent}`,
                  borderRadius: 8,
                  background: 'var(--bg)',
                  transition: 'background 0.1s',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-soft)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg)';
                }}
              >
                {/* 헤더 행 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: isOpen ? 0 : 5,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: '0.07em',
                      textTransform: 'uppercase',
                      color: accent,
                      padding: '2px 6px',
                      border: `1px solid ${accent}`,
                      borderRadius: 999,
                      lineHeight: 1.6,
                    }}
                  >
                    {kindText}
                  </span>

                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    {periodLabel(s.kind, s.period)}
                  </span>

                  {!s.readAt && (
                    <span
                      title="읽지 않음"
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--hl-rose)',
                        flexShrink: 0,
                      }}
                    />
                  )}

                  {s.model && (
                    <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>{s.model}</Mono>
                  )}

                  <span style={{ flex: 1 }} />

                  <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
                    {relativeTime(s.generatedAt)}
                  </Mono>

                  <span
                    style={{
                      fontSize: 9,
                      color: 'var(--ink-mute)',
                      marginLeft: 6,
                      transform: isOpen ? 'rotate(180deg)' : 'none',
                      display: 'inline-block',
                      transition: 'transform 0.15s',
                    }}
                  >
                    ▼
                  </span>
                </div>

                {/* 접힌 상태: 첫 줄 미리보기 */}
                {!isOpen && (
                  <Mono
                    style={{
                      fontSize: 11.5,
                      color: 'var(--ink-mute)',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {firstLine(s.text)}
                  </Mono>
                )}

                {/* 펼친 상태: 전체 텍스트 */}
                {isOpen && (
                  <div
                    className="psm-selectable"
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px solid var(--line)',
                      fontSize: 13.5,
                      color: 'var(--ink)',
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {s.text}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
