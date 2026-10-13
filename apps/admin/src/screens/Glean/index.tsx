import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { emit, listen } from '@tauri-apps/api/event';
import type { GleanItem, GleanStatus, GleanSummary } from '@vallista/content-core';
import {
  gleanCounts,
  listGlean,
  listThreadsProfiles,
  readGlean,
  syncRssFeeds,
  syncThreadsProfile,
  type GleanCounts,
  type RssSyncResult,
  type ThreadsProfile,
} from '../../lib/tauri';
import { dispatchToast, dispatchRemoveToast } from '../../components/NotifToast';
import { PageHead } from '../../components/atoms/Atoms';
import { GleanList } from './GleanList';
import { GleanDetail } from './GleanDetail';
import { SourcesRail, type SourceFilter } from './SourcesRail';
import { SubscriptionsDialog, type SubsTab } from './SubscriptionsDialog';
import { toSummary } from './summary';

export type StatusFilter = GleanStatus | 'all';

const GLEAN_LIMIT = 30;

function sumSyncResults(payload: unknown): { added: number; updated: number } | null {
  if (!Array.isArray(payload)) return null;
  let added = 0;
  let updated = 0;
  for (const [, r] of payload as Array<[string, RssSyncResult]>) {
    added += r?.added ?? 0;
    updated += r?.updated ?? 0;
  }
  return { added, updated };
}

export function Glean() {
  const [items, setItems] = useState<GleanSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [counts, setCounts] = useState<GleanCounts | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GleanItem | null>(null);
  const [subsOpen, setSubsOpen] = useState(false);
  const [subsTab, setSubsTab] = useState<SubsTab>('rss');
  const [profiles, setProfiles] = useState<ThreadsProfile[]>([]);
  const [syncingRss, setSyncingRss] = useState(false);
  const [syncingThreads, setSyncingThreads] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const manualRefreshRef = useRef(false);
  const loadVersionRef = useRef(0);
  const itemCountRef = useRef(0);
  const detailRef = useRef<GleanItem | null>(null);

  const refreshCounts = useCallback(() => {
    gleanCounts().then(setCounts).catch(() => {});
  }, []);

  const loadFirstPage = useCallback(async (f: StatusFilter, s: SourceFilter) => {
    loadVersionRef.current += 1;
    const ver = loadVersionRef.current;
    setIsLoading(true);
    setItems([]);
    setTotal(0);
    setHasMore(false);
    try {
      const page = await listGlean({
        status: f === 'all' ? undefined : f,
        source: s === 'all' ? undefined : s,
        offset: 0,
        limit: GLEAN_LIMIT,
      });
      if (loadVersionRef.current !== ver) return;
      setItems(page.items);
      setTotal(page.total);
      setHasMore(page.total > page.items.length);
      // 필터가 바뀌어 첫 페이지에 없는 항목은 선택을 푼다 (목록 하이라이트와 상세가 어긋나지 않게)
      setSelectedId((prev) => (prev && page.items.some((i) => i.id === prev) ? prev : null));
    } catch (e: unknown) {
      if (loadVersionRef.current !== ver) return;
      setError(String(e));
    } finally {
      if (loadVersionRef.current === ver) setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async (offset: number, f: StatusFilter, s: SourceFilter) => {
    const ver = loadVersionRef.current;
    setIsLoadingMore(true);
    try {
      const page = await listGlean({
        status: f === 'all' ? undefined : f,
        source: s === 'all' ? undefined : s,
        offset,
        limit: GLEAN_LIMIT,
      });
      if (loadVersionRef.current !== ver) return;
      setItems((prev) => [...prev, ...page.items]);
      setTotal(page.total);
      setHasMore(offset + page.items.length < page.total);
    } catch {
      // 더 불러오기 실패는 조용히
    } finally {
      // 필터가 바뀌어 응답을 버리더라도 플래그는 풀어야 다음 더 불러오기가 막히지 않는다
      setIsLoadingMore(false);
    }
  }, []);

  // 백그라운드 갱신: 스켈레톤·스크롤·이미 불러온 페이지를 유지한 채 같은 범위를 다시 받는다
  const reloadInPlace = useCallback(async (f: StatusFilter, s: SourceFilter) => {
    const ver = loadVersionRef.current;
    const loaded = itemCountRef.current;
    const limit = Math.max(GLEAN_LIMIT, Math.ceil(loaded / GLEAN_LIMIT) * GLEAN_LIMIT);
    try {
      const page = await listGlean({
        status: f === 'all' ? undefined : f,
        source: s === 'all' ? undefined : s,
        offset: 0,
        limit,
      });
      if (loadVersionRef.current !== ver) return;
      setItems(page.items);
      setTotal(page.total);
      setHasMore(page.total > page.items.length);
    } catch {
      // 백그라운드 갱신 실패는 보고 있던 목록을 유지한다
    }
  }, []);

  const refreshProfiles = useCallback(() => {
    listThreadsProfiles().then(setProfiles).catch(() => {});
  }, []);

  const refresh = useCallback(() => {
    void reloadInPlace(filter, source);
    refreshCounts();
  }, [reloadInPlace, filter, source, refreshCounts]);

  const handleRefresh = useCallback(() => {
    manualRefreshRef.current = true;
    setSyncingRss(true);
    dispatchToast({ id: 'glean-rss-refresh', title: '피드 동기화 중…', duration: 0 });
    syncRssFeeds().catch(() => {
      setSyncingRss(false);
      dispatchRemoveToast('glean-rss-refresh');
      dispatchToast({ title: '피드 동기화 실패', duration: 4000 });
      manualRefreshRef.current = false;
    });

    if (profiles.length > 0) {
      setSyncingThreads(true);
      Promise.allSettled(profiles.map((p) => syncThreadsProfile(p.id))).then(() => {
        setSyncingThreads(false);
        refreshProfiles();
        refresh();
      });
    }
  }, [profiles, refresh, refreshProfiles]);

  useEffect(() => {
    itemCountRef.current = items.length;
  }, [items.length]);

  useEffect(() => {
    void loadFirstPage(filter, source);
    refreshCounts();
    refreshProfiles();
  // 마운트 시 1회만
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 필터·소스 변경 시 첫 페이지 재로드
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    void loadFirstPage(filter, source);
  }, [filter, source, loadFirstPage]);

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    listen('bento:rss-syncing', () => setSyncingRss(true)).then((fn) => unsubs.push(fn));
    listen<Array<[string, RssSyncResult]>>('bento:rss-synced', (ev) => {
      setSyncingRss(false);
      const sum = sumSyncResults(ev.payload);
      if (!sum || sum.added + sum.updated > 0) refresh();
      if (manualRefreshRef.current) {
        manualRefreshRef.current = false;
        dispatchRemoveToast('glean-rss-refresh');
        let title = '피드 업데이트됨';
        if (sum) title += sum.added > 0 ? ` · 새 글 ${sum.added}개` : ' · 새 글 없음';
        dispatchToast({ title, duration: 3000 });
      }
    }).then((fn) => unsubs.push(fn));
    return () => unsubs.forEach((fn) => fn());
  }, [refresh]);

  useEffect(() => {
    const unsubs: Array<() => void> = [];
    listen('bento:threads-syncing', () => setSyncingThreads(true)).then((fn) => unsubs.push(fn));
    listen('bento:threads-synced', () => {
      setSyncingThreads(false);
      refresh();
      refreshProfiles();
    }).then((fn) => unsubs.push(fn));
    return () => unsubs.forEach((fn) => fn());
  }, [refresh, refreshProfiles]);

  useEffect(() => {
    detailRef.current = detail;
  }, [detail]);

  // 목록은 요약만 들고 있으므로 선택된 항목의 본문은 따로 읽는다. 읽는 동안은 직전 상세를 유지한다
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    if (detailRef.current?.id === selectedId) return;
    let cancelled = false;
    readGlean(selectedId)
      .then((item) => { if (!cancelled) setDetail(item); })
      .catch(() => { if (!cancelled) setDetail(null); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const upsertItem = useCallback((item: GleanItem) => {
    const summary = toSummary(item);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx === -1) return [summary, ...prev];
      const next = prev.slice();
      next[idx] = summary;
      return next;
    });
    setDetail((prev) => (prev && prev.id === item.id ? item : prev));
    void emit('bento:glean-changed', null);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDetail((prev) => (prev && prev.id === id ? null : prev));
    setTotal((prev) => Math.max(0, prev - 1));
    setSelectedId((prev) => (prev === id ? null : prev));
    void emit('bento:glean-changed', null);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    void loadMore(items.length, filter, source);
  }, [isLoadingMore, hasMore, items.length, filter, source, loadMore]);

  if (error) {
    return (
      <div style={{ padding: 'calc(var(--gap-lg) * 2) calc(var(--gap-lg) * 3)', maxWidth: 1120 }}>
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

  if (isLoading && items.length === 0) {
    return <GleanSkeleton />;
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
        counts={counts}
        source={source}
        onSource={setSource}
        onOpenSubscriptions={(tab) => {
          setSubsTab(tab);
          setSubsOpen(true);
        }}
      />
      <GleanList
        items={items}
        totalCount={total}
        filter={filter}
        onFilterChange={setFilter}
        selectedId={selectedId}
        onSelect={setSelectedId}
        syncingLabel={[syncingRss && 'RSS', syncingThreads && 'Threads'].filter(Boolean).join(' · ') || null}
        onAdded={(item) => {
          upsertItem(item);
          setDetail(item);
          setSelectedId(item.id);
        }}
        onRefresh={handleRefresh}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        isLoadingMore={isLoadingMore}
      />
      {detail ? (
        <GleanDetail
          key={detail.id}
          item={detail}
          onChange={upsertItem}
          onDelete={() => removeItem(detail.id)}
        />
      ) : selectedId ? (
        <div />
      ) : (
        <EmptyDetail count={total} />
      )}
      <SubscriptionsDialog
        open={subsOpen}
        initialTab={subsTab}
        onClose={() => setSubsOpen(false)}
        onSynced={refresh}
        profiles={profiles}
        onProfilesChange={setProfiles}
        counts={counts}
        onItemsRefresh={refresh}
      />
    </div>
  );
}

function Skel({ w, h, r = 4, style }: { w?: string | number; h: number; r?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: w ?? '100%',
        height: h,
        borderRadius: r,
        background: 'linear-gradient(90deg, var(--line) 25%, var(--line-strong) 50%, var(--line) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

function GleanSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 320px 1fr', height: '100%', minHeight: 0 }}>
      {/* SourcesRail 자리 */}
      <div style={{ borderRight: '1px solid var(--line)', background: 'var(--bg-soft)', padding: 'var(--card-pad)', display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'hidden' }}>
        <Skel w={80} h={10} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Skel w={20} h={20} r={10} />
              <Skel h={12} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Skel h={28} r={6} />
          <Skel h={28} r={6} />
        </div>
      </div>

      {/* GleanList 자리 */}
      <div style={{ borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
        {/* 필터 헤더 */}
        <div style={{ padding: '10px var(--card-pad)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {[60, 50, 50, 50].map((w, i) => (
            <Skel key={i} w={w} h={22} r={6} />
          ))}
        </div>
        {/* 카드 리스트 */}
        <div style={{ flex: 1, overflowY: 'hidden', padding: '8px var(--card-pad)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Skel w="85%" h={13} />
              <div style={{ display: 'flex', gap: 8 }}>
                <Skel w={60} h={10} />
                <Skel w={40} h={10} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GleanDetail 자리 */}
      <div style={{ padding: 'calc(var(--gap-lg) * 2) calc(var(--gap-lg) * 2)', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'hidden' }}>
        <Skel w="60%" h={22} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Skel w={80} h={12} />
          <Skel w={60} h={12} />
          <Skel w={100} h={12} />
        </div>
        <div style={{ height: 1, background: 'var(--line)', margin: '4px 0' }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skel key={i} w={i % 3 === 2 ? '70%' : '100%'} h={14} />
        ))}
        <Skel w="90%" h={14} />
        <Skel w="80%" h={14} />
      </div>
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
