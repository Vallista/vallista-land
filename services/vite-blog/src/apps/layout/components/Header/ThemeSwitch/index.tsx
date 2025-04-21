import { Toggle } from '@vallista/design-system'

import HeaderDarkmodeSun from '@/assets/icons/header-darkmode-sun.svg?react'
import HeaderDarkmodeMoon from '@/assets/icons/header-darkmode-moon.svg?react'

import * as Styled from './index.style'
import { useThemeSwitch } from './useThemeSwitch'

export const ThemeSwitch = () => {
  const { mode, handleThemeSwitch } = useThemeSwitch()

  return (
    <Styled._ThemeToggleContainer>
      <HeaderDarkmodeSun />
      <Toggle toggle={mode === 'DARK'} size='medium' onChange={handleThemeSwitch} color='pink' />
      <HeaderDarkmodeMoon />
    </Styled._ThemeToggleContainer>
  )
}
