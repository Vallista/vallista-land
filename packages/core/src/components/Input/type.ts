import { ReactNode } from 'react'

export type InputSizeType = 'small' | 'medium' | 'large'

export interface InputProps {
  size: InputSizeType
  placeholder: string
  disabled: boolean
  prefix: ReactNode
  suffix: ReactNode
  prefixStyling: boolean
  suffixStyling: boolean
  value: string
  onChange: (target: string) => void
}

export type SearchInputProps = InputProps
export interface ReturningUseInput {
  value: string
  onChange: (value: string) => void
}
