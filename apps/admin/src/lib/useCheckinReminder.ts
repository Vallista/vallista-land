import { useEffect, useRef } from 'react';
import { getMood } from './tauri';

const CHECKIN_REMINDED_HOUR_KEY = 'bento.reminder.checkinHour';
const RETRO_REMINDED_KEY = 'bento.reminder.retroDone';

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function currentHour(): number {
  return new Date().getHours();
}

function isReminderHour(): boolean {
  const h = currentHour();
  return h >= 8 && h < 23;
}

function isRetroHour(): boolean {
  const h = currentHour();
  return h >= 18 && h < 23;
}

export interface CheckinReminderCallbacks {
  onCheckinNeeded: () => void;
  onRetroNeeded: () => void;
}

export function useCheckinReminder({ onCheckinNeeded, onRetroNeeded }: CheckinReminderCallbacks): void {
  const onCheckinRef = useRef(onCheckinNeeded);
  const onRetroRef = useRef(onRetroNeeded);

  useEffect(() => { onCheckinRef.current = onCheckinNeeded; }, [onCheckinNeeded]);
  useEffect(() => { onRetroRef.current = onRetroNeeded; }, [onRetroNeeded]);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (cancelled) return;
      if (!isReminderHour()) return;
      const today = todayKey();
      const hour = currentHour();
      try {
        const mood = await getMood(today);
        if (cancelled) return;
        if (!mood) {
          const lastHour = sessionStorage.getItem(CHECKIN_REMINDED_HOUR_KEY);
          if (lastHour !== String(hour)) {
            sessionStorage.setItem(CHECKIN_REMINDED_HOUR_KEY, String(hour));
            onCheckinRef.current();
          }
        } else if (!mood.retrospectiveNote && isRetroHour()) {
          const lastRetroDate = sessionStorage.getItem(RETRO_REMINDED_KEY);
          if (lastRetroDate !== today) {
            sessionStorage.setItem(RETRO_REMINDED_KEY, today);
            onRetroRef.current();
          }
        }
      } catch {
        // ignore
      }
    };

    check();
    const interval = window.setInterval(check, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);
}
