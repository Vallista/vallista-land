import { ReactElement } from 'react'

type IconType = ReactElement

export interface NavMenu {
  id: string
  name: string
  icon: IconType
  path: string
  description?: string
}

export type NavMenus = NavMenu[]
