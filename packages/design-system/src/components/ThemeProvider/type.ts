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

export type LayerType = typeof Layers
export type ShadowType = typeof Shadows

/** 기본적으로 사용될 기본 테마 규격 */
export interface BaseTheme {
  layers: LayerType
  shadows: ReturnType<ShadowType>
}

export type BaseThemeMapper = Record<'LIGHT' | 'DARK', BaseTheme>
