import { Theme, SerializedStyles } from '@emotion/react'

export type WithThemeStyleProps<T> = { theme: Theme } & T
export type StyleShape<T> = (props: WithThemeStyleProps<T>) => string | SerializedStyles
export type SerializedCustomRecord<T extends string | number | symbol> = Record<T, SerializedStyles>

// FIXME: 추후 팔레트 별 관리할 수 있도록 수정해야함.
// FIXME: 디폴트, 다크모드 제공 단계 필요

/**
 * # Colors
 *
 * 색상 팔레트
 */
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
}

/**
 * # Layers
 *
 * z-index 우선순위를 사용할 수 있도록 제공
 */
export const Layers = {
  /** 백그라운드 */
  BACKGROUND: -1,
  /** 기본 */
  STANDARD: 0,
  /** 기본 */
  AFTER_STANDARD: 10,
  /** 앞 배경 */
  FOREGROUND: 100,
  /** 모달 */
  MODAL: 1000,
  /** 로딩 */
  LOADING: 2000,
  /** 스넥바 */
  SNACKBAR: 3000,
  /** input등 요소들이 안보여야하는 경우, 지정하고 화면 밖으로 컬링해서 빼버림 */
  CONCEAL: 9999
}

export const Shadows = (
  isDark?: boolean
): { SMALLEST: string; EXTRA_SMALL: string; SMALL: string; MEDIUM: string; LARGE: string; HOVER: string } => {
  const rgb = isDark ? '255' : '0'
  const smallColor = `rgba(${rgb}, ${rgb}, ${rgb}, 0.1)`
  const otherColor = `rgba(${rgb}, ${rgb}, ${rgb}, 0.12)`

  return {
    SMALLEST: `0 2px 4px ${smallColor}`,
    EXTRA_SMALL: `0 4px 8px ${otherColor}`,
    SMALL: `0 5px 10px ${otherColor}`,
    MEDIUM: `0 8px 30px ${otherColor}`,
    LARGE: `0 30px 60px ${otherColor}`,
    HOVER: `0 30px 60px ${otherColor}`
  }
}

export type ColorType = typeof Colors
export type LayerType = typeof Layers
export type ShadowType = typeof Shadows

/** 사용가능한 컬러 (ColorType에서 최종 color 값들만 추출) */
export type AvailablePickedColor = ColorType extends { [key: string]: infer T }
  ? T extends { [key: string]: infer K }
    ? K
    : never
  : never

/** 기본적으로 사용될 기본 테마 규격 */
export interface BaseTheme {
  colors: ColorType
  layers: LayerType
  shadows: ReturnType<ShadowType>
}

export type BaseThemeMapper = Record<'light' | 'dark', BaseTheme>
