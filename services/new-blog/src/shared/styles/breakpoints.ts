/**
 * 반응형 디자인을 위한 Breakpoint 상수
 * 모바일과 데스크탑 스타일을 명확하게 분리하기 위해 사용
 */

export const BREAKPOINTS = {
  /** 모바일 최대 너비 (1024px 이하) */
  MOBILE_MAX: '1024px',
  /** 데스크탑 최소 너비 (1025px 이상) */
  DESKTOP_MIN: '1025px'
} as const

/**
 * 모바일 미디어 쿼리
 * @example
 * '@media': mobile({ width: '100%' })
 */
export const mobile = (styles: Record<string, unknown>) => ({
  [`screen and (max-width: ${BREAKPOINTS.MOBILE_MAX})`]: styles
})

/**
 * 데스크탑 미디어 쿼리
 * @example
 * '@media': desktop({ width: '800px' })
 */
export const desktop = (styles: Record<string, unknown>) => ({
  [`screen and (min-width: ${BREAKPOINTS.DESKTOP_MIN})`]: styles
})

/**
 * 모바일과 데스크탑 스타일을 분리하여 반환
 * @example
 * const styles = responsive({
 *   mobile: { width: '100%', padding: '10px' },
 *   desktop: { width: '800px', padding: '24px' }
 * })
 */
export const responsive = <T extends Record<string, unknown>>(config: {
  mobile?: T
  desktop?: T
}): { '@media'?: Record<string, T> } => {
  const media: Record<string, T> = {}

  if (config.mobile) {
    media[`screen and (max-width: ${BREAKPOINTS.MOBILE_MAX})`] = config.mobile
  }

  if (config.desktop) {
    media[`screen and (min-width: ${BREAKPOINTS.DESKTOP_MIN})`] = config.desktop
  }

  return Object.keys(media).length > 0 ? { '@media': media } : {}
}
