import { useCallback, useEffect, useState } from 'react';
import {
  addIcalFeed,
  type IcalFeed,
  listIcalFeeds,
  removeIcalFeed,
  syncIcalFeeds,
} from '../../lib/tauri';
import { Button, Mono } from '../../components/atoms/Atoms';

interface Props {
  open: boolean;
  onClose: () => void;
  onSynced?: () => void;
}

export function IcalDialog({ open, onClose, onSynced }: Props) {
  const [feeds, setFeeds] = useState<IcalFeed[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listIcalFeeds();
      setFeeds(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setError(null);
    refresh();
  }, [open, refresh]);

  if (!open) return null;

  const handleAdd = async () => {
    const u = url.trim();
    if (!u) return;
    setBusy(true);
    setError(null);
    try {
      await addIcalFeed(label.trim() || '캘린더', u);
      setLabel('');
      setUrl('');
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('이 캘린더 구독을 제거할까요? 이미 동기화된 일정 블록은 그대로 둡니다.')) return;
    setBusy(true);
    try {
      await removeIcalFeed(id);
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await syncIcalFeeds();
      setFeeds(next);
      onSynced?.();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.32)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: 'calc(100vw - 48px)',
          maxHeight: 'calc(100vh - 80px)',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          color: 'var(--ink)',
          overflow: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>캘린더 구독</h2>
          <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>iCal · webcal</Mono>
          <span style={{ flex: 1 }} />
          <Button sm ghost onClick={onClose}>닫기</Button>
        </div>

        <div
          style={{
            fontSize: 12,
            color: 'var(--ink-soft)',
            lineHeight: 1.55,
          }}
        >
          Google Calendar의 <Mono>설정 → 캘린더 통합 → 비공개 주소(iCal)</Mono>를 등록하면 일정이 Meet 블록으로 가져와집니다. webcal:// URL도 자동으로 https://로 변환됩니다.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr auto',
            gap: 8,
          }}
        >
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="라벨 (예: 회사)"
            style={inputStyle}
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… 또는 webcal://…"
            style={inputStyle}
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
            gap: 8,
            borderTop: '1px solid var(--line)',
            paddingTop: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
              구독 {feeds.length}개
            </span>
            <span style={{ flex: 1 }} />
            <Button sm onClick={handleSync} disabled={busy || feeds.length === 0}>
              {busy ? '동기화 중…' : '지금 동기화'}
            </Button>
          </div>

          {loading && feeds.length === 0 ? (
            <Empty text="불러오는 중…" />
          ) : feeds.length === 0 ? (
            <Empty text="등록된 캘린더가 없습니다" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {feeds.map((f) => (
                <FeedRow key={f.id} feed={f} onRemove={() => handleRemove(f.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  fontSize: 12.5,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  borderRadius: 6,
  fontFamily: 'inherit',
  outline: 'none',
};

function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '16px 0',
        color: 'var(--ink-mute)',
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
      }}
    >
      {text}
    </div>
  );
}

function FeedRow({ feed, onRemove }: { feed: IcalFeed; onRemove: () => void }) {
  const r = feed.lastResult;
  return (
    <div
      style={{
        padding: '10px 12px',
        border: '1px solid var(--line)',
        borderRadius: 6,
        background: 'var(--bg-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          {feed.label}
        </span>
        <span style={{ flex: 1 }} />
        <button
          onClick={onRemove}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--err)',
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          제거
        </button>
      </div>
      <span title={feed.url} style={{ display: 'block' }}>
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
          {feed.url}
        </Mono>
      </span>
      <div
        style={{
          display: 'flex',
          gap: 12,
          fontSize: 10.5,
          color: 'var(--ink-mute)',
        }}
      >
        <span>
          마지막 동기화 ·{' '}
          {feed.lastSyncedAt ? prettyTime(feed.lastSyncedAt) : '없음'}
        </span>
        {r && (
          <span>
            +{r.added} ↻{r.updated} skip{r.skipped}/{r.total}
          </span>
        )}
      </div>
    </div>
  );
}

function prettyTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
