import { forwardRef } from 'react'
import { clsx } from 'clsx'

import { Spinner } from '../Spinner'
import { ButtonProps } from './type'
import { useButton } from './useButton'
import { button, buttonIcon, buttonText } from './Button.css'

/**
 * # Button
 *
 * @description [vercel design button](https://vercel.com/design/button)
 *
 * 기본적인 버튼 컴포넌트입니다. 해당 컴포넌트로 모든 버튼을 나타냅니다.
 *
 * @param {ButtonProps} {@link ButtonProps} 기본적인 Text 요소
 *
 * @example ```tsx
 * <Button type={Colors.HIGHLIGHT.PINK} size="small" variant="shadow" disabled>Hello World!</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, Partial<ButtonProps>>((props, ref) => {
  const {
    children,
    prefix,
    suffix,
    disabled,
    loading,
    onClick,
    type = 'button',
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    'aria-expanded': ariaExpanded,
    'aria-pressed': ariaPressed,
    size,
    shape,
    variant,
    color,
    block,
    ...otherProps
  } = useButton(props)

  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      aria-expanded={ariaExpanded}
      aria-pressed={ariaPressed}
      aria-busy={loading}
      className={clsx(button({ size, shape, variant, color, block }))}
      onClick={onClick}
      {...otherProps}
    >
      {(prefix || loading) && (
        <span className={buttonIcon} style={{ marginRight: '8px' }} aria-hidden='true'>
          {loading ? <Spinner size={16} /> : prefix}
        </span>
      )}
      <span className={buttonText}>{children}</span>
      {suffix && (
        <span className={buttonIcon} style={{ marginLeft: '8px' }} aria-hidden='true'>
          {suffix}
        </span>
      )}
    </button>
  )
})

Button.displayName = 'Button'
