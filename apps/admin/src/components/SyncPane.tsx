// 설정 → 냥노션: 서버 주소 · 개인 토큰 · 맞출 체크리스트 · 켜고 끄기 · 지금 동기화.
//
// 토큰은 macOS 키체인에(기존 keychainSetToken), 나머지는 localStorage(bento.sync.v1)에.

import { useEffect, useState } from 'react';
import { Mono } from './atoms/Atoms';
import {
  SYNC_STATUS_EVENT,
  chooseChecklist,
  createServerChecklist,
  fetchSyncMe,
  outboxSize,
  readSyncConfig,
  syncNow,
  writeSyncConfig,
  type SyncConfig,
  type SyncMe,
} from '../lib/nyanotionSync';
import {
  SYNC_KEYCHAIN_REMOTE,
  keychainDeleteToken,
  keychainHasToken,
  keychainSetToken,
} from '../lib/tauri';

const inputStyle: React.CSSProperties = {
  padding: '7px 9px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 12,
  width: '100%',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 11.5,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

function when(iso: string | null): string {
  if (!iso) return '아직 없음';
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function SyncPane() {
  const [cfg, setCfg] = useState<SyncConfig>(() => readSyncConfig());
  const [server, setServer] = useState(cfg.serverUrl);
  const [hasToken, setHasToken] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [me, setMe] = useState<SyncMe | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(() => outboxSize());

  useEffect(() => {
    let cancelled = false;
    keychainHasToken(SYNC_KEYCHAIN_REMOTE)
      .then((v) => {
        if (!cancelled) setHasToken(v);
      })
      .catch(() => undefined);
    const onStatus = () => {
      setCfg(readSyncConfig());
      setPending(outboxSize());
    };
    window.addEventListener(SYNC_STATUS_EVENT, onStatus);
    window.addEventListener('bento:sync-dirty', onStatus);
    return () => {
      cancelled = true;
      window.removeEventListener(SYNC_STATUS_EVENT, onStatus);
      window.removeEventListener('bento:sync-dirty', onStatus);
    };
  }, []);

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setMessage(null);
    try {
      await task();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  const saveToken = () =>
    run(async () => {
      const t = tokenInput.trim();
      if (!t.startsWith('nyt_')) throw new Error('냥노션 개인 토큰은 nyt_ 로 시작합니다.');
      await keychainSetToken(SYNC_KEYCHAIN_REMOTE, t);
      setTokenInput('');
      setHasToken(true);
      setMessage('토큰을 키체인에 넣었어요.');
    });

  const connect = () =>
    run(async () => {
      const url = server.trim().replace(/\/+$/, '');
      setCfg(writeSyncConfig({ serverUrl: url }));
      const result = await fetchSyncMe(url);
      setMe(result);
      if (!readSyncConfig().checklistId && result.primaryChecklistId) {
        setCfg(chooseChecklist(result.primaryChecklistId));
      }
      setMessage(`${result.user.name} (${result.user.email}) 으로 연결됐어요.`);
    });

  const makeChecklist = () =>
    run(async () => {
      const title = window.prompt('냥노션에 만들 체크리스트 이름', 'Bento 할 일');
      if (!title) return;
      const id = await createServerChecklist(cfg.serverUrl, title);
      setCfg(chooseChecklist(id));
      setMe(await fetchSyncMe(cfg.serverUrl));
    });

  const toggle = () =>
    run(async () => {
      const next = writeSyncConfig({ enabled: !cfg.enabled });
      setCfg(next);
      if (next.enabled) await syncNow();
    });

  const forget = () =>
    run(async () => {
      if (!window.confirm('키체인의 냥노션 토큰을 지울까요? 동기화가 멈춥니다.')) return;
      await keychainDeleteToken(SYNC_KEYCHAIN_REMOTE);
      setHasToken(false);
      setCfg(writeSyncConfig({ enabled: false }));
    });

  const linked = cfg.checklistId !== null;
  const chosen = me?.checklists.find((c) => c.id === cfg.checklistId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Mono style={{ fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
        할 일·폴더·메모·하위 항목을 냥노션 체크리스트 하나와 맞춥니다. 냥노션이 원본이고, 여기엔
        오프라인 사본이 남습니다. 처음 켜면 이 Mac 의 할 일을 전부 올립니다(서버에 이미 같은 할 일이
        있으면 서버 쪽이 이깁니다).
      </Mono>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>서버 주소</Mono>
        <input
          value={server}
          onChange={(e) => setServer(e.target.value)}
          style={inputStyle}
          placeholder="https://nyanotion.party"
        />
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
          개인 토큰{' '}
          {hasToken ? '· 키체인에 있음' : '· 없음 — 냥노션 → 내 계정 → 개인 토큰에서 만드세요'}
        </Mono>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder={hasToken ? '바꾸려면 새 토큰 붙여넣기' : 'nyt_…'}
            style={inputStyle}
          />
          <button
            style={buttonStyle}
            disabled={busy || tokenInput.trim() === ''}
            onClick={saveToken}
          >
            저장
          </button>
          {hasToken && (
            <button style={buttonStyle} disabled={busy} onClick={forget}>
              지우기
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button style={buttonStyle} disabled={busy || !hasToken} onClick={connect}>
          연결 확인
        </button>
        {me && (
          <>
            <select
              value={cfg.checklistId ?? ''}
              onChange={(e) => {
                if (!e.target.value) return;
                if (
                  cfg.checklistId &&
                  !window.confirm('맞출 체크리스트를 바꾸면 처음부터 다시 맞춥니다. 바꿀까요?')
                )
                  return;
                setCfg(chooseChecklist(e.target.value));
              }}
              style={{ ...inputStyle, width: 'auto', flex: '1 1 200px' }}
            >
              <option value="">맞출 체크리스트 고르기</option>
              {me.checklists.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.spaceKind === 'org' ? `👪 ${c.spaceName} · ` : ''}
                  {c.title || '제목 없음'} ({c.open})
                </option>
              ))}
            </select>
            <button style={buttonStyle} disabled={busy} onClick={makeChecklist}>
              새로 만들기
            </button>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          style={{
            ...buttonStyle,
            background: cfg.enabled ? 'var(--accent)' : 'var(--bg)',
            color: cfg.enabled ? 'var(--bg)' : 'var(--ink)',
          }}
          disabled={busy || !hasToken || !linked}
          onClick={toggle}
        >
          {cfg.enabled ? '동기화 켜짐' : '동기화 켜기'}
        </button>
        <button
          style={buttonStyle}
          disabled={busy || !cfg.enabled}
          onClick={() => run(() => syncNow())}
        >
          지금 동기화
        </button>
        <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
          {chosen ? `${chosen.title} · ` : ''}마지막 {when(cfg.lastSyncAt)} · 보낼 것 {pending}
          {cfg.lastResult &&
            ` · 올림 ${cfg.lastResult.pushed} 받음 ${cfg.lastResult.pulled}` +
              (cfg.lastResult.stale > 0 ? ` (서버가 더 새로움 ${cfg.lastResult.stale})` : '') +
              (cfg.lastResult.rejected > 0 ? ` · 거절 ${cfg.lastResult.rejected}` : '')}
        </Mono>
      </div>

      {(message || cfg.lastError) && (
        <Mono
          style={{
            fontSize: 11,
            color: cfg.lastError && !message ? 'var(--err)' : 'var(--ink-mute)',
          }}
        >
          {message ?? cfg.lastError}
        </Mono>
      )}
    </div>
  );
}
