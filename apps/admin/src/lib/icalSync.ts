export type IcalSyncInterval = 'off' | '5m' | '15m' | '30m' | '1h' | '4h' | '24h';

export const ICAL_SYNC_INTERVAL_KEY = 'bento.ical.syncInterval';
export const ICAL_SYNC_LAST_KEY = 'bento.ical.lastAutoSyncAt';

export const ICAL_SYNC_INTERVALS: { id: IcalSyncInterval; label: string; ms: number }[] = [
  { id: 'off', label: '꺼짐', ms: 0 },
  { id: '5m', label: '5분', ms: 5 * 60_000 },
  { id: '15m', label: '15분', ms: 15 * 60_000 },
  { id: '30m', label: '30분', ms: 30 * 60_000 },
  { id: '1h', label: '1시간', ms: 60 * 60_000 },
  { id: '4h', label: '4시간', ms: 4 * 60 * 60_000 },
  { id: '24h', label: '24시간', ms: 24 * 60 * 60_000 },
];

export function readIcalSyncInterval(): IcalSyncInterval {
  if (typeof window === 'undefined') return 'off';
  const v = window.localStorage.getItem(ICAL_SYNC_INTERVAL_KEY);
  if (!v) return 'off';
  const found = ICAL_SYNC_INTERVALS.find((x) => x.id === v);
  return found ? found.id : 'off';
}

export function writeIcalSyncInterval(v: IcalSyncInterval): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ICAL_SYNC_INTERVAL_KEY, v);
  window.dispatchEvent(new CustomEvent('bento:ical-sync-interval-changed'));
}

export function intervalMs(id: IcalSyncInterval): number {
  return ICAL_SYNC_INTERVALS.find((x) => x.id === id)?.ms ?? 0;
}

export function readLastAutoSyncAt(): number {
  if (typeof window === 'undefined') return 0;
  const v = window.localStorage.getItem(ICAL_SYNC_LAST_KEY);
  return v ? Number(v) || 0 : 0;
}

export function writeLastAutoSyncAt(ts: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ICAL_SYNC_LAST_KEY, String(ts));
}

export const MACOS_CAL_AUTO_KEY = 'bento.macosCal.autoConfig';

export interface MacosCalAutoConfig {
  enabled: boolean;
  calendars: string[];
  daysBack: number;
  daysForward: number;
}

const DEFAULT_MACOS_CAL_AUTO: MacosCalAutoConfig = {
  enabled: false,
  calendars: [],
  daysBack: 0,
  daysForward: 30,
};

export function readMacosCalAutoConfig(): MacosCalAutoConfig {
  if (typeof window === 'undefined') return DEFAULT_MACOS_CAL_AUTO;
  const raw = window.localStorage.getItem(MACOS_CAL_AUTO_KEY);
  if (!raw) return DEFAULT_MACOS_CAL_AUTO;
  try {
    const parsed = JSON.parse(raw) as Partial<MacosCalAutoConfig>;
    return {
      enabled: Boolean(parsed.enabled),
      calendars: Array.isArray(parsed.calendars)
        ? parsed.calendars.filter((c): c is string => typeof c === 'string')
        : [],
      daysBack: Number.isFinite(parsed.daysBack) ? Math.max(0, Math.min(365, Number(parsed.daysBack))) : 0,
      daysForward: Number.isFinite(parsed.daysForward)
        ? Math.max(0, Math.min(365, Number(parsed.daysForward)))
        : 30,
    };
  } catch {
    return DEFAULT_MACOS_CAL_AUTO;
  }
}

export function writeMacosCalAutoConfig(cfg: MacosCalAutoConfig): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MACOS_CAL_AUTO_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new CustomEvent('bento:macos-cal-auto-changed'));
}
