import { useCallback, useState, type FocusEvent, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';

export interface TipState {
  x: number;
  y: number;
  value: string;
  label: string;
  extra?: string;
}

/** 칸·막대마다 붙이는 툴팁. 값이 앞(굵게), 라벨이 뒤. 키보드 포커스에도 같은 내용을 띄운다 */
export function useHoverTip() {
  const [tip, setTip] = useState<TipState | null>(null);
  const show = useCallback(
    (e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>, content: Omit<TipState, 'x' | 'y'>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setTip({ x: r.left + r.width / 2, y: r.top, ...content });
    },
    [],
  );
  const hide = useCallback(() => setTip(null), []);
  return { tip, show, hide };
}

export function HoverTip({ tip }: { tip: TipState | null }) {
  if (!tip) return null;
  return createPortal(
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        left: tip.x,
        top: tip.y - 8,
        transform: 'translate(-50%, -100%)',
        zIndex: 9999,
        pointerEvents: 'none',
        background: 'var(--bg-elev)',
        border: '1px solid var(--line-strong)',
        borderRadius: 6,
        boxShadow: 'var(--shadow-2)',
        padding: '6px 9px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{tip.value}</span>
      <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{tip.label}</span>
      {tip.extra && <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{tip.extra}</span>}
    </div>,
    document.body,
  );
}

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

/** "10월 24일 (토)" */
export function dateLabel(k: string): string {
  const [y, m, d] = k.split('-').map((s) => Number.parseInt(s, 10));
  const dow = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12).getDay();
  return `${m}월 ${d}일 (${DOW[dow]})`;
}
