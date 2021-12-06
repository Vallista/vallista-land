import { ThemeProvider as BaseThemeProvider } from '@emotion/react'
import React, { FC } from 'react'

import { BaseThemeMapper, Colors, Layers } from './type'

const Themes: BaseThemeMapper = {
  DEFAULT: {
    colors: Colors,
    layers: Layers
  },
  DARK: {
    colors: Colors,
    layers: Layers
  }
}

type ThemeKeys = keyof typeof Themes

/**
 * # ThemeProvider
 *
 * @description **[경고] ThemeProvider는 필수입니다. 항상 root에 넣어주세요!**
 *
 * @param {ThemeKeys} {@link ThemeKeys} theme에 넣으면 테마가 변경됩니다. 기본: DEFAULT
 *
 * @example ```tsx
 * <ThemeProvider theme='DARK'>
 *  ...
 * </ThemeProvider>
 * ```
 */
export const ThemeProvider: FC<{ theme?: ThemeKeys }> = ({ theme = 'DEFAULT', children }) => {
  return <BaseThemeProvider theme={Themes[theme]}>{children}</BaseThemeProvider>
}
