import { ReactNode } from 'react'

export type NavCategoryType = Record<'me' | 'posts' | 'tags', { name: string; icon: ReactNode; link: string }>
export type NavFooterType = {
  [key: string]: { name: string; icon: ReactNode; link: string }
}
