import type { CSSProperties } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

const baseProps = ({ size = 14, color = 'currentColor', strokeWidth = 1.4, style }: IconProps) => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: color,
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  style: { display: 'inline-block', verticalAlign: '-2px', ...style },
});

export function ClockIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <circle cx="8" cy="8" r="5.6" />
      <path d="M8 5.2v3l1.8 1.4" />
    </svg>
  );
}

export function CheckIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <path d="M3.4 8.4 6.6 11.4 12.6 4.8" />
    </svg>
  );
}

export function ArrowRightIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <path d="M3 8h9.4" />
      <path d="M9.2 4.6 12.6 8l-3.4 3.4" />
    </svg>
  );
}

export function ChevronLeftIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <path d="M9.6 3.6 5.2 8l4.4 4.4" />
    </svg>
  );
}

export function ChevronRightIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <path d="M6.4 3.6 10.8 8l-4.4 4.4" />
    </svg>
  );
}

export function PlusIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <path d="M8 3v10" />
      <path d="M3 8h10" />
    </svg>
  );
}

export function CloseIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <path d="M4 4l8 8" />
      <path d="M12 4 4 12" />
    </svg>
  );
}

export function CalendarIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <rect x="2.6" y="3.4" width="10.8" height="10" rx="1.4" />
      <path d="M2.6 6.4h10.8" />
      <path d="M5.4 2.4v2" />
      <path d="M10.6 2.4v2" />
    </svg>
  );
}

export function StreakIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <path d="M3 11.6h10" />
      <path d="M4.4 9.4h7.2" />
      <path d="M6 7.2h4" />
      <path d="M7 5h2" />
    </svg>
  );
}

export function TicketIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <path d="M2.6 6.4v-2a1 1 0 0 1 1-1h8.8a1 1 0 0 1 1 1v2a1.4 1.4 0 0 0 0 2.8v2a1 1 0 0 1-1 1H3.6a1 1 0 0 1-1-1v-2a1.4 1.4 0 0 0 0-2.8z" />
      <path d="M6.6 5.2v5.6" strokeDasharray="1 1.4" />
    </svg>
  );
}

export function TimelineIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <path d="M3.2 3.6h9.6" />
      <path d="M5.6 8h7.2" />
      <path d="M3.2 12.4h9.6" />
      <circle cx="3.2" cy="8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PinIcon(p: IconProps = {}) {
  return (
    <svg {...baseProps(p)}>
      <path d="M8 9.4v3.4" />
      <path d="M5.4 9.4h5.2" />
      <path d="M5.6 9.4 5 6.4l1.2-1.2 3.6 3.6L8.6 10z" />
      <path d="m9.4 4.6 2 2" />
    </svg>
  );
}
