import { Text, Spinner } from '@vallista/design-system'
import { useEffect, useRef, useState } from 'react'

import { getGiscusConfig } from '@shared/config/giscus'
import { logger } from '@shared/lib/logger'

import * as styles from './GiscusComments.css'

interface GiscusCommentsProps {
  postId: string
  title?: string
}

export function GiscusComments({ postId, title }: GiscusCommentsProps) {
  const commentsRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const config = getGiscusConfig()
    logger.debug('Giscus config:', config)

    // Giscus 스크립트 로드
    const loadGiscus = () => {
      if (typeof window !== 'undefined' && window.giscus) {
        try {
          logger.debug('Loading Giscus with term:', title || postId)
          window.giscus.render(commentsRef.current!, {
            ...config,
            term: `/articles/${postId}` // pathname 기반으로 변경
          })
          setIsLoading(false)
        } catch (error) {
          logger.error('Giscus render error:', error)
          setHasError(true)
          setIsLoading(false)
        }
      }
    }

    // Giscus 스크립트가 이미 로드되어 있는지 확인
    if (typeof window !== 'undefined' && window.giscus) {
      loadGiscus()
    } else {
      // Giscus 스크립트 로드
      const script = document.createElement('script')
      script.src = 'https://giscus.app/client.js'
      script.setAttribute('data-repo', config.repo)
      script.setAttribute('data-repo-id', config.repoId)
      script.setAttribute('data-category', config.category)
      script.setAttribute('data-category-id', config.categoryId)
      script.setAttribute('data-mapping', config.mapping)
      script.setAttribute('data-strict', config.strict)
      script.setAttribute('data-reactions-enabled', config.reactionsEnabled)
      script.setAttribute('data-emit-metadata', config.emitMetadata)
      script.setAttribute('data-input-position', config.inputPosition)
      script.setAttribute('data-theme', config.theme)
      script.setAttribute('data-lang', config.lang)
      script.setAttribute('data-loading', config.loading)
      script.crossOrigin = 'anonymous'
      script.async = true

      script.onload = () => {
        logger.debug('Giscus script loaded')
        loadGiscus()
      }

      script.onerror = () => {
        logger.error('Failed to load Giscus script')
        setHasError(true)
        setIsLoading(false)
      }

      document.head.appendChild(script)
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      // cleanup은 필요하지 않음 (Giscus가 자체적으로 관리)
    }
  }, [postId, title])

  return (
    <div className={styles.container}>
      <Text size={32} weight={700}>
        댓글
      </Text>

      <div className={styles.commentsWrapper}>
        <div ref={commentsRef} className={styles.comments} />

        {/* 로딩 상태 */}
        {isLoading && (
          <div className={styles.loading}>
            <Spinner size={16} />
            <Text size={14} color='secondary'>
              댓글을 불러오는 중...
            </Text>
          </div>
        )}

        {/* 에러 상태 */}
        {hasError && (
          <div className={styles.error}>
            <Text size={14} color='error'>
              댓글을 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}

// Giscus 타입 정의
declare global {
  interface Window {
    giscus: {
      render: (element: HTMLElement, options: Record<string, unknown>) => void
    }
  }
}
