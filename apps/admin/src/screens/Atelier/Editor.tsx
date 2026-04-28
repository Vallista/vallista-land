import { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView, keymap } from '@codemirror/view';
import { Mono } from '../../components/atoms/Atoms';
import { useDoc, type DocStatus } from './state';
import { createWysiwyg } from './wysiwyg';
import { PreviewPanel } from './PreviewPanel';

type Mode = 'edit' | 'preview';

interface EditorProps {
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
  onToggleFocus?: () => void;
  leftCollapsed?: boolean;
  rightCollapsed?: boolean;
  focusMode?: boolean;
  leftForced?: boolean;
  rightForced?: boolean;
}

export function Editor({
  onToggleLeft,
  onToggleRight,
  onToggleFocus,
  leftCollapsed,
  rightCollapsed,
  focusMode,
  leftForced,
  rightForced,
}: EditorProps) {
  const { path, status, error, savedAt, body, frontmatter, setBody, flush } = useDoc();
  const [mode, setMode] = useState<Mode>('edit');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'p' && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        setMode((m) => (m === 'edit' ? 'preview' : 'edit'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const cmExtensions = useMemo(
    () => [
      markdown(),
      EditorView.lineWrapping,
      ...createWysiwyg({ docPath: path }),
      EditorView.theme({
        '&': {
          height: '100%',
          background: 'var(--bg)',
          color: 'var(--ink)',
        },
        '.cm-scroller': {
          fontFamily: 'var(--font-serif)',
          fontSize: '16px',
          lineHeight: '1.85',
        },
        '.cm-content': {
          padding: '36px 48px 80px',
          maxWidth: '760px',
          margin: '0 auto',
          caretColor: 'var(--ink)',
        },
        '.cm-gutters': { display: 'none' },
        '.cm-focused': { outline: 'none' },
        '.cm-line': { padding: '0' },
        '.cm-cursor': { borderLeft: '2px solid var(--ink)' },
        '.cm-selectionBackground': { background: 'var(--accent-ring) !important' },
        '&.cm-editor ::selection': { background: 'var(--accent-ring) !important' },
      }),
      keymap.of([
        {
          key: 'Mod-s',
          preventDefault: true,
          run: () => {
            flush();
            return true;
          },
        },
      ]),
    ],
    [flush, path],
  );

  if (status === 'loading') {
    return (
      <div style={{ padding: 40, color: 'var(--ink-mute)', fontSize: 13 }}>문서 읽는 중…</div>
    );
  }

  if (status === 'error' && body === '' && Object.keys(frontmatter).length === 0) {
    return (
      <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Mono style={{ fontSize: 11, color: 'var(--err)' }}>읽기 실패</Mono>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)' }}>
          이 문서를 열 수 없습니다. 경로가 사라졌거나 파일을 읽지 못했습니다.
        </p>
        <Mono
          style={{
            fontSize: 11,
            color: 'var(--ink-mute)',
            padding: 10,
            background: 'var(--bg-soft)',
            border: '1px solid var(--line)',
            borderRadius: 6,
            whiteSpace: 'pre-wrap',
          }}
        >
          {path}
          {error ? `\n\n${error}` : ''}
        </Mono>
      </div>
    );
  }

  const title = pickTitle(frontmatter, path);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <style>{wysiwygCss}</style>
      <Header
        path={path}
        title={title}
        status={status}
        savedAt={savedAt}
        error={error}
        mode={mode}
        onModeChange={setMode}
        onToggleLeft={onToggleLeft}
        onToggleRight={onToggleRight}
        onToggleFocus={onToggleFocus}
        leftCollapsed={leftCollapsed}
        rightCollapsed={rightCollapsed}
        focusMode={focusMode}
        leftForced={leftForced}
        rightForced={rightForced}
      />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex' }}>
        {mode === 'edit' ? (
          <CodeMirror
            value={body}
            onChange={setBody}
            extensions={cmExtensions}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
              highlightActiveLineGutter: false,
              highlightSelectionMatches: false,
            }}
            theme="none"
            style={{ height: '100%', flex: 1, minWidth: 0 }}
          />
        ) : (
          <PreviewPanel />
        )}
      </div>
    </div>
  );
}

function pickTitle(fm: Record<string, unknown>, path: string): string {
  if (typeof fm.title === 'string' && fm.title.trim().length > 0) return fm.title;
  const parts = path.split('/').filter((p) => p.length > 0);
  const last = parts[parts.length - 1] ?? path;
  if (last === 'index.md' || last === 'index.mdx') {
    return parts[parts.length - 2] ?? path;
  }
  return last.replace(/\.mdx?$/, '');
}

function Header({
  path,
  title,
  status,
  savedAt,
  error,
  mode,
  onModeChange,
  onToggleLeft,
  onToggleRight,
  onToggleFocus,
  leftCollapsed,
  rightCollapsed,
  focusMode,
  leftForced,
  rightForced,
}: {
  path: string;
  title: string;
  status: DocStatus;
  savedAt: Date | null;
  error: string | null;
  mode: Mode;
  onModeChange: (m: Mode) => void;
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
  onToggleFocus?: () => void;
  leftCollapsed?: boolean;
  rightCollapsed?: boolean;
  focusMode?: boolean;
  leftForced?: boolean;
  rightForced?: boolean;
}) {
  return (
    <div
      style={{
        padding: '14px 64px 12px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <Mono
          style={{
            fontSize: 10.5,
            color: 'var(--ink-mute)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            minWidth: 0,
          }}
        >
          {path}
        </Mono>
        <ModeToggle mode={mode} onChange={onModeChange} />
        <PaneToggles
          onToggleLeft={onToggleLeft}
          onToggleRight={onToggleRight}
          onToggleFocus={onToggleFocus}
          leftCollapsed={leftCollapsed}
          rightCollapsed={rightCollapsed}
          focusMode={focusMode}
          leftForced={leftForced}
          rightForced={rightForced}
        />
        <SaveIndicator status={status} savedAt={savedAt} error={error} />
      </div>
      <h1
        style={{
          margin: 0,
          fontSize: 19,
          fontWeight: 600,
          color: 'var(--ink)',
          letterSpacing: '-0.2px',
        }}
      >
        {title}
      </h1>
      <Mono style={{ fontSize: 9.5, color: 'var(--ink-faint)' }}>
        ⌘S · 1.5s 디바운스 자동 저장 · ⌘P 미리보기 토글 · 복구 = git 만 (백업 없음)
      </Mono>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1px solid var(--line)',
        borderRadius: 4,
        overflow: 'hidden',
        height: 22,
      }}
    >
      <ModeButton
        active={mode === 'edit'}
        divider
        onClick={() => onChange('edit')}
        title="편집 (⌘P)"
      >
        EDIT
      </ModeButton>
      <ModeButton
        active={mode === 'preview'}
        onClick={() => onChange('preview')}
        title="미리보기 (⌘P)"
      >
        PREVIEW
      </ModeButton>
    </div>
  );
}

function ModeButton({
  active,
  divider,
  title,
  onClick,
  children,
}: {
  active: boolean;
  divider?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        height: '100%',
        padding: '0 10px',
        background: active ? 'var(--bg-shade)' : 'transparent',
        color: active ? 'var(--ink)' : 'var(--ink-mute)',
        border: 'none',
        borderRight: divider ? '1px solid var(--line)' : 'none',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '0.06em',
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </button>
  );
}

function PaneToggles({
  onToggleLeft,
  onToggleRight,
  onToggleFocus,
  leftCollapsed,
  rightCollapsed,
  focusMode,
  leftForced,
  rightForced,
}: {
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
  onToggleFocus?: () => void;
  leftCollapsed?: boolean;
  rightCollapsed?: boolean;
  focusMode?: boolean;
  leftForced?: boolean;
  rightForced?: boolean;
}) {
  if (!onToggleLeft && !onToggleRight && !onToggleFocus) return null;
  const leftTitle = leftForced
    ? '창이 좁아 자동 접힘 — 창을 넓히면 복원'
    : leftCollapsed
      ? '좌측 패널 열기 (⌘\\)'
      : '좌측 패널 접기 (⌘\\)';
  const rightTitle = rightForced
    ? '창이 좁아 자동 접힘 — 창을 넓히면 복원'
    : rightCollapsed
      ? '우측 패널 열기 (⌘⇧\\)'
      : '우측 패널 접기 (⌘⇧\\)';
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {onToggleLeft && (
        <PaneButton
          active={!leftCollapsed}
          forced={leftForced}
          title={leftTitle}
          onClick={onToggleLeft}
        >
          <SidebarLeftIcon collapsed={leftCollapsed} />
        </PaneButton>
      )}
      {onToggleFocus && (
        <PaneButton
          active={focusMode}
          title={focusMode ? '집중 모드 해제 (⌘.)' : '집중 모드 (⌘.)'}
          onClick={onToggleFocus}
        >
          <FocusIcon />
        </PaneButton>
      )}
      {onToggleRight && (
        <PaneButton
          active={!rightCollapsed}
          forced={rightForced}
          title={rightTitle}
          onClick={onToggleRight}
        >
          <SidebarRightIcon collapsed={rightCollapsed} />
        </PaneButton>
      )}
    </div>
  );
}

function PaneButton({
  active,
  forced,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  forced?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 24,
        height: 22,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active ? 'var(--bg-shade)' : 'transparent',
        color: forced ? 'var(--ink-faint)' : active ? 'var(--ink)' : 'var(--ink-mute)',
        border: `1px ${forced ? 'dashed' : 'solid'} var(--line)`,
        borderRadius: 4,
        cursor: 'pointer',
        opacity: forced ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  );
}

function SidebarLeftIcon({ collapsed }: { collapsed?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" />
      <line
        x1="6"
        y1="2.5"
        x2="6"
        y2="13.5"
        stroke="currentColor"
        strokeDasharray={collapsed ? '2 2' : undefined}
      />
    </svg>
  );
}

function SidebarRightIcon({ collapsed }: { collapsed?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" />
      <line
        x1="10"
        y1="2.5"
        x2="10"
        y2="13.5"
        stroke="currentColor"
        strokeDasharray={collapsed ? '2 2' : undefined}
      />
    </svg>
  );
}

function FocusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}

function SaveIndicator({
  status,
  savedAt,
  error,
}: {
  status: DocStatus;
  savedAt: Date | null;
  error: string | null;
}) {
  let text = '';
  let color = 'var(--ink-mute)';
  if (status === 'idle' && savedAt) {
    text = `저장됨 ${formatTime(savedAt)}`;
  } else if (status === 'dirty') {
    text = '편집 중…';
    color = 'var(--warn)';
  } else if (status === 'saving') {
    text = '저장 중…';
    color = 'var(--blue)';
  } else if (status === 'saved') {
    text = savedAt ? `저장됨 ${formatTime(savedAt)}` : '저장됨';
    color = 'var(--ok)';
  } else if (status === 'error') {
    text = `오류 — ${error ?? ''}`.trim();
    color = 'var(--err)';
  }
  return (
    <Mono style={{ fontSize: 10.5, color, whiteSpace: 'nowrap' }}>{text}</Mono>
  );
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

const wysiwygCss = `
.cm-content .cm-h {
  font-family: var(--font-serif);
  color: var(--ink);
  letter-spacing: -0.2px;
}
.cm-content .cm-h1 { font-size: 28px; font-weight: 700; line-height: 1.2; }
.cm-content .cm-h2 { font-size: 23px; font-weight: 700; line-height: 1.25; }
.cm-content .cm-h3 { font-size: 19px; font-weight: 600; line-height: 1.3; }
.cm-content .cm-h4 { font-size: 17px; font-weight: 600; }
.cm-content .cm-h5 { font-size: 15.5px; font-weight: 600; }
.cm-content .cm-h6 {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink-soft);
}

.cm-img-widget {
  display: block;
  margin: 6px 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-soft);
  cursor: pointer;
  transition: border-color 120ms ease;
  user-select: none;
  -webkit-user-drag: none;
}
.cm-img-widget:hover { border-color: var(--ink-soft); }
.cm-img-widget__img {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
  -webkit-user-drag: none;
  pointer-events: none;
}
.cm-img-widget__caption {
  padding: 6px 10px;
  font-size: 11.5px;
  color: var(--ink-mute);
  background: var(--bg);
  border-top: 1px solid var(--line);
  font-family: var(--font-mono);
  word-break: break-all;
}
.cm-img-widget--error {
  outline: 1px dashed var(--err);
}
.cm-img-widget--error .cm-img-widget__img { display: none; }
.cm-img-widget--error::before {
  content: '이미지를 불러올 수 없습니다';
  display: block;
  padding: 14px;
  text-align: center;
  font-size: 12px;
  color: var(--err);
}
`;
