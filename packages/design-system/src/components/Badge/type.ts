export type BadgeType = 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'violet'
export type BadgeVariant = 'primary' | 'contrast'

export interface BadgeProps {
  type: BadgeType
  variant: BadgeVariant
  outline?: boolean
  size: 'small' | 'normal' | 'large'
  children: React.ReactNode
}
