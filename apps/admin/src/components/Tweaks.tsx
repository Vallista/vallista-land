import { useEffect, useState } from 'react';
import { Mono } from './atoms/Atoms';
import {
  appSetupStatus,
  blogPull,
  blogSetupWorkspace,
  keychainDeleteToken,
  keychainHasToken,
  keychainSetToken,
  llmStatus,
  migrateReports,
  pickContentRoot,
  setBlogConfig,
  type LlmStatus,
  type MigrateReportsReport,
} from '../lib/tauri';

export type Theme = 'dark' | 'light';
export type Density = 'compact' | 'cozy' | 'spacious';
export type WeekStart = 'mon' | 'sun';
export type AutoFlag = 'on' | 'off';

const THEME_KEY = 'bento.theme';
const DENSITY_KEY = 'bento.density';
const WEEK_START_KEY = 'bento.summary.weekStartDay';
const AUTO_ENABLED_KEY = 'bento.summary.autoEnabled';

const THEMES: { value: Theme; label: string; hint: string }[] = [
  { value: 'dark', label: 'Dark', hint: '밤·작업' },
  { value: 'light', label: 'Paper', hint: '낮·종이' },
];

const DENSITIES: { value: Density; label: string; hint: string }[] = [
  { value: 'compact', label: 'Compact', hint: '많이 보기' },
  { value: 'cozy', label: 'Cozy', hint: '편안하게' },
  { value: 'spacious', label: 'Spacious', hint: '여백 위주' },
];

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const v = window.localStorage.getItem(THEME_KEY);
  return v === 'light' ? 'light' : 'dark';
}

function readDensity(): Density {
  if (typeof window === 'undefined') return 'compact';
  const v = window.localStorage.getItem(DENSITY_KEY);
  return v === 'cozy' || v === 'spacious' ? v : 'compact';
}

function readWeekStart(): WeekStart {
  if (typeof window === 'undefined') return 'mon';
  const v = window.localStorage.getItem(WEEK_START_KEY);
  return v === 'sun' ? 'sun' : 'mon';
}

function readAutoEnabled(): AutoFlag {
  if (typeof window === 'undefined') return 'on';
  const v = window.localStorage.getItem(AUTO_ENABLED_KEY);
  return v === 'false' ? 'off' : 'on';
}

function applyAttrs(theme: Theme, density: Density) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-density', density);
}

export function applyInitialTweaks(): void {
  applyAttrs(readTheme(), readDensity());
}

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenIcal?: () => void;
  onOpenLLMSetup?: () => void;
}

interface BlogFormState {
  enabled: boolean;
  contentPath: string;
  gitRemote: string;
  gitBranch: string;
  gitName: string;
  gitEmail: string;
  blogReady: boolean;
  reportsMigrated: boolean;
}

const EMPTY_BLOG_FORM: BlogFormState = {
  enabled: false,
  contentPath: '',
  gitRemote: '',
  gitBranch: '',
  gitName: '',
  gitEmail: '',
  blogReady: false,
  reportsMigrated: false,
};

export function Tweaks({ open, onClose, onOpenIcal, onOpenLLMSetup }: Props) {
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [density, setDensity] = useState<Density>(readDensity);
  const [weekStart, setWeekStart] = useState<WeekStart>(readWeekStart);
  const [autoEnabled, setAutoEnabled] = useState<AutoFlag>(readAutoEnabled);
  const [llm, setLlm] = useState<LlmStatus | null>(null);
  const [blogForm, setBlogForm] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [blogStatus, setBlogStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [blogError, setBlogError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenSaved, setTokenSaved] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'saving' | 'saved' | 'deleting' | 'error'>('idle');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [workspaceStatus, setWorkspaceStatus] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const [workspaceMessage, setWorkspaceMessage] = useState<string | null>(null);
  const [migrateStatus, setMigrateStatus] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const [migrateMessage, setMigrateMessage] = useState<string | null>(null);
  const [confirmMigrate, setConfirmMigrate] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_KEY, theme);
    window.localStorage.setItem(DENSITY_KEY, density);
    applyAttrs(theme, density);
  }, [theme, density]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(WEEK_START_KEY, weekStart);
    window.localStorage.setItem(AUTO_ENABLED_KEY, autoEnabled === 'on' ? 'true' : 'false');
  }, [weekStart, autoEnabled]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !onOpenLLMSetup) return;
    let cancelled = false;
    llmStatus()
      .then((s) => {
        if (!cancelled) setLlm(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, onOpenLLMSetup]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    appSetupStatus()
      .then((s) => {
        if (cancelled) return;
        setBlogForm({
          enabled: s.blogEnabled,
          contentPath: s.contentPath ?? '',
          gitRemote: s.gitRemote ?? '',
          gitBranch: s.gitBranch ?? '',
          gitName: s.gitName ?? '',
          gitEmail: s.gitEmail ?? '',
          blogReady: s.blogReady,
          reportsMigrated: s.reportsMigrated,
        });
        setBlogStatus('idle');
        setBlogError(null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  const updateBlog = <K extends keyof BlogFormState>(key: K, value: BlogFormState[K]) => {
    setBlogForm((prev) => ({ ...prev, [key]: value }));
    setBlogStatus('idle');
  };

  const handlePickPath = async () => {
    try {
      const p = await pickContentRoot();
      if (p) updateBlog('contentPath', p);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const remote = blogForm.gitRemote.trim();
    if (!remote) {
      setTokenSaved(false);
      return;
    }
    let cancelled = false;
    keychainHasToken(remote)
      .then((has) => {
        if (!cancelled) setTokenSaved(has);
      })
      .catch(() => {
        if (!cancelled) setTokenSaved(false);
      });
    return () => {
      cancelled = true;
    };
  }, [blogForm.gitRemote]);

  const handleTokenSave = async () => {
    const remote = blogForm.gitRemote.trim();
    if (!remote) {
      setTokenError('git 원격 주소를 먼저 저장하세요.');
      setTokenStatus('error');
      return;
    }
    if (!tokenInput.trim()) return;
    setTokenStatus('saving');
    setTokenError(null);
    try {
      await keychainSetToken(remote, tokenInput.trim());
      setTokenInput('');
      setTokenSaved(true);
      setTokenStatus('saved');
      window.setTimeout(() => {
        setTokenStatus((s) => (s === 'saved' ? 'idle' : s));
      }, 1500);
    } catch (e) {
      setTokenStatus('error');
      setTokenError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleTokenDelete = async () => {
    const remote = blogForm.gitRemote.trim();
    if (!remote) return;
    setTokenStatus('deleting');
    setTokenError(null);
    try {
      await keychainDeleteToken(remote);
      setTokenSaved(false);
      setTokenStatus('idle');
    } catch (e) {
      setTokenStatus('error');
      setTokenError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleWorkspaceSetup = async () => {
    setWorkspaceStatus('busy');
    setWorkspaceMessage(null);
    try {
      const msg = await blogSetupWorkspace();
      setWorkspaceStatus('ok');
      setWorkspaceMessage(msg);
      const next = await appSetupStatus();
      setBlogForm((prev) => ({
        ...prev,
        blogReady: next.blogReady,
        contentPath: next.contentPath ?? prev.contentPath,
      }));
    } catch (e) {
      setWorkspaceStatus('error');
      setWorkspaceMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const handleWorkspacePull = async () => {
    setWorkspaceStatus('busy');
    setWorkspaceMessage(null);
    try {
      const msg = await blogPull();
      setWorkspaceStatus('ok');
      setWorkspaceMessage(msg);
    } catch (e) {
      setWorkspaceStatus('error');
      setWorkspaceMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const handleMigrateReports = async () => {
    if (!confirmMigrate) {
      setConfirmMigrate(true);
      setMigrateStatus('idle');
      setMigrateMessage(
        '한 번 실행하면 contents/reports와 contents/notes/reports의 .md가 data_root/reports로 이동합니다. 원본은 data_root/backups/reports-<ts>/에 보존됩니다. 다시 누르면 실행됩니다.',
      );
      return;
    }
    setMigrateStatus('busy');
    setMigrateMessage(null);
    try {
      const res: MigrateReportsReport = await migrateReports();
      setMigrateStatus('ok');
      setMigrateMessage(
        `이전 완료 — 복사 ${res.copied}건 · 건너뜀 ${res.skipped}건\n백업: ${res.backupPath}`,
      );
      setConfirmMigrate(false);
      const next = await appSetupStatus();
      setBlogForm((prev) => ({ ...prev, reportsMigrated: next.reportsMigrated }));
    } catch (e) {
      setMigrateStatus('error');
      setMigrateMessage(e instanceof Error ? e.message : String(e));
      setConfirmMigrate(false);
    }
  };

  const handleBlogSave = async () => {
    setBlogStatus('saving');
    setBlogError(null);
    try {
      const next = await setBlogConfig({
        enabled: blogForm.enabled,
        contentPath: blogForm.contentPath || null,
        gitRemote: blogForm.gitRemote || null,
        gitBranch: blogForm.gitBranch || null,
        gitName: blogForm.gitName || null,
        gitEmail: blogForm.gitEmail || null,
      });
      setBlogForm((prev) => ({ ...prev, blogReady: next.blogReady }));
      setBlogStatus('saved');
      window.setTimeout(() => {
        setBlogStatus((s) => (s === 'saved' ? 'idle' : s));
      }, 1500);
    } catch (e) {
      setBlogStatus('error');
      setBlogError(e instanceof Error ? e.message : String(e));
    }
  };

  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,18,22,0.32)',
        zIndex: 180,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 320,
          maxWidth: '92vw',
          height: '100%',
          background: 'var(--bg)',
          borderLeft: '1px solid var(--line-strong)',
          boxShadow: '-20px 0 50px rgba(0,0,0,0.28)',
          padding: '20px 18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>설정</h2>
          <span style={{ flex: 1 }} />
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>esc 닫기 · ⌘, 토글</Mono>
        </div>

        <Section label="테마">
          <RadioGroup
            value={theme}
            options={THEMES.map((t) => ({ value: t.value, label: t.label, hint: t.hint }))}
            onChange={(v) => setTheme(v)}
          />
        </Section>

        <Section label="밀도">
          <RadioGroup
            value={density}
            options={DENSITIES.map((d) => ({ value: d.value, label: d.label, hint: d.hint }))}
            onChange={(v) => setDensity(v)}
          />
        </Section>

        <Section label="자동 정리">
          <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>주 시작일</Mono>
          <RadioGroup
            value={weekStart}
            options={[
              { value: 'mon', label: '월요일', hint: 'ISO' },
              { value: 'sun', label: '일요일', hint: '미국식' },
            ]}
            onChange={(v) => setWeekStart(v)}
          />
          <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)', marginTop: 6 }}>
            주·월 자동 생성
          </Mono>
          <RadioGroup
            value={autoEnabled}
            options={[
              { value: 'on', label: '켜짐', hint: '앱 실행 시' },
              { value: 'off', label: '꺼짐', hint: '수동만' },
            ]}
            onChange={(v) => setAutoEnabled(v)}
          />
        </Section>

        <Section label="블로그">
          <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>활성화</Mono>
          <RadioGroup
            value={blogForm.enabled ? 'on' : 'off'}
            options={[
              { value: 'on', label: '켜짐', hint: '블로그 모드' },
              { value: 'off', label: '꺼짐', hint: '생활만' },
            ]}
            onChange={(v) => updateBlog('enabled', v === 'on')}
          />

          {blogForm.enabled && (
            <>
              <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)', marginTop: 6 }}>
                콘텐츠 폴더
              </Mono>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  value={blogForm.contentPath}
                  onChange={(e) => updateBlog('contentPath', e.target.value)}
                  style={inputStyle}
                  placeholder="vallista-land 워킹트리 경로"
                  spellCheck={false}
                />
                <button onClick={handlePickPath} style={smallButtonStyle}>
                  찾기…
                </button>
              </div>
              {blogForm.contentPath && !blogForm.blogReady && blogStatus !== 'saving' && (
                <Mono style={{ fontSize: 10, color: 'var(--err, var(--ink-mute))' }}>
                  pnpm-workspace.yaml과 contents/가 필요합니다.
                </Mono>
              )}

              <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)', marginTop: 6 }}>
                Git 원격 / 브랜치
              </Mono>
              <input
                value={blogForm.gitRemote}
                onChange={(e) => updateBlog('gitRemote', e.target.value)}
                style={inputStyle}
                placeholder="https://github.com/user/repo.git"
                spellCheck={false}
              />
              <input
                value={blogForm.gitBranch}
                onChange={(e) => updateBlog('gitBranch', e.target.value)}
                style={inputStyle}
                placeholder="main"
                spellCheck={false}
              />

              <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)', marginTop: 6 }}>
                커밋 작성자
              </Mono>
              <input
                value={blogForm.gitName}
                onChange={(e) => updateBlog('gitName', e.target.value)}
                style={inputStyle}
                placeholder="이름"
                spellCheck={false}
              />
              <input
                value={blogForm.gitEmail}
                onChange={(e) => updateBlog('gitEmail', e.target.value)}
                style={inputStyle}
                placeholder="email@example.com"
                spellCheck={false}
                autoCapitalize="off"
              />

              <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)', marginTop: 6 }}>
                Git 토큰 (키체인 저장)
              </Mono>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  style={inputStyle}
                  placeholder={tokenSaved ? '••••••••  (저장됨)' : 'Personal Access Token'}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                />
                <button
                  onClick={handleTokenSave}
                  disabled={
                    !tokenInput.trim() ||
                    tokenStatus === 'saving' ||
                    !blogForm.gitRemote.trim()
                  }
                  style={{
                    ...smallButtonStyle,
                    opacity:
                      !tokenInput.trim() ||
                      tokenStatus === 'saving' ||
                      !blogForm.gitRemote.trim()
                        ? 0.5
                        : 1,
                  }}
                >
                  {tokenStatus === 'saving' ? '저장 중…' : '저장'}
                </button>
              </div>
              {tokenSaved && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', flex: 1 }}>
                    {tokenStatus === 'saved' ? '저장됨' : '키체인에 저장됨'}
                  </Mono>
                  <button
                    onClick={handleTokenDelete}
                    disabled={tokenStatus === 'deleting'}
                    style={{
                      ...smallButtonStyle,
                      opacity: tokenStatus === 'deleting' ? 0.5 : 1,
                    }}
                  >
                    {tokenStatus === 'deleting' ? '삭제 중…' : '삭제'}
                  </button>
                </div>
              )}
              {tokenError && (
                <Mono style={{ fontSize: 10, color: 'var(--err, var(--ink-mute))' }}>
                  {tokenError}
                </Mono>
              )}
              {!blogForm.gitRemote.trim() && (
                <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                  토큰은 git 원격 주소를 먼저 저장한 뒤 입력하세요.
                </Mono>
              )}
            </>
          )}

          <button
            onClick={handleBlogSave}
            disabled={blogStatus === 'saving'}
            style={{
              ...rowButtonStyle,
              marginTop: 8,
              justifyContent: 'center',
              opacity: blogStatus === 'saving' ? 0.5 : 1,
            }}
          >
            <span>
              {blogStatus === 'saving'
                ? '저장 중…'
                : blogStatus === 'saved'
                  ? '저장됨'
                  : '저장'}
            </span>
          </button>
          {blogError && (
            <Mono style={{ fontSize: 10, color: 'var(--err, var(--ink-mute))' }}>
              {blogError}
            </Mono>
          )}

          {blogForm.enabled && (
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <button
                onClick={handleWorkspaceSetup}
                disabled={
                  workspaceStatus === 'busy' ||
                  !blogForm.contentPath.trim() ||
                  !blogForm.gitRemote.trim()
                }
                style={{
                  ...rowButtonStyle,
                  flex: 1,
                  justifyContent: 'center',
                  opacity:
                    workspaceStatus === 'busy' ||
                    !blogForm.contentPath.trim() ||
                    !blogForm.gitRemote.trim()
                      ? 0.5
                      : 1,
                }}
              >
                <span>
                  {workspaceStatus === 'busy' ? '준비 중…' : '워크스페이스 준비'}
                </span>
              </button>
              <button
                onClick={handleWorkspacePull}
                disabled={workspaceStatus === 'busy' || !blogForm.blogReady}
                style={{
                  ...rowButtonStyle,
                  flex: 1,
                  justifyContent: 'center',
                  opacity:
                    workspaceStatus === 'busy' || !blogForm.blogReady ? 0.5 : 1,
                }}
              >
                <span>
                  {workspaceStatus === 'busy' ? '당겨오는 중…' : '당겨오기'}
                </span>
              </button>
            </div>
          )}
          {workspaceMessage && (
            <Mono
              style={{
                fontSize: 10,
                color:
                  workspaceStatus === 'error'
                    ? 'var(--err, var(--ink-mute))'
                    : 'var(--ink-mute)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {workspaceMessage}
            </Mono>
          )}
        </Section>

        <Section label="데이터 이전">
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
            보고서를 블로그(contents)에서 앱 데이터(data_root)로 이전합니다. 한 번만
            실행되며, 원본은 백업 폴더로 이동합니다.
          </Mono>
          <button
            onClick={handleMigrateReports}
            disabled={
              migrateStatus === 'busy' || blogForm.reportsMigrated || !blogForm.contentPath
            }
            style={{
              ...rowButtonStyle,
              justifyContent: 'center',
              marginTop: 4,
              opacity:
                migrateStatus === 'busy' ||
                blogForm.reportsMigrated ||
                !blogForm.contentPath
                  ? 0.5
                  : 1,
            }}
          >
            <span>
              {blogForm.reportsMigrated
                ? '이미 이전됨'
                : migrateStatus === 'busy'
                  ? '이전 중…'
                  : confirmMigrate
                    ? '한번 더 눌러 확정'
                    : 'Reports 데이터 이전'}
            </span>
          </button>
          {migrateMessage && (
            <Mono
              style={{
                fontSize: 10,
                color:
                  migrateStatus === 'error'
                    ? 'var(--err, var(--ink-mute))'
                    : 'var(--ink-mute)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
              }}
            >
              {migrateMessage}
            </Mono>
          )}
        </Section>

        {(onOpenIcal || onOpenLLMSetup) && (
          <Section label="연동">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {onOpenIcal && (
                <button
                  onClick={onOpenIcal}
                  style={rowButtonStyle}
                >
                  <span style={{ flex: 1 }}>캘린더 구독·동기화</span>
                  <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>iCal</Mono>
                </button>
              )}
              {onOpenLLMSetup && (
                <button
                  onClick={onOpenLLMSetup}
                  style={rowButtonStyle}
                >
                  <span style={{ flex: 1 }}>로컬 LLM</span>
                  <LlmHint llm={llm} />
                </button>
              )}
            </div>
          </Section>
        )}

        <div style={{ marginTop: 'auto' }}>
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            ⌘K 검색 · ⌘N 빠른 생각 · ⌘T 빠른 할 일 · ⌘, 설정
          </Mono>
        </div>
      </aside>
    </div>
  );
}

const rowButtonStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 6,
  border: '1px solid var(--line)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  fontFamily: 'inherit',
  fontSize: 12.5,
  cursor: 'pointer',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

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

const smallButtonStyle: React.CSSProperties = {
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

function LlmHint({ llm }: { llm: LlmStatus | null }) {
  if (!llm) {
    return (
      <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>확인 중…</Mono>
    );
  }
  if (!llm.binPresent) {
    return (
      <Mono style={{ fontSize: 10, color: 'var(--warn, var(--ink-mute))' }}>
        미설치
      </Mono>
    );
  }
  const count = llm.models.length;
  if (count === 0) {
    return (
      <Mono style={{ fontSize: 10, color: 'var(--warn, var(--ink-mute))' }}>
        모델 없음
      </Mono>
    );
  }
  return (
    <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
      모델 {count}개
    </Mono>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)', letterSpacing: '0.06em' }}>
        {label.toUpperCase()}
      </Mono>
      {children}
    </div>
  );
}

function RadioGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; hint?: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: 6,
      }}
    >
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '8px 6px',
              borderRadius: 6,
              border: active ? '1px solid var(--ink)' : '1px solid var(--line)',
              background: active ? 'var(--bg-shade)' : 'var(--bg)',
              color: active ? 'var(--ink)' : 'var(--ink-soft)',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              lineHeight: 1.2,
            }}
          >
            <span>{o.label}</span>
            {o.hint && (
              <span
                style={{
                  fontSize: 9.5,
                  color: 'var(--ink-mute)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {o.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
