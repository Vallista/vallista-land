import { SITE_CONFIG, SEO_CONFIG } from '@shared/config'
import { CONTENT_CONSTANTS } from '@shared/constants/content'
import { ArticleMeta, SEOData, Article } from '@shared/types'

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / CONTENT_CONSTANTS.WORDS_PER_MINUTE)
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export function generateDescription(
  content: string,
  maxLength: number = CONTENT_CONSTANTS.DESCRIPTION_MAX_LENGTH
): string {
  const plainText = content
    .replace(/^---[\s\S]*?---/, '') // Remove frontmatter
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // Remove images
    .replace(/\[[^\]]*\]\([^)]*\)/g, '') // Remove links
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  return truncateText(plainText, maxLength)
}

export function createSEOData(article?: ArticleMeta | Article, pathname: string = '/'): SEOData {
  const url = `${SITE_CONFIG.url}${pathname}`

  if (article) {
    return {
      title: article.title,
      description: article.description,
      image: article.image || SEO_CONFIG.defaultImage,
      url,
      type: 'article',
      publishedTime: article.date,
      modifiedTime: article.date,
      author: article.author || SITE_CONFIG.author,
      tags: article.tags
    }
  }

  return {
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription,
    image: SEO_CONFIG.defaultImage,
    url,
    type: 'website'
  }
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }

  // Fallback for older browsers
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
  return Promise.resolve()
}
