import React from 'react'
import * as styles from './Heading.css'

interface HeadingProps {
  children: React.ReactNode
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'text'
  className?: string
}

export function Heading({ children, as = 'h1', size = '2xl', weight = 'bold', color, className }: HeadingProps) {
  const Component = as

  return (
    <Component
      className={`${styles.heading} ${styles.size[size]} ${styles.weight[weight]} ${color ? styles.color[color] : ''} ${className || ''}`}
    >
      {children}
    </Component>
  )
}
