export interface FooterProps {
  subFooter?: React.ReactNode
  children: React.ReactNode
}

export interface FooterGroupProps {
  title: string
  children: React.ReactNode
}

export interface FooterLinkProps {
  href?: string
  custom?: boolean
  children: React.ReactNode
}
