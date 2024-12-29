import { ReactNode } from 'react'

export interface NavCategoryProperties {
  name: string
  icon: ReactNode
  link: string
}

export interface NavCategoryType {
  me: NavCategoryProperties
  home: NavCategoryProperties
  posts: NavCategoryProperties
  tags?: NavCategoryProperties
}
export interface NavFooterType {
  [key: string]: { name: string; icon: ReactNode; link: string }
}
