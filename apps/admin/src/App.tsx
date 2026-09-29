import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Radar } from './screens/Radar';
import { Insights } from './screens/Insights';
import { Review } from './screens/Review';
import { Publish } from './screens/Publish';
import { Thoughts } from './screens/Thoughts';
import { Mail } from './screens/Mail';
import { Health } from './screens/Health';
import { LLMSetup } from './screens/LLMSetup';
import type { PaneId } from './components/Tweaks';
import { Onboarding, checkOnboardingDone } from './screens/Onboarding';
import { SearchPalette } from './components/SearchPalette';
import { QuickEntry, type QuickKind } from './components/QuickEntry';
import { ClipboardHistoryPanel } from './components/ClipboardHistoryPanel';
import { Tweaks } from './components/Tweaks';
import { IcalDialog } from './screens/Plan/IcalDialog';
import { ContextMenu } from './components/ContextMenu';
import { useAutoSummary } from './lib/useAutoSummary';
import { logError } from './lib/errorLog';
import { Toaster, useToasts } from './components/NotifToast';
import { useCheckinReminder } from './lib/useCheckinReminder';
import {
  applyGlobalShortcuts,
  appSetupStatus,
  llmStatus,
  macosCalImport,
  macosCalList,
  macosCalStatus,
  migrateTaskNotesToEventNotes,
  migrateBlockNotesToEventNotes,
  readGlobalKeybindingsFromDisk,
  showQuick,
  syncIcalFeeds,
  type AppSetupStatus,
} from './lib/tauri';
import { matchesBinding, readKeybindings } from './lib/keybindings';
import { countThoughts } from './lib/thoughts';
import {
  intervalMs,
  readIcalSyncInterval,
  readLastAutoSyncAt,
  readMacosCalAutoConfig,
  writeLastAutoSyncAt,
  writeMacosCalAutoConfig,
} from './lib/icalSync';

type QuickWindowKind = QuickKind | 'clipboard';
const ALL_QUICK_WINDOW_KINDS: ReadonlySet<string> = new Set<string>([
  'thought', 'glean', 'blog', 'task', 'clipboard',
]);

function readQuickKindFromHash(): QuickWindowKind | null {
  const hash = (typeof window !== 'undefined' && window.location.hash) || '';
  const m = /^#quick=([a-z]+)$/.exec(hash);
  if (!m) return null;
  const k = m[1] as QuickWindowKind;
  return ALL_QUICK_WINDOW_KINDS.has(k) ? k : null;
}

const SCREENS: Record<ScreenId, () => JSX.Element> = {
  today: Today,
  atelier: Atelier,
  glean: Glean,
  plan: Plan,
  radar: Radar,
  health: Health,
  insights: Insights,
  review: Review,
  publish: Publish,
  thoughts: Thoughts,
  mail: Mail,
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
  const [onboardingDone, setOnboardingDone] = useState(checkOnboardingDone);
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

  if (!onboardingDone) {
    return <Onboarding onDone={() => setOnboardingDone(true)} />;
  }

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
  const [tweaksInitialPane, setTweaksInitialPane] = useState<PaneId | undefined>();
  const [showIcal, setShowIcal] = useState(false);
  const [thoughtsCount, setThoughtsCount] = useState<number | undefined>(() => countThoughts());
  const { pendingModal, dismiss: dismissSummary } = useAutoSummary();
  const { toasts, addToast, removeToast } = useToasts();
  const lastSummaryIdRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState<Set<ScreenId>>(() => new Set<ScreenId>(['today']));

  useEffect(() => {
    migrateTaskNotesToEventNotes().catch(() => {});
    migrateBlockNotesToEventNotes().catch(() => {});
  }, []);

  useEffect(() => {
    if (!pendingModal) return;
    if (lastSummaryIdRef.current === pendingModal.id) return;
    lastSummaryIdRef.current = pendingModal.id;
    const title = pendingModal.kind === 'weekly' ? '지난 주 리포트 도착' : '지난 달 리포트 도착';
    addToast({
      id: `summary-${pendingModal.id}`,
      title,
      body: '자동 정리가 생성됐어요.',
      duration: 0,
      cta: {
        label: '회고 탭으로',
        onClick: () => {
          removeToast(`summary-${pendingModal.id}`);
          void dismissSummary();
          setActive('review');
        },
      },
    });
  }, [pendingModal, addToast]);

  useCheckinReminder({
    onCheckinNeeded: useCallback(() => {
      addToast({
        id: 'checkin-reminder',
        title: '컨디션 체크',
        body: '오늘 에너지와 기분을 기록해보세요.',
        cta: { label: '오늘로', onClick: () => setActive('today') },
      });
    }, [addToast]),
    onRetroNeeded: useCallback(() => {
      addToast({
        id: 'retro-reminder',
        title: '오늘 회고',
        body: '저녁 회고를 써볼 시간이에요.',
        cta: { label: '오늘로', onClick: () => setActive('today') },
      });
    }, [addToast]),
  });

  useEffect(() => {
    const onAdd = (e: Event) => addToast((e as CustomEvent<Parameters<typeof addToast>[0]>).detail);
    const onRemove = (e: Event) => removeToast((e as CustomEvent<string>).detail);
    window.addEventListener('bento:toast', onAdd);
    window.addEventListener('bento:toast-remove', onRemove);
    return () => {
      window.removeEventListener('bento:toast', onAdd);
      window.removeEventListener('bento:toast-remove', onRemove);
    };
  }, [addToast, removeToast]);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = event.message || '알 수 없는 오류';
      void logError(message, {
        stack: (event.error as Error | undefined)?.stack,
        source: event.filename,
      });
      addToast({ title: '오류 발생', body: message.slice(0, 120) });
    };
    const onUnhandled = (event: PromiseRejectionEvent) => {
      const err = event.reason as unknown;
      const message = err instanceof Error ? err.message : String(err ?? '알 수 없는 오류');
      void logError(message, { stack: err instanceof Error ? err.stack : undefined });
      addToast({ title: '오류 발생', body: message.slice(0, 120) });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, [addToast]);

  useEffect(() => {
    setMounted((prev) => {
      if (prev.has(active)) return prev;
      const next = new Set(prev);
      next.add(active);
      return next;
    });
  }, [active]);

  useEffect(() => {
    if (!blogEnabled && (active === 'atelier' || active === 'publish')) {
      setActive('today');
    }
  }, [blogEnabled, active]);

  useEffect(() => {
    readGlobalKeybindingsFromDisk()
      .then((kb) => applyGlobalShortcuts(kb))
      .catch(() => {});
  }, []);

  useEffect(() => {
    llmStatus()
      .then((s) => {
        if (!s.binPresent || s.models.length === 0) {
          if (sessionStorage.getItem(LLM_SETUP_DISMISS_KEY) !== '1') {
            setShowLLMSetup(true);
          }
        }
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
          let calendarsToSync = macCfg.calendars;
          if (calendarsToSync.length > 0) {
            try {
              const allCals = await macosCalList();
              const newCals = allCals.filter(c => !calendarsToSync.includes(c));
              if (newCals.length > 0) {
                calendarsToSync = [...calendarsToSync, ...newCals];
                writeMacosCalAutoConfig({ ...macCfg, calendars: calendarsToSync });
              }
            } catch {
              // 목록 조회 실패 시 기존 설정 유지
            }
          }
          await macosCalImport({
            calendars: calendarsToSync,
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
      const kb = readKeybindings();
      if (matchesBinding(e, kb.search)) {
        e.preventDefault();
        setShowSearch(true);
        return;
      }
      if (matchesBinding(e, kb.quickThought)) {
        e.preventDefault();
        void showQuick('thought');
        return;
      }
      if (matchesBinding(e, kb.quickTask)) {
        e.preventDefault();
        void showQuick('task');
        return;
      }
      if (matchesBinding(e, kb.tweaks)) {
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
        onOpenLLMSetup={() => {
          setTweaksInitialPane('integrations');
          setShowTweaks(true);
        }}
        onOpenSearch={() => setShowSearch(true)}
        onOpenQuick={(kind) => void showQuick(kind)}
        onOpenTweaks={() => setShowTweaks(true)}
        thoughtsCount={thoughtsCount}
        blogEnabled={blogEnabled}
      >
        {(Object.entries(SCREENS) as [ScreenId, () => JSX.Element][]).map(([id, Comp]) => {
          if (!mounted.has(id)) return null;
          return (
            <div key={id} style={{ display: id === active ? 'contents' : 'none' }}>
              <Comp />
            </div>
          );
        })}
      </Shell>
      {showLLMSetup && <LLMSetup onDismiss={dismissLLMSetup} />}
      <SearchPalette
        open={showSearch}
        onClose={() => setShowSearch(false)}
        onNavigate={(id) => setActive(id)}
      />
      <Tweaks
        open={showTweaks}
        onClose={() => {
          setShowTweaks(false);
          setTweaksInitialPane(undefined);
        }}
        onOpenIcal={() => {
          setShowTweaks(false);
          setShowIcal(true);
        }}
        initialPane={tweaksInitialPane}
      />
      <IcalDialog
        open={showIcal}
        onClose={() => setShowIcal(false)}
        onSynced={() => window.dispatchEvent(new CustomEvent('bento:ical-synced'))}
      />
      <Toaster toasts={toasts} onRemove={removeToast} />
      <ContextMenu currentScreen={active} onOpenTweaks={() => setShowTweaks(true)} />
      </BlogContext.Provider>
    </NavContext.Provider>
  );
}

function QuickWindow({ initialKind }: { initialKind: QuickWindowKind }) {
  const [kind, setKind] = useState<QuickWindowKind>(initialKind);
  const [version, setVersion] = useState(0);
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
      const payload = event.payload as QuickWindowKind;
      if (ALL_QUICK_WINDOW_KINDS.has(payload)) {
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

  useEffect(() => {
    // 창이 열린 직후 spurious blur 방지를 위해 한 틱 뒤에 등록
    let timer: number;
    let onBlur: (() => void) | null = null;
    timer = window.setTimeout(() => {
      onBlur = () => close();
      window.addEventListener('blur', onBlur);
    }, 150);
    return () => {
      window.clearTimeout(timer);
      if (onBlur) window.removeEventListener('blur', onBlur);
    };
  }, []);

  if (kind === 'clipboard') {
    return (
      <ClipboardHistoryPanel key={version} popup open onClose={close} />
    );
  }

  return (
    <QuickEntry
      key={version}
      open
      popup
      initialKind={kind as QuickKind}
      onClose={close}
    />
  );
}
