import { useCallback, useEffect, useState } from 'react';
import { Button, Empty, Input, Mono } from '../../components/atoms/Atoms';
import {
  addRssFeed,
  listRssFeeds,
  removeRssFeed,
  syncRssFeed,
  type RssFeed,
} from '../../lib/tauri';

function parseYoutubeInput(raw: string): { url: string; kind: 'rss' | 'headless' } | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 'youtube.com' && host !== 'youtu.be') return null;
    // 이미 RSS URL
    if (u.pathname.startsWith('/feeds/')) return { url: s, kind: 'rss' };
    // /channel/UCxxxxxx → RSS 직접 변환
    const ch = u.pathname.match(/\/channel\/(UC[\w-]+)/);
    if (ch) {
      return {
        url: `https://www.youtube.com/feeds/videos.xml?channel_id=${ch[1]}`,
        kind: 'rss',
      };
    }
    // /@handle, /user/... → 채널 ID 모름 → headless로 처리
    return { url: s, kind: 'headless' };
  } catch {
    return null;
  }
}

function isYoutubeUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '');
    return h === 'youtube.com' || h === 'youtu.be';
  } catch {
    return false;
  }
}

function prettyTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function YoutubePanel({ onSynced }: { onSynced?: () => void }) {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await listRssFeeds();
      setFeeds(all.filter((f) => isYoutubeUrl(f.url)));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setError(null);
    refresh();
  }, [refresh]);

  const handleAdd = async () => {
    const parsed = parseYoutubeInput(url);
    if (!parsed) {
      setError('유효한 YouTube 채널 URL을 입력하세요');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addRssFeed({
        label: label.trim() || 'YouTube 채널',
        url: parsed.url,
        sourceKind: parsed.kind,
      });
      setUrl('');
      setLabel('');
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('이 구독을 제거할까요? 이미 줍기에 추가된 항목은 그대로 둡니다.')) return;
    setBusy(true);
    try {
      await removeRssFeed(id);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await syncRssFeed(id);
      await refresh();
      onSynced?.();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          padding: '8px 12px',
          background: 'var(--bg-soft)',
          border: '1px dashed var(--line)',
          borderRadius: 6,
          fontSize: 11.5,
          color: 'var(--ink-mute)',
          lineHeight: 1.6,
        }}
      >
        채널 URL <Mono style={{ color: 'var(--ink-2)' }}>youtube.com/@handle</Mono> 또는{' '}
        <Mono style={{ color: 'var(--ink-2)' }}>youtube.com/channel/UCxxxxxx</Mono> 를 입력하면
        자동으로 RSS 구독으로 변환됩니다.{' '}
        <Mono>@handle</Mono> 형식은 헤드리스 브라우저로 처리됩니다.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: 8 }}>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="채널 이름"
          disabled={busy}
        />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/@channel"
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          style={{ background: 'var(--bg)' }}
        />
        <Button sm onClick={handleAdd} disabled={busy || !url.trim()}>
          추가
        </Button>
      </div>

      {error && (
        <div
          style={{
            padding: 10,
            border: '1px solid var(--err-soft)',
            background: 'var(--err-soft)',
            color: 'var(--err)',
            borderRadius: 6,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          borderTop: '1px solid var(--line)',
          paddingTop: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>구독 {feeds.length}개</span>
        </div>
        {loading && feeds.length === 0 ? (
          <Empty>불러오는 중…</Empty>
        ) : feeds.length === 0 ? (
          <Empty>등록된 YouTube 채널이 없습니다</Empty>
        ) : (
          feeds.map((f) => (
            <div
              key={f.id}
              style={{
                padding: '10px 12px',
                border: '1px solid var(--line)',
                borderRadius: 6,
                background: f.enabled ? 'var(--bg-soft)' : 'transparent',
                opacity: f.enabled ? 1 : 0.6,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', flex: 1 }}>
                  {f.label}
                </span>
                <button
                  onClick={() => handleSync(f.id)}
                  disabled={busy}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--blue)',
                    cursor: busy ? 'wait' : 'pointer',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    padding: 0,
                  }}
                >
                  동기화
                </button>
                <button
                  onClick={() => handleRemove(f.id)}
                  disabled={busy}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--err)',
                    cursor: busy ? 'wait' : 'pointer',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    padding: 0,
                  }}
                >
                  제거
                </button>
              </div>
              <span title={f.url} style={{ display: 'block' }}>
                <Mono
                  style={{
                    fontSize: 10.5,
                    color: 'var(--ink-mute)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {f.url}
                </Mono>
              </span>
              <div style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
                마지막 · {f.lastSyncedAt ? prettyTime(f.lastSyncedAt) : '없음'}
              </div>
              {f.lastResult?.error && (
                <div
                  style={{
                    padding: '6px 8px',
                    border: '1px solid var(--err-soft)',
                    background: 'var(--err-soft)',
                    color: 'var(--err)',
                    borderRadius: 4,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {f.lastResult.error}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

