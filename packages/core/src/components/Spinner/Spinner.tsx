import { css, keyframes } from '@emotion/react'
import styled from '@emotion/styled'
import React, { FC } from 'react'
import { Colors } from '../ThemeProvider/type'

import { SpinnerProps, ReturningUseSpinner } from './type'
import { useSpinner } from './useSpinner'

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
export const Spinner: FC<Partial<SpinnerProps>> = (props) => {
  const { size } = useSpinner(props)

  return (
    <SpinnerWrapper size={size}>
      <div>
        {[...Array(12)].map((_, index) => {
          return <SpinnerStick key={index} index={index} />
        })}
      </div>
    </SpinnerWrapper>
  )
}

const SpinnerAnimation = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0.15;
  }
`

const SpinnerWrapper = styled.div<ReturningUseSpinner>`
  ${(props) => css`
    width: ${`${props.size ?? 20}px`};
    height: ${`${props.size ?? 20}px`};
  `}
  & > div {
    position: relative;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
  }
`

const SpinnerStick = styled.div<{ index: number }>`
  animation: ${SpinnerAnimation} 1.2s linear infinite;
  position: absolute;
  top: -3.9%;
  left: -10%;
  width: 24%;
  height: 8%;
  border-radius: 5px;
  background: ${Colors.PRIMARY.ACCENT_7};
  ${(props) => css`
    animation-delay: ${-1.2 + props.index * 0.1}s;
    transform: rotate(${30 * props.index}deg) translate(146%);
  `}
`
