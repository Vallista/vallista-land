import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ScreenId } from '../shell/Shell';
import { showQuick, syncIcalFeeds } from '../lib/tauri';

const THEME_KEY = 'bento.theme';
const DENSITY_KEY = 'bento.density';

type Theme = 'dark' | 'light';
type Density = 'compact' | 'cozy' | 'spacious';

function readTheme(): Theme {
  const v = window.localStorage.getItem(THEME_KEY);
  return v === 'light' ? 'light' : 'dark';
}

function readDensity(): Density {
  const v = window.localStorage.getItem(DENSITY_KEY);
  return v === 'cozy' || v === 'spacious' ? v : 'compact';
}

function applyTheme(t: Theme) {
  window.localStorage.setItem(THEME_KEY, t);
  document.documentElement.setAttribute('data-theme', t);
}

function applyDensity(d: Density) {
  window.localStorage.setItem(DENSITY_KEY, d);
  document.documentElement.setAttribute('data-density', d);
}

const DENSITY_CYCLE: Density[] = ['compact', 'cozy', 'spacious'];
const DENSITY_LABELS: Record<Density, string> = { compact: 'Compact', cozy: 'Cozy', spacious: 'Spacious' };

interface MenuItem {
  icon: string;
  label: string;
  hint?: string;
  action: () => void;
}

function screenItems(screen: ScreenId): MenuItem[] {
  switch (screen) {
    case 'today':
      return [{ icon: '⌇', label: '빠른 메모', hint: '생각을 짧게', action: () => void showQuick('thought') }];
    case 'thoughts':
      return [{ icon: '⌇', label: '생각 추가', hint: '짧게 끄적이기', action: () => void showQuick('thought') }];
    case 'plan':
      return [
        { icon: '☐', label: '할 일 추가', hint: '인박스에 넣기', action: () => void showQuick('task') },
        { icon: '◷', label: '캘린더 동기화', hint: 'iCal 새로고침', action: () => void syncIcalFeeds() },
      ];
    case 'glean':
      return [{ icon: '⊞', label: '글 추가', hint: '링크·텍스트 캡처', action: () => void showQuick('glean') }];
    default:
      return [];
  }
}

export function ContextMenu({
  currentScreen,
  onOpenTweaks,
}: {
  currentScreen: ScreenId;
  onOpenTweaks: () => void;
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [theme, setTheme] = useState<Theme>('dark');
  const [density, setDensity] = useState<Density>('compact');
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onCtx = (e: MouseEvent) => {
      // input/textarea 내부는 기본 메뉴 허용
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable="true"]')) return;
      e.preventDefault();
      setTheme(readTheme());
      setDensity(readDensity());
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('contextmenu', onCtx);
    return () => window.removeEventListener('contextmenu', onCtx);
  }, []);

  useEffect(() => {
    if (!pos) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key !== 'Escape') return;
      if (e instanceof MouseEvent && menuRef.current?.contains(e.target as Node)) return;
      setPos(null);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
    };
  }, [pos]);

  if (!pos) return null;

  const GAP = 8;
  const menuW = 220;
  const x = Math.min(pos.x + GAP, window.innerWidth - menuW - GAP);
  const y = pos.y + GAP;

  const globalTopItems: MenuItem[] = [
    {
      icon: '◎',
      label: theme === 'dark' ? 'Paper 테마로' : 'Dark 테마로',
      hint: theme === 'dark' ? '밝게' : '어둡게',
      action: () => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        setTheme(next);
      },
    },
    {
      icon: '⊟',
      label: `밀도: ${DENSITY_LABELS[density]}`,
      hint: (() => {
        const idx = DENSITY_CYCLE.indexOf(density);
        const next = DENSITY_CYCLE[(idx + 1) % DENSITY_CYCLE.length] ?? 'compact';
        return `→ ${DENSITY_LABELS[next]}`;
      })(),
      action: () => {
        const idx = DENSITY_CYCLE.indexOf(density);
        const next = DENSITY_CYCLE[(idx + 1) % DENSITY_CYCLE.length] ?? 'compact';
        applyDensity(next);
        setDensity(next);
      },
    },
  ];

  const specific = screenItems(currentScreen);

  const footerItems: MenuItem[] = [
    { icon: '⌘', label: '설정', hint: undefined, action: () => { setPos(null); onOpenTweaks(); } },
    { icon: '↺', label: '새로고침', hint: undefined, action: () => window.location.reload() },
  ];

  const run = (item: MenuItem) => {
    item.action();
    setPos(null);
  };

  return createPortal(
    <>
    <style>{`.ctx-row:hover { background: var(--bg-shade) !important; }`}</style>
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        width: menuW,
        background: 'var(--bg)',
        border: '1px solid var(--line-strong)',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        zIndex: 9999,
        padding: '4px 0',
        userSelect: 'none',
      }}
    >
      {globalTopItems.map((item) => <Row key={item.label} item={item} onRun={run} />)}

      {specific.length > 0 && (
        <>
          <Separator />
          {specific.map((item) => <Row key={item.label} item={item} onRun={run} />)}
        </>
      )}

      <Separator />
      {footerItems.map((item) => <Row key={item.label} item={item} onRun={run} />)}
    </div>
    </>,
    document.body,
  );
}

function Row({ item, onRun }: { item: MenuItem; onRun: (item: MenuItem) => void }) {
  return (
    <button
      onClick={() => onRun(item)}
      className="ctx-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 12px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        color: 'var(--ink)',
        fontSize: 13,
      }}
    >
      <span style={{ width: 16, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 12, flexShrink: 0 }}>
        {item.icon}
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.hint && (
        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{item.hint}</span>
      )}
    </button>
  );
}

function Separator() {
  return (
    <div
      style={{
        height: 1,
        background: 'var(--line)',
        margin: '4px 0',
      }}
    />
  );
}
