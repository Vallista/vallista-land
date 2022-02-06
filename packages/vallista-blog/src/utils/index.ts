import { Post } from '../types/type'
export * as localStorage from './storage'

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

/** dark mode 인지 여부 */
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** 브라우저 혹은 운영체제의 모드 환경에 따라 이벤트를 받습니다. */
export function onChangeThemeEvent(func: (theme: 'dark' | 'light') => void): void {
  if (typeof window === 'undefined') return
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    func(event.matches ? 'dark' : 'light')
  })
}
