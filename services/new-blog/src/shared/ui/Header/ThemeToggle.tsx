import { Toggle } from '@vallista/design-system'

import HeaderDarkmodeMoon from '@shared/assets/icons/header-darkmode-moon.svg?react'
import HeaderDarkmodeSun from '@shared/assets/icons/header-darkmode-sun.svg?react'
import { useThemeSwitch } from '@shared/hooks/useThemeSwitch'

import * as Styled from './ThemeToggle.css'

export const ThemeToggle = () => {
  const { mode, handleThemeSwitch } = useThemeSwitch()

  return (
    <div className={Styled.themeToggleContainer}>
      <HeaderDarkmodeSun aria-hidden='true' />
      <Toggle
        toggle={mode === 'DARK'}
        size='medium'
        onChange={handleThemeSwitch}
        color='pink'
        aria-label={`Switch to ${mode === 'DARK' ? 'light' : 'dark'} mode`}
      />
      <HeaderDarkmodeMoon aria-hidden='true' />
    </div>
  )
}
