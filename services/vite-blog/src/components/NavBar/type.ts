import { FC, ReactPortal, SVGProps } from 'react'

type IconType = SVGProps<SVGSVGElement> | FC

export interface NavCategoryProperties {
  name: string
  icon: IconType
  link: string
}

export interface NavCategoryType {
  me: NavCategoryProperties
  home: NavCategoryProperties
  posts: NavCategoryProperties
  tags?: NavCategoryProperties
}
export interface NavFooterType {
  [key: string]: { name: string; icon: IconType; link: string }
}
