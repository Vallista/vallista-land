import { useEffect, useRef, useState } from 'react';
import type { GleanItem, GleanSource } from '@vallista/content-core';
import { addGlean, fetchUrl } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

type Props = {
  onClose: () => void;
  onAdded: (item: GleanItem) => void;
};

export function AddDialog({ onClose, onAdded }: Props) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [source, setSource] = useState<GleanSource>('paste');
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    titleRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (/^https?:\/\//i.test(trimmed)) {
      setSource((prev) => (prev === 'paste' ? 'web' : prev));
    }
  }, [url]);

  const fetchFromUrl = async () => {
    if (fetching || busy) return;
    const trimmed = url.trim();
    if (!trimmed) {
      setError('URL을 먼저 입력하세요');
      return;
    }
    setFetching(true);
    setError(null);
    try {
      const result = await fetchUrl(trimmed);
      if (result.url) setUrl(result.url);
      if (result.title) setTitle(result.title);
      if (result.excerpt) setExcerpt(result.excerpt);
      if (result.body) setBody(result.body);
      if (result.sourceGuess) setSource(result.sourceGuess);
    } catch (e) {
      setError(`페치 실패: ${e}`);
    } finally {
      setFetching(false);
    }
  };

  const submit = async () => {
    if (busy) return;
    const t = title.trim();
    const b = body.trim();
    if (!t && !b) {
      setError('제목 또는 본문 중 하나는 입력하세요');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const item = await addGlean({
        id: newId(),
        url: url.trim(),
        source,
        title: t,
        excerpt: excerpt.trim() || autoExcerpt(b),
        body: b,
      });
      onAdded(item);
      onClose();
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          width: 'min(560px, 92vw)',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Mono style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.06em' }}>
            줍기 · 새 캡처
          </Mono>
          <SourcePicker source={source} onChange={setSource} />
        </div>

        <div
          style={{
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            overflowY: 'auto',
          }}
        >
          <Field label="URL">
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://… (선택)"
                style={inputStyle()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchFromUrl();
                  }
                }}
              />
              <button
                type="button"
                onClick={fetchFromUrl}
                disabled={fetching || busy || !url.trim()}
                style={{
                  padding: '0 12px',
                  border: '1px solid var(--line)',
                  background: 'var(--bg)',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  letterSpacing: '0.06em',
                  borderRadius: 5,
                  cursor: fetching || !url.trim() ? 'wait' : 'pointer',
                  whiteSpace: 'nowrap',
                  opacity: !url.trim() ? 0.5 : 1,
                }}
              >
                {fetching ? '가져오는 중…' : '가져오기'}
              </button>
            </div>
          </Field>
          <Field label="제목">
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="이 글을 무엇이라 부를까요"
              style={inputStyle()}
            />
          </Field>
          <Field label="요약 (선택)">
            <input
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="비우면 본문 앞부분에서 자동 생성"
              style={inputStyle()}
            />
          </Field>
          <Field label="본문">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="기사 본문을 붙여넣으세요"
              rows={10}
              style={{
                ...inputStyle(),
                fontFamily: 'var(--font-serif)',
                lineHeight: 1.55,
                resize: 'vertical',
                minHeight: 140,
              }}
            />
          </Field>
        </div>

        {error && (
          <div
            style={{
              padding: '8px 18px',
              background: 'var(--err-soft)',
              color: 'var(--err)',
              fontSize: 11.5,
              fontFamily: 'var(--font-mono)',
              borderTop: '1px solid var(--err-soft)',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            padding: '10px 18px',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            background: 'var(--bg-soft)',
          }}
        >
          <button onClick={onClose} disabled={busy} style={btnGhost()}>
            취소
          </button>
          <button onClick={submit} disabled={busy} style={btnPrimary(busy)}>
            {busy ? '저장 중…' : '거두기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)', letterSpacing: '0.06em' }}>
        {label}
      </Mono>
      {children}
    </label>
  );
}

function SourcePicker({
  source,
  onChange,
}: {
  source: GleanSource;
  onChange: (s: GleanSource) => void;
}) {
  const opts: { id: GleanSource; label: string }[] = [
    { id: 'paste', label: 'PASTE' },
    { id: 'web', label: 'WEB' },
    { id: 'rss', label: 'RSS' },
    { id: 'youtube', label: 'YOUTUBE' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        gap: 1,
        padding: 1,
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 5,
      }}
    >
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: '3px 8px',
            borderRadius: 3,
            border: 'none',
            background: source === o.id ? 'var(--bg-shade)' : 'transparent',
            color: source === o.id ? 'var(--ink)' : 'var(--ink-mute)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            letterSpacing: '0.06em',
            cursor: 'pointer',
            fontWeight: source === o.id ? 600 : 500,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    padding: '7px 10px',
    border: '1px solid var(--line)',
    background: 'var(--bg-input, var(--bg))',
    color: 'var(--ink)',
    fontSize: 12.5,
    borderRadius: 5,
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };
}

function btnGhost(): React.CSSProperties {
  return {
    padding: '5px 12px',
    border: '1px solid var(--line)',
    background: 'transparent',
    color: 'var(--ink-soft)',
    fontFamily: 'inherit',
    fontSize: 12,
    borderRadius: 5,
    cursor: 'pointer',
  };
}

function btnPrimary(busy: boolean): React.CSSProperties {
  return {
    padding: '5px 14px',
    border: '1px solid var(--ink)',
    background: 'var(--ink)',
    color: 'var(--on-accent)',
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 5,
    cursor: busy ? 'wait' : 'pointer',
  };
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function autoExcerpt(body: string): string {
  const text = body.replace(/\s+/g, ' ').trim();
  if (text.length <= 200) return text;
  return `${text.slice(0, 200)}…`;
}
