import { useState } from 'react';
import { Button, Eyebrow, Input, Mono, StatusDot } from '../../components/atoms/Atoms';
import {
  mailAddAccount,
  mailDeleteAccount,
  mailOAuthStart,
  mailTestConnection,
  mailUpdateAccount,
  type MailAccount,
  type MailAccountInput,
} from '../../lib/tauri';

type TestState = 'idle' | 'testing' | 'ok' | 'fail';

export function AccountDialog({
  account,
  onSave,
  onClose,
}: {
  account?: MailAccount;
  onSave: (account: MailAccount) => void;
  onClose: () => void;
}) {
  const editing = !!account;
  const [label, setLabel] = useState(account?.label ?? '');
  const [host, setHost] = useState(account?.host ?? 'imap.gmail.com');
  const [port, setPort] = useState<number>(account?.port ?? 993);
  const [tls, setTls] = useState<boolean>(account?.tls ?? true);
  const [username, setUsername] = useState(account?.username ?? '');
  const [password, setPassword] = useState('');
  const [test, setTest] = useState<TestState>('idle');
  const [testMsg, setTestMsg] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authKind, setAuthKind] = useState<'password' | 'oauth'>(
    account?.authKind === 'oauth2' ? 'oauth' : 'password',
  );
  const [oauthClientId, setOauthClientId] = useState('');
  const [oauthClientSecret, setOauthClientSecret] = useState('');
  const [oauthBusy, setOauthBusy] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const canSave =
    authKind === 'password' &&
    label.trim().length > 0 &&
    host.trim().length > 0 &&
    username.trim().length > 0 &&
    (editing || password.length > 0);

  const handleSave = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    setError(null);
    setTest('idle');
    setTestMsg('');
    try {
      const input: MailAccountInput = {
        id: account?.id,
        label: label.trim(),
        host: host.trim(),
        port,
        tls,
        username: username.trim(),
        password,
      };
      const saved = editing ? await mailUpdateAccount(input) : await mailAddAccount(input);
      setTest('testing');
      try {
        await mailTestConnection(saved.id);
        setTest('ok');
        onSave(saved);
        onClose();
      } catch (err) {
        setTest('fail');
        setTestMsg(String(err));
        if (!editing) {
          await mailDeleteAccount(saved.id).catch(() => {});
        }
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!editing || !account) return;
    if (!confirm(`"${account.label}" 계정을 삭제하시겠습니까?\n저장된 자격증명이 영구 삭제됩니다.`))
      return;
    setBusy(true);
    try {
      await mailDeleteAccount(account.id);
      onClose();
      window.dispatchEvent(new CustomEvent('bento:mail-accounts-changed'));
    } catch (err) {
      setError(String(err));
      setBusy(false);
    }
  };

  const handleOAuthStart = async () => {
    if (!oauthClientId.trim() || !oauthClientSecret.trim() || !label.trim()) return;
    setOauthBusy(true);
    setOauthError(null);
    try {
      const saved = await mailOAuthStart({
        clientId: oauthClientId.trim(),
        clientSecret: oauthClientSecret.trim(),
        label: label.trim(),
      });
      onSave(saved);
      onClose();
    } catch (e) {
      setOauthError(e instanceof Error ? e.message : String(e));
    } finally {
      setOauthBusy(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9000,
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 'var(--gap-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--gap-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>
            {editing ? '계정 편집' : '계정 추가'}
          </h2>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>IMAP</Mono>
        </div>

        <Field label="표시 이름">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="개인 메일"
            autoFocus
          />
        </Field>

        {!editing && (
          <div style={{ display: 'flex', gap: 6 }}>
            {(['password', 'oauth'] as const).map((kind) => (
              <button
                key={kind}
                onClick={() => setAuthKind(kind)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--line)',
                  background: authKind === kind ? 'var(--bg-shade)' : 'transparent',
                  color: authKind === kind ? 'var(--ink)' : 'var(--ink-2)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: authKind === kind ? 600 : 400,
                }}
              >
                {kind === 'password' ? 'IMAP 비밀번호' : 'Google OAuth'}
              </button>
            ))}
          </div>
        )}

        {authKind === 'password' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="호스트">
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="imap.gmail.com"
                mono
              />
            </Field>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: '0 0 100px' }}>
                <Field label="포트">
                  <Input
                    type="number"
                    value={port}
                    onChange={(e) => setPort(parseInt(e.target.value, 10) || 993)}
                    mono
                  />
                </Field>
              </div>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  padding: '8px 0',
                }}
              >
                <input
                  type="checkbox"
                  checked={tls}
                  onChange={(e) => {
                    setTls(e.target.checked);
                    setPort(e.target.checked ? 993 : 143);
                  }}
                  style={{ accentColor: 'var(--ink)', margin: 0 }}
                />
                TLS / SSL
              </label>
            </div>
            <Field label="사용자 이름">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="me@example.com"
                mono
              />
            </Field>
            <Field label={editing ? '비밀번호 (변경 시에만 입력)' : '비밀번호'}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editing ? '비워두면 기존 값 유지' : '••••••••'}
                mono
              />
            </Field>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Google OAuth Client ID">
              <Input
                value={oauthClientId}
                onChange={(e) => setOauthClientId(e.target.value)}
                placeholder="123456789.apps.googleusercontent.com"
                mono
              />
            </Field>
            <Field label="Client Secret">
              <Input
                type="password"
                value={oauthClientSecret}
                onChange={(e) => setOauthClientSecret(e.target.value)}
                placeholder="GOCSPX-..."
                mono
              />
            </Field>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              Google Cloud Console에서 &ldquo;데스크톱 앱&rdquo; 유형의 OAuth 2.0 클라이언트를 만들고
              Client ID와 Client Secret을 입력하세요.
              <br />
              스코프: <code style={{ fontFamily: 'monospace' }}>https://mail.google.com/</code>
            </p>
            {oauthError && (
              <div
                style={{
                  padding: '8px 10px',
                  border: '1px solid var(--err-soft, rgba(248,113,113,0.3))',
                  background: 'var(--bg-soft)',
                  borderRadius: 6,
                  color: 'var(--err)',
                  fontSize: 12,
                }}
              >
                {oauthError}
              </div>
            )}
          </div>
        )}

        {test !== 'idle' && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '8px 10px',
              border: '1px solid var(--line)',
              borderRadius: 6,
              background: 'var(--bg-soft)',
            }}
          >
            {test === 'fail' ? (() => {
              const parsed = parseTestError(testMsg);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusDot tone="err" />
                    <Mono style={{ fontSize: 11, color: 'var(--err)' }}>{parsed.summary}</Mono>
                  </div>
                  {parsed.hint && (
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-2)', lineHeight: 1.5, paddingLeft: 16 }}>
                      {parsed.hint}
                    </p>
                  )}
                  <details style={{ paddingLeft: 16 }}>
                    <summary style={{ fontSize: 10, color: 'var(--ink-mute)', cursor: 'pointer', userSelect: 'none' }}>
                      상세 오류 보기
                    </summary>
                    <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', display: 'block', marginTop: 4, wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                      {testMsg}
                    </Mono>
                  </details>
                </div>
              );
            })() : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusDot
                  tone={test === 'ok' ? 'ok' : 'mute'}
                  pulse={test === 'testing'}
                />
                <Mono style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                  {test === 'testing' ? '연결 테스트 중…' : testMsg}
                </Mono>
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '8px 10px',
              border: '1px solid var(--err-soft, rgba(248,113,113,0.3))',
              background: 'var(--bg-soft)',
              borderRadius: 6,
              color: 'var(--err)',
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editing ? (
            <Button danger sm onClick={handleDelete} disabled={busy || oauthBusy}>
              삭제
            </Button>
          ) : (
            <div />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button ghost sm onClick={onClose} disabled={busy || oauthBusy}>
              취소
            </Button>
            {authKind === 'password' ? (
              <Button sm onClick={handleSave} disabled={!canSave || busy}>
                {busy ? '저장 중…' : test === 'fail' ? '다시 시도' : '저장'}
              </Button>
            ) : (
              <Button
                sm
                onClick={handleOAuthStart}
                disabled={
                  !oauthClientId.trim() ||
                  !oauthClientSecret.trim() ||
                  !label.trim() ||
                  oauthBusy
                }
              >
                {oauthBusy ? '브라우저 인증 대기 중…' : 'Google로 인증'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseTestError(msg: string): { summary: string; hint?: string } {
  if (msg.includes('Application-specific password')) {
    return {
      summary: '앱 비밀번호가 필요합니다',
      hint: 'Google 계정은 일반 비밀번호 대신 앱 비밀번호를 사용해야 합니다. Google 계정 보안 설정에서 앱 비밀번호를 생성하세요.',
    };
  }
  if (msg.includes('authentication') || msg.includes('login') || msg.includes('Login')) {
    return { summary: '인증 실패 — 사용자 이름이나 비밀번호를 확인하세요' };
  }
  if (msg.includes('timed out') || msg.includes('timeout')) {
    return { summary: '연결 시간 초과 — 호스트와 포트를 확인하세요' };
  }
  if (msg.includes('Connection refused') || msg.includes('connection refused')) {
    return { summary: '연결 거부됨 — 호스트와 포트를 확인하세요' };
  }
  return { summary: '연결 실패' };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  );
}
