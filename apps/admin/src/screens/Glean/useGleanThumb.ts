import { useEffect, useState } from 'react';
import { readGleanThumb } from '../../lib/tauri';

// Threads 썸네일은 평균 200KB가 넘는 data URI라 목록 페이로드에 싣지 않고 행이 보일 때 하나씩 읽는다
const MAX_CACHED = 200;
const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function remember(id: string, thumb: string | null) {
  if (cache.size >= MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(id, thumb);
}

function fetchThumb(id: string): Promise<string | null> {
  const pending = inflight.get(id);
  if (pending) return pending;
  const p = readGleanThumb(id)
    .catch(() => null)
    .then((thumb) => {
      inflight.delete(id);
      remember(id, thumb);
      return thumb;
    });
  inflight.set(id, p);
  return p;
}

export function useGleanThumb(id: string, enabled: boolean): string | null {
  const [thumb, setThumb] = useState<string | null>(() =>
    enabled ? (cache.get(id) ?? null) : null,
  );
  useEffect(() => {
    if (!enabled) {
      setThumb(null);
      return;
    }
    const cached = cache.get(id);
    if (cached !== undefined) {
      setThumb(cached);
      return;
    }
    let cancelled = false;
    fetchThumb(id).then((t) => {
      if (!cancelled) setThumb(t);
    });
    return () => {
      cancelled = true;
    };
  }, [id, enabled]);
  return thumb;
}
