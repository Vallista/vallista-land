import { css, Theme } from '@emotion/react'
import styled from '@emotion/styled'

import { AvailablePickedColor } from '../ThemeProvider/type'
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
export const Badge = (props: Partial<BadgeProps>) => {
  const { size = 'normal', type = 'primary', variant = 'primary', children, ...otherProps } = props

  return (
    <Container size={size} type={type} variant={variant} {...otherProps}>
      {children}
    </Container>
  )
}

const BadgeColorMapper = (
  theme: Theme,
  params: BadgeProps
): Record<
  BadgeType,
  { background: AvailablePickedColor; border: AvailablePickedColor; color: AvailablePickedColor }
> => ({
  primary: {
    background: params.outline
      ? theme.colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
        ? theme.colors.PRIMARY.FOREGROUND
        : theme.colors.PRIMARY.FOREGROUND,
    border: theme.colors.PRIMARY.FOREGROUND,
    color: params.outline ? theme.colors.PRIMARY.FOREGROUND : theme.colors.PRIMARY.BACKGROUND
  },
  secondary: {
    background: params.outline
      ? theme.colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
        ? theme.colors.PRIMARY.ACCENT_2
        : theme.colors.PRIMARY.ACCENT_5,
    border: theme.colors.PRIMARY.ACCENT_5,
    color: params.outline
      ? theme.colors.PRIMARY.FOREGROUND
      : params.variant === 'contrast'
        ? theme.colors.PRIMARY.ACCENT_7
        : theme.colors.PRIMARY.BACKGROUND
  },
  success: {
    background: params.outline
      ? theme.colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
        ? theme.colors.SUCCESS.LIGHTER
        : theme.colors.SUCCESS.DEFAULT,
    border: theme.colors.SUCCESS.DEFAULT,
    color: params.outline
      ? theme.colors.PRIMARY.FOREGROUND
      : params.variant === 'contrast'
        ? theme.colors.SUCCESS.DARK
        : theme.colors.PRIMARY.BACKGROUND
  },
  error: {
    background: params.outline
      ? theme.colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
        ? theme.colors.ERROR.LIGHTER
        : theme.colors.ERROR.DEFAULT,
    border: theme.colors.ERROR.DEFAULT,
    color: params.outline
      ? theme.colors.PRIMARY.FOREGROUND
      : params.variant === 'contrast'
        ? theme.colors.ERROR.DARK
        : theme.colors.PRIMARY.BACKGROUND
  },
  warning: {
    background: params.outline
      ? theme.colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
        ? theme.colors.WARNING.LIGHTER
        : theme.colors.WARNING.DEFAULT,
    border: theme.colors.WARNING.DEFAULT,
    color: params.outline
      ? theme.colors.PRIMARY.FOREGROUND
      : params.variant === 'contrast'
        ? theme.colors.WARNING.DARK
        : theme.colors.PRIMARY.BACKGROUND
  },
  violet: {
    background: params.outline
      ? theme.colors.PRIMARY.BACKGROUND
      : params.variant === 'contrast'
        ? theme.colors.VIOLET.LIGHTER
        : theme.colors.VIOLET.DEFAULT,
    border: theme.colors.VIOLET.DEFAULT,
    color: params.outline
      ? theme.colors.PRIMARY.FOREGROUND
      : params.variant === 'contrast'
        ? theme.colors.VIOLET.DARK
        : theme.colors.PRIMARY.BACKGROUND
  }
})

const Container = styled.span<BadgeProps>`
  display: inline-block;
  vertical-align: middle;
  border-radius: 16px;
  font-weight: 500;
  line-height: 1;
  cursor: inherit;
  font-feature-settings: tnum;
  font-variant: tabular-nums;
  text-transform: capitalize;
  white-space: nowrap;
  ${({ theme, ...props }) => css`
    background: ${BadgeColorMapper(theme, props)[props.type].background};
    color: ${BadgeColorMapper(theme, props)[props.type].color};
    border: 1px solid ${BadgeColorMapper(theme, props)[props.type].border};

    ${props.size === 'small' &&
    css`
      padding: 3px 7px;
      font-size: 0.625rem;
    `}

    ${props.size === 'normal' &&
    css`
      padding: 2px 7px;
      font-size: 0.875rem;
    `}
    
    ${props.size === 'large' &&
    css`
      padding: 3px 10px;
      font-size: 1rem;
    `}
  `}
`
