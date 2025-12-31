import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

import { createSEOData } from '@shared/lib/utils'
import { SEOData, ArticleMeta, Article } from '@shared/types'

interface UseSEOOptions {
  article?: ArticleMeta | Article
  title?: string
  description?: string
  image?: string
  type?: 'website' | 'article'
}

/**
 * SEO 데이터를 생성하는 훅
 * 페이지별로 적절한 SEO 메타데이터를 자동으로 생성합니다.
 */
export function useSEO(options: UseSEOOptions = {}) {
  const location = useLocation()
  const { article, title, description, image, type } = options

  const seoData = useMemo((): SEOData => {
    // 아티클이 있는 경우 아티클 기반 SEO 데이터 생성
    if (article) {
      return createSEOData(article, location.pathname)
    }

    // 커스텀 SEO 데이터가 있는 경우
    if (title || description) {
      return {
        title: title || 'Vallista Blog',
        description: description || '기술과 개발에 대한 생각을 나누는 공간입니다.',
        image: image,
        url: `${window.location.origin}${location.pathname}`,
        type: type || 'website'
      }
    }

    // 기본 SEO 데이터
    return createSEOData(undefined, location.pathname)
  }, [article, title, description, image, type, location.pathname])

  return seoData
}
