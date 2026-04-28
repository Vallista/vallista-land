import { useMemo } from 'react';
import type { DocState, DocSummary } from '@vallista/content-core';
import { Eyebrow, Mono } from '../../components/atoms/Atoms';

export type StateFilter = DocState | 'all';
export type FolderFilter = string | null;

interface LibraryItem {
  id: StateFilter;
  label: string;
  icon: string;
  color: string;
}

const LIBRARY: LibraryItem[] = [
  { id: 'all', label: '전부', icon: '◇', color: 'var(--ink-mute)' },
  { id: 'seed', label: '메모', icon: '◦', color: 'var(--ink-mute)' },
  { id: 'sprout', label: '초안', icon: '◐', color: 'var(--blue)' },
  { id: 'draft', label: '교정', icon: '◑', color: 'var(--hl-amber)' },
  { id: 'published', label: '공개', icon: '●', color: 'var(--ok)' },
];

interface FolderRow {
  id: string;
  label: string;
  count: number;
  icon: string;
}

function buildFolders(docs: DocSummary[]): FolderRow[] {
  const map = new Map<string, number>();
  for (const d of docs) {
    const seg = topSegment(d.path);
    if (!seg) continue;
    map.set(seg, (map.get(seg) ?? 0) + 1);
  }
  const out: FolderRow[] = [];
  for (const [id, count] of map.entries()) {
    out.push({ id, label: id, count, icon: iconForFolder(id) });
  }
  return out.sort((a, b) => b.count - a.count);
}

function buildTags(docs: DocSummary[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const d of docs) {
    for (const t of d.tags ?? []) {
      map.set(t, (map.get(t) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export function LibraryRail({
  docs,
  filter,
  folder,
  tag,
  onFilter,
  onFolder,
  onTag,
}: {
  docs: DocSummary[];
  filter: StateFilter;
  folder: FolderFilter;
  tag: string | null;
  onFilter: (f: StateFilter) => void;
  onFolder: (f: FolderFilter) => void;
  onTag: (t: string | null) => void;
}) {
  const stateCounts = useMemo(() => countByState(docs), [docs]);
  const folders = useMemo(() => buildFolders(docs), [docs]);
  const tags = useMemo(() => buildTags(docs), [docs]);
  const sproutCount = docs.filter((d) => d.state === 'sprout').length;

  return (
    <aside
      style={{
        flex: '0 0 192px',
        width: 192,
        borderRight: '1px solid var(--line)',
        background: 'var(--bg-soft)',
        padding: '14px 6px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ padding: '0 10px 8px' }}>
        <Eyebrow>상태</Eyebrow>
      </div>
      {LIBRARY.map((it) => {
        const active = filter === it.id;
        const n = it.id === 'all' ? docs.length : stateCounts[it.id as DocState];
        return (
          <button
            key={it.id}
            onClick={() => onFilter(it.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '5px 10px',
              background: active ? 'var(--bg-shade)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-2)',
              border: 'none',
              borderRadius: 5,
              fontSize: 12.5,
              fontFamily: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 12,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: it.color,
                  textAlign: 'center',
                }}
              >
                {it.icon}
              </span>
              <span>{it.label}</span>
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

      {folders.length > 0 && (
        <>
          <div style={{ padding: '16px 10px 4px' }}>
            <Eyebrow>폴더</Eyebrow>
          </div>
          {folders.map((f) => {
            const active = folder === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onFolder(active ? null : f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '5px 10px',
                  background: active ? 'var(--bg-shade)' : 'transparent',
                  color: active ? 'var(--ink)' : 'var(--ink-2)',
                  border: 'none',
                  borderRadius: 5,
                  fontSize: 12.5,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
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
                    {f.icon}
                  </span>
                  <span style={{ textTransform: 'lowercase' }}>{f.label}</span>
                </span>
                <Mono
                  style={{
                    fontSize: 10.5,
                    color: active ? 'var(--ink-2)' : 'var(--ink-mute)',
                  }}
                >
                  {f.count}
                </Mono>
              </button>
            );
          })}
        </>
      )}

      {tags.length > 0 && (
        <>
          <div style={{ padding: '16px 10px 4px' }}>
            <Eyebrow>태그</Eyebrow>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              padding: '0 10px',
            }}
          >
            {tags.map((t) => {
              const active = tag === t.tag;
              return (
                <button
                  key={t.tag}
                  onClick={() => onTag(active ? null : t.tag)}
                  style={{
                    padding: '2px 8px',
                    border: '1px solid var(--line)',
                    borderRadius: 999,
                    background: active ? 'var(--ink)' : 'transparent',
                    color: active ? 'var(--on-accent)' : 'var(--ink-soft)',
                    fontSize: 10.5,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    lineHeight: 1.3,
                  }}
                  title={`${t.tag} · ${t.count}`}
                >
                  {t.tag}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div style={{ marginTop: 'auto', padding: '14px 10px 0' }}>
        <Eyebrow>작성 중</Eyebrow>
        <div
          style={{
            marginTop: 8,
            padding: '8px 10px',
            background: 'var(--bg)',
            border: '1px dashed var(--line)',
            borderRadius: 6,
            fontSize: 11,
            color: 'var(--ink-soft)',
            lineHeight: 1.5,
          }}
        >
          {sproutCount > 0 ? (
            <>
              <Mono style={{ color: 'var(--blue)' }}>{sproutCount}개</Mono>의
              초안 진행
            </>
          ) : (
            '진행 중인 초안이 없어요'
          )}
        </div>
      </div>
    </aside>
  );
}

function countByState(docs: DocSummary[]): Record<DocState, number> {
  const counts: Record<DocState, number> = {
    seed: 0,
    sprout: 0,
    draft: 0,
    published: 0,
  };
  for (const d of docs) {
    counts[d.state] = (counts[d.state] ?? 0) + 1;
  }
  return counts;
}

function topSegment(p: string): string | null {
  const parts = p.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  return parts[1] ?? null;
}

function iconForFolder(name: string): string {
  if (/people/i.test(name)) return '@';
  if (/article|writing/i.test(name)) return '▤';
  if (/note|daily/i.test(name)) return '◐';
  if (/tech/i.test(name)) return '⌬';
  if (/glean|library/i.test(name)) return '⊞';
  return '·';
}
