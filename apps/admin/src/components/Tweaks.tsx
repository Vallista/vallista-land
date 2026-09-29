import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clearLogs, getLogs, type ErrorEntry } from '../lib/errorLog';
import { Mono } from './atoms/Atoms';
import {
  ACTION_LABELS,
  DEFAULT_BINDINGS,
  DEFAULT_GLOBAL_BINDINGS,
  GLOBAL_ACTION_LABELS,
  formatBinding,
  formatGlobalBinding,
  readKeybindings,
  writeKeybindings,
  type ActionId,
  type AppKeybindings,
  type Binding,
  type GlobalActionId,
  type GlobalBinding,
  type GlobalKeybindings,
} from '../lib/keybindings';
import {
  appSetupStatus,
  blogPull,
  blogSetupWorkspace,
  keychainDeleteToken,
  keychainHasToken,
  keychainSetToken,
  migrateReports,
  pickContentRoot,
  applyGlobalShortcuts,
  readGlobalKeybindingsFromDisk,
  setBlogConfig,
  writeGlobalKeybindingsToDisk,
  type MigrateReportsReport,
} from '../lib/tauri';
import { readWeekStartDay, writeWeekStartDay, type WeekStartDay } from '../lib/weekStart';
import { LLMSetupContent } from '../screens/LLMSetup';
import { useLabels } from '../screens/Plan/labelCatalog';
import type { Label } from '../screens/Plan/labelCatalog';

export type Theme = 'dark' | 'light';
export type Density = 'compact' | 'cozy' | 'spacious';
export type WeekStart = WeekStartDay;
export type AutoFlag = 'on' | 'off';
export type ClipPollMs = '1000' | '2000' | '5000' | '10000';
export type ClipMaxItems = '50' | '100' | '200' | '500';
export type ClipRetainDays = '0' | '1' | '7' | '30' | '90';

const THEME_KEY = 'bento.theme';
const DENSITY_KEY = 'bento.density';
const AUTO_ENABLED_KEY = 'bento.summary.autoEnabled';
const LAST_PANE_KEY = 'bento.tweaks.lastPane';

const CLIP_ENABLED_KEY = 'bento.clipboard.enabled';
const CLIP_POLL_MS_KEY = 'bento.clipboard.pollMs';
const CLIP_MAX_ITEMS_KEY = 'bento.clipboard.maxItems';
const CLIP_RETAIN_DAYS_KEY = 'bento.clipboard.retainDays';

export const CLIPBOARD_SETTINGS_EVENT = 'bento:clipboard-settings';

const THEMES: { value: Theme; label: string; hint: string }[] = [
  { value: 'dark', label: 'Dark', hint: '밤·작업' },
  { value: 'light', label: 'Paper', hint: '낮·종이' },
];

const DENSITIES: { value: Density; label: string; hint: string }[] = [
  { value: 'compact', label: 'Compact', hint: '많이 보기' },
  { value: 'cozy', label: 'Cozy', hint: '편안하게' },
  { value: 'spacious', label: 'Spacious', hint: '여백 위주' },
];

export type PaneId = 'appearance' | 'schedule' | 'clipboard' | 'blog' | 'integrations' | 'data' | 'keybindings' | 'labels' | 'logs';

const PANES: { id: PaneId; label: string; icon: string; hint: string }[] = [
  { id: 'appearance', label: '외관', icon: '◎', hint: '테마·밀도' },
  { id: 'schedule', label: '일정', icon: '◷', hint: '주·자동 정리' },
  { id: 'clipboard', label: '클립보드', icon: '⎘', hint: '히스토리·수집' },
  { id: 'blog', label: '블로그', icon: '▤', hint: '폴더·Git' },
  { id: 'integrations', label: '연동', icon: '◇', hint: '캘린더·LLM' },
  { id: 'data', label: '데이터', icon: '⊟', hint: '이전·백업' },
  { id: 'keybindings', label: '단축키', icon: '⌘', hint: '키 바인딩' },
  { id: 'labels', label: '라벨', icon: '◉', hint: '종류·색 커스텀' },
  { id: 'logs', label: '로그', icon: '◫', hint: '호출·에러 기록' },
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

function readAutoEnabled(): AutoFlag {
  if (typeof window === 'undefined') return 'on';
  const v = window.localStorage.getItem(AUTO_ENABLED_KEY);
  return v === 'false' ? 'off' : 'on';
}

function readClipEnabled(): AutoFlag {
  if (typeof window === 'undefined') return 'on';
  const v = window.localStorage.getItem(CLIP_ENABLED_KEY);
  return v === 'false' ? 'off' : 'on';
}

function readClipPollMs(): ClipPollMs {
  if (typeof window === 'undefined') return '2000';
  const v = window.localStorage.getItem(CLIP_POLL_MS_KEY);
  if (v === '1000' || v === '2000' || v === '5000' || v === '10000') return v;
  return '2000';
}

function readClipMaxItems(): ClipMaxItems {
  if (typeof window === 'undefined') return '200';
  const v = window.localStorage.getItem(CLIP_MAX_ITEMS_KEY);
  if (v === '50' || v === '100' || v === '200' || v === '500') return v;
  return '200';
}

function readClipRetainDays(): ClipRetainDays {
  if (typeof window === 'undefined') return '0';
  const v = window.localStorage.getItem(CLIP_RETAIN_DAYS_KEY);
  if (v === '0' || v === '1' || v === '7' || v === '30' || v === '90') return v;
  return '0';
}

function readLastPane(): PaneId {
  if (typeof window === 'undefined') return 'appearance';
  const v = window.localStorage.getItem(LAST_PANE_KEY);
  if (v === 'appearance' || v === 'schedule' || v === 'clipboard' || v === 'blog' || v === 'integrations' || v === 'data' || v === 'keybindings' || v === 'labels' || v === 'logs') {
    return v;
  }
  return 'appearance';
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
  initialPane?: PaneId;
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

export function Tweaks({ open, onClose, onOpenIcal, initialPane }: Props) {
  const [pane, setPane] = useState<PaneId>(readLastPane);
  const [theme, setTheme] = useState<Theme>(readTheme);
  const [density, setDensity] = useState<Density>(readDensity);
  const [weekStart, setWeekStart] = useState<WeekStart>(readWeekStartDay);
  const [autoEnabled, setAutoEnabled] = useState<AutoFlag>(readAutoEnabled);
  const [clipEnabled, setClipEnabled] = useState<AutoFlag>(readClipEnabled);
  const [clipPollMs, setClipPollMs] = useState<ClipPollMs>(readClipPollMs);
  const [clipMaxItems, setClipMaxItems] = useState<ClipMaxItems>(readClipMaxItems);
  const [clipRetainDays, setClipRetainDays] = useState<ClipRetainDays>(readClipRetainDays);
  const [blogForm, setBlogForm] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [blogStatus, setBlogStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [blogError, setBlogError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenSaved, setTokenSaved] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'saving' | 'saved' | 'deleting' | 'error'>('idle');
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSectionOpen, setTokenSectionOpen] = useState(false);
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
    writeWeekStartDay(weekStart);
    window.localStorage.setItem(AUTO_ENABLED_KEY, autoEnabled === 'on' ? 'true' : 'false');
  }, [weekStart, autoEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CLIP_ENABLED_KEY, clipEnabled === 'on' ? 'true' : 'false');
    window.localStorage.setItem(CLIP_POLL_MS_KEY, clipPollMs);
    window.localStorage.setItem(CLIP_MAX_ITEMS_KEY, clipMaxItems);
    window.localStorage.setItem(CLIP_RETAIN_DAYS_KEY, clipRetainDays);
    window.dispatchEvent(new CustomEvent(CLIPBOARD_SETTINGS_EVENT));
  }, [clipEnabled, clipPollMs, clipMaxItems, clipRetainDays]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LAST_PANE_KEY, pane);
  }, [pane]);

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
    if (open && initialPane) setPane(initialPane);
  }, [open]);

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
    if (pane !== 'blog') {
      setTokenSectionOpen(false);
      return;
    }
  }, [pane]);

  useEffect(() => {
    if (!tokenSectionOpen) return;
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
  }, [blogForm.gitRemote, tokenSectionOpen]);

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
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,18,22,0.36)',
        zIndex: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(var(--gap-lg) * 2)',
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: 880,
          maxWidth: 'calc(100vw - 48px)',
          height: 600,
          maxHeight: 'calc(100vh - 80px)',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 10,
          boxShadow: '0 20px 60px rgba(0,0,0,0.36)',
          display: 'flex',
          flexDirection: 'column',
          color: 'var(--ink)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--gap)',
            padding: 'var(--card-pad) calc(var(--card-pad) + 2px)',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-soft)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>설정</h2>
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
            {PANES.find((p) => p.id === pane)?.label}
          </Mono>
          <span style={{ flex: 1 }} />
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>esc 닫기 · ⌘, 토글</Mono>
        </div>

        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <nav
            style={{
              flex: '0 0 180px',
              width: 180,
              borderRight: '1px solid var(--line)',
              background: 'var(--bg-soft)',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              overflowY: 'auto',
            }}
          >
            {PANES.map((p) => (
              <PaneTab key={p.id} pane={p} active={pane === p.id} onClick={() => setPane(p.id)} />
            ))}
          </nav>

          <section
            style={{
              flex: 1,
              minWidth: 0,
              padding: 'var(--card-pad) calc(var(--card-pad) + 2px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--gap-lg)',
              overflowY: 'auto',
            }}
          >
            {pane === 'appearance' && (
              <AppearancePane
                theme={theme}
                density={density}
                onTheme={setTheme}
                onDensity={setDensity}
              />
            )}
            {pane === 'schedule' && (
              <SchedulePane
                weekStart={weekStart}
                autoEnabled={autoEnabled}
                onWeekStart={setWeekStart}
                onAutoEnabled={setAutoEnabled}
              />
            )}
            {pane === 'clipboard' && (
              <ClipboardPane
                enabled={clipEnabled}
                pollMs={clipPollMs}
                maxItems={clipMaxItems}
                retainDays={clipRetainDays}
                onEnabled={setClipEnabled}
                onPollMs={setClipPollMs}
                onMaxItems={setClipMaxItems}
                onRetainDays={setClipRetainDays}
              />
            )}
            {pane === 'blog' && (
              <BlogPane
                form={blogForm}
                status={blogStatus}
                error={blogError}
                tokenInput={tokenInput}
                tokenSaved={tokenSaved}
                tokenStatus={tokenStatus}
                tokenError={tokenError}
                tokenSectionOpen={tokenSectionOpen}
                onToggleTokenSection={() => setTokenSectionOpen((v) => !v)}
                workspaceStatus={workspaceStatus}
                workspaceMessage={workspaceMessage}
                onUpdate={updateBlog}
                onPickPath={handlePickPath}
                onTokenInput={setTokenInput}
                onTokenSave={handleTokenSave}
                onTokenDelete={handleTokenDelete}
                onSave={handleBlogSave}
                onSetupWorkspace={handleWorkspaceSetup}
                onPullWorkspace={handleWorkspacePull}
              />
            )}
            {pane === 'integrations' && (
              <IntegrationsPane onOpenIcal={onOpenIcal} />
            )}
            {pane === 'data' && (
              <DataPane
                reportsMigrated={blogForm.reportsMigrated}
                contentPath={blogForm.contentPath}
                migrateStatus={migrateStatus}
                migrateMessage={migrateMessage}
                confirmMigrate={confirmMigrate}
                onMigrate={handleMigrateReports}
              />
            )}
            {pane === 'keybindings' && <KeybindingsPane />}
            {pane === 'labels' && <LabelsPane />}
            {pane === 'logs' && <LogsPane />}
          </section>
        </div>

        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--line)',
            background: 'var(--bg-soft)',
          }}
        >
          <Mono style={{ fontSize: 10, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            ⌘K 검색 · ⌘N 빠른 생각 · ⌘T 빠른 할 일 · ⌘, 설정
          </Mono>
        </div>
      </div>
    </div>
  );
}

function PaneTab({
  pane,
  active,
  onClick,
}: {
  pane: { id: PaneId; label: string; icon: string; hint: string };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => {
        if (active) return;
        e.currentTarget.style.background = 'var(--bg)';
        e.currentTarget.style.color = 'var(--ink)';
      }}
      onMouseLeave={(e) => {
        if (active) return;
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--ink-2)';
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 10px',
        borderRadius: 6,
        border: 'none',
        background: active ? 'var(--bg-shade)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-2)',
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        fontFamily: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 120ms, color 120ms',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          width: 16,
          justifyContent: 'center',
          color: active ? 'var(--ink)' : 'var(--ink-mute)',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          lineHeight: 1,
        }}
      >
        {pane.icon}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block' }}>{pane.label}</span>
        <Mono
          style={{
            display: 'block',
            fontSize: 9.5,
            color: active ? 'var(--ink-2)' : 'var(--ink-mute)',
            marginTop: 1,
          }}
        >
          {pane.hint}
        </Mono>
      </span>
    </button>
  );
}

function AppearancePane({
  theme,
  density,
  onTheme,
  onDensity,
}: {
  theme: Theme;
  density: Density;
  onTheme: (v: Theme) => void;
  onDensity: (v: Density) => void;
}) {
  return (
    <>
      <Section label="테마">
        <RadioGroup
          value={theme}
          options={THEMES.map((t) => ({ value: t.value, label: t.label, hint: t.hint }))}
          onChange={onTheme}
        />
      </Section>

      <Section label="밀도">
        <RadioGroup
          value={density}
          options={DENSITIES.map((d) => ({ value: d.value, label: d.label, hint: d.hint }))}
          onChange={onDensity}
        />
      </Section>
    </>
  );
}

function SchedulePane({
  weekStart,
  autoEnabled,
  onWeekStart,
  onAutoEnabled,
}: {
  weekStart: WeekStart;
  autoEnabled: AutoFlag;
  onWeekStart: (v: WeekStart) => void;
  onAutoEnabled: (v: AutoFlag) => void;
}) {
  return (
    <>
      <Section label="주 시작일" hint="주간 보고서·캘린더 기준">
        <RadioGroup
          value={weekStart}
          options={[
            { value: 'mon', label: '월요일', hint: 'ISO' },
            { value: 'sun', label: '일요일', hint: '미국식' },
          ]}
          onChange={onWeekStart}
        />
      </Section>

      <Section label="주·월 자동 생성" hint="앱 실행 시 회고 자동 작성">
        <RadioGroup
          value={autoEnabled}
          options={[
            { value: 'on', label: '켜짐', hint: '앱 실행 시' },
            { value: 'off', label: '꺼짐', hint: '수동만' },
          ]}
          onChange={onAutoEnabled}
        />
      </Section>
    </>
  );
}

function ClipboardPane({
  enabled,
  pollMs,
  maxItems,
  retainDays,
  onEnabled,
  onPollMs,
  onMaxItems,
  onRetainDays,
}: {
  enabled: AutoFlag;
  pollMs: ClipPollMs;
  maxItems: ClipMaxItems;
  retainDays: ClipRetainDays;
  onEnabled: (v: AutoFlag) => void;
  onPollMs: (v: ClipPollMs) => void;
  onMaxItems: (v: ClipMaxItems) => void;
  onRetainDays: (v: ClipRetainDays) => void;
}) {
  return (
    <>
      <Section label="히스토리 수집" hint="클립보드 자동 저장">
        <RadioGroup
          value={enabled}
          options={[
            { value: 'on', label: '켜짐', hint: '자동 수집' },
            { value: 'off', label: '꺼짐', hint: '수동만' },
          ]}
          onChange={onEnabled}
        />
      </Section>

      <Section label="갱신 주기" hint="새 복사 내용 감지 간격">
        <RadioGroup
          value={pollMs}
          options={[
            { value: '1000', label: '1초', hint: '즉각' },
            { value: '2000', label: '2초', hint: '기본' },
            { value: '5000', label: '5초', hint: '절약' },
            { value: '10000', label: '10초', hint: '최소' },
          ]}
          onChange={onPollMs}
        />
      </Section>

      <Section label="최대 보관 개수" hint="초과 시 오래된 항목 자동 삭제">
        <RadioGroup
          value={maxItems}
          options={[
            { value: '50', label: '50개', hint: '' },
            { value: '100', label: '100개', hint: '' },
            { value: '200', label: '200개', hint: '기본' },
            { value: '500', label: '500개', hint: '' },
          ]}
          onChange={onMaxItems}
        />
      </Section>

      <Section label="보존 기간" hint="설정 기간 이전 항목 자동 삭제">
        <RadioGroup
          value={retainDays}
          options={[
            { value: '0', label: '무제한', hint: '' },
            { value: '1', label: '1일', hint: '' },
            { value: '7', label: '7일', hint: '1주' },
            { value: '30', label: '30일', hint: '1달' },
            { value: '90', label: '90일', hint: '3달' },
          ]}
          onChange={onRetainDays}
        />
      </Section>
    </>
  );
}

interface BlogPaneProps {
  form: BlogFormState;
  status: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
  tokenInput: string;
  tokenSaved: boolean;
  tokenStatus: 'idle' | 'saving' | 'saved' | 'deleting' | 'error';
  tokenError: string | null;
  tokenSectionOpen: boolean;
  onToggleTokenSection: () => void;
  workspaceStatus: 'idle' | 'busy' | 'ok' | 'error';
  workspaceMessage: string | null;
  onUpdate: <K extends keyof BlogFormState>(key: K, value: BlogFormState[K]) => void;
  onPickPath: () => void;
  onTokenInput: (v: string) => void;
  onTokenSave: () => void;
  onTokenDelete: () => void;
  onSave: () => void;
  onSetupWorkspace: () => void;
  onPullWorkspace: () => void;
}

function BlogPane({
  form,
  status,
  error,
  tokenInput,
  tokenSaved,
  tokenStatus,
  tokenError,
  tokenSectionOpen,
  onToggleTokenSection,
  workspaceStatus,
  workspaceMessage,
  onUpdate,
  onPickPath,
  onTokenInput,
  onTokenSave,
  onTokenDelete,
  onSave,
  onSetupWorkspace,
  onPullWorkspace,
}: BlogPaneProps) {
  return (
    <>
      <Section label="블로그 모드" hint="글방·발행 화면 노출 여부">
        <RadioGroup
          value={form.enabled ? 'on' : 'off'}
          options={[
            { value: 'on', label: '켜짐', hint: '블로그 모드' },
            { value: 'off', label: '꺼짐', hint: '생활만' },
          ]}
          onChange={(v) => onUpdate('enabled', v === 'on')}
        />
      </Section>

      {form.enabled && (
        <>
          <Section label="콘텐츠 폴더" hint="vallista-land 워킹트리 경로">
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                value={form.contentPath}
                onChange={(e) => onUpdate('contentPath', e.target.value)}
                style={inputStyle}
                placeholder="vallista-land 워킹트리 경로"
                spellCheck={false}
              />
              <button onClick={onPickPath} style={smallButtonStyle}>
                찾기…
              </button>
            </div>
            {form.contentPath && !form.blogReady && status !== 'saving' && (
              <Mono style={{ fontSize: 10, color: 'var(--err, var(--ink-mute))' }}>
                pnpm-workspace.yaml과 contents/가 필요합니다.
              </Mono>
            )}
          </Section>

          <Section label="Git 저장소" hint="원격·브랜치·커밋 작성자">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 6 }}>
              <input
                value={form.gitRemote}
                onChange={(e) => onUpdate('gitRemote', e.target.value)}
                style={inputStyle}
                placeholder="https://github.com/user/repo.git"
                spellCheck={false}
              />
              <input
                value={form.gitBranch}
                onChange={(e) => onUpdate('gitBranch', e.target.value)}
                style={inputStyle}
                placeholder="main"
                spellCheck={false}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <input
                value={form.gitName}
                onChange={(e) => onUpdate('gitName', e.target.value)}
                style={inputStyle}
                placeholder="이름"
                spellCheck={false}
              />
              <input
                value={form.gitEmail}
                onChange={(e) => onUpdate('gitEmail', e.target.value)}
                style={inputStyle}
                placeholder="email@example.com"
                spellCheck={false}
                autoCapitalize="off"
              />
            </div>
          </Section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={onToggleTokenSection}
              style={{
                ...rowButtonStyle,
                justifyContent: 'space-between',
                background: tokenSectionOpen ? 'var(--bg-shade)' : 'var(--bg)',
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-start' }}>
                <span>Git 토큰</span>
                <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>키체인에 안전 저장</Mono>
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                {tokenSectionOpen ? '▲' : '▼'}
              </span>
            </button>
            {tokenSectionOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '4px 0' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => onTokenInput(e.target.value)}
                    style={inputStyle}
                    placeholder={tokenSaved ? '••••••••  (저장됨)' : 'Personal Access Token'}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                  />
                  <button
                    onClick={onTokenSave}
                    disabled={
                      !tokenInput.trim() ||
                      tokenStatus === 'saving' ||
                      !form.gitRemote.trim()
                    }
                    style={{
                      ...smallButtonStyle,
                      opacity:
                        !tokenInput.trim() ||
                        tokenStatus === 'saving' ||
                        !form.gitRemote.trim()
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
                      onClick={onTokenDelete}
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
                {!form.gitRemote.trim() && (
                  <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
                    토큰은 git 원격 주소를 먼저 저장한 뒤 입력하세요.
                  </Mono>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <div
        style={{
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          paddingTop: 4,
          borderTop: '1px solid var(--line)',
          marginTop: 4,
        }}
      >
        <button
          onClick={onSave}
          disabled={status === 'saving'}
          style={{
            ...rowButtonStyle,
            justifyContent: 'center',
            opacity: status === 'saving' ? 0.5 : 1,
            marginTop: 8,
          }}
        >
          <span>
            {status === 'saving'
              ? '저장 중…'
              : status === 'saved'
                ? '저장됨'
                : '설정 저장'}
          </span>
        </button>

        {form.enabled && (
          <>
            <button
              onClick={onSetupWorkspace}
              disabled={
                workspaceStatus === 'busy' ||
                !form.contentPath.trim() ||
                !form.gitRemote.trim()
              }
              style={{
                ...rowButtonStyle,
                marginTop: 8,
                justifyContent: 'center',
                opacity:
                  workspaceStatus === 'busy' ||
                  !form.contentPath.trim() ||
                  !form.gitRemote.trim()
                    ? 0.5
                    : 1,
              }}
            >
              <span>
                {workspaceStatus === 'busy' ? '준비 중…' : '워크스페이스 준비'}
              </span>
            </button>
            <button
              onClick={onPullWorkspace}
              disabled={workspaceStatus === 'busy' || !form.blogReady}
              style={{
                ...rowButtonStyle,
                marginTop: 8,
                justifyContent: 'center',
                opacity: workspaceStatus === 'busy' || !form.blogReady ? 0.5 : 1,
              }}
            >
              <span>{workspaceStatus === 'busy' ? '당겨오는 중…' : '당겨오기'}</span>
            </button>
          </>
        )}
      </div>

      {error && (
        <Mono style={{ fontSize: 10, color: 'var(--err, var(--ink-mute))' }}>
          {error}
        </Mono>
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
    </>
  );
}

function IntegrationsPane({ onOpenIcal }: { onOpenIcal?: () => void }) {
  return (
    <>
      {onOpenIcal && (
        <Section label="캘린더" hint="iCal 구독·macOS EventKit 동기화">
          <button onClick={onOpenIcal} style={rowButtonStyle}>
            <span style={{ flex: 1 }}>캘린더 구독·동기화</span>
            <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>iCal</Mono>
          </button>
        </Section>
      )}
      <Section label="로컬 LLM" hint="ondevice 모델·서버">
        <LLMSetupContent />
      </Section>
    </>
  );
}

function DataPane({
  reportsMigrated,
  contentPath,
  migrateStatus,
  migrateMessage,
  confirmMigrate,
  onMigrate,
}: {
  reportsMigrated: boolean;
  contentPath: string;
  migrateStatus: 'idle' | 'busy' | 'ok' | 'error';
  migrateMessage: string | null;
  confirmMigrate: boolean;
  onMigrate: () => void;
}) {
  return (
    <Section label="Reports 데이터 이전" hint="블로그(contents) → 앱(data_root)">
      <Mono style={{ fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
        보고서를 블로그(contents)에서 앱 데이터(data_root)로 이전합니다. 한 번만 실행되며,
        원본은 백업 폴더로 이동합니다.
      </Mono>
      <button
        onClick={onMigrate}
        disabled={migrateStatus === 'busy' || reportsMigrated || !contentPath}
        style={{
          ...rowButtonStyle,
          justifyContent: 'center',
          marginTop: 4,
          opacity:
            migrateStatus === 'busy' || reportsMigrated || !contentPath ? 0.5 : 1,
        }}
      >
        <span>
          {reportsMigrated
            ? '이미 이전됨'
            : migrateStatus === 'busy'
              ? '이전 중…'
              : confirmMigrate
                ? '한번 더 눌러 확정'
                : 'Reports 데이터 이전'}
        </span>
      </button>
      {!contentPath && !reportsMigrated && (
        <Mono style={{ fontSize: 10, color: 'var(--ink-mute)' }}>
          블로그 콘텐츠 폴더를 먼저 설정하세요.
        </Mono>
      )}
      {migrateMessage && (
        <Mono
          style={{
            fontSize: 10,
            color:
              migrateStatus === 'error' ? 'var(--err, var(--ink-mute))' : 'var(--ink-mute)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.5,
          }}
        >
          {migrateMessage}
        </Mono>
      )}
    </Section>
  );
}

const LABEL_QUICK_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#4ade80',
  '#34d399', '#60a5fa', '#c4b5fd', '#f472b6',
];

function resolveColor(palette: string, hex: string): string {
  return /^#[0-9a-fA-F]{3,6}$/.test(hex.trim()) ? hex.trim() : palette;
}

function LabelForm({
  name, setName,
  paletteColor, setPaletteColor,
  hex, setHex,
  onConfirm, confirmLabel,
  onCancel,
  autoFocus = true,
}: {
  name: string; setName: (v: string) => void;
  paletteColor: string; setPaletteColor: (v: string) => void;
  hex: string; setHex: (v: string) => void;
  onConfirm: () => void; confirmLabel: string;
  onCancel: () => void;
  autoFocus?: boolean;
}) {
  const activeColor = resolveColor(paletteColor, hex);
  const hexValid = /^#[0-9a-fA-F]{3,6}$/.test(hex.trim());

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        padding: '12px 14px',
        border: '1px solid var(--line)',
        borderRadius: 8,
        background: 'var(--bg-soft)',
      }}
    >
      {/* 이름 + 현재 색상 프리뷰 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
            background: activeColor,
            border: '1.5px solid rgba(0,0,0,0.12)',
            boxShadow: `0 0 0 2px ${activeColor}33`,
          }}
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ ...inputStyle, flex: 1, fontSize: 12.5 }}
          placeholder="라벨 이름"
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm();
            if (e.key === 'Escape') onCancel();
          }}
        />
      </div>

      {/* 컬러 팔레트 */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {LABEL_QUICK_COLORS.map((c) => {
          const selected = activeColor === c && !hexValid;
          return (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => { setPaletteColor(c); setHex(''); }}
              style={{
                width: 22, height: 22, borderRadius: 5, background: c, padding: 0,
                cursor: 'pointer', boxSizing: 'border-box', flexShrink: 0,
                border: selected ? '2.5px solid var(--ink)' : '2.5px solid transparent',
                outline: selected ? `2px solid ${c}` : 'none',
                outlineOffset: 1,
                transition: 'border 100ms, outline 100ms',
              }}
            />
          );
        })}
      </div>

      {/* hex 직접 입력 + 프리뷰 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span
          style={{
            width: 24, height: 24, borderRadius: 5, flexShrink: 0,
            background: hexValid ? hex.trim() : 'var(--bg-shade)',
            border: `1.5px solid ${hexValid ? 'var(--blue)' : 'var(--line)'}`,
            transition: 'background 120ms, border 120ms',
          }}
        />
        <input
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          style={{
            ...inputStyle, flex: 1,
            fontSize: 11.5, fontFamily: 'var(--font-mono)',
            color: hexValid ? 'var(--ink)' : 'var(--ink-mute)',
          }}
          placeholder="#hex 직접 입력 (선택)"
          spellCheck={false}
        />
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', paddingTop: 2 }}>
        <button onClick={onCancel} style={smallButtonStyle}>취소</button>
        <button
          onClick={onConfirm}
          disabled={!name.trim()}
          style={{ ...smallButtonStyle, opacity: !name.trim() ? 0.4 : 1 }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

function LabelsPane() {
  const { labels, updateLabel, removeLabel, addLabel } = useLabels();
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(LABEL_QUICK_COLORS[0] ?? '#f87171');
  const [editHex, setEditHex] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(LABEL_QUICK_COLORS[0] ?? '#f87171');
  const [newHex, setNewHex] = useState('');

  function startEdit(label: Label) {
    setEditing(label.id);
    setEditName(label.name);
    setEditColor(label.color);
    setEditHex('');
  }

  function commitEdit() {
    if (!editing || !editName.trim()) return;
    updateLabel(editing, { name: editName.trim(), color: resolveColor(editColor, editHex) });
    setEditing(null);
  }

  function commitAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addLabel({ name: trimmed, color: resolveColor(newColor, newHex) });
    setAdding(false);
    setNewName('');
    setNewColor(LABEL_QUICK_COLORS[0] ?? '#f87171');
    setNewHex('');
  }

  return (
    <Section label="라벨 관리" hint="종류·색 커스텀">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {labels.map((label) => {
          if (editing === label.id) {
            return (
              <LabelForm
                key={label.id}
                name={editName} setName={setEditName}
                paletteColor={editColor} setPaletteColor={setEditColor}
                hex={editHex} setHex={setEditHex}
                onConfirm={commitEdit} confirmLabel="저장"
                onCancel={() => setEditing(null)}
              />
            );
          }
          return (
            <div
              key={label.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                border: '1px solid var(--line)', borderRadius: 6, background: 'var(--bg)',
              }}
            >
              <span
                style={{
                  width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                  background: label.color, border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
              <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink)' }}>{label.name}</span>
              <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>{label.color}</Mono>
              {label.builtin && (
                <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>내장</Mono>
              )}
              <button onClick={() => startEdit(label)} style={{ ...smallButtonStyle, fontSize: 11 }}>
                편집
              </button>
              {!label.builtin && (
                <button
                  onClick={() => removeLabel(label.id)}
                  style={{ ...smallButtonStyle, fontSize: 11, color: 'var(--err, #e55)' }}
                >
                  삭제
                </button>
              )}
            </div>
          );
        })}
      </div>

      {adding ? (
        <div style={{ marginTop: 4 }}>
          <LabelForm
            name={newName} setName={setNewName}
            paletteColor={newColor} setPaletteColor={setNewColor}
            hex={newHex} setHex={setNewHex}
            onConfirm={commitAdd} confirmLabel="추가"
            onCancel={() => { setAdding(false); setNewName(''); }}
          />
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ ...rowButtonStyle, marginTop: 4 }}>
          ＋ 새 라벨
        </button>
      )}
    </Section>
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

const ACTION_ORDER: ActionId[] = ['search', 'quickThought', 'quickTask', 'tweaks'];
const GLOBAL_ACTION_ORDER: GlobalActionId[] = ['globalThought', 'globalTask', 'globalClipboard'];

function KeybindingsPane() {
  const [bindings, setBindings] = useState<AppKeybindings>(readKeybindings);
  const [globalBindings, setGlobalBindings] = useState<GlobalKeybindings>(DEFAULT_GLOBAL_BINDINGS);

  useEffect(() => {
    readGlobalKeybindingsFromDisk().then(setGlobalBindings).catch(() => {});
  }, []);
  const [capturing, setCapturing] = useState<ActionId | null>(null);
  const [capturingGlobal, setCapturingGlobal] = useState<GlobalActionId | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const capturingRef = useRef<ActionId | null>(null);
  const capturingGlobalRef = useRef<GlobalActionId | null>(null);
  capturingRef.current = capturing;
  capturingGlobalRef.current = capturingGlobal;

  useEffect(() => {
    if (!capturing) return;
    const onKey = (e: KeyboardEvent) => {
      const current = capturingRef.current;
      if (!current) return;
      e.preventDefault();
      e.stopPropagation();

      const k = e.key.toLowerCase();
      if (k === 'escape') {
        setCapturing(null);
        return;
      }
      if (['meta', 'control', 'shift', 'alt'].includes(k)) return;

      const binding: Binding = {
        meta: e.metaKey || e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        key: k,
      };
      const next = { ...bindings, [current]: binding };
      setBindings(next);
      writeKeybindings(next);
      setCapturing(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [capturing, bindings]);

  useEffect(() => {
    if (!capturingGlobal) return;
    const onKey = (e: KeyboardEvent) => {
      const current = capturingGlobalRef.current;
      if (!current) return;
      e.preventDefault();
      e.stopPropagation();

      const k = e.key.toLowerCase();
      if (k === 'escape') {
        setCapturingGlobal(null);
        return;
      }
      if (['meta', 'control', 'shift', 'alt'].includes(k)) return;

      const binding: GlobalBinding = {
        meta: e.metaKey,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        key: k,
      };
      const next = { ...globalBindings, [current]: binding };
      setGlobalBindings(next);
      writeGlobalKeybindingsToDisk(next).catch(() => {});
      setCapturingGlobal(null);
      setGlobalError(null);
      applyGlobalShortcuts(next).catch((err) => {
        setGlobalError(String(err));
      });
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [capturingGlobal, globalBindings]);

  const resetAll = () => {
    setBindings({ ...DEFAULT_BINDINGS });
    writeKeybindings({ ...DEFAULT_BINDINGS });
    const nextGlobal = { ...DEFAULT_GLOBAL_BINDINGS };
    setGlobalBindings(nextGlobal);
    writeGlobalKeybindingsToDisk(nextGlobal).catch(() => {});
    setCapturing(null);
    setCapturingGlobal(null);
    setGlobalError(null);
    applyGlobalShortcuts(nextGlobal).catch((err) => {
      setGlobalError(String(err));
    });
  };

  return (
    <>
      <Section label="앱 단축키" hint="앱 창이 포커스된 상태에서 동작">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {ACTION_ORDER.map((id) => {
            const isCapturing = capturing === id;
            return (
              <BindingRow
                key={id}
                label={ACTION_LABELS[id]}
                display={formatBinding(bindings[id])}
                isCapturing={isCapturing}
                onCapture={() => setCapturing(id)}
              />
            );
          })}
        </div>
      </Section>

      <Section label="전역 단축키" hint="앱이 백그라운드에 있어도 동작 · ⌃ Ctrl">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {GLOBAL_ACTION_ORDER.map((id) => {
            const isCapturing = capturingGlobal === id;
            return (
              <BindingRow
                key={id}
                label={GLOBAL_ACTION_LABELS[id]}
                display={formatGlobalBinding(globalBindings[id])}
                isCapturing={isCapturing}
                onCapture={() => setCapturingGlobal(id)}
              />
            );
          })}
        </div>
        {globalError && (
          <Mono style={{ fontSize: 10, color: 'var(--err, #e55)', marginTop: 4 }}>
            전역 단축키 등록 실패: {globalError}
          </Mono>
        )}
      </Section>

      {confirmReset ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 6,
            border: '1px solid var(--err, #e55)',
            background: 'var(--err-soft, rgba(229,85,85,0.08))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ flex: 1, fontSize: 12, color: 'var(--ink)' }}>
            모든 단축키를 기본값으로 되돌릴까요?
          </span>
          <button
            onClick={() => setConfirmReset(false)}
            style={{ ...smallButtonStyle, fontSize: 11 }}
          >
            취소
          </button>
          <button
            onClick={() => {
              resetAll();
              setConfirmReset(false);
            }}
            style={{
              ...smallButtonStyle,
              fontSize: 11,
              background: 'var(--err, #e55)',
              borderColor: 'var(--err, #e55)',
              color: '#fff',
            }}
          >
            초기화
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmReset(true)}
          style={{ ...rowButtonStyle, justifyContent: 'center' }}
        >
          기본값으로 초기화
        </button>
      )}
    </>
  );
}

function BindingRow({
  label,
  display,
  isCapturing,
  onCapture,
}: {
  label: string;
  display: string;
  isCapturing: boolean;
  onCapture: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        border: '1px solid var(--line)',
        borderRadius: 6,
        background: isCapturing ? 'var(--bg-shade)' : 'var(--bg)',
      }}
    >
      <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink)' }}>{label}</span>
      {isCapturing ? (
        <span style={{ fontSize: 11, color: 'var(--blue)', fontFamily: 'var(--font-mono)' }}>
          키를 누르세요… (esc 취소)
        </span>
      ) : (
        <>
          <kbd
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 7px',
              borderRadius: 4,
              border: '1px solid var(--line)',
              background: 'var(--bg-soft)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-2)',
              lineHeight: 1.6,
              minWidth: 36,
              justifyContent: 'center',
            }}
          >
            {display}
          </kbd>
          <button onClick={onCapture} style={{ ...smallButtonStyle, fontSize: 11 }}>
            변경
          </button>
        </>
      )}
    </div>
  );
}

function Section({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <Mono
          style={{
            fontSize: 9.5,
            color: 'var(--ink-mute)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Mono>
        {hint && (
          <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)' }}>· {hint}</Mono>
        )}
      </div>
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

function LogsPane() {
  const [entries, setEntries] = useState<ErrorEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [logMenu, setLogMenu] = useState<{ x: number; y: number; entry: ErrorEntry } | null>(null);

  const copyEntry = (entry: ErrorEntry) => {
    const text = [
      new Date(entry.ts).toLocaleString('ko-KR'),
      `[${entry.level.toUpperCase()}]`,
      entry.source ? `[${entry.source}]` : '',
      entry.message,
      entry.stack ? `\n${entry.stack}` : '',
    ].filter(Boolean).join(' ');
    void navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId((prev) => (prev === entry.id ? null : prev)), 1500);
  };

  const handleContextMenu = (e: React.MouseEvent, entry: ErrorEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setLogMenu({ x: e.clientX, y: e.clientY, entry });
  };

  useEffect(() => {
    if (!logMenu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      setLogMenu(null);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
    };
  }, [logMenu]);

  const load = () => {
    setLoading(true);
    getLogs(500)
      .then((logs) => {
        setEntries(logs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.level === filter);

  const handleClear = async () => {
    await clearLogs();
    setEntries([]);
  };

  return (
    <>
    <Section label="로그">
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {(['all', 'error', 'warn', 'info'] as const).map((lv) => (
          <button
            key={lv}
            onClick={() => setFilter(lv)}
            style={{
              padding: '3px 10px',
              borderRadius: 999,
              border: `1px solid ${filter === lv ? 'var(--ink)' : 'var(--line)'}`,
              background: filter === lv ? 'var(--ink)' : 'transparent',
              color: filter === lv ? 'var(--on-accent)' : 'var(--ink-2)',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {lv}
          </button>
        ))}
        <button
          onClick={load}
          style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-2)', cursor: 'pointer' }}
        >
          새로고침
        </button>
        <button
          onClick={() => void handleClear()}
          style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink-2)', cursor: 'pointer' }}
        >
          전체 삭제
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          maxHeight: 480,
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
        }}
      >
        {loading && <span style={{ color: 'var(--ink-mute)', padding: 8 }}>로딩 중...</span>}
        {!loading && filtered.length === 0 && (
          <span style={{ color: 'var(--ink-mute)', padding: 8 }}>로그 없음</span>
        )}
        {filtered.map((entry) => (
            <div
              key={entry.id}
              onClick={() => copyEntry(entry)}
              onContextMenu={(e) => handleContextMenu(e, entry)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '3px 4px',
                borderRadius: 4,
                background: entry.level === 'error'
                  ? 'color-mix(in srgb, var(--tone-err) 10%, transparent)'
                  : entry.level === 'warn'
                  ? 'color-mix(in srgb, var(--tone-warn) 8%, transparent)'
                  : 'transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '70px 36px 1fr', gap: 6, alignItems: 'start' }}>
                <span style={{ color: 'var(--ink-mute)', fontSize: 9.5, paddingTop: 1 }}>
                  {new Date(entry.ts).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    color: entry.level === 'error'
                      ? 'var(--tone-err)'
                      : entry.level === 'warn'
                      ? 'var(--tone-warn)'
                      : 'var(--ink-mute)',
                    fontSize: 9.5,
                    paddingTop: 1,
                  }}
                >
                  {entry.level.toUpperCase()}
                </span>
                <span style={{ color: 'var(--ink)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                  {entry.source && (
                    <span style={{ color: 'var(--ink-2)', marginRight: 4 }}>[{entry.source}]</span>
                  )}
                  {entry.message}
                  {copiedId === entry.id && (
                    <span style={{ color: 'var(--tone-ok, #22c55e)', marginLeft: 6, fontSize: 9 }}>복사됨</span>
                  )}
                </span>
              </div>
            </div>
        ))}
      </div>
    </Section>
    {logMenu && createPortal(
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: logMenu.y + 4,
          left: logMenu.x + 4,
          background: 'var(--bg)',
          border: '1px solid var(--line-strong)',
          borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.24)',
          zIndex: 9999,
          padding: '4px 0',
          minWidth: 120,
          userSelect: 'none',
        }}
      >
        <button
          onClick={() => { copyEntry(logMenu.entry); setLogMenu(null); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '6px 12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--ink)',
            fontSize: 13,
          }}
        >
          <span style={{ width: 16, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 12, flexShrink: 0 }}>⎘</span>
          <span>복사</span>
        </button>
      </div>,
      document.body,
    )}
    </>
  );
}
