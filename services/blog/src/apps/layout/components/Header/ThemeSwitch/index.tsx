import { Toggle } from '@vallista/design-system'

import HeaderDarkmodeSun from '@/assets/icons/header-darkmode-sun.svg?react'
import HeaderDarkmodeMoon from '@/assets/icons/header-darkmode-moon.svg?react'

import * as Styled from './index.style'
import { useThemeSwitch } from './useThemeSwitch'

export const ThemeSwitch = () => {
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
