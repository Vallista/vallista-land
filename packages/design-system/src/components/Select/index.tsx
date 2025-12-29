import React, { ReactNode, useState, useRef, useEffect } from 'react'
import {
  selectContainer,
  selectTrigger,
  selectDropdown,
  selectOption,
  selectArrow,
  selectArrowOpen
} from './Select.css'
import { clsx } from 'clsx'

// Option 요소의 props 타입 정의
interface OptionProps {
  value?: string
  disabled?: boolean
  children?: ReactNode
}

// 타입 가드 함수
function isOptionElement(element: React.ReactElement): element is React.ReactElement<OptionProps> {
  return element.type === 'option'
}

export interface SelectProps {
  children: ReactNode
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  width?: string | number
  maxWidth?: string | number
  'aria-label'?: string
  'aria-describedby'?: string
}

export const Select = ({
  children,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select an option',
  width,
  maxWidth,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // SSR safe mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // SSR safe event listener
  useEffect(() => {
    if (!mounted || typeof document === 'undefined') return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mounted])

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleOptionClick = (optionValue: string) => {
    onChange?.(optionValue)
    setIsOpen(false)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        setIsOpen(!isOpen)
        break
      case 'Escape':
        setIsOpen(false)
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        }
        break
    }
  }

  // 선택된 옵션의 텍스트 찾기
  const selectedOptionText =
    React.Children.toArray(children)
      .filter(
        (child): child is React.ReactElement<OptionProps> => React.isValidElement(child) && isOptionElement(child)
      )
      .find((option) => option.props.value === value)?.props.children || placeholder

  return (
    <div
      className={selectContainer()}
      style={{
        width: width || 'auto',
        maxWidth: maxWidth || 'none'
      }}
    >
      <div
        ref={triggerRef}
        className={selectTrigger({ open: isOpen })}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role='combobox'
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-disabled={disabled}
      >
        <span>{selectedOptionText}</span>
        <svg
          className={clsx(selectArrow, isOpen && selectArrowOpen)}
          width='16'
          height='16'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <polyline points='6,9 12,15 18,9' />
        </svg>
      </div>

      {isOpen && mounted && (
        <div ref={dropdownRef} className={selectDropdown()} role='listbox'>
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child) || !isOptionElement(child)) return null

            const optionValue = child.props.value
            const isSelected = optionValue === value
            const isDisabled = child.props.disabled

            return (
              <div
                key={optionValue}
                className={selectOption()}
                onClick={() => !isDisabled && handleOptionClick(optionValue || '')}
                role='option'
                aria-selected={isSelected}
                aria-disabled={isDisabled}
                data-selected={isSelected}
                tabIndex={-1}
              >
                {child.props.children}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
