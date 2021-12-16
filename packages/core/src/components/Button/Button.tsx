import { css } from '@emotion/react'
import styled from '@emotion/styled'
import React, { FC } from 'react'

import { Spinner } from '../Spinner'
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
    <Element disabled={disabled || loading} {...otherProps} onClick={onClick}>
      {(prefix || loading) && <Accessory isPrefix>{loading ? <Spinner /> : prefix}</Accessory>}
      <Content {...otherProps}>{children}</Content>
      {suffix && <Accessory>{suffix}</Accessory>}
    </Element>
  )
}

const Element = styled.button<ReturningUseButton>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition-property: border-color, background, color, transform, box-shadow;
  transition-duration: 0.15s;
  transition-timing-function: ease;
  max-width: 100%;
  padding: 0 12px;
  cursor: pointer;

  ${(props) => css`
    ${props.shape &&
    css`
      border-radius: ${props.shape === 'square' ? '5px' : '100%'};
    `}
    ${props.width &&
    css`
      width: ${props.width}px;
    `};
    ${props.block &&
    css`
      width: 100%;
    `};
    ${props.size &&
    css`
      height: ${props.size === 'small' ? '32px' : props.size === 'medium' ? '40px' : '48px'};
    `}
    ${props.variant === 'ghost' &&
    css`
      background-image: linear-gradient(to right, hsla(0, 0%, 100%, 0.8), hsla(0, 0%, 100%, 0.8));
    `};
    ${props.variant === 'shadow' &&
    css`
      box-shadow: ${props.theme.shadows.SMALL};
    `}
    color: ${props.normal.foreground};
    border: 1px solid ${props.normal.border};
    background: ${props.normal.background};
  `}

  &:hover:enabled {
    ${(props) => css`
      color: ${props.hover.foreground};
      background: ${props.hover.background};
      border: 1px solid ${props.hover.border};
      ${props.variant === 'shadow' &&
      css`
        transform: translateY(-2px);
      `};
      ${props.variant === 'shadow' &&
      css`
        box-shadow: ${props.theme.shadows.MEDIUM};
      `};
      ${props.variant === 'ghost' &&
      css`
        background-image: linear-gradient(to right, hsla(0, 0%, 100%, 0.8), hsla(0, 0%, 100%, 0.8));
      `}
    `}
  }

  &:active:enabled {
    ${(props) => css`
      color: ${props.active.foreground};
      background: ${props.active.background};
      border: 1px solid ${props.active.border};
      ${props.variant === 'shadow' &&
      css`
        transform: none;
      `};
      ${props.variant === 'shadow' &&
      css`
        box-shadow: ${props.theme.shadows.SMALL};
      `};
      ${props.variant === 'ghost' &&
      css`
        background-image: linear-gradient(to right, hsla(0, 0%, 100%, 0.7), hsla(0, 0%, 100%, 0.7));
      `};
    `}
  }

  &:disabled {
    cursor: not-allowed;
    color: ${({ theme }) => theme.colors.PRIMARY.ACCENT_3};
    border-color: ${({ theme }) => theme.colors.PRIMARY.ACCENT_2};
    background: ${({ theme }) => theme.colors.PRIMARY.ACCENT_1};
  }
`

const Content = styled.span<Pick<ReturningUseButton, 'align'>>`
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  display: inline-block;
  ${(props) => css`
    ${(props.align === 'grow' || props.align === 'start') &&
    css`
      margin-right: auto;
    `};
    ${props.align === 'grow' &&
    css`
      margin-left: auto;
    `};
  `}
`

const Accessory = styled.span<{ isPrefix?: boolean }>`
  ${(props) => css`
    ${props.isPrefix &&
    css`
      margin-right: 8px;
    `};
    ${!props.isPrefix &&
    css`
      margin-left: 8px;
    `};
  `}
`
