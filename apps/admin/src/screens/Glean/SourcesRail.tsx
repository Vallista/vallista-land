import { useCallback, useState } from 'react';
import type { GleanSource } from '@vallista/content-core';
import { Eyebrow, Mono } from '../../components/atoms/Atoms';
import { llmChat, type GleanCounts } from '../../lib/tauri';
import { useLLMWake } from '../../components/LLMWakeModal';

export type SourceFilter = GleanSource | 'all';

const SOURCES: { id: SourceFilter; label: string; icon: string }[] = [
  { id: 'all', label: '모든 소스', icon: '◈' },
  { id: 'web', label: '웹 클립', icon: '◐' },
  { id: 'rss', label: 'RSS', icon: '⌬' },
  { id: 'threads', label: 'Threads', icon: '◎' },
  { id: 'youtube', label: 'YouTube', icon: '▷' },
  { id: 'paste', label: '붙여넣기', icon: '▤' },
];

export function SourcesRail({
  counts,
  source,
  onSource,
  onOpenSubscriptions,
}: {
  counts: GleanCounts | null;
  source: SourceFilter;
  onSource: (s: SourceFilter) => void;
  onOpenSubscriptions?: (tab: 'rss' | 'youtube' | 'threads') => void;
}) {
  const todayRssCount = counts?.todayRssCount ?? 0;
  const todayRssTitles = counts?.todayRssTitles ?? [];

  const wake = useLLMWake();
  const [digest, setDigest] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [llmError, setLlmError] = useState<string | null>(null);

  const summarize = useCallback(async () => {
    if (!todayRssTitles.length || busy) return;
    setDigest(null);
    setLlmError(null);
    await wake.run(async () => {
      setBusy(true);
      try {
        const titles = todayRssTitles.map((t) => `- ${t}`).join('\n');
        const out = await llmChat({
          messages: [
            {
              role: 'system',
              content:
                '오늘 수집된 RSS 헤드라인 목록을 읽고 오늘의 주요 이슈와 트렌드를 한국어로 3~5줄로 요약한다. 각 줄은 "- "로 시작. 부연·인사·메타발화 금지.',
            },
            {
              role: 'user',
              content: `오늘 RSS 헤드라인 (${todayRssTitles.length}개):\n${titles}`,
            },
          ],
          temperature: 0.3,
          maxTokens: 400,
        });
        setDigest(out.trim());
      } catch (e: unknown) {
        setLlmError(String(e));
      } finally {
        setBusy(false);
      }
    });
  }, [todayRssTitles, busy, wake]);

  return (
    <>
    {wake.modal}
    <aside
      style={{
        flex: '0 0 200px',
        borderRight: '1px solid var(--line)',
        background: 'var(--bg-soft)',
        padding: '14px 8px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          padding: '0 10px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Eyebrow>소스</Eyebrow>
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{counts?.total ?? 0}</Mono>
      </div>
      {SOURCES.map((s) => {
        const active = source === s.id;
        const n = s.id === 'all' ? (counts?.total ?? 0) : (counts?.bySource[s.id as GleanSource] ?? 0);
        return (
          <button
            key={s.id}
            onClick={() => onSource(s.id)}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 10px',
              borderRadius: 5,
              border: 'none',
              background: active ? 'var(--bg-shade)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-2)',
              fontSize: 12.5,
              fontFamily: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              marginBottom: 2,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: active ? 'var(--ink)' : 'var(--ink-mute)',
                  textAlign: 'center',
                }}
              >
                {s.icon}
              </span>
              <span>{s.label}</span>
            </span>
            <Mono
              style={{
                fontSize: 10.5,
                color: active ? 'var(--ink-2)' : 'var(--ink-mute)',
              }}
            >
              {n}
            </Mono>
          </button>
        );
      })}

      <div style={{ padding: '20px 10px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow>오늘 RSS</Eyebrow>
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{todayRssCount}</Mono>
      </div>
      <div style={{ padding: '0 6px' }}>
        {todayRssCount === 0 ? (
          <div style={{ padding: '6px 10px', fontSize: 11.5, color: 'var(--ink-mute)', fontStyle: 'italic' }}>
            오늘 수집된 RSS 없음
          </div>
        ) : (
          <>
            <button
              onClick={() => void summarize()}
              disabled={busy || todayRssCount === 0}
              style={{
                width: '100%',
                padding: '7px 10px',
                background: busy ? 'var(--bg-shade)' : 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                color: busy ? 'var(--ink-mute)' : 'var(--blue)',
                fontSize: 11.5,
                fontFamily: 'inherit',
                cursor: busy ? 'default' : 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Mono style={{ fontSize: 11 }}>✦</Mono>
              {busy ? '요약 중…' : digest ? '다시 요약' : 'AI 요약'}
            </button>
            {llmError && (
              <div style={{ marginTop: 6, padding: '6px 8px', fontSize: 10.5, color: 'var(--err)', fontFamily: 'var(--font-mono)', border: '1px solid var(--err-soft)', borderRadius: 5, background: 'var(--err-soft)' }}>
                {llmError}
              </div>
            )}
            {digest && (
              <div
                style={{
                  marginTop: 6,
                  padding: '8px 10px',
                  background: 'var(--bg)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  fontSize: 11.5,
                  color: 'var(--ink)',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-line',
                }}
              >
                {digest}
              </div>
            )}
          </>
        )}
      </div>

      {onOpenSubscriptions && (
        <div style={{ marginTop: 'auto', padding: '16px 10px 0' }}>
          <button
            onClick={() => onOpenSubscriptions('rss')}
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              color: 'var(--ink-2)',
              fontSize: 11.5,
              fontFamily: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
              ⊕
            </span>
            구독 관리
          </button>
        </div>
      )}
    </aside>
    </>
  );
}

