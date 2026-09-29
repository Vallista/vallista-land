import { useCallback, useEffect, useState } from 'react';
import {
  addRssFeed,
  checkChrome,
  type ChromeStatus,
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
import { Button, Checkbox, Empty, Input, Mono, Select, type SelectOption } from '../../components/atoms/Atoms';

const SOURCE_KIND_OPTIONS: SelectOption<string>[] = [
  { value: 'rss', label: 'RSS / Atom / JSON' },
  { value: 'headless', label: '헤드리스 브라우저' },
];

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

export function RssFeedPanel({ onSynced }: { onSynced?: () => void }) {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [config, setConfig] = useState<RssConfig | null>(null);
  const [chrome, setChrome] = useState<ChromeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [sourceKind, setSourceKind] = useState<string>('rss');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [list, cfg, ch] = await Promise.all([
        listRssFeeds(),
        getRssConfig(),
        checkChrome().catch(() => null),
      ]);
      setFeeds(list);
      setConfig(cfg);
      setChrome(ch);
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
    const u = url.trim();
    if (!u) return;
    if (sourceKind === 'headless' && chrome && !chrome.found) {
      setError('Chrome/Chromium이 설치되어 있지 않습니다. 아래 안내에서 설치 후 다시 시도하세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fallbackLabel = sourceKind === 'headless' ? '헤드리스' : 'RSS';
      await addRssFeed({
        label: label.trim() || fallbackLabel,
        url: u,
        sourceKind,
      });
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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
              <strong>헤드리스 브라우저</strong> — RSS가 없는 페이지도 백그라운드에서 Chrome을 띄워
              가져올 수 있습니다. 소스를 <Mono>헤드리스 브라우저</Mono>로 선택하고 페이지 URL을
              그대로 등록하세요. 창은 뜨지 않고 결과만 줍기로 적립됩니다.
            </li>
            <li style={{ marginTop: 4 }}>
              <strong>Threads</strong> —
              <Mono>https://www.threads.net/@&lt;username&gt;</Mono> 같은 프로필 URL을 헤드리스로
              등록.
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

        {sourceKind === 'headless' && chrome && !chrome.found && (
          <div
            style={{
              padding: '10px 12px',
              border: '1px solid var(--err-soft)',
              background: 'var(--err-soft)',
              borderRadius: 6,
              fontSize: 12,
              color: 'var(--ink)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div>
              헤드리스 브라우저 모드를 쓰려면 <strong>Chrome / Chromium</strong>이 설치되어
              있어야 합니다.
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
              Chrome · Chrome Beta · Chromium · Edge · Brave · Arc 중 하나면 됩니다.
            </div>
            <div>
              <a
                href={chrome.downloadUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--blue)' }}
              >
                Chrome 다운로드 →
              </a>
            </div>
          </div>
        )}

        {sourceKind === 'headless' && chrome && chrome.found && (
          <div
            style={{
              padding: '8px 10px',
              border: '1px solid var(--line)',
              background: 'var(--bg-soft)',
              borderRadius: 6,
              fontSize: 11.5,
              color: 'var(--ink-mute)',
            }}
          >
            <Mono style={{ color: 'var(--ink)', fontSize: 11 }}>{chrome.name ?? 'Chrome'}</Mono>{' '}
            발견 — 헤드리스로 사용합니다.
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 140px 1fr auto',
            gap: 8,
          }}
        >
          <Select<string>
            value={sourceKind}
            options={SOURCE_KIND_OPTIONS}
            onChange={(v) => v && setSourceKind(v)}
          />
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="라벨"
            style={{ background: 'var(--bg)' }}
          />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              sourceKind === 'headless'
                ? 'https://www.threads.net/@username'
                : 'https://example.com/rss.xml'
            }
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

            <Checkbox
              checked={config.autoSyncEnabled}
              onChange={(v) => updateConfig({ autoSyncEnabled: v })}
            >
              <span>자동 동기화 활성화</span>
              <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
                — 끄면 백그라운드 폴링이 멈춥니다 (수동 동기화는 가능)
              </span>
            </Checkbox>

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
            <Empty>불러오는 중…</Empty>
          ) : feeds.length === 0 ? (
            <Empty>등록된 RSS 구독이 없습니다</Empty>
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
        <Checkbox
          checked={feed.enabled}
          onChange={onToggle}
          title={feed.enabled ? '비활성화' : '활성화'}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{feed.label}</span>
        {feed.sourceKind === 'headless' && (
          <Mono
            style={{
              fontSize: 9.5,
              color: 'var(--blue)',
              border: '1px solid var(--line)',
              borderRadius: 3,
              padding: '1px 5px',
              background: 'var(--bg)',
            }}
            title="헤드리스 브라우저로 가져옴"
          >
            HL
          </Mono>
        )}
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
