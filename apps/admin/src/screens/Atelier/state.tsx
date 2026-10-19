import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { readDoc } from '../../lib/tauri';
import { parseDoc, persistDoc } from './save';

export type DocStatus = 'loading' | 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 1500;

interface DocCtx {
  path: string;
  status: DocStatus;
  error: string | null;
  savedAt: Date | null;
  body: string;
  frontmatter: Record<string, unknown>;
  setBody: (body: string) => void;
  setFrontmatter: (fm: Record<string, unknown>) => void;
  flush: () => Promise<void>;
  pauseAutosave: () => Promise<void>;
  resumeAutosave: () => void;
}

const Ctx = createContext<DocCtx | null>(null);

export function useDoc(): DocCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDoc must be used inside <DocProvider>');
  return v;
}

export function DocProvider({ path, children }: { path: string; children: ReactNode }) {
  const [body, setBody] = useState<string>('');
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState<DocStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const lastBodyRef = useRef<string | null>(null);
  const lastFmRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const pausedRef = useRef(false);
  const inFlightRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    setStatus('loading');
    setError(null);
    setSavedAt(null);
    lastBodyRef.current = null;
    lastFmRef.current = null;
    let alive = true;
    readDoc(path)
      .then((file) => {
        if (!alive) return;
        const parsed = parseDoc(file.raw);
        setFrontmatter(parsed.data);
        setBody(parsed.body);
        lastBodyRef.current = parsed.body;
        lastFmRef.current = JSON.stringify(parsed.data);
        setStatus('idle');
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(String(e));
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [path]);

  const flush = async () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pausedRef.current) return;
    if (lastBodyRef.current === null) return;
    const fmJson = JSON.stringify(frontmatter);
    if (lastBodyRef.current === body && lastFmRef.current === fmJson) return;
    setStatus('saving');
    try {
      const saving = persistDoc(path, frontmatter, body);
      inFlightRef.current = saving;
      try {
        await saving;
      } finally {
        if (inFlightRef.current === saving) inFlightRef.current = null;
      }
      lastBodyRef.current = body;
      lastFmRef.current = fmJson;
      setSavedAt(new Date());
      setStatus('saved');
      setError(null);
    } catch (e) {
      setStatus('error');
      setError(String(e));
    }
  };

  const pauseAutosave = async () => {
    pausedRef.current = true;
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const inFlight = inFlightRef.current;
    if (inFlight) await inFlight.catch(() => undefined);
  };

  const resumeAutosave = () => {
    pausedRef.current = false;
    void flushRef.current();
  };

  useEffect(() => {
    flushRef.current = flush;
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (lastBodyRef.current === null) return;
    const fmJson = JSON.stringify(frontmatter);
    if (lastBodyRef.current === body && lastFmRef.current === fmJson) return;
    setStatus('dirty');
    if (pausedRef.current) return;
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      flushRef.current();
    }, DEBOUNCE_MS);
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [body, frontmatter]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        flushRef.current();
      }
    };
  }, []);

  const value: DocCtx = {
    path,
    status,
    error,
    savedAt,
    body,
    frontmatter,
    setBody,
    setFrontmatter,
    flush: () => flushRef.current(),
    pauseAutosave,
    resumeAutosave,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
