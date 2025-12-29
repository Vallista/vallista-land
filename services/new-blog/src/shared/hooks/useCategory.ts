import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { ArticleMeta } from '@shared/types'

export type CategoryType = 'articles' | 'notes' | 'projects'

interface CategoryInfo {
  title: string
  emptyMessage: string
}

interface UseCategoryOptions {
  content?: {
    articles?: ArticleMeta[]
    notes?: ArticleMeta[]
    projects?: ArticleMeta[]
  }
}

/**
 * 카테고리 관련 로직을 처리하는 훅
 * URL 경로에서 카테고리를 결정하고, 해당 카테고리의 콘텐츠와 정보를 제공합니다.
 */
export function useCategory(options: UseCategoryOptions = {}) {
  const location = useLocation()
  const { content } = options

  // URL 경로에서 카테고리 결정
  const selectedCategory = useMemo((): CategoryType => {
    const path = location.pathname
    if (path.startsWith('/articles')) return 'articles'
    if (path.startsWith('/notes')) return 'notes'
    if (path.startsWith('/projects')) return 'projects'
    return 'articles' // 기본값
  }, [location.pathname])

  // 카테고리별 콘텐츠 필터링
  const filteredContents = useMemo((): ArticleMeta[] => {
    if (!content) return []

    switch (selectedCategory) {
      case 'articles':
        return content.articles || []
      case 'notes':
        return content.notes || []
      case 'projects':
        return content.projects || []
      default:
        return content.articles || []
    }
  }, [content, selectedCategory])

  // 카테고리별 정보
  const categoryInfo = useMemo((): CategoryInfo => {
    switch (selectedCategory) {
      case 'articles':
        return {
          title: '아티클',
          emptyMessage: '아직 글이 없습니다. 곧 새로운 글을 작성할 예정입니다.'
        }
      case 'notes':
        return {
          title: '노트',
          emptyMessage: '아직 노트가 없습니다. 곧 새로운 노트를 작성할 예정입니다.'
        }
      case 'projects':
        return {
          title: '프로젝트',
          emptyMessage: '아직 프로젝트가 없습니다. 곧 새로운 프로젝트를 작성할 예정입니다.'
        }
      default:
        return {
          title: '아티클',
          emptyMessage: '아직 글이 없습니다. 곧 새로운 글을 작성할 예정입니다.'
        }
    }
  }, [selectedCategory])

  return {
    selectedCategory,
    filteredContents,
    categoryInfo
  }
}
