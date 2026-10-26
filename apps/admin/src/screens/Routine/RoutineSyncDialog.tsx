import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { listen } from '@tauri-apps/api/event';
import { Eyebrow, Input, Mono } from '../../components/atoms/Atoms';
import {
  ROUTINE_SYNC_STATUS_EVENT,
  routineSyncConfigure,
  routineSyncNow,
  routineSyncSetToken,
  routineSyncStatus,
  type RoutineSyncStatus,
} from '../../lib/tauri';

/** 지금 상태를 읽고, Rust 가 상태 이벤트를 보낼 때마다 다시 읽는다. */
export function useRoutineSyncStatus(): [RoutineSyncStatus | null, (s: RoutineSyncStatus) => void] {
  const [status, setStatus] = useState<RoutineSyncStatus | null>(null);
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | null = null;
    const load = () =>
      routineSyncStatus()
        .then((s) => {
          if (!cancelled) setStatus(s);
        })
        .catch(() => {
          // 커맨드가 없는 이전 빌드 — 단추를 숨긴다
          if (!cancelled) setStatus(null);
        });
    void load();
    listen(ROUTINE_SYNC_STATUS_EVENT, () => void load()).then((fn) => {
      if (cancelled) fn();
      else unlisten = fn;
    });
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      unlisten?.();
      window.clearInterval(id);
    };
  }, []);
  return [status, setStatus];
}

function ago(iso: string | null): string {
  if (!iso) return '아직 없음';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return iso;
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return '방금';
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return new Date(t).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  open: boolean;
  status: RoutineSyncStatus | null;
  onStatus: (s: RoutineSyncStatus) => void;
  onClose: () => void;
}

export function RoutineSyncDialog({ open, status, onStatus, onClose }: Props) {
  const [server, setServer] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (open && status) setServer(status.serverUrl);
    // 열 때 한 번만 채운다 — 입력 중에 상태 이벤트가 와도 덮지 않게
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!confirmClear) return;
    const t = window.setTimeout(() => setConfirmClear(false), 4000);
    return () => window.clearTimeout(t);
  }, [confirmClear]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !status) return null;

  const run = async (fn: () => Promise<RoutineSyncStatus | void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const next = await fn();
      if (next) onStatus(next);
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const serverDirty = server.trim().replace(/\/+$/, '') !== status.serverUrl;
  const saveServer = () => run(() => routineSyncConfigure({ serverUrl: server }));
  const saveToken = () =>
    run(async () => {
      const s = await routineSyncSetToken(token);
      setToken('');
      return s;
    });
  const clearToken = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setConfirmClear(false);
    void run(() => routineSyncSetToken(''));
  };
  const toggle = () => run(() => routineSyncConfigure({ enabled: !status.enabled }));
  const syncNow = () =>
    run(async () => {
      await routineSyncNow();
      return routineSyncStatus();
    });

  const r = status.lastResult;
  const firstLink = !status.linked;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={overlay}
    >
      <div role="dialog" aria-modal="true" aria-label="루틴 동기화" style={panel}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Eyebrow>루틴 동기화 · 도란</Eyebrow>
          <button onClick={onClose} title="닫기 (ESC)" style={closeBtn}>
            ×
          </button>
        </div>
        <p style={lead}>
          아이폰 루틴 앱과 같은 도란 계정으로 루틴 · 기록 · 타이머를 맞춰요. 고친 지 2초 뒤와
          1분마다 올리고 받으며, 같은 것을 양쪽에서 고쳤으면 나중에 고친 쪽이 남아요.
        </p>

        <Field label="서버">
          <div style={{ display: 'flex', gap: 6 }}>
            <Input
              value={server}
              onChange={(e) => setServer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && serverDirty) void saveServer();
              }}
              spellCheck={false}
              style={{ flex: 1 }}
            />
            {serverDirty && (
              <button onClick={() => void saveServer()} disabled={busy} style={ghostBtn}>
                저장
              </button>
            )}
          </div>
          {serverDirty && status.linked && (
            <Hint>서버를 바꾸면 처음 연결부터 다시 해요 (이 맥의 기록은 그대로).</Hint>
          )}
        </Field>

        <Field label="개인 토큰">
          {status.hasToken ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mono style={{ fontSize: 12, color: 'var(--ink-soft)' }}>키체인에 저장됨</Mono>
              <button onClick={clearToken} disabled={busy} style={dangerBtn(confirmClear)}>
                {confirmClear ? '한 번 더 누르면 지워요' : '지우기'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <Input
                type="password"
                value={token}
                placeholder="nyt_…"
                onChange={(e) => setToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && token.trim()) void saveToken();
                }}
                spellCheck={false}
                autoComplete="off"
                style={{ flex: 1 }}
              />
              <button
                onClick={() => void saveToken()}
                disabled={busy || !token.trim()}
                style={ghostBtn}
              >
                저장
              </button>
            </div>
          )}
          <Hint>
            도란 웹 › 계정 › 개인 토큰에서 만들어요. 체크리스트 동기화와 같은 자리를 써서 한 번만
            넣으면 돼요. 토큰은 웹뷰로 돌아오지 않아요.
          </Hint>
        </Field>

        <label style={toggleRow}>
          <input
            type="checkbox"
            checked={status.enabled}
            disabled={busy || (!status.enabled && !status.hasToken)}
            onChange={() => void toggle()}
          />
          <span style={{ fontSize: 13, color: 'var(--ink)' }}>동기화 켜기</span>
          {!status.hasToken && !status.enabled && (
            <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>토큰을 먼저 넣어 주세요</Mono>
          )}
        </label>
        {firstLink && (
          <Hint>
            처음 맞출 때는 이 맥의 루틴과 기록을 모두 올리고 서버(아이폰)에 있는 것을 받아 합쳐요.
            같은 루틴이 양쪽에 있으면 서버 쪽을 남겨요. 그 직전에 루틴 파일 세 개를
            backups/routine-sync-&lt;시각&gt;/ 에 복사해 둬요.
          </Hint>
        )}

        {(status.enabled || status.linked) && (
          <div style={statusBox}>
            <Row k="상태">
              {status.running
                ? '맞추는 중…'
                : status.lastError
                  ? '멈춤 — 아래 오류'
                  : status.enabled
                    ? '켜짐'
                    : '꺼짐 (변경은 쌓아 둬요)'}
            </Row>
            <Row k="마지막 동기화">{ago(status.lastSyncAt)}</Row>
            <Row k="올릴 변경">{status.pending === 0 ? '없음' : `${status.pending}건`}</Row>
            {r && (
              <Row k="마지막 결과">
                올림 {r.pushed} · 받음 {r.pulled}
                {r.stale > 0 && ` · 서버가 더 새로움 ${r.stale}`}
                {r.rejected > 0 && ` · 거절 ${r.rejected}`}
              </Row>
            )}
            {status.firstLinkBackup && (
              <Row k="처음 연결 백업">
                <Mono style={{ fontSize: 11, wordBreak: 'break-all' }}>
                  {status.firstLinkBackup}
                </Mono>
              </Row>
            )}
            {status.lastError && (
              <Mono style={{ fontSize: 11, color: 'var(--err)', lineHeight: 1.5 }}>
                {status.lastError}
              </Mono>
            )}
          </div>
        )}

        {error && <Mono style={{ fontSize: 11, color: 'var(--err)' }}>{error}</Mono>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={ghostBtn}>
            닫기
          </button>
          <button
            onClick={() => void syncNow()}
            disabled={busy || status.running || !status.hasToken}
            style={primaryBtn(!(busy || status.running || !status.hasToken))}
          >
            {busy || status.running ? '맞추는 중…' : '지금 맞추기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{label}</Mono>
      {children}
    </div>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: 0, fontSize: 11.5, lineHeight: 1.6, color: 'var(--ink-mute)' }}>
      {children}
    </p>
  );
}

function Row({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 12, alignItems: 'baseline' }}>
      <span style={{ width: 92, flexShrink: 0, color: 'var(--ink-mute)' }}>{k}</span>
      <span style={{ color: 'var(--ink)', minWidth: 0 }}>{children}</span>
    </div>
  );
}

/** 헤더 단추 — 켜져 있으면 점 색으로 상태를 보인다. */
export function SyncButton({
  status,
  onClick,
  style,
}: {
  status: RoutineSyncStatus | null;
  onClick: () => void;
  style: CSSProperties;
}) {
  if (!status) return null;
  const color = !status.enabled
    ? 'var(--ink-faint)'
    : status.lastError
      ? 'var(--err)'
      : status.running || status.pending > 0
        ? 'var(--warn)'
        : 'var(--ok)';
  const title = !status.enabled
    ? '도란 동기화 꺼짐'
    : status.lastError
      ? `동기화 오류: ${status.lastError}`
      : status.pending > 0
        ? `올릴 변경 ${status.pending}건`
        : `마지막 동기화 ${ago(status.lastSyncAt)}`;
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ ...style, display: 'inline-flex', alignItems: 'center', gap: 6 }}
    >
      <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      동기화
    </button>
  );
}

const overlay: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 100,
  padding: 16,
};

const panel: CSSProperties = {
  width: 'min(520px, 94vw)',
  maxHeight: '88vh',
  background: 'var(--bg-soft)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-pop)',
  padding: '20px 22px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  overflowY: 'auto',
};

const lead: CSSProperties = {
  margin: 0,
  fontSize: 12.5,
  lineHeight: 1.65,
  color: 'var(--ink-soft)',
};

const toggleRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  cursor: 'pointer',
};

const statusBox: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '12px 14px',
  border: '1px solid var(--line)',
  borderRadius: 8,
  background: 'var(--bg)',
};

const ghostBtn: CSSProperties = {
  padding: '6px 12px',
  fontSize: 12,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

function primaryBtn(enabled: boolean): CSSProperties {
  return {
    padding: '7px 14px',
    fontSize: 12,
    border: 'none',
    background: enabled ? 'var(--ink)' : 'var(--bg-shade)',
    color: enabled ? 'var(--on-accent)' : 'var(--ink-mute)',
    borderRadius: 6,
    cursor: enabled ? 'pointer' : 'default',
    fontFamily: 'inherit',
    fontWeight: 500,
  };
}

function dangerBtn(confirming: boolean): CSSProperties {
  return {
    padding: '4px 8px',
    fontSize: 11,
    border: `1px solid ${confirming ? 'var(--err)' : 'var(--line)'}`,
    background: confirming ? 'var(--err)' : 'transparent',
    color: confirming ? 'var(--on-accent)' : 'var(--err)',
    borderRadius: 4,
    fontFamily: 'inherit',
    cursor: 'pointer',
  };
}

const closeBtn: CSSProperties = {
  width: 22,
  height: 22,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: 'var(--ink-mute)',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
};
