import { useState } from 'react';
import { Button, Input, Mono } from '../../components/atoms/Atoms';
import {
  debugThreadsPage,
  fetchThreadsProfile,
  type RssSyncResult,
  type ThreadsDebugResult,
} from '../../lib/tauri';

interface Props {
  open: boolean;
  onClose: () => void;
  onImported?: () => void;
}

export function ThreadsImportDialog({ open, onClose, onImported }: Props) {
  const [url, setUrl] = useState('');
  const [maxScrolls, setMaxScrolls] = useState('50');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RssSyncResult | null>(null);
  const [debug, setDebug] = useState<ThreadsDebugResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleImport = async () => {
    const u = url.trim();
    if (!u) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const scrolls = Number(maxScrolls);
      const res = await fetchThreadsProfile(u, Number.isFinite(scrolls) && scrolls > 0 ? scrolls : undefined);
      setResult(res);
      onImported?.();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleDebug = async () => {
    const u = url.trim();
    if (!u) return;
    setBusy(true);
    setError(null);
    setDebug(null);
    setResult(null);
    try {
      const res = await debugThreadsPage(u);
      setDebug(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (busy) return;
    setUrl('');
    setResult(null);
    setDebug(null);
    setError(null);
    onClose();
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
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 24,
          width: 480,
          maxWidth: '90vw',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
            Threads 프로필 전체 가져오기
          </span>
          <button
            onClick={handleClose}
            disabled={busy}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-mute)',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              padding: '2px 4px',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>프로필 URL</Mono>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.threads.com/@username"
            disabled={busy}
            onKeyDown={(e) => { if (e.key === 'Enter') handleImport(); }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
            최대 스크롤 횟수 (기본 50 · 게시글 ~500개 기준)
          </Mono>
          <Input
            value={maxScrolls}
            onChange={(e) => setMaxScrolls(e.target.value)}
            placeholder="50"
            disabled={busy}
            style={{ width: 100 }}
          />
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--err-soft)',
              border: '1px solid var(--err-soft)',
              borderRadius: 6,
              color: 'var(--err)',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {error}
          </div>
        )}

        {debug && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              padding: '10px 14px',
              background: 'var(--bg-shade)',
              border: '1px solid var(--line)',
              borderRadius: 8,
            }}
          >
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <StatBadge label="쿠키 주입" value={debug.cookieCount} tone={debug.cookieCount > 0 ? 'var(--ok)' : 'var(--warn)'} />
              <StatBadge label="/post/ 링크" value={debug.postLinkCount} tone={debug.postLinkCount > 0 ? 'var(--ok)' : 'var(--err)'} />
            </div>
            {debug.articleSelCounts.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {debug.articleSelCounts.map(([sel, count]) => (
                  <div key={sel} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: count > 0 ? 'var(--ok)' : 'var(--err)', fontFamily: 'var(--font-mono)' }}>
                      {count > 0 ? '✓' : '✗'}
                    </span>
                    <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{sel}</Mono>
                    <Mono style={{ fontSize: 10, color: count > 0 ? 'var(--ok)' : 'var(--err)' }}>({count})</Mono>
                  </div>
                ))}
              </div>
            )}
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
              페이지 타이틀: {debug.title || '(없음)'}
            </Mono>
            <details>
              <summary style={{ fontSize: 11, color: 'var(--ink-mute)', cursor: 'pointer' }}>
                HTML 앞부분 보기
              </summary>
              <pre
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--ink-2)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: 200,
                  overflowY: 'auto',
                  background: 'var(--bg)',
                  padding: 8,
                  borderRadius: 4,
                  border: '1px solid var(--line)',
                }}
              >
                {debug.htmlSnippet}
              </pre>
            </details>
          </div>
        )}

        {result && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--bg-shade)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                display: 'flex',
                gap: 20,
              }}
            >
              <StatBadge label="추가됨" value={result.added} tone="var(--ok)" />
              <StatBadge label="건너뜀" value={result.skipped} tone="var(--ink-mute)" />
              <StatBadge label="전체" value={result.total} tone="var(--ink)" />
            </div>
            {result.error && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--err-soft)',
                  border: '1px solid var(--err-soft)',
                  borderRadius: 6,
                  color: 'var(--err)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                저장 오류: {result.error}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button sm ghost onClick={handleClose} disabled={busy}>
            닫기
          </Button>
          <Button sm ghost onClick={handleDebug} disabled={busy || !url.trim()}>
            {busy ? '진단 중…' : '페이지 진단'}
          </Button>
          <Button sm onClick={handleImport} disabled={busy || !url.trim()}>
            {busy ? '가져오는 중…' : '가져오기'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: tone, fontFamily: 'var(--font-mono)' }}>
        {value}
      </span>
      <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{label}</Mono>
    </div>
  );
}
