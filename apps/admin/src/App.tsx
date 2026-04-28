import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { Shell, type ScreenId } from './shell/Shell';
import { NavContext } from './shell/nav';
import { BlogContext } from './shell/blogContext';
import { Today } from './screens/Today';
import { Atelier } from './screens/Atelier';
import { Glean } from './screens/Glean';
import { Plan } from './screens/Plan';
import { Insights } from './screens/Insights';
import { Publish } from './screens/Publish';
import { Thoughts } from './screens/Thoughts';
import { LLMSetup } from './screens/LLMSetup';
import { SearchPalette } from './components/SearchPalette';
import { QuickEntry, type QuickKind } from './components/QuickEntry';
import { Tweaks } from './components/Tweaks';
import { IcalDialog } from './screens/Plan/IcalDialog';
import { SummaryModal } from './components/SummaryModal';
import { useAutoSummary } from './lib/useAutoSummary';
import {
  appSetupStatus,
  llmStatus,
  macosCalImport,
  macosCalStatus,
  showQuick,
  syncIcalFeeds,
  type AppSetupStatus,
} from './lib/tauri';
import { countThoughts } from './lib/thoughts';
import {
  intervalMs,
  readIcalSyncInterval,
  readLastAutoSyncAt,
  readMacosCalAutoConfig,
  writeLastAutoSyncAt,
} from './lib/icalSync';

const QUICK_KINDS: ReadonlySet<QuickKind> = new Set<QuickKind>([
  'thought',
  'glean',
  'blog',
  'task',
]);

function readQuickKindFromHash(): QuickKind | null {
  const hash = (typeof window !== 'undefined' && window.location.hash) || '';
  const m = /^#quick=([a-z]+)$/.exec(hash);
  if (!m) return null;
  const k = m[1] as QuickKind;
  return QUICK_KINDS.has(k) ? k : null;
}

const SCREENS: Record<ScreenId, () => JSX.Element> = {
  today: Today,
  atelier: Atelier,
  glean: Glean,
  plan: Plan,
  insights: Insights,
  publish: Publish,
  thoughts: Thoughts,
};

const LLM_SETUP_DISMISS_KEY = 'bento.llmSetup.dismissed';

export function App() {
  const initialQuick = useMemo(readQuickKindFromHash, []);
  if (initialQuick) {
    return <QuickWindow initialKind={initialQuick} />;
  }
  return <RootApp />;
}

function RootApp() {
  const [status, setStatus] = useState<AppSetupStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = () => {
      appSetupStatus()
        .then((s) => {
          if (!cancelled) setStatus(s);
        })
        .catch(() => {
          if (!cancelled) setStatus(defaultStatus());
        });
    };
    fetchStatus();

    let unlistenChanged: UnlistenFn | null = null;
    listen('bento:content-root-changed', () => fetchStatus())
      .then((fn) => {
        unlistenChanged = fn;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      unlistenChanged?.();
    };
  }, []);

  if (!status) return null;
  return <FullApp blogEnabled={status.blogEnabled} />;
}

function defaultStatus(): AppSetupStatus {
  return {
    blogEnabled: false,
    blogReady: false,
    contentPath: null,
    gitRemote: null,
    gitBranch: null,
    gitEmail: null,
    gitName: null,
    reportsMigrated: false,
  };
}

function FullApp({ blogEnabled }: { blogEnabled: boolean }) {
  const [active, setActive] = useState<ScreenId>('today');
  const [showLLMSetup, setShowLLMSetup] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTweaks, setShowTweaks] = useState(false);
  const [showIcal, setShowIcal] = useState(false);
  const [thoughtsCount, setThoughtsCount] = useState<number | undefined>(() => countThoughts());
  const { pendingModal, dismiss: dismissSummary } = useAutoSummary();
  const ScreenComp = SCREENS[active];

  useEffect(() => {
    if (!blogEnabled && (active === 'atelier' || active === 'publish')) {
      setActive('today');
    }
  }, [blogEnabled, active]);

  useEffect(() => {
    if (sessionStorage.getItem(LLM_SETUP_DISMISS_KEY) === '1') return;
    llmStatus()
      .then((s) => {
        if (!s.binPresent || s.models.length === 0) setShowLLMSetup(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const refresh = () => setThoughtsCount(countThoughts());
    window.addEventListener('storage', refresh);
    window.addEventListener('bento:thoughts-changed', refresh);
    const id = window.setInterval(refresh, 5_000);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('bento:thoughts-changed', refresh);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const tick = () => {
      const id = readIcalSyncInterval();
      const ms = intervalMs(id);
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
      if (ms <= 0) return;

      const last = readLastAutoSyncAt();
      const now = Date.now();
      const since = now - last;
      const initialDelay = since >= ms ? 0 : Math.max(0, ms - since);

      const run = async () => {
        if (cancelled) return;
        if (document.visibilityState === 'hidden') return;
        try {
          await syncIcalFeeds();
          writeLastAutoSyncAt(Date.now());
          window.dispatchEvent(new CustomEvent('bento:ical-auto-synced'));
          window.dispatchEvent(new CustomEvent('bento:ical-synced'));
        } catch {
          /* swallow — UI 트리거가 별도로 사용자에게 보여줌 */
        }
        const macCfg = readMacosCalAutoConfig();
        if (!macCfg.enabled) return;
        try {
          const status = await macosCalStatus();
          if (!status.available) return;
          await macosCalImport({
            calendars: macCfg.calendars,
            daysBack: macCfg.daysBack,
            daysForward: macCfg.daysForward,
          });
          window.dispatchEvent(new CustomEvent('bento:macos-cal-auto-synced'));
          window.dispatchEvent(new CustomEvent('bento:ical-synced'));
        } catch {
          /* swallow — 권한 변경 등은 다이얼로그에서 사용자에게 노출 */
        }
      };

      const start = () => {
        if (cancelled) return;
        run();
        timer = window.setInterval(run, ms);
      };

      if (initialDelay === 0) {
        start();
      } else {
        timer = window.setTimeout(start, initialDelay) as unknown as number;
      }
    };

    tick();
    const onChange = () => tick();
    window.addEventListener('bento:ical-sync-interval-changed', onChange);
    window.addEventListener('bento:macos-cal-auto-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearInterval(timer);
        window.clearTimeout(timer);
      }
      window.removeEventListener('bento:ical-sync-interval-changed', onChange);
      window.removeEventListener('bento:macos-cal-auto-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (!isMeta) return;
      const k = e.key.toLowerCase();
      if (k === 'k') {
        e.preventDefault();
        setShowSearch(true);
        return;
      }
      if (k === 'n' && e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        void showQuick('thought');
        return;
      }
      if (k === 't' && e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        void showQuick('task');
        return;
      }
      if (e.key === ',') {
        e.preventDefault();
        setShowTweaks((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dismissLLMSetup = () => {
    sessionStorage.setItem(LLM_SETUP_DISMISS_KEY, '1');
    setShowLLMSetup(false);
  };

  return (
    <NavContext.Provider value={setActive}>
      <BlogContext.Provider value={blogEnabled}>
      <Shell
        active={active}
        onSelect={setActive}
        onOpenLLMSetup={() => setShowLLMSetup(true)}
        onOpenSearch={() => setShowSearch(true)}
        onOpenQuick={(kind) => void showQuick(kind)}
        onOpenTweaks={() => setShowTweaks(true)}
        thoughtsCount={thoughtsCount}
        blogEnabled={blogEnabled}
      >
        <ScreenComp />
      </Shell>
      {showLLMSetup && <LLMSetup onDismiss={dismissLLMSetup} />}
      <SearchPalette
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={(id) => setActive(id)}
      />
      <Tweaks
        open={showTweaks}
        onClose={() => setShowTweaks(false)}
        onOpenIcal={() => {
          setShowTweaks(false);
          setShowIcal(true);
        }}
        onOpenLLMSetup={() => {
          setShowTweaks(false);
          setShowLLMSetup(true);
        }}
      />
      <IcalDialog
        open={showIcal}
        onClose={() => setShowIcal(false)}
        onSynced={() => window.dispatchEvent(new CustomEvent('bento:ical-synced'))}
      />
      {pendingModal && !showLLMSetup && (
        <SummaryModal summary={pendingModal} onClose={dismissSummary} />
      )}
      </BlogContext.Provider>
    </NavContext.Provider>
  );
}

function QuickWindow({ initialKind }: { initialKind: QuickKind }) {
  const [kind, setKind] = useState<QuickKind>(initialKind);
  const [version, setVersion] = useState(0);
  const [blogEnabled, setBlogEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    appSetupStatus()
      .then((s) => {
        if (!cancelled) setBlogEnabled(s.blogEnabled);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const rootEl = document.getElementById('root');
    const prevHtml = root.style.background;
    const prevBody = body.style.background;
    const prevRoot = rootEl?.style.background ?? '';
    root.style.background = 'transparent';
    body.style.background = 'transparent';
    if (rootEl) rootEl.style.background = 'transparent';
    return () => {
      root.style.background = prevHtml;
      body.style.background = prevBody;
      if (rootEl) rootEl.style.background = prevRoot;
    };
  }, []);

  useEffect(() => {
    let unlisten: UnlistenFn | null = null;
    listen<string>('bento:quick-shortcut', (event) => {
      const payload = event.payload as QuickKind;
      if (QUICK_KINDS.has(payload)) {
        setKind(payload);
        setVersion((v) => v + 1);
      }
    })
      .then((fn) => {
        unlisten = fn;
      })
      .catch(() => {});
    return () => {
      unlisten?.();
    };
  }, []);

  const close = () => {
    invoke('close_quick_window').catch(() => {
      try {
        const w = getCurrentWebviewWindow();
        w.close().catch(() => {
          w.hide().catch(() => {});
        });
      } catch {
        /* ignore */
      }
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  return (
    <QuickEntry
      key={version}
      popup
      open
      initialKind={kind}
      onClose={close}
      blogEnabled={blogEnabled}
    />
  );
}
