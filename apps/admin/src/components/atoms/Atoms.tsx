import type { CSSProperties, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

type Tone = 'ok' | 'warn' | 'err' | 'blue' | 'mute';

export function Mono({ children, style, ...rest }: { children: ReactNode; style?: CSSProperties }) {
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

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { style, ...rest } = props;
  return (
    <input
      {...rest}
      style={{
        padding: '8px 11px',
        borderRadius: 6,
        border: '1px solid var(--line)',
        background: 'var(--bg-input)',
        color: 'var(--ink)',
        fontSize: 13,
        width: '100%',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 120ms',
        ...style,
      }}
    />
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

export function LoamIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <line x1="2" y1="14" x2="16" y2="14" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9" y1="14" x2="9" y2="6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M9 9 C 6 8.5, 4 7, 4 5 C 6 5, 8 6.5, 9 9 Z" fill={color} />
      <path d="M9 7 C 12 6.5, 14 5, 14 3 C 12 3, 10 4.5, 9 7 Z" fill={color} />
    </svg>
  );
}

export function BrandMark({ name = 'Pensmith' }: { name?: string }) {
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
        <LoamIcon size={14} />
      </span>
      {name}
    </span>
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
