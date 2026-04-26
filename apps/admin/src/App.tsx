import { useEffect, useState } from 'react';
import { Shell, type ScreenId } from './shell/Shell';
import { NavContext } from './shell/nav';
import { Today } from './screens/Today';
import { Atelier } from './screens/Atelier';
import { Glean } from './screens/Glean';
import { Plan } from './screens/Plan';
import { Insights } from './screens/Insights';
import { Publish } from './screens/Publish';
import { LLMSetup } from './screens/LLMSetup';
import { llmStatus } from './lib/tauri';

const SCREENS: Record<ScreenId, () => JSX.Element> = {
  today: Today,
  atelier: Atelier,
  glean: Glean,
  plan: Plan,
  insights: Insights,
  publish: Publish,
};

const LLM_SETUP_DISMISS_KEY = 'pensmith.llmSetup.dismissed';

export function App() {
  const [active, setActive] = useState<ScreenId>('today');
  const [showLLMSetup, setShowLLMSetup] = useState(false);
  const ScreenComp = SCREENS[active];

  useEffect(() => {
    if (sessionStorage.getItem(LLM_SETUP_DISMISS_KEY) === '1') return;
    llmStatus()
      .then((s) => {
        if (!s.binPresent || s.models.length === 0) setShowLLMSetup(true);
      })
      .catch(() => {});
  }, []);

  const dismissLLMSetup = () => {
    sessionStorage.setItem(LLM_SETUP_DISMISS_KEY, '1');
    setShowLLMSetup(false);
  };

  return (
    <NavContext.Provider value={setActive}>
      <Shell active={active} onSelect={setActive}>
        <ScreenComp />
      </Shell>
      {showLLMSetup && <LLMSetup onDismiss={dismissLLMSetup} />}
    </NavContext.Provider>
  );
}
