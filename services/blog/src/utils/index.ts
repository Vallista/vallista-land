import { Post } from '../types/type'

// eslint-disable-next-line no-useless-escape
export const SPLIT_DATE_FORMAT = /[\-\+ :T]/

export function translateDate(time: string): number[] {
  return time.split(SPLIT_DATE_FORMAT).map((it) => Number(it.includes('.') ? it.split('.')[0] : it))
}

export function toDate(time: string): Date {
  const result = translateDate(time)
  return new Date(result[0], result[1] - 1, result[2], result[3], result[4], result[5])
}

export function getTime(date: string): [string, string, string] {
  const translate = date.split(SPLIT_DATE_FORMAT)
  return [translate[0] || '0', translate[1] || '0', translate[2] || '0']
}

export function filteredByDraft(posts: Post[]): Post[] {
  return posts.filter((it) =>
    !it.frontmatter.draft
      ? true
      : (typeof window === 'undefined' ? '' : window.location.host).includes('localhost')
      ? true
      : false
  )
}

export * as localStorage from './storage'
export * from './theme'
