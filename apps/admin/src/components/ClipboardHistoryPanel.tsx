import { useEffect, useRef, useState } from 'react';
import type { ClipboardEntry } from '../lib/tauri';
import {
  clipboardHistoryClear,
  clipboardHistoryDelete,
  clipboardHistoryDeleteWithinHours,
  clipboardHistoryList,
  clipboardHistoryPush,
  clipboardReadText,
  startWindowDrag,
} from '../lib/tauri';
import { Input, Mono } from './atoms/Atoms';

export function ClipboardHistoryPanel({
  open,
  onClose,
  popup = false,
}: {
  open: boolean;
  onClose: () => void;
  popup?: boolean;
}) {
  const [entries, setEntries] = useState<ClipboardEntry[]>([]);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [timeMenuOpen, setTimeMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    clipboardReadText()
      .then((text) => text?.trim() ? clipboardHistoryPush(text) : clipboardHistoryList())
      .then(setEntries)
      .catch(() => clipboardHistoryList().then(setEntries).catch(() => setEntries([])));
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  const filtered = entries.filter((e) =>
    e.text.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    if (active >= filtered.length) setActive(0);
  }, [filtered.length, active]);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLLIElement>(`[data-idx="${active}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const entry = filtered[active];
        if (entry) pasteEntry(entry);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, active]);

  const pasteEntry = async (entry: ClipboardEntry) => {
    try {
      await navigator.clipboard.writeText(entry.text);
      setCopied(entry.id);
      if (popup) {
        window.setTimeout(() => onClose(), 400);
      } else {
        window.setTimeout(() => setCopied(null), 1200);
      }
    } catch {
      /* ignore */
    }
  };

  const deleteEntry = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = await clipboardHistoryDelete(id).catch(() => null);
    if (updated) setEntries(updated);
  };

  const clearAll = async () => {
    await clipboardHistoryClear().catch(() => null);
    setEntries([]);
  };

  const deleteWithinHours = async (hours: number) => {
    const updated = await clipboardHistoryDeleteWithinHours(hours).catch(() => null);
    if (updated) setEntries(updated);
    setTimeMenuOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={popup ? undefined : onClose}
      data-tauri-drag-region={popup ? '' : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        background: popup ? 'transparent' : 'rgba(15,18,22,0.42)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: popup ? 24 : '14vh',
        zIndex: 200,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        data-tauri-drag-region={popup ? '' : undefined}
        style={{
          width: popup ? 'min(560px, calc(100vw - 80px))' : 'min(560px, 92vw)',
          maxHeight: popup ? 'calc(100vh - 48px)' : '60vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg)',
          border: '1px solid var(--line-strong)',
          borderRadius: 12,
          boxShadow: '0 20px 60px rgba(0,0,0,0.32)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          onMouseDown={popup ? startWindowDrag : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="2" y="1" width="11" height="13" rx="1.5" stroke="var(--ink-mute)" strokeWidth="1.3" />
            <path d="M5 1.5h5" stroke="var(--ink-mute)" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M4.5 6h6M4.5 9h4" stroke="var(--ink-mute)" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="클립보드 히스토리 검색…"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: 0,
              fontSize: 14,
              borderRadius: 0,
            }}
          />
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
            {filtered.length}건
          </Mono>
        </div>

        {/* List */}
        <ul
          ref={listRef}
          style={{
            margin: 0,
            padding: 4,
            listStyle: 'none',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {filtered.length === 0 ? (
            <li
              style={{
                padding: 'calc(var(--card-pad) + 8px) var(--card-pad)',
                color: 'var(--ink-mute)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              {entries.length === 0 ? '아직 복사한 내용이 없습니다.' : '일치하는 항목이 없습니다.'}
            </li>
          ) : (
            filtered.map((entry, i) => (
              <li
                key={entry.id}
                data-idx={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => pasteEntry(entry)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: i === active ? 'var(--bg-shade)' : 'transparent',
                  transition: 'background 80ms',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'var(--ink)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontFamily: entry.text.length < 120 ? 'inherit' : 'var(--font-mono)',
                    }}
                  >
                    {entry.text}
                  </div>
                  <Mono
                    style={{
                      fontSize: 10,
                      color: 'var(--ink-mute)',
                      display: 'block',
                      marginTop: 2,
                    }}
                  >
                    {formatTime(entry.copiedAt)}
                  </Mono>
                </div>
                {copied === entry.id ? (
                  <Mono style={{ fontSize: 10, color: 'var(--ok)', flexShrink: 0 }}>복사됨</Mono>
                ) : (
                  <button
                    onClick={(e) => deleteEntry(e, entry.id)}
                    title="삭제"
                    style={{
                      flexShrink: 0,
                      width: 20,
                      height: 20,
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--ink-mute)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 4,
                      opacity: i === active ? 1 : 0,
                      transition: 'opacity 80ms',
                      padding: 0,
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                      <path d="M2 2l7 7M9 2L2 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </li>
            ))
          )}
        </ul>

        {/* Footer */}
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Mono style={{ fontSize: 10.5, color: 'var(--ink-mute)', display: 'flex', gap: 14 }}>
            <span>↑↓ 이동</span>
            <span>↵ 복사</span>
            <span>esc 닫기</span>
          </Mono>
          {entries.length > 0 && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {timeMenuOpen ? (
                <>
                  {([1, 6, 24] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => deleteWithinHours(h)}
                      style={footerBtnStyle}
                    >
                      {h}h
                    </button>
                  ))}
                  <button onClick={() => setTimeMenuOpen(false)} style={footerBtnStyle}>
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setTimeMenuOpen(true)} style={footerBtnStyle}>
                    최근 삭제 ▾
                  </button>
                  <button onClick={clearAll} style={footerBtnStyle}>
                    전체 삭제
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const footerBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--ink-mute)',
  fontSize: 10.5,
  fontFamily: 'var(--font-mono)',
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: 4,
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}시간 전`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}일 전`;
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
