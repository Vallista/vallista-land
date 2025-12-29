import React from 'react'

type ButtonColor = 'primary' | 'secondary' | 'success' | 'error'
type ButtonVariant = 'ghost' | 'shadow' | 'default'

export interface ButtonProps {
  width?: number
  align?: 'grow' | 'start'
  variant?: ButtonVariant
  shape?: 'square' | 'circle'
  size?: 'small' | 'medium' | 'large'
  type?: 'submit' | 'reset' | 'button'
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  color?: ButtonColor
  loading?: boolean
  disabled?: boolean
  block?: boolean
  children?: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
  // Accessibility props
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-pressed'?: boolean
  'aria-busy'?: boolean
  // HTML button props
  name?: string
  value?: string
  form?: string
  formAction?: string
  formMethod?: 'get' | 'post'
  formTarget?: string
  formEncType?: string
  // Event handlers
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  onKeyUp?: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  // Ref
  ref?: React.Ref<HTMLButtonElement>
}
