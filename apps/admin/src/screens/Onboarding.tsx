import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button, Eyebrow, Input, Mono, StatusDot } from '../components/atoms/Atoms';
import {
  macosCalRequestAccess,
  mailAddAccount,
  openPrivacySecurity,
  pickContentRoot,
  setBlogConfig,
  setAppPersonalization,
  type MailAccount,
  type MailAccountInput,
} from '../lib/tauri';

const ONBOARDING_KEY = 'bento.onboarding.done';

export function checkOnboardingDone(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(ONBOARDING_KEY) === '1';
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState('Bento');
  const [appUrl, setAppUrl] = useState('');
  const [hasContentFolder, setHasContentFolder] = useState(false);
  const [contentPath, setContentPath] = useState<string | null>(null);
  const [articlesDir, setArticlesDir] = useState('contents/articles');
  const [notesDir, setNotesDir] = useState('contents/notes');
  const [calStatus, setCalStatus] = useState<'idle' | 'requesting' | 'done' | 'denied'>('idle');
  const [privacyOpened, setPrivacyOpened] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mailAccounts, setMailAccounts] = useState<MailAccount[]>([]);

  const TOTAL_STEPS = 6;

  // 순서: 1=권한, 2=앱이름, 3=폴더, 4=경로(선택), 5=메일, 6=완료
  const goNext = () => {
    if (step === 3 && !hasContentFolder) {
      setStep(5); // 4(경로) 스킵 → 5(메일)
    } else {
      setStep((s) => s + 1);
    }
  };

  const goPrev = () => {
    if (step === 5 && !hasContentFolder) {
      setStep(3); // 4(경로) 스킵됐으므로 3으로
    } else {
      setStep((s) => s - 1);
    }
  };

  const handlePickFolder = async () => {
    const path = await pickContentRoot();
    if (path) setContentPath(path);
  };

  const handleCalRequest = async () => {
    setCalStatus('requesting');
    try {
      await macosCalRequestAccess();
      setCalStatus('done');
    } catch {
      setCalStatus('denied');
    }
  };

  const handlePrivacyOpen = async () => {
    await openPrivacySecurity();
    setPrivacyOpened(true);
  };

  const handleFinish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await setAppPersonalization({
        appName: appName || 'Bento',
        appUrl,
        keychainService: 'bento.git',
        articlesDir: articlesDir || 'contents/articles',
        notesDir: notesDir || 'contents/notes',
      });
      if (hasContentFolder && contentPath) {
        await setBlogConfig({
          enabled: true,
          contentPath,
          gitRemote: null,
          gitBranch: null,
          gitEmail: null,
          gitName: null,
        });
      }
    } catch {
      /* 설정 저장 실패해도 온보딩 완료 처리 */
    }
    window.localStorage.setItem(ONBOARDING_KEY, '1');
    onDone();
  };

  const permissionReady = calStatus !== 'idle' && privacyOpened;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '40px 24px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        <StepIndicator current={step} total={TOTAL_STEPS} skipped={!hasContentFolder ? [4] : []} />

        <div style={{ minHeight: 280 }}>
          {step === 1 && (
            <StepPermissions
              calStatus={calStatus}
              onCalRequest={handleCalRequest}
              privacyOpened={privacyOpened}
              onPrivacyOpen={handlePrivacyOpen}
            />
          )}
          {step === 2 && (
            <StepAppName
              appName={appName}
              appUrl={appUrl}
              onAppName={setAppName}
              onAppUrl={setAppUrl}
            />
          )}
          {step === 3 && (
            <StepContentFolder
              hasContentFolder={hasContentFolder}
              contentPath={contentPath}
              onToggle={setHasContentFolder}
              onPick={handlePickFolder}
            />
          )}
          {step === 4 && (
            <StepCollectionPaths
              articlesDir={articlesDir}
              notesDir={notesDir}
              onArticlesDir={setArticlesDir}
              onNotesDir={setNotesDir}
            />
          )}
          {step === 5 && (
            <StepMailAccounts
              accounts={mailAccounts}
              onAdd={(acc) => setMailAccounts((prev) => [...prev, acc])}
            />
          )}
          {step === 6 && (
            <StepSummary
              appName={appName || 'Bento'}
              appUrl={appUrl}
              hasContentFolder={hasContentFolder}
              contentPath={contentPath}
              articlesDir={articlesDir}
              notesDir={notesDir}
              calStatus={calStatus}
              mailAccountCount={mailAccounts.length}
            />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {step > 1 ? (
            <Button ghost sm onClick={goPrev}>
              ← 뒤로
            </Button>
          ) : (
            <div />
          )}
          {step < TOTAL_STEPS ? (
            <Button sm onClick={goNext} disabled={step === 1 && !permissionReady}>
              다음 →
            </Button>
          ) : (
            <Button sm onClick={handleFinish} disabled={busy}>
              {busy ? '저장 중…' : '시작하기'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({
  current,
  total,
  skipped,
}: {
  current: number;
  total: number;
  skipped: number[];
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const isSkipped = skipped.includes(n);
        const isCurrent = n === current;
        const isPast = n < current && !isSkipped;
        return (
          <div
            key={n}
            style={{
              width: isCurrent ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: isCurrent
                ? 'var(--ink)'
                : isPast
                  ? 'var(--ink-mute)'
                  : 'var(--line)',
              transition: 'width 200ms, background 200ms',
            }}
          />
        );
      })}
    </div>
  );
}

function StepPermissions({
  calStatus,
  onCalRequest,
  privacyOpened,
  onPrivacyOpen,
}: {
  calStatus: 'idle' | 'requesting' | 'done' | 'denied';
  onCalRequest: () => void;
  privacyOpened: boolean;
  onPrivacyOpen: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            margin: '0 0 6px',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.4px',
          }}
        >
          필요한 권한
        </h1>
        <Mono style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
          앱 기능에 필요한 시스템 권한을 허용합니다
        </Mono>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Eyebrow>시스템 권한</Eyebrow>
        <PermRow
          icon="📅"
          title="캘린더"
          desc="macOS 일정을 가져와 플래너·오늘 화면에 표시합니다"
          action={
            calStatus === 'done' ? (
              <Mono style={{ fontSize: 11, color: 'var(--green, #22c55e)' }}>허용됨</Mono>
            ) : calStatus === 'denied' ? (
              <Mono style={{ fontSize: 11, color: 'var(--ink-mute)' }}>거부됨</Mono>
            ) : (
              <Button ghost sm onClick={onCalRequest} disabled={calStatus === 'requesting'}>
                {calStatus === 'requesting' ? '요청 중…' : '허용'}
              </Button>
            )
          }
        />
        <PermRow
          icon="📋"
          title="클립보드"
          desc="복사 히스토리를 추적해 빠른 붙여넣기를 지원합니다"
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Eyebrow>개인정보 보안</Eyebrow>
        <PermRow
          icon="🔒"
          title="개인정보 보호 및 보안"
          desc="macOS 시스템 설정에서 앱 접근 권한을 직접 확인하고 설정합니다"
          action={
            privacyOpened ? (
              <Mono style={{ fontSize: 11, color: 'var(--green, #22c55e)' }}>확인됨</Mono>
            ) : (
              <Button ghost sm onClick={onPrivacyOpen}>
                열기
              </Button>
            )
          }
        />
      </div>
      {(!privacyOpened || calStatus === 'idle') && (
        <Mono style={{ fontSize: 11, color: 'var(--ink-mute)', textAlign: 'center' }}>
          위 항목을 모두 확인해야 다음으로 진행할 수 있습니다
        </Mono>
      )}
    </div>
  );
}

function StepAppName({
  appName,
  appUrl,
  onAppName,
  onAppUrl,
}: {
  appName: string;
  appUrl: string;
  onAppName: (v: string) => void;
  onAppUrl: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'var(--bg-shade)',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            margin: '0 auto 14px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink)',
          }}
        >
          ⊞
        </div>
        <h1
          style={{
            margin: '0 0 6px',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.4px',
          }}
        >
          어떤 앱을 만드시나요?
        </h1>
        <Mono style={{ fontSize: 12, color: 'var(--ink-mute)' }}>앱 이름과 URL을 설정합니다</Mono>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="앱 이름">
          <Input
            value={appName}
            onChange={(e) => onAppName(e.target.value)}
            placeholder="Bento"
          />
        </Field>
        <Field label="앱 URL (선택)">
          <Input
            value={appUrl}
            onChange={(e) => onAppUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </Field>
      </div>
    </div>
  );
}

function StepContentFolder({
  hasContentFolder,
  contentPath,
  onToggle,
  onPick,
}: {
  hasContentFolder: boolean;
  contentPath: string | null;
  onToggle: (v: boolean) => void;
  onPick: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            margin: '0 0 6px',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.4px',
          }}
        >
          글·메모 폴더가 있나요?
        </h2>
        <Mono style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
          블로그나 노트 콘텐츠 폴더를 연결합니다
        </Mono>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ToggleRow label="콘텐츠 폴더 연결" checked={hasContentFolder} onChange={onToggle} />
        {hasContentFolder && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button ghost sm onClick={onPick}>
              📁 폴더 선택
            </Button>
            {contentPath && (
              <Mono
                style={{
                  fontSize: 11,
                  color: 'var(--ink-mute)',
                  padding: '6px 10px',
                  background: 'var(--bg-soft)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  wordBreak: 'break-all',
                }}
              >
                {contentPath}
              </Mono>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StepCollectionPaths({
  articlesDir,
  notesDir,
  onArticlesDir,
  onNotesDir,
}: {
  articlesDir: string;
  notesDir: string;
  onArticlesDir: (v: string) => void;
  onNotesDir: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{
            margin: '0 0 6px',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.4px',
          }}
        >
          컬렉션 경로
        </h2>
        <Mono style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
          폴더 내 글과 메모의 하위 경로를 지정합니다
        </Mono>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="글 폴더">
          <Input
            value={articlesDir}
            onChange={(e) => onArticlesDir(e.target.value)}
            placeholder="contents/articles"
          />
        </Field>
        <Field label="메모 폴더">
          <Input
            value={notesDir}
            onChange={(e) => onNotesDir(e.target.value)}
            placeholder="contents/notes"
          />
        </Field>
      </div>
    </div>
  );
}

function StepMailAccounts({
  accounts,
  onAdd,
}: {
  accounts: MailAccount[];
  onAdd: (acc: MailAccount) => void;
}) {
  const [label, setLabel] = useState('');
  const [host, setHost] = useState('imap.gmail.com');
  const [port, setPort] = useState(993);
  const [tls, setTls] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testState, setTestState] = useState<'idle' | 'ok' | 'fail'>('idle');

  const canAdd = label.trim() && host.trim() && username.trim() && password.length > 0 && !busy;

  const handleAdd = async () => {
    if (!canAdd) return;
    setBusy(true);
    setError(null);
    setTestState('idle');
    try {
      const input: MailAccountInput = {
        label: label.trim(),
        host: host.trim(),
        port,
        tls,
        username: username.trim(),
        password,
      };
      const saved = await mailAddAccount(input);
      onAdd(saved);
      setLabel('');
      setUsername('');
      setPassword('');
      setTestState('ok');
    } catch (err) {
      setError(String(err));
      setTestState('fail');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 28,
            margin: '0 auto 12px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          ✉
        </div>
        <h2
          style={{
            margin: '0 0 6px',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.4px',
          }}
        >
          메일 계정 연결
        </h2>
        <Mono style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
          IMAP 계정을 추가하면 앱 안에서 메일을 바로 확인할 수 있어요
        </Mono>
      </div>

      {accounts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Eyebrow>추가된 계정</Eyebrow>
          {accounts.map((acc, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                border: '1px solid var(--line)',
                borderRadius: 6,
                background: 'var(--bg-soft)',
              }}
            >
              <StatusDot tone="ok" />
              <span style={{ fontSize: 13, color: 'var(--ink)', flex: 1 }}>{acc.label}</span>
              <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{acc.username}</Mono>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field label="표시 이름">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="개인 메일" />
        </Field>
        <Field label="호스트">
          <Input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="imap.gmail.com"
            mono
          />
        </Field>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: '0 0 90px' }}>
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
        <Field label="비밀번호">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            mono
          />
        </Field>
      </div>

      {error && (
        <Mono style={{ fontSize: 11, color: 'var(--err)', lineHeight: 1.4 }}>{error}</Mono>
      )}

      {testState === 'ok' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot tone="ok" />
          <Mono style={{ fontSize: 11, color: 'var(--ink-2)' }}>계정이 추가됐습니다</Mono>
        </div>
      )}

      <Button sm onClick={handleAdd} disabled={!canAdd}>
        {busy ? '추가 중…' : '+ 계정 추가'}
      </Button>
    </div>
  );
}

function StepSummary({
  appName,
  appUrl,
  hasContentFolder,
  contentPath,
  articlesDir,
  notesDir,
  calStatus,
  mailAccountCount,
}: {
  appName: string;
  appUrl: string;
  hasContentFolder: boolean;
  contentPath: string | null;
  articlesDir: string;
  notesDir: string;
  calStatus: string;
  mailAccountCount: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--bg-shade)',
            border: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            margin: '0 auto 12px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink)',
          }}
        >
          ✓
        </div>
        <h2
          style={{
            margin: '0 0 6px',
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--ink)',
            letterSpacing: '-0.4px',
          }}
        >
          설정 완료
        </h2>
        <Mono style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
          아래 내용으로 {appName}을 시작합니다
        </Mono>
      </div>
      <div style={{ border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
        <SummaryRow label="앱 이름" value={appName} />
        {appUrl && <SummaryRow label="앱 URL" value={appUrl} />}
        <SummaryRow
          label="콘텐츠 폴더"
          value={hasContentFolder && contentPath ? contentPath : '연결 안 함'}
        />
        {hasContentFolder && contentPath && (
          <>
            <SummaryRow label="글 폴더" value={articlesDir || 'contents/articles'} />
            <SummaryRow label="메모 폴더" value={notesDir || 'contents/notes'} />
          </>
        )}
        <SummaryRow
          label="캘린더 권한"
          value={calStatus === 'done' ? '허용됨' : calStatus === 'denied' ? '거부됨' : '미요청'}
        />
        <SummaryRow
          label="메일 계정"
          value={mailAccountCount > 0 ? `${mailAccountCount}개 연결됨` : '연결 안 함'}
          last
        />
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Mono
        style={{
          fontSize: 10.5,
          color: 'var(--ink-mute)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Mono>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '11px 14px',
        border: '1px solid var(--line)',
        borderRadius: 8,
        background: 'var(--bg-soft)',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 16, height: 16, cursor: 'pointer' }}
      />
    </label>
  );
}

function PermRow({
  icon,
  title,
  desc,
  action,
}: {
  icon: string;
  title: string;
  desc: string;
  action?: ReactNode;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '11px 14px',
        border: '1px solid var(--line)',
        borderRadius: 8,
        background: 'var(--bg-soft)',
      }}
    >
      <span style={{ fontSize: 18, lineHeight: 1, flex: '0 0 auto', marginTop: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', marginBottom: 2 }}>
          {title}
        </div>
        <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', lineHeight: 1.5 }}>{desc}</Mono>
      </div>
      {action && <div style={{ flex: '0 0 auto' }}>{action}</div>}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 12,
        padding: '10px 14px',
        borderBottom: last ? 'none' : '1px solid var(--line)',
      }}
    >
      <Mono style={{ fontSize: 11, color: 'var(--ink-mute)', flexShrink: 0 }}>{label}</Mono>
      <span
        style={{
          fontSize: 12,
          color: 'var(--ink)',
          textAlign: 'right',
          wordBreak: 'break-all',
          maxWidth: '60%',
        }}
      >
        {value}
      </span>
    </div>
  );
}
