import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, Eyebrow, Mono, StatusDot } from '../../components/atoms/Atoms';
import {
  mailFolderUnreadCounts,
  mailInvalidateFolderCache,
  mailInvalidateUnreadCache,
  mailListAccounts,
  mailListFolders,
  type MailAccount,
  type MailFolder,
} from '../../lib/tauri';
import { AccountDialog } from './AccountDialog';

// 컴포넌트 재마운트·계정 전환 사이에도 폴더 목록 유지
const _folderCache = new Map<string, MailFolder[]>();

type FolderNode = {
  fullName: string
  label: string
  isVirtual: boolean
  children: FolderNode[]
}

function buildFolderTree(folders: MailFolder[]): FolderNode[] {
  if (folders.length === 0) return []
  const delim = folders[0]?.delimiter || '/'
  const nodeMap = new Map<string, FolderNode>()

  for (const f of folders) {
    nodeMap.set(f.name, {
      fullName: f.name,
      label: f.name.split(delim).pop() ?? f.name,
      isVirtual: false,
      children: [],
    })
  }

  for (const f of folders) {
    const parts = f.name.split(delim)
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join(delim)
      if (!nodeMap.has(parentPath)) {
        nodeMap.set(parentPath, {
          fullName: parentPath,
          label: parts[i - 1] ?? '',
          isVirtual: true,
          children: [],
        })
      }
    }
  }

  const roots: FolderNode[] = []
  for (const [name, node] of nodeMap) {
    const parts = name.split(delim)
    if (parts.length === 1) {
      roots.push(node)
    } else {
      const parent = nodeMap.get(parts.slice(0, -1).join(delim))
      if (parent) parent.children.push(node)
      else roots.push(node)
    }
  }

  const sort = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => {
      if (a.fullName.toUpperCase() === 'INBOX') return -1
      if (b.fullName.toUpperCase() === 'INBOX') return 1
      return a.label.localeCompare(b.label, 'ko')
    })
    nodes.forEach((n) => sort(n.children))
  }
  sort(roots)
  return roots
}

function flattenVisible(
  nodes: FolderNode[],
  collapsed: Set<string>,
  depth = 0,
): Array<{ node: FolderNode; depth: number }> {
  const out: Array<{ node: FolderNode; depth: number }> = []
  for (const node of nodes) {
    out.push({ node, depth })
    if (node.children.length > 0 && !collapsed.has(node.fullName)) {
      out.push(...flattenVisible(node.children, collapsed, depth + 1))
    }
  }
  return out
}

function relativeTime(ts: number, _tick: number): string {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return '방금 전';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  return `${Math.floor(hrs / 24)}일 전`;
}

export function AccountsRail({
  selectedAccountId,
  onSelectAccount,
  selectedFolder,
  onSelectFolder,
  refreshKey,
  unreadDelta,
}: {
  selectedAccountId: string | null;
  onSelectAccount: (id: string | null) => void;
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
  refreshKey: number;
  unreadDelta?: { accountId: string; folder: string; delta: number; _seq: number } | null;
}) {
  const [accounts, setAccounts] = useState<MailAccount[] | null>(null);
  const [folders, setFolders] = useState<MailFolder[] | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [foldersErr, setFoldersErr] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [accountUnreads, setAccountUnreads] = useState<Record<string, number>>({});
  const [accountStatus, setAccountStatus] = useState<Record<string, 'loading' | 'ok' | 'err'>>({});
  const [accountLastUpdated, setAccountLastUpdated] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<MailAccount | null>(null);
  const [accountsVersion, setAccountsVersion] = useState(0);

  // 계정 목록 로드
  useEffect(() => {
    let cancelled = false;
    mailListAccounts()
      .then((list) => {
        if (cancelled) return;
        setAccounts(list);
        // 선택된 계정이 사라졌으면 첫 계정 선택 (단, __all__은 자동 전환 금지)
        const first = list[0];
        if (first && !list.find((a) => a.id === selectedAccountId) && selectedAccountId !== '__all__') {
          onSelectAccount(first.id);
        } else if (list.length === 0 && selectedAccountId !== '__all__') {
          onSelectAccount(null);
        }
      })
      .catch(() => {
        if (!cancelled) setAccounts([]);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountsVersion, refreshKey]);

  // 계정별 총 미읽음 수 + 연결 상태 (모든 계정 병렬 fetch)
  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    let cancelled = false;
    const initStatus: Record<string, 'loading' | 'ok' | 'err'> = {};
    for (const acc of accounts) initStatus[acc.id] = 'loading';
    setAccountStatus(initStatus);

    const STATUS_TIMEOUT_MS = 10_000;
    const withTimeout = (id: string, p: Promise<{ id: string; total: number; ok: boolean }>) =>
      Promise.race([
        p,
        new Promise<{ id: string; total: number; ok: false }>((resolve) =>
          setTimeout(() => resolve({ id, total: 0, ok: false }), STATUS_TIMEOUT_MS),
        ),
      ]);

    Promise.all(
      accounts.map((acc) =>
        withTimeout(
          acc.id,
          mailFolderUnreadCounts(acc.id)
            .then((counts) => ({ id: acc.id, total: Object.values(counts).reduce((s, n) => s + n, 0), ok: true as const }))
            .catch(() => ({ id: acc.id, total: 0, ok: false as const })),
        ),
      ),
    ).then((results) => {
      if (cancelled) return;
      const unreadMap: Record<string, number> = {};
      const statusMap: Record<string, 'loading' | 'ok' | 'err'> = {};
      for (const { id, total, ok } of results) {
        unreadMap[id] = total;
        statusMap[id] = ok ? 'ok' : 'err';
      }
      const updatedMap: Record<string, number> = {};
      const now = Date.now();
      for (const { id, ok } of results) {
        if (ok) updatedMap[id] = now;
      }
      setAccountUnreads(unreadMap);
      setAccountStatus(statusMap);
      setAccountLastUpdated((prev) => ({ ...prev, ...updatedMap }));
    }).catch(() => { /* 개별 에러는 위에서 처리됨 */ });
    return () => { cancelled = true; };
  }, [accounts]);

  // 상대시간 표시 갱신용 1분 tick
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // 외부 이벤트 (다른 화면에서 추가/삭제 시 갱신)
  useEffect(() => {
    const onChange = () => {
      _folderCache.clear();
      mailInvalidateFolderCache();
      mailInvalidateUnreadCache();
      setAccountsVersion((v) => v + 1);
    };
    window.addEventListener('bento:mail-accounts-changed', onChange);
    return () => window.removeEventListener('bento:mail-accounts-changed', onChange);
  }, []);

  // 메일 읽음 처리 후 실제 서버 count 재조회
  const selectedAccountIdRef = useRef(selectedAccountId);
  useEffect(() => { selectedAccountIdRef.current = selectedAccountId; });
  useEffect(() => {
    const onSeenChanged = (e: Event) => {
      const { accountId } = (e as CustomEvent<{ accountId: string }>).detail;
      if (!accountId) return;
      mailInvalidateUnreadCache(accountId);
      mailFolderUnreadCounts(accountId)
        .then((counts) => {
          const total = Object.values(counts).reduce((s, n) => s + n, 0);
          setAccountUnreads((prev) => ({ ...prev, [accountId]: total }));
          if (accountId === selectedAccountIdRef.current) {
            setUnreadCounts(counts);
          }
        })
        .catch(() => {});
    };
    window.addEventListener('bento:mail-seen-changed', onSeenChanged);
    return () => window.removeEventListener('bento:mail-seen-changed', onSeenChanged);
  }, []);

  // refreshKey 변경 추적 — 강제 새로고침 시 해당 계정 캐시 무효화
  const prevRefreshKey = useRef(refreshKey);

  // 폴더 로드 — 프론트 캐시 히트 시 로딩 없이 즉시 표시
  useEffect(() => {
    if (!selectedAccountId || selectedAccountId === '__all__') {
      setFolders(null);
      setFoldersErr(null);
      return;
    }

    const forceRefresh = prevRefreshKey.current !== refreshKey;
    prevRefreshKey.current = refreshKey;
    if (forceRefresh) _folderCache.delete(selectedAccountId);

    let cancelled = false;
    setFoldersErr(null);
    setCollapsed(new Set());

    const cached = _folderCache.get(selectedAccountId);
    if (cached) {
      // 캐시 히트 → 즉시 표시, 로딩 없음
      setFolders(cached);
      setLoadingFolders(false);
      const inbox = cached.find((f) => f.name.toUpperCase() === 'INBOX');
      const first = cached[0];
      if (first && (!selectedFolder || (selectedFolder !== '__all__' && !cached.find((f) => f.name === selectedFolder)))) {
        onSelectFolder(inbox?.name ?? first.name);
      }
    } else {
      setLoadingFolders(true);
      setFolders(null);
    }

    // 백그라운드 fetch (캐시 미스 시 첫 로드, 캐시 히트 시 갱신)
    mailListFolders(selectedAccountId)
      .then((list) => {
        if (cancelled) return;
        _folderCache.set(selectedAccountId, list);
        setFolders(list);
        if (!cached) {
          const firstFolder = list[0];
          if (firstFolder) {
            const inbox = list.find((f) => f.name.toUpperCase() === 'INBOX');
            if (!selectedFolder || (selectedFolder !== '__all__' && !list.find((f) => f.name === selectedFolder))) {
              onSelectFolder(inbox?.name ?? firstFolder.name);
            }
          } else {
            onSelectFolder(null);
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if (!cached) {
          setFoldersErr(String(err));
          setFolders([]);
          onSelectFolder(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingFolders(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, refreshKey]);

  // 안읽음 카운트 별도 fetch (STATUS 명령, 캐시 2분)
  useEffect(() => {
    if (!selectedAccountId || selectedAccountId === '__all__') {
      setUnreadCounts({});
      return;
    }
    let cancelled = false;
    mailFolderUnreadCounts(selectedAccountId)
      .then((counts) => { if (!cancelled) setUnreadCounts(counts); })
      .catch(() => { if (!cancelled) setUnreadCounts({}); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, refreshKey]);

  // 읽음 처리 시 로컬 카운트 즉시 반영
  useEffect(() => {
    if (!unreadDelta || unreadDelta.delta === 0) return;
    const { accountId, folder, delta } = unreadDelta;
    setUnreadCounts((prev) => ({
      ...prev,
      [folder]: Math.max(0, (prev[folder] ?? 0) + delta),
    }));
    setAccountUnreads((prev) => ({
      ...prev,
      [accountId]: Math.max(0, (prev[accountId] ?? 0) + delta),
    }));
  }, [unreadDelta]);

  const selectedAccount = accounts?.find((a) => a.id === selectedAccountId) ?? null;
  const totalUnread = Object.values(accountUnreads).reduce((s, n) => s + n, 0);

  const allStatuses = accounts?.map((a) => accountStatus[a.id]) ?? [];
  const allDotTone =
    allStatuses.length === 0 || allStatuses.some((s) => s === undefined || s === 'loading')
      ? 'mute'
      : allStatuses.some((s) => s === 'err')
      ? 'err'
      : 'ok';
  const allDotPulse = allStatuses.some((s) => s === undefined || s === 'loading');

  const folderTree = useMemo(() => buildFolderTree(folders ?? []), [folders]);
  const visibleFolders = useMemo(
    () => flattenVisible(folderTree, collapsed),
    [folderTree, collapsed],
  );

  const toggleCollapse = (fullName: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });

  return (
    <aside
      style={{
        flex: '0 0 200px',
        width: 200,
        minWidth: 0,
        borderRight: '1px solid var(--line)',
        background: 'var(--bg-soft)',
        padding: '14px 8px',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        gap: 'var(--gap)',
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
        <Eyebrow>계정</Eyebrow>
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{accounts?.length ?? '…'}</Mono>
      </div>

      {accounts === null ? (
        <AccountsSkel />
      ) : (
        <>
          {/* 전체 메일 */}
          <button
            onClick={() => {
              onSelectAccount('__all__');
              onSelectFolder(null);
            }}
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
              padding: '7px 10px',
              borderRadius: 5,
              border: 'none',
              background: selectedAccountId === '__all__' ? 'var(--bg-shade)' : 'transparent',
              color: selectedAccountId === '__all__' ? 'var(--ink)' : 'var(--ink-2)',
              fontSize: 12.5,
              fontFamily: 'inherit',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%' }}>
              <StatusDot tone={allDotTone} pulse={allDotPulse} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selectedAccountId === '__all__' ? 500 : 400 }}>
                전체 메일
              </span>
              {totalUnread > 0 && (
                <Mono style={{ fontSize: 9.5, color: selectedAccountId === '__all__' ? 'var(--ink)' : 'var(--blue)', background: selectedAccountId === '__all__' ? 'var(--bg)' : 'rgba(96,165,250,0.12)', padding: '1px 5px', borderRadius: 8, flexShrink: 0 }}>
                  {totalUnread}
                </Mono>
              )}
            </span>
          </button>

          {accounts.length === 0 ? (
            <div
              style={{
                padding: '12px 10px',
                color: 'var(--ink-mute)',
                fontSize: 12,
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              계정이 없습니다
            </div>
          ) : accounts.map((acc) => {
          const isActive = acc.id === selectedAccountId;
          const accUnread = accountUnreads[acc.id] ?? 0;
          const accStatus = accountStatus[acc.id];
          const dotTone = isActive && foldersErr
            ? 'err'
            : isActive && loadingFolders
            ? 'mute'
            : accStatus === 'err'
            ? 'err'
            : accStatus === 'ok'
            ? 'ok'
            : 'mute';
          const dotPulse = (isActive && (!!foldersErr || loadingFolders)) || accStatus === 'loading';
          return (
            <button
              key={acc.id}
              onClick={() => onSelectAccount(acc.id)}
              title={`${acc.username} · ${acc.host}:${acc.port}`}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                padding: '7px 10px',
                borderRadius: 5,
                border: 'none',
                background: isActive ? 'var(--bg-shade)' : 'transparent',
                color: isActive ? 'var(--ink)' : 'var(--ink-2)',
                fontSize: 12.5,
                fontFamily: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', minWidth: 0 }}>
                <StatusDot tone={dotTone} pulse={dotPulse} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 500 : 400 }}>
                  {acc.label}
                </span>
                {accUnread > 0 && (
                  <Mono style={{ fontSize: 9.5, color: isActive ? 'var(--ink)' : 'var(--blue)', background: isActive ? 'var(--bg)' : 'rgba(96,165,250,0.12)', padding: '1px 5px', borderRadius: 8, flexShrink: 0 }}>
                    {accUnread}
                  </Mono>
                )}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 14, maxWidth: '100%', gap: 4 }}>
                <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                  {acc.username}
                </Mono>
                {accountLastUpdated[acc.id] && (
                  <Mono style={{ fontSize: 9, color: 'var(--ink-mute)', flexShrink: 0 }}>
                    {relativeTime(accountLastUpdated[acc.id]!, tick)}
                  </Mono>
                )}
              </span>
            </button>
          );
        })}
        </>
      )}

      <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Button ghost sm onClick={() => setShowAdd(true)} style={{ width: '100%' }}>
          + 계정 추가
        </Button>
        {selectedAccount && selectedAccountId !== '__all__' && (
          <Button ghost sm onClick={() => setEditing(selectedAccount)} style={{ width: '100%', color: 'var(--ink-mute)' }}>
            ✎ {selectedAccount.label} 편집
          </Button>
        )}
      </div>

      {selectedAccount && selectedAccountId !== '__all__' && (
        <>
          <div
            style={{
              padding: 'var(--gap) 10px 4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--line)',
              marginTop: 4,
            }}
          >
            <Eyebrow>폴더</Eyebrow>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              {folders ? folders.length : '…'}
            </Mono>
          </div>
          {loadingFolders && <FoldersSkel />}
          {foldersErr && (
            <div
              style={{
                padding: '8px 10px',
                color: 'var(--err)',
                fontSize: 11,
                lineHeight: 1.4,
                wordBreak: 'break-all',
              }}
            >
              {foldersErr}
            </div>
          )}
          {folders &&
            !loadingFolders &&
            visibleFolders.map(({ node, depth }) => {
              const isActive = !node.isVirtual && node.fullName === selectedFolder;
              const isInbox = node.fullName.toUpperCase() === 'INBOX';
              const hasChildren = node.children.length > 0;
              const isCollapsed = collapsed.has(node.fullName);
              const unread = unreadCounts[node.fullName] ?? 0;
              return (
                <div
                  key={node.fullName}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 10 + depth * 14,
                    paddingRight: 4,
                    borderRadius: 5,
                    background: isActive ? 'var(--bg-shade)' : 'transparent',
                    overflow: 'hidden',
                    minWidth: 0,
                  }}
                >
                  {/* 접기/펼치기 토글 */}
                  <button
                    onClick={() => hasChildren && toggleCollapse(node.fullName)}
                    style={{
                      width: 20,
                      flex: '0 0 20px',
                      padding: 0,
                      border: 'none',
                      background: 'transparent',
                      color: hasChildren ? 'var(--ink-mute)' : 'transparent',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 16,
                      cursor: hasChildren ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    tabIndex={hasChildren ? 0 : -1}
                  >
                    {isInbox ? '⌂' : hasChildren ? (isCollapsed ? '▸' : '▾') : '·'}
                  </button>
                  {/* 폴더명 + 안읽음 뱃지 */}
                  <button
                    onClick={() => !node.isVirtual && onSelectFolder(node.fullName)}
                    title={node.fullName}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: '5px 4px',
                      border: 'none',
                      background: 'transparent',
                      color: isActive ? 'var(--ink)' : node.isVirtual ? 'var(--ink-mute)' : 'var(--ink-2)',
                      fontSize: 12,
                      fontFamily: 'inherit',
                      cursor: node.isVirtual ? 'default' : 'pointer',
                      textAlign: 'left',
                      fontWeight: unread > 0 ? 600 : isActive ? 500 : 400,
                      fontStyle: node.isVirtual ? 'italic' : 'normal',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.label}
                    </span>
                    {unread > 0 && (
                      <Mono
                        style={{
                          fontSize: 9.5,
                          color: isActive ? 'var(--ink)' : 'var(--blue)',
                          background: isActive ? 'var(--bg)' : 'rgba(96,165,250,0.12)',
                          padding: '1px 5px',
                          borderRadius: 8,
                          flexShrink: 0,
                        }}
                      >
                        {unread}
                      </Mono>
                    )}
                  </button>
                </div>
              );
            })}
        </>
      )}

      {showAdd && (
        <AccountDialog
          onSave={(saved) => {
            setAccountsVersion((v) => v + 1);
            onSelectAccount(saved.id);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
      {editing && (
        <AccountDialog
          account={editing}
          onSave={() => setAccountsVersion((v) => v + 1)}
          onClose={() => setEditing(null)}
        />
      )}
    </aside>
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

function AccountsSkel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 8px' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ padding: '7px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Skel w={8} h={8} r={4} />
            <Skel h={13} />
          </div>
          <Skel w="70%" h={10} style={{ marginLeft: 14 }} />
        </div>
      ))}
    </div>
  );
}

function FoldersSkel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 8px' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Skel w={12} h={12} r={2} />
          <Skel h={12} w={`${60 + (i % 3) * 20}%`} />
        </div>
      ))}
    </div>
  );
}
