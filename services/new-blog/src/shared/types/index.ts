export interface Article {
  id: string
  title: string
  description: string
  content: string
  slug: string
  date: string
  tags: string[]
  image?: string
  author?: string
  readingTime?: number
  draft?: boolean
  series?: {
    name: string
    order: number
  }
}

export interface Series {
  name: string
  description?: string
  posts: {
    title: string
    slug: string
    url: string
    order: number
  }[]
}

export interface ArticleMeta {
  title: string
  description: string
  date: string
  tags?: string[]
  image?: string
  slug: string
  author?: string
  readingTime?: number
  draft?: boolean
}

export interface SEOData {
  title: string
  description: string
  image?: string
  url: string
  type: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
}

export interface SearchParams {
  query?: string
  tags?: string[]
  page?: number
  limit?: number
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface ApiResponse<T> {
  data: T
  meta?: PaginationMeta
  error?: string
}

// 페이지 관련 타입들
export interface BasePageProps {
  title: string
  description: string
  enableScrollToTop?: boolean
  className?: string
}

export interface ContentPageProps extends BasePageProps {
  content: ArticleMeta[]
  isLoading: boolean
  error?: Error | null
  emptyMessage?: string
  children?: React.ReactNode
}

export interface ArticlePageProps extends BasePageProps {
  article: Article
  relatedArticles?: Article[]
  seriesInfo?: Series
}

export interface StaticPageProps extends BasePageProps {
  children: React.ReactNode
}

export interface PageWrapperProps extends BasePageProps {
  children: React.ReactNode
  seoData?: SEOData
  enableScrollToTop?: boolean
}

export interface PageHeaderProps {
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

export interface PageContentProps {
  children: React.ReactNode
  className?: string
}

export interface SEOHeadProps {
  seoData: SEOData
  additionalMeta?: React.ReactNode
}
