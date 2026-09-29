export type ActionId = 'search' | 'quickThought' | 'quickTask' | 'tweaks';

export interface Binding {
  meta: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
}

export type AppKeybindings = Record<ActionId, Binding>;

export const ACTION_LABELS: Record<ActionId, string> = {
  search: '검색',
  quickThought: '빠른 생각',
  quickTask: '빠른 할 일',
  tweaks: '설정',
};

export const DEFAULT_BINDINGS: AppKeybindings = {
  search: { meta: true, shift: false, alt: false, key: 'k' },
  quickThought: { meta: true, shift: false, alt: false, key: 'n' },
  quickTask: { meta: true, shift: false, alt: false, key: 't' },
  tweaks: { meta: true, shift: false, alt: false, key: ',' },
};

const STORAGE_KEY = 'bento.keybindings';

export function readKeybindings(): AppKeybindings {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return { ...DEFAULT_BINDINGS };
    const parsed = JSON.parse(raw) as Partial<AppKeybindings>;
    return {
      search: parsed.search ?? DEFAULT_BINDINGS.search,
      quickThought: parsed.quickThought ?? DEFAULT_BINDINGS.quickThought,
      quickTask: parsed.quickTask ?? DEFAULT_BINDINGS.quickTask,
      tweaks: parsed.tweaks ?? DEFAULT_BINDINGS.tweaks,
    };
  } catch {
    return { ...DEFAULT_BINDINGS };
  }
}

export function writeKeybindings(kb: AppKeybindings): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kb));
}

export function matchesBinding(e: KeyboardEvent, b: Binding): boolean {
  return (
    e.key.toLowerCase() === b.key &&
    (e.metaKey || e.ctrlKey) === b.meta &&
    e.shiftKey === b.shift &&
    e.altKey === b.alt
  );
}

export function formatBinding(b: Binding): string {
  const parts: string[] = [];
  if (b.meta) parts.push('⌘');
  if (b.shift) parts.push('⇧');
  if (b.alt) parts.push('⌥');
  parts.push(b.key === ',' ? ',' : b.key.toUpperCase());
  return parts.join('');
}

// ─── 전역(OS) 단축키 ────────────────────────────────────────────────────────

export type GlobalActionId = 'globalThought' | 'globalTask' | 'globalClipboard';

export interface GlobalBinding {
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
}

export type GlobalKeybindings = Record<GlobalActionId, GlobalBinding>;

export const GLOBAL_ACTION_LABELS: Record<GlobalActionId, string> = {
  globalThought: '빠른 생각 (전역)',
  globalTask: '빠른 할 일 (전역)',
  globalClipboard: '클립보드 히스토리 (전역)',
};

export const GLOBAL_ACTION_KINDS: Record<GlobalActionId, string> = {
  globalThought: 'thought',
  globalTask: 'task',
  globalClipboard: 'clipboard',
};

export const DEFAULT_GLOBAL_BINDINGS: GlobalKeybindings = {
  globalThought: { meta: false, ctrl: true, shift: false, alt: false, key: 'n' },
  globalTask: { meta: false, ctrl: true, shift: false, alt: false, key: 't' },
  globalClipboard: { meta: false, ctrl: true, shift: true, alt: false, key: 'c' },
};


export function toRustShortcut(b: GlobalBinding): string {
  const parts: string[] = [];
  if (b.meta) parts.push('super');
  if (b.ctrl) parts.push('control');
  if (b.alt) parts.push('alt');
  if (b.shift) parts.push('shift');
  parts.push(b.key.toLowerCase());
  return parts.join('+');
}

export function formatGlobalBinding(b: GlobalBinding): string {
  const parts: string[] = [];
  if (b.ctrl) parts.push('⌃');
  if (b.meta) parts.push('⌘');
  if (b.shift) parts.push('⇧');
  if (b.alt) parts.push('⌥');
  parts.push(b.key.toUpperCase());
  return parts.join('');
}
