import { useMemo } from 'react';
import type { GleanItem, GleanSource } from '@vallista/content-core';
import { Eyebrow, Mono } from '../../components/atoms/Atoms';

export type SourceFilter = GleanSource | 'all';

const SOURCES: { id: SourceFilter; label: string; icon: string }[] = [
  { id: 'all', label: '모든 소스', icon: '◈' },
  { id: 'web', label: '웹 클립', icon: '◐' },
  { id: 'rss', label: 'RSS', icon: '⌬' },
  { id: 'youtube', label: 'YouTube', icon: '▷' },
  { id: 'paste', label: '붙여넣기', icon: '▤' },
];

export function SourcesRail({
  items,
  source,
  onSource,
  onOpenRss,
}: {
  items: GleanItem[];
  source: SourceFilter;
  onSource: (s: SourceFilter) => void;
  onOpenRss?: () => void;
}) {
  const counts = useMemo(() => {
    const c: Record<GleanSource, number> = { web: 0, rss: 0, youtube: 0, paste: 0 };
    for (const it of items) {
      c[it.source] = (c[it.source] ?? 0) + 1;
    }
    return c;
  }, [items]);

  const seeds = useMemo(() => trendingKeywords(items).slice(0, 5), [items]);

  return (
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
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
          {items.length}
        </Mono>
      </div>
      {SOURCES.map((s) => {
        const active = source === s.id;
        const n = s.id === 'all' ? items.length : counts[s.id as GleanSource];
        return (
          <button
            key={s.id}
            onClick={() => onSource(s.id)}
            style={{
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

      {seeds.length > 0 && (
        <>
          <div style={{ padding: '20px 10px 8px' }}>
            <Eyebrow>반복 키워드</Eyebrow>
          </div>
          <div
            style={{
              padding: '0 6px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {seeds.map((s) => (
              <div
                key={s.word}
                style={{
                  padding: '8px 10px',
                  borderRadius: 5,
                  border: '1px dashed var(--line)',
                  background: 'var(--bg)',
                  fontSize: 11.5,
                  color: 'var(--ink-2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      color: 'var(--blue)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    ✦
                  </span>
                  <span
                    style={{
                      flex: 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={s.word}
                  >
                    {s.word}
                  </span>
                  <Mono style={{ fontSize: 10, color: 'var(--blue)' }}>
                    ×{s.count}
                  </Mono>
                </div>
                <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                  {s.lastWhen}
                </Mono>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 'auto', padding: '16px 10px 0' }}>
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: 'var(--ok)',
              }}
            />
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-2)' }}>로컬 vault</Mono>
            <span style={{ flex: 1 }} />
          </div>
          <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>
            RSS 구독 + 수동 추가
          </Mono>
          {onOpenRss && (
            <button
              onClick={onOpenRss}
              style={{
                marginTop: 4,
                padding: '6px 10px',
                background: 'var(--bg-soft)',
                border: '1px solid var(--line)',
                borderRadius: 5,
                color: 'var(--ink-2)',
                fontSize: 11,
                fontFamily: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue)' }}>⌬</span>
              RSS 구독 관리
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function trendingKeywords(
  items: GleanItem[],
): { word: string; count: number; lastWhen: string }[] {
  const stop = STOPWORDS;
  const map = new Map<string, { count: number; lastIso: string }>();
  for (const it of items) {
    const titleWords = tokenize(it.title);
    for (const w of titleWords) {
      if (w.length < 3) continue;
      if (stop.has(w)) continue;
      const cur = map.get(w);
      if (cur) {
        cur.count += 1;
        if (it.fetchedAt > cur.lastIso) cur.lastIso = it.fetchedAt;
      } else {
        map.set(w, { count: 1, lastIso: it.fetchedAt });
      }
    }
  }
  const out = Array.from(map.entries())
    .map(([word, { count, lastIso }]) => ({
      word,
      count,
      lastWhen: relTime(lastIso),
    }))
    .filter((x) => x.count >= 2);
  out.sort((a, b) => b.count - a.count);
  return out;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, ' ')
    .split(/\s+/)
    .filter((x) => x.length > 0);
}

const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'this',
  'that',
  'from',
  'into',
  'about',
  'using',
  'how',
  'why',
  'what',
  'when',
  '있는',
  '없는',
  '있다',
  '없다',
  '대한',
  '관한',
  '통한',
  '위한',
]);

function relTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return '';
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${Math.max(1, min)}분 전`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}시간 전`;
  const day = Math.floor(hour / 24);
  if (day < 30) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
