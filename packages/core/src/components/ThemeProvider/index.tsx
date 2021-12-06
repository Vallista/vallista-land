import { ThemeProvider as BaseThemeProvider, Theme, SerializedStyles } from '@emotion/react'
import * as React from 'react'

export type WithThemeStyleProps<T> = { theme: Theme } & T
export type StyleShape<T> = (props: WithThemeStyleProps<T>) => string | SerializedStyles
export type SerializedCustomRecord<T extends string | number | symbol> = Record<T, SerializedStyles>

export const Colors = {
  PRIMARY: {
    BACKGROUND: '#ffffff',
    ACCENT_1: '#FAFAFA',
    ACCENT_2: '#EAEAEA',
    ACCENT_3: '#999',
    ACCENT_4: '#888',
    ACCENT_5: '#666',
    ACCENT_6: '#444',
    ACCENT_7: '#333',
    ACCENT_8: '#111',
    FOREGROUND: '#000'
  },
  ERROR: {
    LIGHTER: '#F7D4D6',
    LIGHT: '#FF1A1A',
    DEFAULT: '#E00',
    DARK: '#C50000'
  },
  SUCCESS: {
    LIGHTER: '#D3E5FF',
    LIGHT: '#3291FF',
    DEFAULT: '#0070F3',
    DARK: '#0761D1'
  },
  WARNING: {
    LIGHTER: '#FFEFCF',
    LIGHT: '#F7B955',
    DEFAULT: '#F5A623',
    DARK: '#AB570A'
  },
  VIOLET: {
    LIGHTER: '#D8CCF1',
    LIGHT: '#8A63D2',
    DEFAULT: '#7928CA',
    DARK: '#4C2889'
  },
  CYAN: {
    LIGHTER: '#AAFFEC',
    LIGHT: '#79FFE1',
    DEFAULT: '#50E3C2',
    DARK: '#29BC9B'
  },
  HIGHLIGHT: {
    PURPLE: '#F81CE5',
    MAGENTA: '#EB367F',
    PINK: '#FF0080',
    YELLOW: '#FFF500'
  }
} as const

export const Layers = {
  BACKGROUND: -1,
  STANDARD: 0,
  FOREGROUND: 100,
  DIALOG: 1000,
  LOADING: 2000,
  SNACKBAR: 3000,
  CONCEAL: 9999
} as const

export interface BaseTheme {
  colors: typeof Colors
  layers: typeof Layers
}

const baseTheme: BaseTheme = {
  colors: Colors,
  layers: Layers
}

export const ThemeProvider: React.FC = ({ children }) => {
  return <BaseThemeProvider theme={baseTheme}>{children}</BaseThemeProvider>
}
