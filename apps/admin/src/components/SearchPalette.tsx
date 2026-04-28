import { useEffect, useMemo, useRef, useState } from 'react';
import type { DocSummary, GleanItem, Task } from '@vallista/content-core';
import { listDocs, listGlean, listTasks } from '../lib/tauri';
import { Input, Mono } from './atoms/Atoms';
import type { ScreenId } from '../shell/Shell';

type Hit =
  | { kind: 'doc'; id: string; title: string; sub: string; tags: string[]; doc: DocSummary }
  | { kind: 'task'; id: string; title: string; sub: string; task: Task }
  | { kind: 'glean'; id: string; title: string; sub: string; item: GleanItem }
  | { kind: 'screen'; id: ScreenId; title: string; sub: string };

const SCREEN_HITS: Hit[] = [
  { kind: 'screen', id: 'today', title: '오늘', sub: '하루 흐름·할 일·컨디션' },
  { kind: 'screen', id: 'thoughts', title: '생각', sub: '짧게 끄적이는 것들' },
  { kind: 'screen', id: 'plan', title: '할 일', sub: '캘린더·인박스' },
  { kind: 'screen', id: 'glean', title: '줍기', sub: '캡처한 글들' },
  { kind: 'screen', id: 'atelier', title: '글방', sub: '글 쓰기/편집' },
  { kind: 'screen', id: 'publish', title: '발행', sub: '발행 추이·배포' },
  { kind: 'screen', id: 'insights', title: '돌아보기', sub: '주간 회고' },
];

export function SearchPalette({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (id: ScreenId) => void;
}) {
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [glean, setGlean] = useState<GleanItem[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    Promise.all([
      listDocs().catch(() => [] as DocSummary[]),
      listTasks().catch(() => [] as Task[]),
      listGlean().catch(() => [] as GleanItem[]),
    ]).then(([d, t, g]) => {
      setDocs(d);
      setTasks(t);
      setGlean(g);
    });
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    const screenHits: Hit[] = SCREEN_HITS.filter(
      (h) => !q || h.title.toLowerCase().includes(q) || h.sub.toLowerCase().includes(q),
    );
    if (!q) {
      return [
        ...screenHits,
        ...tasks
          .filter((t) => !t.done)
          .slice(0, 5)
          .map<Hit>((t) => ({
            kind: 'task',
            id: t.id,
            title: t.title,
            sub: t.due ? `due ${t.due.slice(0, 10)}` : '할 일',
            task: t,
          })),
        ...docs
          .slice(0, 8)
          .map<Hit>((d) => ({
            kind: 'doc',
            id: d.id,
            title: d.title,
            sub: `${d.collection} · ${d.state}`,
            tags: d.tags,
            doc: d,
          })),
      ];
    }
    const docHits: Hit[] = docs
      .filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          d.path.toLowerCase().includes(q),
      )
      .slice(0, 12)
      .map((d) => ({
        kind: 'doc',
        id: d.id,
        title: d.title,
        sub: `${d.collection} · ${d.state}`,
        tags: d.tags,
        doc: d,
      }));
    const taskHits: Hit[] = tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, 8)
      .map((t) => ({
        kind: 'task',
        id: t.id,
        title: t.title,
        sub: t.done ? '완료' : t.due ? `due ${t.due.slice(0, 10)}` : '할 일',
        task: t,
      }));
    const gleanHits: Hit[] = glean
      .filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          (g.url ?? '').toLowerCase().includes(q) ||
          (g.excerpt ?? '').toLowerCase().includes(q),
      )
      .slice(0, 8)
      .map((g) => ({
        kind: 'glean',
        id: g.id,
        title: g.title || '(제목 없음)',
        sub: hostname(g.url) + ' · ' + g.source,
        item: g,
      }));
    return [...screenHits, ...docHits, ...taskHits, ...gleanHits];
  }, [query, docs, tasks, glean]);

  useEffect(() => {
    if (active >= hits.length) setActive(0);
  }, [hits, active]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(hits.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const hit = hits[active];
        if (hit) commit(hit);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, hits, active]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLLIElement>(`[data-idx="${active}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const commit = (hit: Hit) => {
    if (hit.kind === 'screen') {
      onNavigate(hit.id);
    } else if (hit.kind === 'task') {
      onNavigate('plan');
    } else if (hit.kind === 'glean') {
      onNavigate('glean');
    } else if (hit.kind === 'doc') {
      onNavigate('atelier');
    }
    onClose();
  };

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,18,22,0.42)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '14vh',
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 92vw)',
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.32)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="7" cy="7" r="5" stroke="var(--ink-mute)" strokeWidth="1.4" />
            <path d="M11 11 14 14" stroke="var(--ink-mute)" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색 — 노트 · 할일 · 클립 · 화면"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: 0,
              fontSize: 14,
              borderRadius: 0,
            }}
          />
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>esc</Mono>
        </div>
        <ul
          ref={listRef}
          style={{
            margin: 0,
            padding: 4,
            listStyle: 'none',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {hits.length === 0 ? (
            <li
              style={{
                padding: '24px 16px',
                color: 'var(--ink-mute)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              일치하는 항목이 없습니다.
            </li>
          ) : (
            hits.map((h, i) => (
              <li
                key={`${h.kind}-${h.id}-${i}`}
                data-idx={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(h)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: i === active ? 'var(--bg-shade)' : 'transparent',
                }}
              >
                <KindBadge kind={h.kind} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {h.title}
                  </div>
                  <Mono
                    style={{
                      fontSize: 10.5,
                      color: 'var(--ink-mute)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      marginTop: 1,
                    }}
                  >
                    {h.sub}
                  </Mono>
                </div>
              </li>
            ))
          )}
        </ul>
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--ink-mute)',
            display: 'flex',
            gap: 14,
          }}
        >
          <span>↑↓ 이동</span>
          <span>↵ 선택</span>
          <span>esc 닫기</span>
        </div>
      </div>
    </div>
  );
}

function KindBadge({ kind }: { kind: Hit['kind'] }) {
  const label =
    kind === 'screen'
      ? '화면'
      : kind === 'task'
        ? '할일'
        : kind === 'glean'
          ? '클립'
          : '문서';
  const color =
    kind === 'task'
      ? 'var(--blue)'
      : kind === 'glean'
        ? 'var(--hl-violet)'
        : kind === 'doc'
          ? 'var(--ink-2)'
          : 'var(--ok)';
  return (
    <span
      style={{
        minWidth: 32,
        textAlign: 'center',
        padding: '2px 6px',
        borderRadius: 4,
        background: 'var(--bg-shade)',
        color,
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </span>
  );
}

function hostname(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
