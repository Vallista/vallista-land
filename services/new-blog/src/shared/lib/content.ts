import { Article, ArticleMeta, Series } from '@shared/types'

// 컨텐츠 타입 정의
export interface ContentFile {
  path: string
  content: string
  frontmatter: Record<string, unknown>
}

export interface ContentIndex {
  articles: ArticleMeta[]
  notes: ArticleMeta[]
  projects: ArticleMeta[]
  tags: string[]
  categories: string[]
}

export type ContentType = 'articles' | 'notes' | 'projects'

// 이미지 경로 처리 함수
export function processImagePath(imagePath: string | undefined, slug: string): string | undefined {
  if (!imagePath) return undefined

  // 이미 절대 URL인 경우 그대로 반환
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // 이미 /contents/articles/로 시작하는 경우 그대로 반환
  if (imagePath.startsWith('/contents/articles/')) {
    return imagePath
  }

  // 상대 경로 처리
  if (imagePath.startsWith('./')) {
    // ./assets/image.png -> /contents/articles/slug/assets/image.png
    return `/contents/articles/${slug}${imagePath.slice(1)}`
  }

  if (imagePath.startsWith('assets/')) {
    // assets/image.png -> /contents/articles/slug/assets/image.png
    return `/contents/articles/${slug}/${imagePath}`
  }

  if (imagePath.startsWith('contents/articles/')) {
    // contents/articles/slug/assets/image.png -> /contents/articles/slug/assets/image.png
    return `/${imagePath}`
  }

  if (imagePath.startsWith('articles/')) {
    // articles/slug/assets/image.png -> /contents/articles/slug/assets/image.png
    const pathWithoutArticles = imagePath.replace(/^articles\//, '')
    return `/contents/articles/${pathWithoutArticles}`
  }

  // 기타 상대 경로는 slug와 결합
  return `/contents/articles/${slug}/${imagePath}`
}

// 이미지 경로 최적화 함수 (1.png, splash.png 순서로 찾기)
export function optimizeImagePath(imagePath: string | undefined, slug: string): string | undefined {
  if (!imagePath) return undefined

  // 이미 절대 URL인 경우 그대로 반환
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // 이미 /contents/articles/로 시작하는 경우 그대로 반환
  if (imagePath.startsWith('/contents/articles/')) {
    return imagePath
  }

  // 상대 경로 처리
  if (imagePath.startsWith('./')) {
    // ./assets/image.png -> /contents/articles/slug/assets/image.png
    return `/contents/articles/${slug}${imagePath.slice(1)}`
  }

  if (imagePath.startsWith('assets/')) {
    // assets/image.png -> /contents/articles/slug/assets/image.png
    return `/contents/articles/${slug}/${imagePath}`
  }

  if (imagePath.startsWith('contents/articles/')) {
    // contents/articles/slug/assets/image.png -> /contents/articles/slug/assets/image.png
    return `/${imagePath}`
  }

  if (imagePath.startsWith('articles/')) {
    // articles/slug/assets/image.png -> /contents/articles/slug/assets/image.png
    const pathWithoutArticles = imagePath.replace(/^articles\//, '')
    return `/contents/articles/${pathWithoutArticles}`
  }

  // 기타 상대 경로는 slug와 결합
  return `/contents/articles/${slug}/${imagePath}`
}

// 컨텐츠 인덱스 JSON 파일을 가져오기
const contentIndexUrl = '/content-index.json'

// 컨텐츠 인덱스 캐시
let contentIndexCache: ContentIndex | null = null

// 컨텐츠 파싱 함수
export function parseContent(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const frontmatterMatch = content.match(/^---\s*[\r\n]+([\s\S]*?)\r?\n---/)

  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content }
  }

  const frontmatterStr = frontmatterMatch[1]
  const body = content.slice(frontmatterMatch[0].length).trim()

  const frontmatter: Record<string, unknown> = {}
  const lines = frontmatterStr.split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || !trimmed.includes(':')) continue

    const [keyPart, ...valueParts] = trimmed.split(':')
    const key = keyPart.trim()
    const rawValue = valueParts.join(':').trim()

    let value: unknown = rawValue.replace(/^["']|["']$/g, '')

    // 타입 변환
    if (value === 'null') value = null
    else if (value === 'true') value = true
    else if (value === 'false') value = false
    else if (!isNaN(Number(value))) value = Number(value)
    else if (key === 'tags' && rawValue.startsWith('[') && rawValue.endsWith(']')) {
      value = JSON.parse(rawValue)
    }

    frontmatter[key] = value
  }

  return { frontmatter, body }
}

// 모든 컨텐츠 로드
export async function loadAllContent(): Promise<ContentIndex> {
  // 캐시된 데이터가 있으면 반환
  if (contentIndexCache) {
    return contentIndexCache
  }

  try {
    const response = await fetch(contentIndexUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch content index: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Content index loaded:', data) // 디버깅용

    // 이미지 경로 처리
    const processedData = {
      ...data,
      articles: data.articles.map((article: ArticleMeta) => ({
        ...article,
        image: processImagePath(article.image, article.slug)
      })),
      notes: data.notes.map((note: ArticleMeta) => ({
        ...note,
        image: processImagePath(note.image, note.slug)
      })),
      projects: data.projects.map((project: ArticleMeta) => ({
        ...project,
        image: processImagePath(project.image, project.slug)
      }))
    }

    // 캐시에 저장
    contentIndexCache = processedData

    return processedData
  } catch (error) {
    console.error('Error loading content index:', error)

    // 에러 시 빈 데이터 반환
    return {
      articles: [],
      notes: [],
      projects: [],
      tags: [],
      categories: []
    }
  }
}

// 특정 글 로드
export async function loadArticle(slug: string): Promise<Article | null> {
  try {
    // contents 디렉토리의 JSON 파일 사용 (폴더 구조)
    const url = `/contents/articles/${slug}/index.json`
    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    return {
      id: data.slug,
      title: data.title,
      description: data.description,
      content: data.content || '',
      slug: data.slug,
      date: data.date,
      tags: data.tags || [],
      image: processImagePath(data.image, data.slug),
      author: data.author,
      readingTime: data.readingTime,
      draft: data.draft,
      series: data.series
    }
  } catch (error) {
    console.error('Error loading article:', error)
    return null
  }
}

// 태그별 글 검색
export async function getArticlesByTag(tag: string): Promise<ArticleMeta[]> {
  const { articles } = await loadAllContent()
  return articles.filter((article) => article.tags?.includes(tag) || false)
}

// 관련 글 찾기
export async function getRelatedArticles(slug: string, limit: number = 3): Promise<ArticleMeta[]> {
  const { articles } = await loadAllContent()
  const currentArticle = articles.find((article) => article.slug === slug)

  if (!currentArticle) return []

  const related = articles
    .filter((article) => article.slug !== slug)
    .map((article) => {
      const commonTags = (currentArticle.tags || []).filter((tag) => (article.tags || []).includes(tag))
      return { ...article, relevance: commonTags.length }
    })
    .filter((article) => article.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)

  return related.map(({ relevance: _relevance, ...article }) => article)
}

// 시리즈 정보 가져오기
export async function getSeriesInfo(seriesName: string): Promise<Series | null> {
  const { articles } = await loadAllContent()

  // 시리즈에 속한 글들 찾기
  const seriesPosts = articles
    .filter((article) => (article as any).series?.name === seriesName)
    .map((article) => ({
      title: article.title,
      slug: article.slug,
      url: `/articles/${article.slug}`,
      order: (article as any).series?.order || 0
    }))
    .sort((a, b) => a.order - b.order)

  if (seriesPosts.length === 0) return null

  return {
    name: seriesName,
    posts: seriesPosts
  }
}
