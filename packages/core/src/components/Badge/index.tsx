import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC } from 'react'

import { AvailablePickedColor, Colors } from '../ThemeProvider/type'
import { BadgeProps, BadgeType } from './type'

/**
 * # Badge
 * 
 * 뱃지 컴포넌트입니다.
 * 
 * @param {BadgeProps} {@link BadgeProps} 기본적인 프롭
 * 
 * @example ```tsx
    <Badge type='primary' variant='contrast'>
      150
    </Badge>
    <Badge type='secondary' variant='contrast'>
      150
    </Badge>
    <Badge type='success' variant='contrast'>
      150
    </Badge>
    <Badge type='warning' variant='contrast'>
      150
    </Badge>
    <Badge type='error' variant='contrast'>
      150
    </Badge>
    <Badge type='violet' variant='contrast'>
      150
    </Badge>
 * ```
 */
export const Badge: FC<Partial<BadgeProps>> = (props) => {
  const { size = 'normal', type = 'primary', variant = 'primary', children, ...otherProps } = props

  return (
    <Container size={size} type={type} variant={variant} {...otherProps}>
      {children}
    </Container>
  )
}

const BadgeColorMapper = (
  params: BadgeProps
): Record<
  BadgeType,
  { background: AvailablePickedColor; border: AvailablePickedColor; color: AvailablePickedColor }
> => ({
  primary: {
    background: params.outline
      ? Colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
      ? Colors.PRIMARY.FOREGROUND
      : Colors.PRIMARY.FOREGROUND,
    border: Colors.PRIMARY.FOREGROUND,
    color: params.outline ? Colors.PRIMARY.FOREGROUND : Colors.PRIMARY.BACKGROUND
  },
  secondary: {
    background: params.outline
      ? Colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
      ? Colors.PRIMARY.ACCENT_2
      : Colors.PRIMARY.ACCENT_5,
    border: Colors.PRIMARY.ACCENT_5,
    color: params.outline
      ? Colors.PRIMARY.FOREGROUND
      : params.variant === 'contrast'
      ? Colors.PRIMARY.ACCENT_7
      : Colors.PRIMARY.BACKGROUND
  },
  success: {
    background: params.outline
      ? Colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
      ? Colors.SUCCESS.LIGHTER
      : Colors.SUCCESS.DEFAULT,
    border: Colors.SUCCESS.DEFAULT,
    color: params.outline
      ? Colors.PRIMARY.FOREGROUND
      : params.variant === 'contrast'
      ? Colors.SUCCESS.DARK
      : Colors.PRIMARY.BACKGROUND
  },
  error: {
    background: params.outline
      ? Colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
      ? Colors.ERROR.LIGHTER
      : Colors.ERROR.DEFAULT,
    border: Colors.ERROR.DEFAULT,
    color: params.outline
      ? Colors.PRIMARY.FOREGROUND
      : params.variant === 'contrast'
      ? Colors.ERROR.DARK
      : Colors.PRIMARY.BACKGROUND
  },
  warning: {
    background: params.outline
      ? Colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
      ? Colors.WARNING.LIGHTER
      : Colors.WARNING.DEFAULT,
    border: Colors.WARNING.DEFAULT,
    color: params.outline
      ? Colors.PRIMARY.FOREGROUND
      : params.variant === 'contrast'
      ? Colors.WARNING.DARK
      : Colors.PRIMARY.BACKGROUND
  },
  violet: {
    background: params.outline
      ? Colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
      ? Colors.VIOLET.LIGHTER
      : Colors.VIOLET.DEFAULT,
    border: Colors.VIOLET.DEFAULT,
    color: params.outline
      ? Colors.PRIMARY.FOREGROUND
      : params.variant === 'contrast'
      ? Colors.VIOLET.DARK
      : Colors.PRIMARY.BACKGROUND
  }
})

const Container = styled.span<BadgeProps>`
  display: inline-block;
  vertical-align: middle;
  border-radius: 16px;
  font-weight: 500;
  line-height: 1;
  cursor: inherit;
  font-feature-settings: 'tnum';
  font-variant: tabular-nums;
  text-transform: capitalize;
  white-space: nowrap;
  ${(props) => css`
    background: ${BadgeColorMapper(props)[props.type].background};
    color: ${BadgeColorMapper(props)[props.type].color};
    border: 1px solid ${BadgeColorMapper(props)[props.type].border};

    ${props.size === 'small' &&
    css`
      padding: 3px 7px;
      font-size: 12px;
    `}

    ${props.size === 'normal' &&
    css`
      padding: 2px 7px;
      font-size: 14px;
    `}
    
    ${props.size === 'large' &&
    css`
      padding: 3px 10px;
      font-size: 16px;
    `}
  `}
`
