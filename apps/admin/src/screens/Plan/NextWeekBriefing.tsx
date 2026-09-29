import { useMemo, useState } from 'react';
import type { Block } from '@vallista/content-core';
import { llmChat } from '../../lib/tauri';
import { resolveLabel } from './labelCatalog';

interface Props {
  blocks: Block[];
  now: Date;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function isoKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function mondayOfNextWeek(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? 1 : 8 - dow));
  return d;
}

export function NextWeekBriefing({ blocks, now }: Props) {
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { start, end, dateKeys } = useMemo(() => {
    const monday = mondayOfNextWeek(now);
    const friday = addDays(monday, 4);
    const keys: string[] = [];
    for (let i = 0; i < 5; i++) keys.push(isoKey(addDays(monday, i)));
    return { start: isoKey(monday), end: isoKey(friday), dateKeys: keys };
  }, [now]);

  const grouped = useMemo(() => {
    const filtered = blocks.filter((b) => b.date >= start && b.date <= end);
    return dateKeys
      .map((date) => ({
        date,
        blocks: filtered.filter((b) => b.date === date).sort((a, b) => a.start.localeCompare(b.start)),
      }))
      .filter((g) => g.blocks.length > 0);
  }, [blocks, start, end, dateKeys]);

  const allBlocks = useMemo(() => grouped.flatMap((g) => g.blocks), [grouped]);

  async function handleGenerate() {
    if (!allBlocks.length) return;
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const eventList = allBlocks
        .map((b) => {
          let line = `- ${b.date} ${b.start}~${b.end} [${b.kind}] ${b.title}`;
          if (b.location) line += ` (장소: ${b.location})`;
          if (b.attendees?.length) line += ` (참석: ${b.attendees.join(', ')})`;
          if (b.notes) line += ` (메모: ${b.notes})`;
          return line;
        })
        .join('\n');

      const text = await llmChat({
        messages: [
          {
            role: 'system',
            content:
              '당신은 주간 일정 준비를 돕는 어시스턴트입니다. 다음 주 일정 목록을 보고 각 일정별로 사전 준비사항을 간결하게 제안하세요. 형식: "- [일정명] → 준비사항" (한국어). 준비가 특별히 필요 없는 루틴·식사·건강 등은 생략해도 됩니다.',
          },
          {
            role: 'user',
            content: `다음 주 일정:\n${eventList}\n\n각 일정별 준비사항을 제안해주세요.`,
          },
        ],
        temperature: 0.7,
        maxTokens: 512,
      });
      setSuggestions(text.trim());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px 24px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>차주 브리핑</span>
        <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
          {start} ~ {end}
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={handleGenerate}
          disabled={loading || allBlocks.length === 0}
          style={{
            padding: '5px 12px',
            border: '1px solid var(--line)',
            borderRadius: 6,
            background: 'var(--bg-shade)',
            color: 'var(--ink)',
            fontSize: 12,
            cursor: loading || allBlocks.length === 0 ? 'default' : 'pointer',
            opacity: loading || allBlocks.length === 0 ? 0.5 : 1,
            fontFamily: 'inherit',
          }}
        >
          {loading ? '생성 중…' : '✦ 준비사항 제안'}
        </button>
      </div>

      {/* 일정 목록 */}
      {grouped.length === 0 ? (
        <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>
          다음 주 일정이 없습니다. 캘린더 동기화를 먼저 해주세요.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {grouped.map((group) => {
            const d = new Date(group.date + 'T00:00:00');
            return (
              <div key={group.date}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--ink-mute)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {group.date.slice(5).replace('-', '/')} {DAY_LABELS[d.getDay()]}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {group.blocks.map((block) => (
                    <div
                      key={block.id}
                      style={{
                        padding: '8px 12px',
                        background: 'var(--bg-shade)',
                        borderRadius: 6,
                        border: '1px solid var(--line)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--ink-mute)',
                          marginTop: 2,
                          minWidth: 88,
                          flexShrink: 0,
                        }}
                      >
                        {block.start}~{block.end}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            color: 'var(--ink)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {block.title}
                        </div>
                        {(block.location || (block.attendees?.length ?? 0) > 0) && (
                          <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                            {block.location && <span>{block.location}</span>}
                            {block.location && (block.attendees?.length ?? 0) > 0 && <span> · </span>}
                            {(block.attendees?.length ?? 0) > 0 && (
                              <span>{block.attendees.join(', ')}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          background: 'var(--bg)',
                          border: '1px solid var(--line)',
                          borderRadius: 4,
                          color: 'var(--ink-soft)',
                          flexShrink: 0,
                        }}
                      >
                        {resolveLabel(block.kind, block.color).name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LLM 준비사항 */}
      {(suggestions || error) && (
        <div
          style={{
            marginTop: 24,
            padding: '14px 16px',
            background: 'var(--bg-shade)',
            border: '1px solid var(--line)',
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-mute)', marginBottom: 10 }}>
            ✦ 준비사항 제안
          </div>
          {error ? (
            <p style={{ color: 'var(--red, #e74c3c)', fontSize: 13, margin: 0 }}>{error}</p>
          ) : (
            <pre
              style={{
                fontSize: 13,
                color: 'var(--ink)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                margin: 0,
                lineHeight: 1.75,
              }}
            >
              {suggestions}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
