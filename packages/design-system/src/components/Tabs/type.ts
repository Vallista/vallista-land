import { ReactNode } from 'react'

interface Tab {
  title: string
  value: string
  icon: ReactNode
}

export interface TabsProps {
  tabs: (Omit<Tab, 'icon'> & Partial<Pick<Tab, 'icon'>>)[]
  selected: string
  setSelected: (value: string) => void
  disabled: boolean
}

export type NeedTabsProps = Omit<TabsProps, 'disabled'> & Partial<Pick<TabsProps, 'disabled'>>

export interface ReturningTabsProps {
  //
}
