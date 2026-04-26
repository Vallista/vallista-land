import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GleanItem, GleanStatus } from '@vallista/content-core';
import { Mono } from '../../components/atoms/Atoms';
import { deleteGlean, updateGleanHighlights, updateGleanStatus } from '../../lib/tauri';
import { buildSegments, getTextOffset, mergeHighlight, removeHighlight } from './highlight';
import { PromoteDialog } from './PromoteDialog';

type Props = {
  item: GleanItem;
  onChange: (item: GleanItem) => void;
  onDelete: () => void;
};

type PendingSelection = { start: number; end: number; rect: DOMRect };

export function GleanDetail({ item, onChange, onDelete }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [pending, setPending] = useState<PendingSelection | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const setStatus = async (next: GleanStatus) => {
    if (busy || item.status === next) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateGleanStatus(item.id, next);
      onChange(updated);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (busy) return;
    if (!confirm(`정말 삭제할까요?\n\n${item.title}`)) return;
    setBusy(true);
    setError(null);
    try {
      await deleteGlean(item.id);
      onDelete();
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  };

  const addHighlight = useCallback(async () => {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const next = mergeHighlight(item.highlights, pending.start, pending.end);
      const updated = await updateGleanHighlights(item.id, next);
      onChange(updated);
      setPending(null);
      window.getSelection()?.removeAllRanges();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }, [pending, item.id, item.highlights, onChange]);

  const dropHighlight = useCallback(
    async (index: number) => {
      setBusy(true);
      setError(null);
      try {
        const next = removeHighlight(item.highlights, index);
        const updated = await updateGleanHighlights(item.id, next);
        onChange(updated);
      } catch (e) {
        setError(String(e));
      } finally {
        setBusy(false);
      }
    },
    [item.id, item.highlights, onChange],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative' }}>
      <Header
        item={item}
        busy={busy}
        onSetStatus={setStatus}
        onDelete={remove}
        onPromote={() => setPromoteOpen(true)}
      />
      {error && (
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--err-soft)',
            color: 'var(--err)',
            fontSize: 11.5,
            fontFamily: 'var(--font-mono)',
            borderBottom: '1px solid var(--err-soft)',
          }}
        >
          {error}
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 36px' }}>
        <Body
          item={item}
          bodyRef={bodyRef}
          onSelectionChange={setPending}
          onRemoveHighlight={dropHighlight}
          disabled={busy || item.status === 'promoted'}
        />
      </div>
      {pending && item.status !== 'promoted' && (
        <HighlightAction pending={pending} onConfirm={addHighlight} onCancel={() => setPending(null)} />
      )}
      {promoteOpen && (
        <PromoteDialog
          item={item}
          onClose={() => setPromoteOpen(false)}
          onPromoted={(updated) => {
            onChange(updated);
            setPromoteOpen(false);
          }}
        />
      )}
    </div>
  );
}

function Header({
  item,
  busy,
  onSetStatus,
  onDelete,
  onPromote,
}: {
  item: GleanItem;
  busy: boolean;
  onSetStatus: (s: GleanStatus) => void;
  onDelete: () => void;
  onPromote: () => void;
}) {
  const promoted = item.status === 'promoted';
  return (
    <div
      style={{
        padding: '12px 28px 10px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg-soft)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
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
          {item.url || `paste/${item.id}`}
        </Mono>
        <StatusToggle status={item.status} disabled={busy} onChange={onSetStatus} />
        <button
          onClick={onPromote}
          disabled={busy || promoted}
          title={promoted ? '이미 씨앗이 되었습니다' : '씨앗으로 — notes에 새 노트 생성'}
          style={{
            padding: '3px 10px',
            border: '1px solid var(--ok)',
            background: promoted ? 'var(--ok-soft)' : 'transparent',
            color: 'var(--ok)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            letterSpacing: '0.06em',
            borderRadius: 4,
            cursor: busy || promoted ? 'not-allowed' : 'pointer',
            opacity: promoted ? 0.6 : 1,
          }}
        >
          {promoted ? '씨앗 ✓' : '씨앗으로'}
        </button>
        <button
          onClick={onDelete}
          disabled={busy}
          style={{
            padding: '3px 9px',
            border: '1px solid var(--line)',
            background: 'var(--bg)',
            color: 'var(--err)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            letterSpacing: '0.06em',
            borderRadius: 4,
            cursor: busy ? 'wait' : 'pointer',
          }}
        >
          삭제
        </button>
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
        {item.title || '(제목 없음)'}
      </h1>
      <Mono style={{ fontSize: 9.5, color: 'var(--ink-faint)' }}>
        {item.source.toUpperCase()} · {formatTime(item.fetchedAt)}
        {item.highlights.length > 0 ? ` · 하이라이트 ${item.highlights.length}` : ''}
        {promoted && item.promotedDocId ? ` · → ${item.promotedDocId}` : ''}
      </Mono>
    </div>
  );
}

function StatusToggle({
  status,
  disabled,
  onChange,
}: {
  status: GleanStatus;
  disabled: boolean;
  onChange: (s: GleanStatus) => void;
}) {
  const options: { id: GleanStatus; label: string }[] = [
    { id: 'unread', label: '안 읽음' },
    { id: 'read', label: '읽음' },
    { id: 'archived', label: '보관' },
  ];
  const locked = disabled || status === 'promoted';
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
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          disabled={locked}
          style={{
            padding: '3px 9px',
            borderRadius: 3,
            border: 'none',
            background: status === o.id ? 'var(--bg-shade)' : 'transparent',
            color: status === o.id ? 'var(--ink)' : 'var(--ink-mute)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            letterSpacing: '0.06em',
            cursor: locked ? 'not-allowed' : 'pointer',
            fontWeight: status === o.id ? 600 : 500,
            opacity: locked ? 0.6 : 1,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Body({
  item,
  bodyRef,
  onSelectionChange,
  onRemoveHighlight,
  disabled,
}: {
  item: GleanItem;
  bodyRef: React.RefObject<HTMLDivElement>;
  onSelectionChange: (sel: PendingSelection | null) => void;
  onRemoveHighlight: (index: number) => void;
  disabled: boolean;
}) {
  const segments = useMemo(() => buildSegments(item.body, item.highlights), [item.body, item.highlights]);

  useEffect(() => {
    if (disabled) return;
    function onUp() {
      const root = bodyRef.current;
      if (!root) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        onSelectionChange(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!root.contains(range.commonAncestorContainer)) {
        onSelectionChange(null);
        return;
      }
      const start = getTextOffset(root, range.startContainer, range.startOffset);
      const end = getTextOffset(root, range.endContainer, range.endOffset);
      if (start < 0 || end < 0 || start === end) {
        onSelectionChange(null);
        return;
      }
      const [s, e] = start <= end ? [start, end] : [end, start];
      const rect = range.getBoundingClientRect();
      onSelectionChange({ start: s, end: e, rect });
    }
    document.addEventListener('mouseup', onUp);
    document.addEventListener('keyup', onUp);
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('keyup', onUp);
    };
  }, [bodyRef, disabled, onSelectionChange]);

  if (!item.body && !item.excerpt) {
    return (
      <div style={{ color: 'var(--ink-mute)', fontStyle: 'italic', fontSize: 13 }}>
        본문이 비어있습니다
      </div>
    );
  }
  return (
    <article
      style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 14,
        lineHeight: 1.7,
        color: 'var(--ink)',
        wordBreak: 'keep-all',
        overflowWrap: 'break-word',
        maxWidth: 720,
      }}
    >
      {item.excerpt && (
        <p
          style={{
            margin: '0 0 16px',
            color: 'var(--ink-mute)',
            fontStyle: 'italic',
            fontSize: 13,
            lineHeight: 1.55,
          }}
        >
          {item.excerpt}
        </p>
      )}
      <div ref={bodyRef} style={{ whiteSpace: 'pre-wrap' }}>
        {segments.map((seg, i) =>
          seg.highlightIndex !== null ? (
            <mark
              key={i}
              onClick={(e) => {
                if (disabled) return;
                if (e.shiftKey) onRemoveHighlight(seg.highlightIndex!);
              }}
              title={disabled ? undefined : 'Shift+클릭으로 하이라이트 제거'}
              style={{
                background: 'var(--warn-soft, rgba(255, 220, 100, 0.4))',
                color: 'inherit',
                padding: '0 1px',
                borderRadius: 2,
                cursor: disabled ? 'default' : 'pointer',
              }}
            >
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </div>
    </article>
  );
}

function HighlightAction({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: PendingSelection;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const top = Math.max(8, pending.rect.top - 38);
  const left = Math.max(8, pending.rect.left + pending.rect.width / 2 - 60);
  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 50,
        display: 'flex',
        gap: 1,
        padding: 2,
        background: 'var(--ink)',
        color: 'var(--on-accent)',
        borderRadius: 5,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
      }}
    >
      <button
        onClick={onConfirm}
        style={{
          padding: '4px 10px',
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          cursor: 'pointer',
          borderRadius: 3,
        }}
      >
        하이라이트
      </button>
      <button
        onClick={onCancel}
        style={{
          padding: '4px 8px',
          background: 'transparent',
          border: 'none',
          color: 'var(--ink-mute)',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          cursor: 'pointer',
          borderRadius: 3,
        }}
      >
        ✕
      </button>
    </div>
  );
}

function formatTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  const d = new Date(t);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
