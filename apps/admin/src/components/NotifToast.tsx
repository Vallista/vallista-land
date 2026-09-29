import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './atoms/Atoms';

export interface ToastItem {
  id: string;
  title: string;
  body?: string;
  cta?: { label: string; onClick: () => void };
  duration?: number; // ms, 0 = 자동 닫기 없음 (기본 8000)
}

export function useToasts(): {
  toasts: ToastItem[];
  addToast: (t: Omit<ToastItem, 'id'> & { id?: string }) => void;
  removeToast: (id: string) => void;
} {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (t: Omit<ToastItem, 'id'> & { id?: string }) => {
      const id = t.id ?? `toast-${Date.now()}-${Math.random()}`;
      const item: ToastItem = { duration: 8000, ...t, id };
      setToasts((prev) => {
        if (prev.some((x) => x.id === id)) return prev;
        return [...prev, item];
      });
      if (item.duration && item.duration > 0) {
        const timer = window.setTimeout(() => removeToast(id), item.duration);
        timers.current.set(id, timer);
      }
    },
    [removeToast],
  );

  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);

  return { toasts, addToast, removeToast };
}

export function dispatchToast(opts: Omit<ToastItem, 'id'> & { id?: string }): void {
  window.dispatchEvent(new CustomEvent('bento:toast', { detail: opts }));
}

export function dispatchRemoveToast(id: string): void {
  window.dispatchEvent(new CustomEvent('bento:toast-remove', { detail: id }));
}

const MAX_VISIBLE = 3;

export function Toaster({
  toasts,
  onRemove,
}: {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}): JSX.Element {
  const visible = toasts.slice(-MAX_VISIBLE);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {visible.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onRemove }: { toast: ToastItem; onRemove: (id: string) => void }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setOpacity(1));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      style={{
        width: 300,
        border: '1px solid var(--line)',
        borderRadius: 10,
        background: 'var(--bg)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
        padding: '12px 14px',
        opacity,
        transition: 'opacity 180ms ease',
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--ink)',
            flexShrink: 1,
            minWidth: 0,
          }}
        >
          {toast.title}
        </span>
        <button
          onClick={() => onRemove(toast.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-mute)',
            fontSize: 14,
            lineHeight: 1,
            padding: '0 2px',
            flexShrink: 0,
          }}
          aria-label="닫기"
        >
          ×
        </button>
      </div>
      {toast.body && (
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--ink-soft)',
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {toast.body}
        </div>
      )}
      {toast.cta && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
          <Button
            ghost
            sm
            onClick={() => {
              toast.cta!.onClick();
              onRemove(toast.id);
            }}
          >
            {toast.cta.label}
          </Button>
        </div>
      )}
    </div>
  );
}
