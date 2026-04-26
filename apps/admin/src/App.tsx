import { useState } from 'react';
import { Shell, type ScreenId } from './shell/Shell';
import { NavContext } from './shell/nav';
import { Today } from './screens/Today';
import { Atelier } from './screens/Atelier';
import { Glean } from './screens/Glean';
import { Plan } from './screens/Plan';
import { Insights } from './screens/Insights';
import { Publish } from './screens/Publish';

const SCREENS: Record<ScreenId, () => JSX.Element> = {
  today: Today,
  atelier: Atelier,
  glean: Glean,
  plan: Plan,
  insights: Insights,
  publish: Publish,
};

export function App() {
  const [active, setActive] = useState<ScreenId>('today');
  const ScreenComp = SCREENS[active];
  return (
    <NavContext.Provider value={setActive}>
      <Shell active={active} onSelect={setActive}>
        <ScreenComp />
      </Shell>
    </NavContext.Provider>
  );
}
