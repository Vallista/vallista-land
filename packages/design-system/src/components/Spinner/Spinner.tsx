import { forwardRef } from 'react'

import { SpinnerProps } from './type'
import { useSpinner } from './useSpinner'
import { spinnerWrapper, spinnerContainer, spinnerSticks } from './Spinner.css'

/**
 * # Spinner
 *
 * @description [vercel design spinner](https://vercel.com/design/spinner)
 *
 * 기본적인 스피너 컴포넌트입니다. 해당 컴포넌트로 모든 로딩 상태를 나타냅니다.
 *
 * @param {SpinnerProps} {@link SpinnerProps} 기본적인 Spinner 요소
 *
 * @example ```tsx
 * <Spinner size={30} />
 * ```
 */
export const Spinner = forwardRef<HTMLDivElement, Partial<SpinnerProps>>((props, ref) => {
  const { size, 'aria-label': ariaLabel = 'Loading...' } = useSpinner(props)

  return (
    <div
      ref={ref}
      className={spinnerWrapper}
      style={{ width: `${size}px`, height: `${size}px` }}
      role='status'
      aria-label={ariaLabel}
      aria-live='polite'
    >
      <div className={spinnerContainer}>
        {spinnerSticks.map((stick, index) => (
          <div key={`spinner-stick-${index}`} className={stick.className} style={stick.style} />
        ))}
      </div>
    </div>
  )
})

Spinner.displayName = 'Spinner'
