import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  CSSProperties,
  ReactNode,
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  HTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

type Tone = 'ok' | 'warn' | 'err' | 'blue' | 'mute';

export function Mono({ children, style, ...rest }: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--ink-mute)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10.5,
        color: 'var(--ink-mute)',
        background: 'var(--bg-shade)',
        padding: '2px 5px',
        borderRadius: 4,
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone = 'ok', pulse = false }: { tone?: Tone; pulse?: boolean }) {
  const color =
    tone === 'ok'
      ? 'var(--ok)'
      : tone === 'warn'
        ? 'var(--warn)'
        : tone === 'err'
          ? 'var(--err)'
          : tone === 'blue'
            ? 'var(--blue)'
            : 'var(--ink-mute)';
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: 999,
        background: color,
        display: 'inline-block',
        animation: pulse ? 'psm-pulse 1.2s ease-in-out infinite' : 'none',
        boxShadow: pulse ? `0 0 0 4px ${color}22` : 'none',
      }}
    />
  );
}

export function Chip({
  children,
  active,
  tone,
  onClick,
  style,
}: {
  children: ReactNode;
  active?: boolean;
  tone?: Tone;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  let bg: CSSProperties['background'] = 'transparent';
  let color: CSSProperties['color'] = 'var(--ink-soft)';
  if (active) {
    bg = 'var(--ink)';
    color = 'var(--on-accent)';
  }
  if (tone === 'blue') {
    bg = 'var(--blue-soft)';
    color = 'var(--blue)';
  }
  if (tone === 'ok') {
    bg = 'var(--ok-soft)';
    color = 'var(--ok)';
  }
  if (tone === 'warn') {
    bg = 'var(--warn-soft)';
    color = 'var(--warn)';
  }
  if (tone === 'err') {
    bg = 'var(--err-soft)';
    color = 'var(--err)';
  }
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        borderRadius: 999,
        border: '1px solid transparent',
        background: bg,
        color,
        fontSize: 11.5,
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.2,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Tag({
  children,
  mono = true,
  style,
}: {
  children: ReactNode;
  mono?: boolean;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 10.5,
        background: 'var(--bg-shade)',
        color: 'var(--ink-2)',
        padding: '2px 7px',
        borderRadius: 4,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  ghost?: boolean;
  danger?: boolean;
  sm?: boolean;
};

export function Button({ children, ghost, danger, sm, style, ...rest }: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: sm ? '6px 10px' : '8px 14px',
    borderRadius: 6,
    border: '1px solid transparent',
    background: 'var(--ink)',
    color: 'var(--on-accent)',
    fontSize: sm ? 12 : 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    transition: 'background 120ms, border-color 120ms',
  };
  if (ghost) {
    base.background = 'transparent';
    base.color = 'var(--ink)';
    base.border = '1px solid var(--line-strong)';
  }
  if (danger) {
    base.background = 'var(--bg-shade)';
    base.color = 'var(--err)';
    base.border = '1px solid rgba(248,113,113,0.3)';
  }
  return (
    <button {...rest} style={{ ...base, ...style }}>
      {children}
    </button>
  );
}

export function IconBtn({
  children,
  onClick,
  title,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        border: 'none',
        background: 'transparent',
        color: 'var(--ink-soft)',
        borderRadius: 6,
        cursor: 'pointer',
        fontFamily: 'inherit',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  style,
  padded = true,
  head,
}: {
  children: ReactNode;
  style?: CSSProperties;
  padded?: boolean;
  head?: ReactNode;
}) {
  return (
    <section
      style={{
        border: '1px solid var(--line)',
        borderRadius: 12,
        background: 'var(--bg)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {head && (
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--line)',
            background: 'var(--bg-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {head}
        </div>
      )}
      <div style={{ padding: padded ? '18px 22px' : 0 }}>{children}</div>
    </section>
  );
}

export function CardTitle({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <h2
      style={{
        margin: 0,
        fontSize: 11.5,
        fontWeight: 600,
        color: 'var(--ink-soft)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        ...style,
      }}
    >
      {children}
    </h2>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  sm?: boolean;
  mono?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { sm, mono, style, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      {...rest}
      style={{
        padding: sm ? '6px 9px' : '8px 11px',
        borderRadius: sm ? 5 : 6,
        border: '1px solid var(--line)',
        background: sm ? 'var(--bg)' : 'var(--bg-input)',
        color: 'var(--ink)',
        fontSize: sm ? 12 : 13,
        width: '100%',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        outline: 'none',
        transition: 'border-color 120ms',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
});

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  sm?: boolean;
  mono?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { sm, mono, style, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      {...rest}
      style={{
        padding: sm ? '6px 9px' : '8px 11px',
        borderRadius: sm ? 5 : 6,
        border: '1px solid var(--line)',
        background: sm ? 'var(--bg)' : 'var(--bg-input)',
        color: 'var(--ink)',
        fontSize: sm ? 12 : 13,
        width: '100%',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        outline: 'none',
        transition: 'border-color 120ms',
        resize: 'vertical',
        lineHeight: 1.5,
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
});

export function Checkbox({
  checked,
  onChange,
  disabled,
  children,
  title,
  style,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
  title?: string;
  style?: CSSProperties;
}) {
  const box = (
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        accentColor: 'var(--ink)',
        margin: 0,
      }}
    />
  );
  if (!children) return box;
  return (
    <label
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        color: disabled ? 'var(--ink-faint)' : 'var(--ink)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none',
        ...style,
      }}
    >
      {box}
      {children}
    </label>
  );
}

export function PageHead({
  title,
  sub,
  right,
  style,
}: {
  title: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <header
      style={{
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 24,
        ...style,
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: 'var(--ink)',
          }}
        >
          {title}
        </h1>
        {sub && (
          <p style={{ margin: '2px 0 0', color: 'var(--ink-soft)', fontSize: 12.5 }}>{sub}</p>
        )}
      </div>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>}
    </header>
  );
}

export function BentoIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect
        x="2.4"
        y="3.4"
        width="13.2"
        height="11.2"
        rx="2.4"
        ry="2.4"
        stroke={color}
        strokeWidth="1.4"
      />
      <line x1="9" y1="3.6" x2="9" y2="14.4" stroke={color} strokeWidth="1.4" />
      <line x1="9" y1="9" x2="15.4" y2="9" stroke={color} strokeWidth="1.4" />
    </svg>
  );
}

export function BrandMark({ name = 'Bento' }: { name?: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-sans)',
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: 'var(--ink)',
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          width: 22,
          height: 22,
          borderRadius: 5,
          background: 'var(--bg-shade)',
          color: 'var(--ok)',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--line)',
        }}
      >
        <BentoIcon size={14} />
      </span>
      {name}
    </span>
  );
}

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
  dot?: string;
}

export function Select<T extends string = string>({
  value,
  options,
  placeholder = '선택',
  onChange,
  fullWidth = true,
}: {
  value: T | '' | null | undefined;
  options: SelectOption<T>[];
  placeholder?: string;
  onChange: (v: T | undefined) => void;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);

  const updatePos = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setPos({ left: r.left, top: r.bottom + 4, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePos();
    const onResize = () => updatePos();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const cur = options.find((o) => o.value === value);

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'relative',
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '6px 9px',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 5,
          color: cur ? 'var(--ink)' : 'var(--ink-mute)',
          fontSize: 12,
          fontFamily: 'inherit',
          cursor: 'pointer',
          textAlign: 'left',
          outline: 'none',
        }}
      >
        {cur?.dot && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: cur.dot,
              flex: '0 0 6px',
            }}
          />
        )}
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {cur ? cur.label : placeholder}
        </span>
        <span style={{ color: 'var(--ink-mute)', fontSize: 9 }}>▾</span>
      </button>
      {open && pos &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: fullWidth ? pos.width : Math.max(pos.width, 160),
              zIndex: 9999,
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: 4,
            }}
          >
            <SelectRow
              label={placeholder}
              active={!cur}
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            />
            {options.map((o) => (
              <SelectRow
                key={o.value}
                label={o.label}
                hint={o.hint}
                dot={o.dot}
                active={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              />
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

function SelectRow({
  label,
  hint,
  dot,
  active,
  onClick,
}: {
  label: string;
  hint?: string;
  dot?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        border: 'none',
        background: active ? 'var(--bg-shade)' : 'transparent',
        color: 'var(--ink)',
        fontSize: 12,
        fontFamily: 'inherit',
        cursor: 'pointer',
        textAlign: 'left',
        borderRadius: 4,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: dot,
            flex: '0 0 6px',
          }}
        />
      )}
      <span style={{ flex: 1 }}>{label}</span>
      {hint && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--ink-mute)',
          }}
        >
          {hint}
        </span>
      )}
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        color: 'var(--ink-mute)',
        textAlign: 'center',
        padding: '40px 0',
        fontStyle: 'italic',
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}
