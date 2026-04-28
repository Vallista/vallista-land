import { useCallback, useEffect, useRef, useState } from 'react';
import type { Summary } from '@vallista/content-core';
import { latestUnreadSummary, markSummaryRead } from './tauri';
import {
  generateMonthlySummary,
  generateWeeklySummary,
  type WeekStartDay,
} from './autoSummary';

const POLL_INTERVAL_MS = 60 * 60 * 1000;

const WEEK_START_KEY = 'bento.summary.weekStartDay';
const AUTO_ENABLED_KEY = 'bento.summary.autoEnabled';

function readWeekStartDay(): WeekStartDay {
  try {
    const v = localStorage.getItem(WEEK_START_KEY);
    return v === 'sun' ? 'sun' : 'mon';
  } catch {
    return 'mon';
  }
}

function readAutoEnabled(): boolean {
  try {
    const v = localStorage.getItem(AUTO_ENABLED_KEY);
    return v === null ? true : v === 'true';
  } catch {
    return true;
  }
}

export interface UseAutoSummaryResult {
  pendingModal: Summary | null;
  dismiss: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAutoSummary(): UseAutoSummaryResult {
  const [pendingModal, setPendingModal] = useState<Summary | null>(null);
  const inFlightRef = useRef(false);

  const refreshUnread = useCallback(async () => {
    try {
      const next = await latestUnreadSummary();
      setPendingModal(next);
    } catch {
      // ignore
    }
  }, []);

  const tick = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!readAutoEnabled()) {
      await refreshUnread();
      return;
    }
    inFlightRef.current = true;
    try {
      const now = new Date();
      const weekStartDay = readWeekStartDay();
      await generateWeeklySummary(now, weekStartDay);
      await generateMonthlySummary(now, weekStartDay);
      await refreshUnread();
    } finally {
      inFlightRef.current = false;
    }
  }, [refreshUnread]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!mounted) return;
      await tick();
    };
    const initialTimer = window.setTimeout(run, 0);
    const interval = window.setInterval(run, POLL_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') run();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mounted = false;
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [tick]);

  const dismiss = useCallback(async () => {
    if (!pendingModal) return;
    try {
      await markSummaryRead(pendingModal.id);
    } catch {
      // ignore
    }
    setPendingModal(null);
    await refreshUnread();
  }, [pendingModal, refreshUnread]);

  return { pendingModal, dismiss, refresh: tick };
}
