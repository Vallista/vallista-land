import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView, keymap } from '@codemirror/view';
import { Mono } from '../../components/atoms/Atoms';
import { useDoc, type DocStatus } from './state';

export function Editor() {
  const { path, status, error, savedAt, body, frontmatter, setBody, flush } = useDoc();

  const cmExtensions = useMemo(
    () => [
      markdown(),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': {
          fontSize: '15px',
          height: '100%',
          background: 'transparent',
          color: 'var(--ink)',
        },
        '.cm-content': {
          fontFamily: 'var(--font-serif)',
          padding: '24px 0',
          lineHeight: '1.7',
          caretColor: 'var(--ink)',
        },
        '.cm-scroller': { padding: '0 64px' },
        '.cm-gutters': { display: 'none' },
        '.cm-focused': { outline: 'none' },
        '.cm-line': { padding: '0' },
        '.cm-cursor': { borderLeftColor: 'var(--ink)' },
        '.cm-selectionBackground': { background: 'var(--blue-soft) !important' },
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
    [flush],
  );

  if (status === 'loading') {
    return (
      <div style={{ padding: 40, color: 'var(--ink-mute)', fontSize: 13 }}>문서 읽는 중…</div>
    );
  }

  if (status === 'error' && body === '' && Object.keys(frontmatter).length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <Mono style={{ fontSize: 11, color: 'var(--err)' }}>READ ERROR</Mono>
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>
          {error}
        </p>
      </div>
    );
  }

  const title = pickTitle(frontmatter, path);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Header path={path} title={title} status={status} savedAt={savedAt} error={error} />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
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
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}

function pickTitle(fm: Record<string, unknown>, path: string): string {
  if (typeof fm.title === 'string' && fm.title.trim().length > 0) return fm.title;
  const parts = path.split('/').filter((p) => p.length > 0);
  const last = parts[parts.length - 1] ?? path;
  if (last === 'index.md') {
    return parts[parts.length - 2] ?? path;
  }
  return last.replace(/\.md$/, '');
}

function Header({
  path,
  title,
  status,
  savedAt,
  error,
}: {
  path: string;
  title: string;
  status: DocStatus;
  savedAt: Date | null;
  error: string | null;
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
        ⌘S · 1.5s 디바운스 자동 저장 · 복구 = git 만 (백업 없음)
      </Mono>
    </div>
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
