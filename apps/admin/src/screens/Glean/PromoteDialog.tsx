import { useEffect, useRef, useState } from 'react';
import type { GleanItem } from '@vallista/content-core';
import { writeDoc, updateGleanStatus, readDoc } from '../../lib/tauri';
import { serializeDoc } from '../Atelier/save';
import { Mono } from '../../components/atoms/Atoms';

type Props = {
  item: GleanItem;
  onClose: () => void;
  onPromoted: (updated: GleanItem) => void;
};

export function PromoteDialog({ item, onClose, onPromoted }: Props) {
  const [slug, setSlug] = useState(() => slugify(item.title) || `glean-${item.id.slice(0, 8)}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const slugRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    slugRef.current?.focus();
    slugRef.current?.select();
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async () => {
    if (busy) return;
    const cleanSlug = slug.trim().replace(/^\/+|\/+$/g, '');
    if (!cleanSlug) {
      setError('slug를 입력하세요');
      return;
    }
    if (!/^[a-z0-9._-]+$/i.test(cleanSlug)) {
      setError('slug는 영숫자 · 하이픈 · 점 · 언더스코어만 사용 가능');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const path = `contents/notes/${cleanSlug}.md`;
      const existing = await readDoc(path);
      if (existing.exists) {
        setError(`이미 존재합니다: ${path}`);
        setBusy(false);
        return;
      }
      const docId = `note_${cleanSlug}`;
      const md = buildSeedMarkdown(item, docId);
      await writeDoc(path, md);
      const updated = await updateGleanStatus(item.id, 'promoted', docId);
      onPromoted(updated);
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
          width: 'min(480px, 92vw)',
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
            씨앗으로 — contents/notes/
          </Mono>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
            이 캡처를 새 노트(seed)로 옮깁니다. 하이라이트와 출처가 본문에 인용되고, 이 줍기 항목은 <Mono style={{ color: 'var(--ok)' }}>promoted</Mono>로 표시됩니다.
          </p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Mono style={{ fontSize: 9.5, color: 'var(--ink-mute)', letterSpacing: '0.06em' }}>
              SLUG
            </Mono>
            <input
              ref={slugRef}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
              style={{
                padding: '7px 10px',
                border: '1px solid var(--line)',
                background: 'var(--bg-input, var(--bg))',
                color: 'var(--ink)',
                fontSize: 12.5,
                borderRadius: 5,
                fontFamily: 'var(--font-mono)',
                outline: 'none',
              }}
            />
          </label>
          {item.highlights.length > 0 && (
            <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
              하이라이트 {item.highlights.length}개가 본문에 인용됩니다
            </Mono>
          )}
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
          <button
            onClick={onClose}
            disabled={busy}
            style={{
              padding: '5px 12px',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--ink-soft)',
              fontFamily: 'inherit',
              fontSize: 12,
              borderRadius: 5,
              cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={submit}
            disabled={busy}
            style={{
              padding: '5px 14px',
              border: '1px solid var(--ink)',
              background: 'var(--ink)',
              color: 'var(--on-accent)',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 5,
              cursor: busy ? 'wait' : 'pointer',
            }}
          >
            {busy ? '심는 중…' : '씨앗 만들기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function buildSeedMarkdown(item: GleanItem, docId: string): string {
  const now = new Date().toISOString();
  const data: Record<string, unknown> = {
    id: docId,
    title: item.title || '(제목 없음)',
    state: 'seed',
    tags: [],
    source: {
      kind: 'glean',
      gleanId: item.id,
      ...(item.url ? { url: item.url } : {}),
      fetchedAt: item.fetchedAt,
    },
    createdAt: now,
    updatedAt: now,
  };

  const lines: string[] = [];
  if (item.url) {
    lines.push(`> 출처: [${hostname(item.url) || item.url}](${item.url})`);
    lines.push('');
  }
  if (item.excerpt) {
    lines.push(item.excerpt);
    lines.push('');
  }
  if (item.highlights.length > 0) {
    lines.push('## 하이라이트');
    lines.push('');
    const sorted = item.highlights.slice().sort((a, b) => a.range[0] - b.range[0]);
    for (const h of sorted) {
      const text = item.body.slice(h.range[0], h.range[1]).trim();
      if (!text) continue;
      const quoted = text
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
      lines.push(quoted);
      if (h.note) {
        lines.push('');
        lines.push(h.note);
      }
      lines.push('');
    }
  } else if (item.body) {
    lines.push('## 거둔 본문');
    lines.push('');
    lines.push(item.body);
    lines.push('');
  }
  return serializeDoc(data, lines.join('\n').trimEnd() + '\n');
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}
