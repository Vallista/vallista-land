import { useCallback, useEffect, useMemo, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import type { GleanItem, GleanStatus } from '@vallista/content-core';
import { listGlean } from '../../lib/tauri';
import { PageHead } from '../../components/atoms/Atoms';
import { GleanList } from './GleanList';
import { GleanDetail } from './GleanDetail';
import { SourcesRail, type SourceFilter } from './SourcesRail';
import { RssDialog } from './RssDialog';

export type StatusFilter = GleanStatus | 'all';

export function Glean() {
  const [items, setItems] = useState<GleanItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rssOpen, setRssOpen] = useState(false);

  const refresh = useCallback(() => {
    listGlean()
      .then(setItems)
      .catch((e: unknown) => setError(String(e)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    let unlisten: (() => void) | null = null;
    listen('bento:rss-synced', () => {
      refresh();
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [refresh]);

  const filtered = useMemo(() => {
    if (!items) return [];
    let out = items;
    if (filter !== 'all') out = out.filter((i) => i.status === filter);
    if (source !== 'all') out = out.filter((i) => i.source === source);
    return out;
  }, [items, filter, source]);

  const selected = useMemo(
    () => filtered.find((i) => i.id === selectedId) ?? null,
    [filtered, selectedId],
  );

  const upsertItem = useCallback((item: GleanItem) => {
    setItems((prev) => {
      if (!prev) return [item];
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx === -1) return [item, ...prev];
      const next = prev.slice();
      next[idx] = item;
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null);
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  if (error) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="줍기" sub="glean 읽기 실패" />
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

  if (!items) {
    return (
      <div style={{ padding: '32px 48px', maxWidth: 1120 }}>
        <PageHead title="줍기" sub="glean 읽는 중…" />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '200px 320px 1fr',
        height: '100%',
        minHeight: 0,
      }}
    >
      <SourcesRail
        items={items}
        source={source}
        onSource={setSource}
        onOpenRss={() => setRssOpen(true)}
      />
      <GleanList
        items={filtered}
        totalCount={items.length}
        filter={filter}
        onFilterChange={setFilter}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAdded={(item) => {
          upsertItem(item);
          setSelectedId(item.id);
        }}
      />
      {selected ? (
        <GleanDetail
          key={selected.id}
          item={selected}
          onChange={upsertItem}
          onDelete={() => removeItem(selected.id)}
        />
      ) : (
        <EmptyDetail count={items.length} />
      )}
      <RssDialog open={rssOpen} onClose={() => setRssOpen(false)} onSynced={refresh} />
    </div>
  );
}

function EmptyDetail({ count }: { count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        color: 'var(--ink-mute)',
        fontSize: 13,
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {count === 0 ? (
        <>
          <span>아직 거둔 글이 없습니다</span>
          <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
            좌측 상단 + 버튼으로 URL이나 본문을 붙여넣어 추가하세요
          </span>
        </>
      ) : (
        <span>좌측에서 항목을 선택하세요</span>
      )}
    </div>
  );
}
