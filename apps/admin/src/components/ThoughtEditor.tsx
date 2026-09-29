import { useCallback, useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { Button, Mono } from './atoms/Atoms';
import type { Thought } from '../lib/thoughts';
import { mdExtensions, mdBasicSetup } from '../lib/mdEditorConfig';

interface Props {
  thought: Thought;
  onSave: (patch: Partial<Thought>) => void;
  onClose: () => void;
}

export function ThoughtEditor({ thought, onSave, onClose }: Props) {
  const [title, setTitle] = useState(thought.title);
  const [body, setBody] = useState(thought.body ?? '');
  const dirty = useRef(false);

  useEffect(() => {
    setTitle(thought.title);
    setBody(thought.body ?? '');
    dirty.current = false;
  }, [thought.id]);

  const handleSave = useCallback(() => {
    const trimmed = title.trim();
    onSave({
      title: trimmed || thought.title,
      body: body.trim() || undefined,
    });
    dirty.current = false;
  }, [title, body, onSave, thought.title]);

  const handleClose = useCallback(() => {
    if (dirty.current) handleSave();
    onClose();
  }, [handleSave, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleSave, handleClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'calc(var(--gap-lg) * 3)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(860px, 100%)',
          height: 'calc(100vh - 100px)',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-pop)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '22px 32px 14px',
            borderBottom: '1px solid var(--line-subtle)',
            flexShrink: 0,
          }}
        >
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); dirty.current = true; }}
            placeholder="제목"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 21,
              fontWeight: 650,
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 1.3,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            padding: '4px 16px',
          }}
        >
          <CodeMirror
            value={body}
            onChange={(val) => { setBody(val); dirty.current = true; }}
            extensions={mdExtensions}
            theme="none"
            placeholder="마크다운으로 자유롭게 쓰세요…"
            height="100%"
            basicSetup={mdBasicSetup}
            style={{ height: '100%', fontSize: 14, fontFamily: 'var(--font-sans)' }}
          />
        </div>

        <div
          style={{
            padding: '10px 20px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <Mono style={{ fontSize: 10, color: 'var(--ink-faint)' }}>⌘S 저장 · Esc 닫기</Mono>
          <span style={{ flex: 1 }} />
          <Button sm ghost onClick={handleClose}>닫기</Button>
          <Button sm onClick={handleSave}>저장</Button>
        </div>
      </div>
    </div>
  );
}
