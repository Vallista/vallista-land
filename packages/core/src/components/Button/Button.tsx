import { css } from '@emotion/react'
import styled from '@emotion/styled'
import React, { FC } from 'react'

import { Spinner } from '../Spinner'
import { Colors } from '../ThemeProvider/type'
import { ButtonProps, ReturningUseButton } from './type'
import { useButton } from './useButton'

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
export const Button: FC<Partial<ButtonProps>> = (props) => {
  const { children, prefix, suffix, disabled, loading, onClick, ...otherProps } = useButton(props)

  return (
    <Element type='submit' disabled={disabled || loading} {...otherProps} onClick={onClick}>
      {(prefix || loading) && <Accessory isPrefix>{loading ? <Spinner /> : prefix}</Accessory>}
      <Content {...otherProps}>{children}</Content>
      {suffix && <Accessory>{suffix}</Accessory>}
    </Element>
  )
}

const Element = styled.button<ReturningUseButton>`
  transition-property: border-color, background, color, transform, box-shadow;
  transition-duration: 0.15s;
  transition-timing-function: ease;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  cursor: default;

  ${(props) => css`
    ${props.shape &&
    css`
      border-radius: ${props.shape === 'square' ? '5px' : '100%'};
    `}
    ${props.shape &&
    css`
      width: ${props.width ? `${props.width}px` : undefined};
    `}
    ${props.size &&
    css`
      height: ${props.size === 'small' ? '32px' : props.size === 'medium' ? '40px' : '48px'};
    `}
    box-shadow: ${props.variant === 'shadow' ? '0 5px 10px rgba(0,0,0,0.12)' : undefined};
    color: ${props.normal?.foreground};
    border: 1px solid ${props.normal?.border};
    background: ${props.normal?.background};
    background-image: ${props.variant === 'ghost'
      ? 'linear-gradient(to right, hsla(0, 0%, 100%, 0.8), hsla(0, 0%, 100%, 0.8))'
      : undefined};
  `}

  &:hover:enabled {
    ${(props) => css`
      color: ${props.hover?.foreground};
      background: ${props.hover?.background};
      border: 1px solid ${props.hover?.border};
      transform: ${props.variant === 'shadow' ? 'translateY(-2px)' : undefined};
      box-shadow: ${props.variant === 'shadow' ? '0 8px 30px rgba(0,0,0,0.12)' : undefined};
      background-image: ${props.variant === 'ghost'
        ? 'linear-gradient(to right, hsla(0, 0%, 100%, 0.8), hsla(0, 0%, 100%, 0.8))'
        : undefined};
    `}
  }

  &:active:enabled {
    ${(props) => css`
      color: ${props.active?.foreground};
      background: ${props.active?.background};
      border: 1px solid ${props.active?.border};
      transform: ${props.variant === 'shadow' ? 'none' : undefined};
      box-shadow: ${props.variant === 'shadow' ? '0 5px 10px rgba(0,0,0,0.12)' : undefined};
      background-image: ${props.variant === 'ghost'
        ? 'linear-gradient(to right, hsla(0, 0%, 100%, 0.7), hsla(0, 0%, 100%, 0.7))'
        : undefined};
    `}
  }

  &:disabled {
    cursor: not-allowed;
    color: ${Colors.PRIMARY.ACCENT_3};
    border-color: ${Colors.PRIMARY.ACCENT_2};
    background: ${Colors.PRIMARY.ACCENT_1};
  }
`

const Content = styled.span<ReturningUseButton>`
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  display: inline-block;
  ${(props) => css`
    margin-right: ${props.align === 'grow' || props.align === 'start' ? 'auto' : undefined};
    margin-left: ${props.align === 'grow' ? 'auto' : undefined};
  `}
`

const Accessory = styled.span<{ isPrefix?: boolean }>`
  ${(props) => css`
    margin-right: ${props.isPrefix ? '8px' : undefined};
    margin-left: ${props.isPrefix ? undefined : '8px'};
  `}
`
