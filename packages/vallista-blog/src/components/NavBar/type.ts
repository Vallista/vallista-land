import { ReactNode } from 'react'

export type NavCategoryType = Record<'me' | 'home' | 'posts' | 'tags', { name: string; icon: ReactNode; link: string }>
export interface NavFooterType {
  [key: string]: { name: string; icon: ReactNode; link: string }
}
