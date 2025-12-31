/**
 * 환경별 로깅 유틸리티
 * 개발 환경에서만 로그를 출력하고, 프로덕션에서는 제거됩니다.
 */

/**
 * 개발 환경 여부 확인
 */
const isDev = import.meta.env.DEV

/**
 * 로거 유틸리티
 * - log, warn: 개발 환경에서만 출력
 * - error: 항상 출력 (프로덕션에서도 에러 추적 필요)
 */
export const logger = {
  /**
   * 일반 로그 (개발 환경에서만)
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args)
    }
  },

  /**
   * 경고 로그 (개발 환경에서만)
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args)
    }
  },

  /**
   * 에러 로그 (항상 출력)
   * 프로덕션에서도 에러 추적이 필요하므로 항상 출력합니다.
   */
  error: (...args: unknown[]) => {
    console.error(...args)
  },

  /**
   * 디버그 로그 (개발 환경에서만)
   * 디버깅용 상세 정보를 출력합니다.
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args)
    }
  }
} as const

