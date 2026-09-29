import { useCallback, useEffect, useRef, useState } from 'react';
import {
  mailCheckNew,
  mailListAllAccountsMessages,
  mailListAllAccountsUnreadMessages,
  mailListAllMessages,
  mailListMessages,
  mailListUnreadMessages,
  type MailMessage,
} from '../../lib/tauri';

interface CacheEntry {
  messages: MailMessage[];
  maxUid: number;
  total?: number;
  unseen?: number;
}

// 모듈 레벨 캐시 — 컴포넌트 언마운트/재마운트 사이에도 유지
const cache = new Map<string, CacheEntry>();

// __all__ 요청 시 개별 계정 캐시에서 즉시 집계 (첫 로딩 체감 속도 개선)
function buildFromIndividualCaches(): MailMessage[] {
  const seen = new Set<string>();
  const msgs: MailMessage[] = [];
  for (const [k, entry] of cache.entries()) {
    const accountId = k.split(':')[0];
    if (!accountId || accountId === '__all__') continue;
    for (const m of entry.messages) {
      const id = `${m.accountId ?? ''}:${m.folder ?? ''}:${m.uid}`;
      if (seen.has(id)) continue;
      seen.add(id);
      msgs.push(m);
    }
  }
  msgs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return msgs;
}

const RETRYABLE_PATTERNS = [
  'connection reset',
  'os error 54',
  'os error 104',
  'broken pipe',
  'timed out',
  'connection refused',
  'eof',
  'list:io',
];

function isRetryable(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return RETRYABLE_PATTERNS.some((p) => msg.includes(p));
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

function cacheKey(accountId: string | null, folder: string | null) {
  return `${accountId ?? ''}:${folder ?? ''}`;
}

export function useMailCache(
  accountId: string | null,
  folder: string | null,
  filter?: 'all' | 'unread' | 'flagged',
) {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [unreadPage, setUnreadPage] = useState(0);
  const pageRef = useRef(0);
  // 세대 카운터: effect 실행마다 증가하여 stale 응답을 구분
  const genRef = useRef(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isUnread = filter === 'unread';
  const key = cacheKey(accountId, folder) + (isUnread ? ':unread' : '');
  const isAllAccounts = accountId === '__all__';
  const isAllFolders = !isAllAccounts && folder === '__all__';
  const pollMs = isAllAccounts ? 120_000 : 30_000;

  const fetchPage = useCallback(
    async (page: number): Promise<MailMessage[]> => {
      if (isAllAccounts) return mailListAllAccountsMessages(page);
      if (isAllFolders) return mailListAllMessages(accountId!, page);
      const result = await mailListMessages(accountId!, folder!, page);
      return result.messages;
    },
    [accountId, folder, isAllAccounts, isAllFolders],
  );

  const fetchUnread = useCallback(async (): Promise<MailMessage[]> => {
    if (isAllAccounts) return mailListAllAccountsUnreadMessages();
    return mailListUnreadMessages(accountId!, folder ?? '__all__');
  }, [accountId, folder, isAllAccounts]);

  const checkNew = useCallback(async () => {
    if (!accountId || (accountId !== '__all__' && !folder)) return;
    const gen = genRef.current;
    const entry = cache.get(key);

    // 캐시 없음 = 초기 fetch 실패 상태 → 전체 재시도
    if (!entry) {
      try {
        const list = await fetchPage(0);
        const maxUid = list.length > 0 ? Math.max(...list.map((m) => m.uid)) : 0;
        cache.set(key, { messages: list, maxUid });
        if (genRef.current !== gen) return;
        setMessages(list);
        setError(null);
        setLoading(false);
        setHasMore(list.length >= 30);
      } catch {
        // 폴링 재시도 실패는 무시 — 다음 인터벌에 재시도
      }
      return;
    }

    try {
      let newMsgs: MailMessage[];

      if (isAllAccounts) {
        const fresh = await mailListAllAccountsMessages(0);
        const seen = new Set(
          entry.messages.map((m) => `${m.accountId}:${m.folder}:${m.uid}`),
        );
        newMsgs = fresh.filter(
          (m) => !seen.has(`${m.accountId}:${m.folder}:${m.uid}`),
        );
      } else if (isAllFolders) {
        // __all__ 폴더 집계는 단순 재페치
        const fresh = await mailListAllMessages(accountId!, 0);
        const seen = new Set(
          entry.messages.map((m) => `${m.folder}:${m.uid}`),
        );
        newMsgs = fresh.filter((m) => !seen.has(`${m.folder}:${m.uid}`));
      } else {
        newMsgs = await mailCheckNew(accountId!, folder!, entry.maxUid);
      }

      if (newMsgs.length > 0 && genRef.current === gen) {
        const updated = [...newMsgs, ...entry.messages];
        const newMaxUid = Math.max(
          entry.maxUid,
          ...newMsgs.map((m) => m.uid),
        );
        cache.set(key, { messages: updated, maxUid: newMaxUid });
        setMessages(updated);
      }
    } catch {
      // 백그라운드 폴링 오류는 무시
    }
  }, [accountId, folder, key, isAllAccounts, isAllFolders, fetchPage]);

  useEffect(() => {
    if (!accountId || (accountId !== '__all__' && !folder)) {
      setMessages([]);
      setLoading(false);
      setError(null);
      return;
    }

    const gen = ++genRef.current;
    pageRef.current = 0;
    setUnreadPage(0);
    setError(null);

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // unread 필터: 서버 사이드 UNSEEN 검색, 페이지네이션 없음
    if (isUnread) {
      setHasMore(false);
      const cached = cache.get(key);
      if (cached) {
        setMessages(cached.messages);
        setLoading(false);
      } else {
        setLoading(true);
        setMessages([]);
      }

      let retryCount = 0;
      const doFetchUnread = () => {
        fetchUnread()
          .then((list) => {
            if (genRef.current !== gen) return;
            const maxUid = list.length > 0 ? Math.max(...list.map((m) => m.uid)) : 0;
            cache.set(key, { messages: list, maxUid });
            setMessages(list);
            setLoading(false);
          })
          .catch((err) => {
            if (genRef.current !== gen) return;
            if (isRetryable(err) && retryCount < MAX_RETRIES) {
              retryCount++;
              retryTimer = setTimeout(doFetchUnread, RETRY_DELAY_MS);
            } else {
              setError(String(err));
              setLoading(false);
            }
          });
      };

      doFetchUnread();

      pollingRef.current = setInterval(() => {
        const currentGen = genRef.current;
        fetchUnread()
          .then((list) => {
            if (genRef.current !== currentGen) return;
            const maxUid = list.length > 0 ? Math.max(...list.map((m) => m.uid)) : 0;
            cache.set(key, { messages: list, maxUid });
            setMessages(list);
          })
          .catch(() => {
            // 폴링 실패는 무시
          });
      }, pollMs);

      return () => {
        ++genRef.current;
        if (retryTimer) clearTimeout(retryTimer);
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }

    // 일반 모드
    setHasMore(true);

    const cached = cache.get(key);
    if (cached) {
      setMessages(cached.messages);
      setLoading(false);
      if (cached.total != null) {
        setHasMore(cached.messages.length < cached.total);
      }
      // 캐시 히트 → 백그라운드에서 신규 확인
      checkNew();
    } else {
      // __all__ 첫 로딩: 개별 계정 캐시에서 즉시 집계해서 보여주기
      const seed = isAllAccounts ? buildFromIndividualCaches() : [];
      if (seed.length > 0) {
        setMessages(seed);
        setLoading(false);
      } else {
        setLoading(true);
        setMessages([]);
      }

      let retryCount = 0;
      const doFetch = () => {
        // 단일 폴더: mailListMessages로 직접 호출해 total/unseen을 캐시에 저장
        const fetchPromise: Promise<MailMessage[]> =
          isAllAccounts || isAllFolders
            ? fetchPage(0).then((list) => {
                const maxUid = list.length > 0 ? Math.max(...list.map((m) => m.uid)) : 0;
                cache.set(key, { messages: list, maxUid });
                return list;
              })
            : mailListMessages(accountId!, folder!, 0).then((result) => {
                const list = result.messages;
                const maxUid = list.length > 0 ? Math.max(...list.map((m) => m.uid)) : 0;
                cache.set(key, { messages: list, maxUid, total: result.total, unseen: result.unseen });
                return list;
              });
        fetchPromise
          .then((list) => {
            if (genRef.current !== gen) return;
            setMessages(list);
            setLoading(false);
            const entry = cache.get(key);
            setHasMore(entry?.total != null ? list.length < entry.total : list.length >= 30);
          })
          .catch((err) => {
            if (genRef.current !== gen) return;
            if (isRetryable(err) && retryCount < MAX_RETRIES) {
              retryCount++;
              retryTimer = setTimeout(doFetch, RETRY_DELAY_MS);
            } else {
              // seed 데이터가 있으면 에러 표시 없이 유지
              if (seed.length === 0) setError(String(err));
              setLoading(false);
            }
          });
      };

      doFetch();
    }

    pollingRef.current = setInterval(checkNew, pollMs);

    return () => {
      ++genRef.current;
      if (retryTimer) clearTimeout(retryTimer);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  // checkNew/fetchUnread는 의존성에 포함하면 무한루프 위험 — key/accountId/folder/isUnread 변경에만 재실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, folder, key, isUnread]);

  const loadMore = useCallback(() => {
    if (isUnread) {
      setUnreadPage((p) => p + 1);
      return;
    }
    if (!accountId || (accountId !== '__all__' && !folder) || loading || !hasMore) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    setLoading(true);
    const gen = genRef.current;

    let retryCount = 0;
    const doLoadMore = () => {
      fetchPage(nextPage)
        .then((list) => {
          if (genRef.current !== gen) return;
          const entry = cache.get(key);
          const prevCount = entry?.messages.length ?? 0;
          setMessages((prev) => {
            const updated = [...prev, ...list];
            if (entry) cache.set(key, { ...entry, messages: updated });
            return updated;
          });
          setHasMore(
            entry?.total != null ? prevCount + list.length < entry.total : list.length >= 30,
          );
          setLoading(false);
        })
        .catch((err) => {
          if (genRef.current !== gen) return;
          if (isRetryable(err) && retryCount < MAX_RETRIES) {
            retryCount++;
            setTimeout(doLoadMore, RETRY_DELAY_MS);
          } else {
            setError(String(err));
            setLoading(false);
          }
        });
    };

    doLoadMore();
  }, [accountId, folder, loading, hasMore, key, fetchPage, isUnread]);

  const applyPatch = useCallback(
    (patch: {
      uid: number;
      folder?: string;
      accountId?: string;
      changes: { seen?: boolean; flagged?: boolean };
    }) => {
      const updater = (list: MailMessage[]) =>
        list.map((m) =>
          m.uid === patch.uid &&
          (patch.folder == null || m.folder === patch.folder) &&
          (patch.accountId == null || m.accountId === patch.accountId)
            ? { ...m, ...patch.changes }
            : m,
        );
      setMessages((prev) => updater(prev));
      const entry = cache.get(key);
      if (entry) cache.set(key, { ...entry, messages: updater(entry.messages) });
    },
    [key],
  );

  const applyBulkPatch = useCallback(
    (uids: Set<number>, changes: { seen?: boolean; flagged?: boolean }) => {
      const updater = (list: MailMessage[]) =>
        list.map((m) => (uids.has(m.uid) ? { ...m, ...changes } : m));
      setMessages((prev) => updater(prev));
      const entry = cache.get(key);
      if (entry) cache.set(key, { ...entry, messages: updater(entry.messages) });
    },
    [key],
  );

  const applyRemove = useCallback(
    (uid: number) => {
      setMessages((prev) => prev.filter((m) => m.uid !== uid));
      const entry = cache.get(key);
      if (entry)
        cache.set(key, { ...entry, messages: entry.messages.filter((m) => m.uid !== uid) });
    },
    [key],
  );

  const refresh = useCallback(() => {
    if (!accountId || (accountId !== '__all__' && !folder)) return;
    cache.delete(key);
    pageRef.current = 0;
    setLoading(true);
    setMessages([]);
    setError(null);
    const gen = ++genRef.current;

    const doRefresh = isUnread
      ? fetchUnread()
      : isAllAccounts || isAllFolders
        ? fetchPage(0).then((list) => {
            const maxUid = list.length > 0 ? Math.max(...list.map((m) => m.uid)) : 0;
            cache.set(key, { messages: list, maxUid });
            return list;
          })
        : mailListMessages(accountId!, folder!, 0).then((result) => {
            const list = result.messages;
            const maxUid = list.length > 0 ? Math.max(...list.map((m) => m.uid)) : 0;
            cache.set(key, { messages: list, maxUid, total: result.total, unseen: result.unseen });
            return list;
          });

    doRefresh
      .then((list) => {
        if (genRef.current !== gen) return;
        if (isUnread) {
          const maxUid = list.length > 0 ? Math.max(...list.map((m) => m.uid)) : 0;
          cache.set(key, { messages: list, maxUid });
        }
        setMessages(list);
        setLoading(false);
        if (!isUnread) {
          const entry = cache.get(key);
          setHasMore(entry?.total != null ? list.length < entry.total : list.length >= 30);
        }
      })
      .catch((err) => {
        if (genRef.current !== gen) return;
        setError(String(err));
        setLoading(false);
      });
  }, [accountId, folder, key, isUnread, isAllAccounts, isAllFolders, fetchPage, fetchUnread]);

  const displayMessages = isUnread ? messages.slice(0, (unreadPage + 1) * 30) : messages;
  const effectiveHasMore = isUnread ? (unreadPage + 1) * 30 < messages.length : hasMore;

  return { messages: displayMessages, loading, error, hasMore: effectiveHasMore, loadMore, applyPatch, applyBulkPatch, applyRemove, refresh };
}
