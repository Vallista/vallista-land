import { useState } from 'react';
import type { Task } from '@vallista/content-core';
import { addTask } from '../../lib/tauri';
import { Mono } from '../../components/atoms/Atoms';

export function QuickAdd({ onAdded }: { onAdded: (t: Task) => void }) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    setError(null);
    try {
      const task = await addTask({
        id: newId(),
        title: t,
        due: due ? `${due}T00:00:00Z` : undefined,
      });
      onAdded(task);
      setTitle('');
      setDue('');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        border: '1px solid var(--line)',
        borderRadius: 8,
        background: 'var(--bg-soft)',
        padding: '8px 10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Mono style={{ fontSize: 13, color: 'var(--ink-mute)' }}>+</Mono>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="할 일을 입력하세요…"
          disabled={busy}
          style={{
            flex: 1,
            padding: '4px 6px',
            background: 'transparent',
            border: 'none',
            color: 'var(--ink)',
            fontSize: 13.5,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          disabled={busy}
          style={{
            padding: '3px 6px',
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            color: 'var(--ink-soft)',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            outline: 'none',
          }}
        />
        <button
          onClick={submit}
          disabled={busy || !title.trim()}
          style={{
            padding: '3px 12px',
            border: '1px solid var(--ink)',
            background: title.trim() ? 'var(--ink)' : 'transparent',
            color: title.trim() ? 'var(--on-accent)' : 'var(--ink-mute)',
            fontFamily: 'inherit',
            fontSize: 11.5,
            fontWeight: 600,
            borderRadius: 4,
            cursor: busy || !title.trim() ? 'not-allowed' : 'pointer',
            opacity: title.trim() ? 1 : 0.5,
          }}
        >
          {busy ? '…' : 'Enter'}
        </button>
      </div>
      {error && (
        <Mono style={{ fontSize: 10.5, color: 'var(--err)' }}>{error}</Mono>
      )}
    </div>
  );
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
