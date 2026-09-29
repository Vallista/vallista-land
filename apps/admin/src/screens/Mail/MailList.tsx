import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { Mono, Empty } from '../../components/atoms/Atoms';
import { mailSetSeen, mailSetSeenBulk } from '../../lib/tauri';
import { useMailCache } from './useMailCache';
import type { MailMessage } from '../../lib/tauri';

type Filter = 'all' | 'unread' | 'flagged';

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function truncateSender(from: string): string {
  const m = /^"?([^"<]+)"?\s*</.exec(from);
  if (m && m[1]) return m[1].trim();
  const addr = from.replace(/<.*>/, '').trim();
  return addr || from;
}

export function MailList({
  accountId,
  folder,
  filter,
  onFilterChange,
  selectedUid,
  onSelect,
  patch,
  removedUid,
  onUnreadDelta,
}: {
  accountId: string | null;
  folder: string | null;
  filter: Filter;
  onFilterChange: (f: Filter) => void;
  selectedUid: number | null;
  onSelect: (uid: number, folder?: string, accountId?: string) => void;
  patch?: { uid: number; folder?: string; accountId?: string; changes: { seen?: boolean; flagged?: boolean } } | null;
  removedUid?: number | null;
  onUnreadDelta?: (accountId: string, folder: string, delta: number) => void;
}) {
  const { messages, loading, error, hasMore, loadMore, applyPatch, applyBulkPatch, applyRemove, refresh } =
    useMailCache(accountId, folder, filter);

  const [hoveredUid, setHoveredUid] = useState<number | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedUids, setSelectedUids] = useState<Set<number>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);
  // 메일 선택: 안읽음이면 즉시 로컬 카운트 반영 후 선택
  const handleSelectMsgRef = useRef<(msg: MailMessage) => void>(() => {});
  useEffect(() => {
    handleSelectMsgRef.current = (msg: MailMessage) => {
      if (!msg.seen && accountId) {
        const targetAccount = accountId === '__all__' ? msg.accountId : accountId;
        const targetFolder = accountId === '__all__' || folder === '__all__' ? msg.folder : (folder ?? msg.folder);
        if (targetAccount && targetFolder) {
          applyPatch({ uid: msg.uid, folder: msg.folder, accountId: msg.accountId, changes: { seen: true } });
          onUnreadDelta?.(targetAccount, targetFolder, -1);
        }
      }
      onSelect(msg.uid, msg.folder, msg.accountId);
    };
  });

  useEffect(() => {
    if (!patch) return;
    applyPatch(patch);
  }, [patch, applyPatch]);

  useEffect(() => {
    if (removedUid == null) return;
    applyRemove(removedUid);
  }, [removedUid, applyRemove]);

  const filtered = messages.filter((m) => {
    if (filter === 'unread') return true; // 서버에서 이미 UNSEEN만 반환
    if (filter === 'flagged') return m.flagged;
    return true;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (filtered.length === 0) return;
      e.preventDefault();
      const idx = selectedUid == null ? -1 : filtered.findIndex((m) => m.uid === selectedUid);
      const nextIdx = e.key === 'ArrowDown'
        ? Math.min(idx + 1, filtered.length - 1)
        : Math.max(idx - 1, 0);
      if (nextIdx === idx) return;
      const next = filtered[nextIdx];
      if (!next) return;
      handleSelectMsgRef.current(next);
      listRef.current?.querySelector<HTMLElement>(`[data-uid="${next.uid}"]`)?.scrollIntoView({ block: 'nearest' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [filtered, selectedUid]);

  const handleToggleSeen = async (msg: MailMessage, e: MouseEvent) => {
    e.stopPropagation();
    if (!accountId) return;
    const targetAccount = accountId === '__all__' ? msg.accountId : accountId;
    const targetFolder = accountId === '__all__' || folder === '__all__' ? msg.folder : folder;
    if (!targetAccount || !targetFolder) return;
    const next = !msg.seen;
    applyPatch({ uid: msg.uid, folder: msg.folder, accountId: msg.accountId, changes: { seen: next } });
    try {
      await mailSetSeen(targetAccount, targetFolder, msg.uid, next);
      onUnreadDelta?.(targetAccount, targetFolder, next ? -1 : 1);
      window.dispatchEvent(new CustomEvent('bento:mail-seen-changed', { detail: { accountId: targetAccount } }));
    } catch {
      applyPatch({ uid: msg.uid, folder: msg.folder, accountId: msg.accountId, changes: { seen: !next } });
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedUids(new Set());
  };

  const handleToggleSelect = (uid: number, e: MouseEvent) => {
    e.stopPropagation();
    setSelectedUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedUids.size === filtered.length) {
      setSelectedUids(new Set());
    } else {
      setSelectedUids(new Set(filtered.map((m) => m.uid)));
    }
  };

  const handleMarkSelectedSeen = async (seen: boolean) => {
    if (selectedUids.size === 0) return;
    const selected = filtered.filter((m) => selectedUids.has(m.uid));
    // API 호출 전에 실제로 상태가 바뀔 메시지들 캡처
    const changing = selected.filter((m) => m.seen !== seen);

    // accountId+folder 그룹핑 (전체 계정/폴더 뷰 대응)
    const groups = new Map<string, { accountId: string; folder: string; uids: number[] }>();
    for (const msg of selected) {
      const effAccountId = accountId === '__all__' ? msg.accountId : accountId;
      const effFolder = accountId === '__all__' || folder === '__all__' ? msg.folder : folder;
      if (!effAccountId || !effFolder) continue;
      const groupKey = `${effAccountId}:${effFolder}`;
      if (!groups.has(groupKey)) groups.set(groupKey, { accountId: effAccountId, folder: effFolder, uids: [] });
      groups.get(groupKey)!.uids.push(msg.uid);
    }

    applyBulkPatch(selectedUids, { seen });

    const results = await Promise.allSettled(
      [...groups.values()].map(({ accountId: aid, folder: fld, uids }) =>
        mailSetSeenBulk(aid, fld, uids, seen)
      )
    );

    // 실패한 그룹 롤백
    const failedUids = new Set<number>();
    const groupsArr = [...groups.values()];
    groupsArr.forEach(({ uids }, i) => {
      if (results[i]?.status === 'rejected') uids.forEach((u) => failedUids.add(u));
    });
    if (failedUids.size > 0) applyBulkPatch(failedUids, { seen: !seen });

    // 성공한 그룹에 대해서만 카운트 delta 전달
    groupsArr.forEach(({ accountId: aid, folder: fld }, i) => {
      if (results[i]?.status !== 'fulfilled') return;
      const groupKey = `${aid}:${fld}`;
      const changingInGroup = changing.filter((m) => {
        const effAccountId = accountId === '__all__' ? m.accountId : accountId;
        const effFolder = accountId === '__all__' || folder === '__all__' ? m.folder : folder;
        return `${effAccountId}:${effFolder}` === groupKey;
      });
      const delta = seen ? -changingInGroup.length : changingInGroup.length;
      if (delta !== 0) onUnreadDelta?.(aid, fld, delta);
    });

    exitSelectionMode();
  };

  const TABS: { id: Filter; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'unread', label: '안 읽음' },
    { id: 'flagged', label: '중요' },
  ];

  return (
    <div
      style={{
        flex: '0 0 320px',
        width: 320,
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-soft)',
        overflow: 'hidden',
      }}
    >
      {loading && (
        <div
          style={{
            padding: '6px 12px',
            background: 'var(--blue)',
            color: '#fff',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            flexShrink: 0,
          }}
        >
          <MailSpinner />
          메일 불러오는 중…
        </div>
      )}
      {/* 헤더 */}
      <div
        style={{
          padding: '10px 10px 8px',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flexShrink: 0,
        }}
      >
        {selectionMode ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 22 }}>
              <button
                onClick={handleSelectAll}
                title={selectedUids.size === filtered.length ? '전체 해제' : '전체 선택'}
                style={{
                  width: 16,
                  height: 16,
                  border: '1.5px solid var(--ink-mute)',
                  borderRadius: 3,
                  background: selectedUids.size === filtered.length ? 'var(--ink)' : 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--on-accent)',
                  fontSize: 10,
                }}
              >
                {selectedUids.size === filtered.length ? '✓' : selectedUids.size > 0 ? '−' : ''}
              </button>
              <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', flex: 1 }}>
                {selectedUids.size > 0 ? `${selectedUids.size}개 선택됨` : '선택하세요'}
              </Mono>
              <button
                onClick={() => { void handleMarkSelectedSeen(true); }}
                disabled={selectedUids.size === 0}
                style={{
                  padding: '3px 8px',
                  border: 'none',
                  borderRadius: 4,
                  background: selectedUids.size > 0 ? 'var(--blue)' : 'var(--line)',
                  color: selectedUids.size > 0 ? '#fff' : 'var(--ink-mute)',
                  fontSize: 10.5,
                  cursor: selectedUids.size > 0 ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                }}
              >
                읽음으로
              </button>
              <button
                onClick={exitSelectionMode}
                style={{
                  padding: '3px 8px',
                  border: 'none',
                  borderRadius: 4,
                  background: 'transparent',
                  color: 'var(--ink-mute)',
                  fontSize: 10.5,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                취소
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', minHeight: 22 }}>
              <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', letterSpacing: '0.06em', flex: 1 }}>
                메일 · {messages.length}
              </Mono>
              <button
                onClick={() => { if (!loading) refresh(); }}
                title="새로 가져오기"
                disabled={loading}
                style={{
                  padding: '2px 6px',
                  border: 'none',
                  borderRadius: 4,
                  background: 'transparent',
                  color: loading ? 'var(--ink-mute)' : 'var(--ink-mute)',
                  fontSize: 13,
                  cursor: loading ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  animation: loading ? 'mail-spin 0.7s linear infinite' : 'none',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                ↻
              </button>
              <button
                onClick={() => setSelectionMode(true)}
                style={{
                  padding: '2px 8px',
                  border: 'none',
                  borderRadius: 4,
                  background: 'transparent',
                  color: 'var(--ink-mute)',
                  fontSize: 10.5,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                선택
              </button>
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {TABS.map((tab) => (
                <FilterChip key={tab.id} active={tab.id === filter} onClick={() => onFilterChange(tab.id)}>
                  {tab.label}
                </FilterChip>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 메시지 목록 */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto' }}>
        {!accountId || (!folder && accountId !== '__all__') ? (
          <div style={{ padding: 'var(--gap-lg)', textAlign: 'center' }}>
            <Mono style={{ fontSize: 12, color: 'var(--ink-mute)' }}>계정과 폴더를 선택하세요</Mono>
          </div>
        ) : error ? (
          <div style={{ padding: 'var(--gap)', color: 'var(--err)', fontSize: 12, lineHeight: 1.5 }}>
            {error}
          </div>
        ) : loading && messages.length === 0 ? (
          <MailListSkel />
        ) : filtered.length === 0 ? (
          <Empty>메일이 없습니다</Empty>
        ) : (
          <>
            {filtered.map((msg) => {
              const active = msg.uid === selectedUid;
              const hovered = hoveredUid === msg.uid;
              return (
                <div
                  key={`${msg.accountId ?? ''}:${msg.folder ?? ''}:${msg.uid}`}
                  data-uid={msg.uid}
                  style={{ position: 'relative', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'stretch' }}
                  onMouseEnter={() => setHoveredUid(msg.uid)}
                  onMouseLeave={() => setHoveredUid(null)}
                >
                {selectionMode && (
                  <button
                    onClick={(e) => handleToggleSelect(msg.uid, e)}
                    style={{
                      width: 36,
                      flexShrink: 0,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 15,
                        height: 15,
                        border: '1.5px solid var(--ink-mute)',
                        borderRadius: 3,
                        background: selectedUids.has(msg.uid) ? 'var(--ink)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--on-accent)',
                        fontSize: 9,
                        flexShrink: 0,
                      }}
                    >
                      {selectedUids.has(msg.uid) ? '✓' : ''}
                    </span>
                  </button>
                )}
                <button
                  onClick={selectionMode
                    ? (e) => handleToggleSelect(msg.uid, e)
                    : () => handleSelectMsgRef.current(msg)}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    padding: '8px 10px',
                    paddingRight: selectionMode ? 10 : 36,
                    border: 'none',
                    borderBottom: 'none',
                    background: active ? 'var(--bg-shade)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: 'var(--ink)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12.5,
                        fontWeight: msg.seen ? 400 : 600,
                        color: msg.seen ? 'var(--ink-2)' : 'var(--ink)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1,
                      }}
                    >
                      {truncateSender(msg.from) || '(발신자 없음)'}
                    </span>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      {msg.flagged && (
                        <span style={{ color: 'var(--warn)', fontSize: 11 }}>★</span>
                      )}
                      {!msg.seen && (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 999,
                            background: 'var(--blue)',
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                        {formatDate(msg.date)}
                      </Mono>
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: msg.seen ? 400 : 500,
                      color: msg.seen ? 'var(--ink-2)' : 'var(--ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {msg.subject || '(제목 없음)'}
                  </span>
                  {(accountId === '__all__' || folder === '__all__') && msg.folder && (
                    <span style={{ fontSize: 10, color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>
                      {msg.folder}
                    </span>
                  )}
                </button>
                {!selectionMode && (
                  <button
                    onClick={(e) => handleToggleSeen(msg, e)}
                    title={msg.seen ? '안 읽음으로 표시' : '읽음으로 표시'}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 22,
                      height: 22,
                      border: 'none',
                      background: 'transparent',
                      color: msg.seen ? 'var(--ink-mute)' : 'var(--blue)',
                      cursor: 'pointer',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      opacity: hovered ? 1 : 0,
                      transition: 'opacity 0.1s',
                      padding: 0,
                    }}
                  >
                    {msg.seen ? '◎' : '●'}
                  </button>
                )}
                </div>
              );
            })}
            {hasMore && !loading && (
              <button
                onClick={loadMore}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: 'none',
                  borderTop: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--ink-mute)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                더 보기
              </button>
            )}
            {loading && messages.length > 0 && (
              <div style={{ padding: 12, textAlign: 'center' }}>
                <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>불러오는 중…</Mono>
              </div>
            )}
          </>
        )}
      </div>
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

function MailListSkel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: '8px 10px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <Skel w={`${50 + (i % 4) * 10}%`} h={13} />
            <Skel w={36} h={10} />
          </div>
          <Skel w={`${60 + (i % 3) * 10}%`} h={12} />
        </div>
      ))}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 9px',
        borderRadius: 999,
        border: '1px solid transparent',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--on-accent)' : 'var(--ink-soft)',
        fontSize: 10.5,
        fontFamily: 'inherit',
        cursor: 'pointer',
        lineHeight: 1.2,
      }}
    >
      {children}
    </button>
  );
}

function MailSpinner() {
  return (
    <>
      <style>{`
        @keyframes mail-spin { to { transform: rotate(360deg); } }
      `}</style>
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: 999,
          border: '1.5px solid rgba(255,255,255,0.35)',
          borderTopColor: '#fff',
          animation: 'mail-spin 0.7s linear infinite',
          flexShrink: 0,
        }}
      />
    </>
  );
}
