/**
 * 공통 에러 타입 정의
 * 애플리케이션 전반에서 일관된 에러 처리를 위해 사용합니다.
 */

/**
 * 콘텐츠 관련 에러
 */
export class ContentError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'ContentError'
    // Error의 stack trace를 유지
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContentError)
    }
  }
}

/**
 * 에러 코드 상수
 */
export const ERROR_CODES = {
  CONTENT_LOAD_FAILED: 'CONTENT_LOAD_FAILED',
  ARTICLE_LOAD_FAILED: 'ARTICLE_LOAD_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  NOT_FOUND: 'NOT_FOUND'
} as const

/**
 * 에러 타입 가드
 */
export function isContentError(error: unknown): error is ContentError {
  return error instanceof ContentError
}

/**
 * 에러를 안전하게 처리하는 헬퍼 함수
 */
export function handleContentError(error: unknown, defaultMessage: string, code: string): ContentError {
  if (isContentError(error)) {
    return error
  }

  if (error instanceof Error) {
    return new ContentError(defaultMessage, code, error)
  }

  return new ContentError(defaultMessage, code, error)
}

