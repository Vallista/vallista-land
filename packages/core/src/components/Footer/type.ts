import { ReactNode } from 'react'

export interface FooterProps {
  subFooter?: ReactNode
}

export interface FooterGroupProps {
  title: string
}

export interface FooterLinkProps {
  href?: string
}
