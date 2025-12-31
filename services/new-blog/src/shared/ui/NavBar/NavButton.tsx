import React from 'react'

import * as Styled from './NavButton.css'

interface NavButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  title?: string
}

export const NavButton: React.FC<NavButtonProps> = ({ children, onClick, className = '', disabled = false, title }) => {
  return (
    <button className={`${Styled.navButton} ${className}`} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  )
}
