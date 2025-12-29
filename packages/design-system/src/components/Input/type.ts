import { ReactNode } from 'react'

export type InputSizeType = 'small' | 'medium' | 'large'

export interface InputProps {
  size?: InputSizeType
  placeholder?: string
  disabled?: boolean
  prefix?: ReactNode
  suffix?: ReactNode
  prefixStyling?: boolean
  suffixStyling?: boolean
  value?: string
  onChange?: (target: string) => void
  // HTML input attributes
  type?: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | 'number'
  name?: string
  id?: string
  required?: boolean
  autoComplete?: string
  autoFocus?: boolean
  readOnly?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
  // Accessibility
  'aria-label'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  'aria-required'?: boolean
  // Event handlers
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  // Ref
  ref?: React.Ref<HTMLInputElement>
}

export interface SearchInputProps extends InputProps {
  onReset?: () => void
}

export interface ReturningUseInput {
  value: string
  onChange: (value: string) => void
}
