import { useCallback, useEffect, useState } from 'react';
import {
  addRssFeed,
  type RssConfig,
  type RssFeed,
  getRssConfig,
  listRssFeeds,
  removeRssFeed,
  setRssConfig,
  syncRssFeed,
  syncRssFeeds,
  updateRssFeed,
} from '../../lib/tauri';
import { Button, Input, Mono, Select, type SelectOption } from '../../components/atoms/Atoms';

interface Props {
  open: boolean;
  onClose: () => void;
  onSynced?: () => void;
}

const INTERVAL_OPTIONS: SelectOption<string>[] = [
  { value: '0', label: '기본값 사용' },
  { value: '5', label: '5분' },
  { value: '10', label: '10분' },
  { value: '15', label: '15분' },
  { value: '30', label: '30분' },
  { value: '60', label: '1시간' },
  { value: '120', label: '2시간' },
  { value: '240', label: '4시간' },
  { value: '720', label: '12시간' },
  { value: '1440', label: '24시간' },
];

const DEFAULT_INTERVAL_OPTIONS: SelectOption<string>[] = INTERVAL_OPTIONS.filter(
  (o) => o.value !== '0',
);

export function RssDialog({ open, onClose, onSynced }: Props) {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [config, setConfig] = useState<RssConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, cfg] = await Promise.all([listRssFeeds(), getRssConfig()]);
      setFeeds(list);
      setConfig(cfg);
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
      await addRssFeed({ label: label.trim() || 'RSS', url: u });
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
    if (!confirm('이 RSS 구독을 제거할까요? 이미 줍기에 추가된 항목은 그대로 둡니다.')) return;
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

  const handleSyncAll = async () => {
    setBusy(true);
    setError(null);
    try {
      await syncRssFeeds();
      await refresh();
      onSynced?.();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleSyncOne = async (id: string) => {
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

  const handleToggleEnabled = async (feed: RssFeed, next: boolean) => {
    setBusy(true);
    try {
      await updateRssFeed(feed.id, { enabled: next });
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleIntervalChange = async (feed: RssFeed, next: string) => {
    const v = Number(next);
    if (!Number.isFinite(v)) return;
    setBusy(true);
    try {
      await updateRssFeed(feed.id, { intervalMin: v });
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const updateConfig = async (patch: Partial<RssConfig>) => {
    if (!config) return;
    const next = { ...config, ...patch };
    setConfig(next);
    try {
      const saved = await setRssConfig(next);
      setConfig(saved);
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.32)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
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
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>RSS 구독</h2>
          <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>RSS · Atom · JSON Feed</Mono>
          <span style={{ flex: 1 }} />
          <Button sm ghost onClick={onClose}>
            닫기
          </Button>
        </div>

        <details style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '6px 0' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Mono style={{ color: 'var(--blue)', fontSize: 11 }}>?</Mono>
              Threads / X 같은 RSS 없는 곳은 어떻게?
            </span>
          </summary>
          <ul
            style={{
              margin: '6px 0 0 0',
              padding: '8px 12px',
              fontSize: 11.5,
              lineHeight: 1.6,
              listStyle: 'none',
              border: '1px dashed var(--line)',
              borderRadius: 6,
              background: 'var(--bg-soft)',
            }}
          >
            <li>
              <strong>RSSHub</strong> — <Mono>https://rsshub.app/</Mono> 같은 변환기를 통해 Threads /
              X / Instagram 등 RSS가 없는 사이트도 RSS URL을 만들 수 있습니다. 가용성은 인스턴스에
              따라 다르며 차단될 수 있습니다.
            </li>
            <li style={{ marginTop: 4 }}>
              <strong>Threads</strong> — <Mono>https://rsshub.app/threads/&lt;username&gt;</Mono>
            </li>
            <li style={{ marginTop: 4 }}>
              <strong>X / Twitter</strong> — Nitter나 RSSHub 인스턴스. 대부분 차단됨, 자체 호스팅
              권장.
            </li>
            <li style={{ marginTop: 4 }}>
              <strong>일반 RSS</strong> — 대부분 블로그는 <Mono>/rss</Mono>, <Mono>/feed</Mono>,
              <Mono>/atom.xml</Mono> 경로로 제공. 사이트 푸터나 페이지 소스에서 찾을 수 있습니다.
            </li>
            <li style={{ marginTop: 4 }}>
              앱이 켜져 있는 동안 백그라운드에서 자동으로 동기화합니다 (기본 30분 주기).
            </li>
          </ul>
        </details>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr auto',
            gap: 8,
          }}
        >
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="라벨 (예: overreacted)"
            style={{ background: 'var(--bg)' }}
          />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/rss.xml"
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

        {config && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              borderTop: '1px solid var(--line)',
              paddingTop: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>환경설정</h3>
              <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>auto sync</Mono>
            </div>

            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--ink)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={config.autoSyncEnabled}
                onChange={(e) => updateConfig({ autoSyncEnabled: e.target.checked })}
                style={{ accentColor: 'var(--blue)' }}
              />
              <span>자동 동기화 활성화</span>
              <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                — 끄면 백그라운드 폴링이 멈춥니다 (수동 동기화는 가능)
              </span>
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontSize: 11,
                  color: 'var(--ink-mute)',
                }}
              >
                <span>기본 주기 (피드별 미설정 시)</span>
                <Select<string>
                  value={String(config.defaultIntervalMin)}
                  options={DEFAULT_INTERVAL_OPTIONS}
                  onChange={(v) => {
                    if (!v) return;
                    const n = Number(v);
                    if (Number.isFinite(n) && n > 0) {
                      updateConfig({ defaultIntervalMin: n });
                    }
                  }}
                />
              </label>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontSize: 11,
                  color: 'var(--ink-mute)',
                }}
              >
                <span>요청 타임아웃 (초)</span>
                <Input
                  type="number"
                  min={3}
                  max={120}
                  value={config.timeoutSec}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n) && n > 0) {
                      updateConfig({ timeoutSec: n });
                    }
                  }}
                  style={{ background: 'var(--bg)' }}
                />
              </label>
            </div>
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
            <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>구독 {feeds.length}개</span>
            <span style={{ flex: 1 }} />
            <Button sm onClick={handleSyncAll} disabled={busy || feeds.length === 0}>
              {busy ? '동기화 중…' : '지금 동기화'}
            </Button>
          </div>

          {loading && feeds.length === 0 ? (
            <Empty text="불러오는 중…" />
          ) : feeds.length === 0 ? (
            <Empty text="등록된 RSS 구독이 없습니다" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {feeds.map((f) => (
                <FeedRow
                  key={f.id}
                  feed={f}
                  busy={busy}
                  onRemove={() => handleRemove(f.id)}
                  onSync={() => handleSyncOne(f.id)}
                  onToggle={(v) => handleToggleEnabled(f, v)}
                  onInterval={(v) => handleIntervalChange(f, v)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

interface FeedRowProps {
  feed: RssFeed;
  busy: boolean;
  onRemove: () => void;
  onSync: () => void;
  onToggle: (enabled: boolean) => void;
  onInterval: (intervalMin: string) => void;
}

function FeedRow({ feed, busy, onRemove, onSync, onToggle, onInterval }: FeedRowProps) {
  const r = feed.lastResult;
  return (
    <div
      style={{
        padding: '10px 12px',
        border: '1px solid var(--line)',
        borderRadius: 6,
        background: feed.enabled ? 'var(--bg-soft)' : 'transparent',
        opacity: feed.enabled ? 1 : 0.6,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          checked={feed.enabled}
          onChange={(e) => onToggle(e.target.checked)}
          style={{ accentColor: 'var(--blue)' }}
          title={feed.enabled ? '비활성화' : '활성화'}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{feed.label}</span>
        <span style={{ flex: 1 }} />
        <button
          onClick={onSync}
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
          onClick={onRemove}
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
          alignItems: 'center',
          gap: 12,
          fontSize: 10.5,
          color: 'var(--ink-mute)',
        }}
      >
        <span>마지막 · {feed.lastSyncedAt ? prettyTime(feed.lastSyncedAt) : '없음'}</span>
        {r && !r.error && (
          <span>
            +{r.added} skip{r.skipped}/{r.total}
          </span>
        )}
        <span style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>주기</span>
          <div style={{ width: 110 }}>
            <Select<string>
              value={String(feed.intervalMin)}
              options={INTERVAL_OPTIONS}
              onChange={(v) => v != null && onInterval(v)}
            />
          </div>
        </span>
      </div>

      {r?.error && (
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
          {r.error}
        </div>
      )}
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
