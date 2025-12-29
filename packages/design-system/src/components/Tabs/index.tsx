import { NeedTabsProps } from './type'
import { useTabs } from './useTabs'
import {
  tabsContainer,
  tabsIconWrapper,
  tabsTab,
  tabsTabContents,
  tabsTabContentsActive,
  tabsTabDisabled
} from './Tabs.css'

/**
 *
 */
export const Tabs = (props: NeedTabsProps) => {
  const { selected, setSelected, tabs, disabled } = useTabs(props)

  return (
    <div className={tabsContainer}>
      {tabs.map((it, idx) => (
        <div
          key={`tab-${idx}`}
          className={`${tabsTab} ${disabled ? tabsTabDisabled : ''}`}
          onClick={() => handleSelect(it.value)}
        >
          <div className={`${tabsTabContents} ${isActive(it.value) ? tabsTabContentsActive : ''}`}>
            {it.icon && <div className={tabsIconWrapper}>{it.icon}</div>}
            {it.title}
          </div>
        </div>
      ))}
    </div>
  )

  function isActive(target: string): boolean {
    return selected === target
  }

  function handleSelect(target: string): void {
    if (disabled) return

    setSelected(target)
  }
}
