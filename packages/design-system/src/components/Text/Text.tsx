import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { FontSizeType } from '.'
import { TextProps, ReturningUseText } from './type'
import { useText } from './useText'

/**
 * # Text
 *
 * @description [vercel design text](https://vercel.com/design/text)
 *
 * 기본적인 텍스트 컴포넌트입니다. 해당 컴포넌트로 모든 텍스트를 나타냅니다.
 *
 * @param {TextProps} {@link TextProps} 기본적인 Text 요소
 *
 * @example ```tsx
 * <Text color={Colors.HIGHLIGHT.PINK} size={20} as='h1'>Hello World!</Text>
 * ```
 */
export const Text = (props: Partial<TextProps>) => {
  const { as, children, ...otherProps } = useText(props)

  const Render = Element.withComponent(as as keyof React.JSX.IntrinsicElements)
  return <Render {...otherProps}>{children}</Render>
}

const fontSizeMapper: Record<FontSizeType, number> = {
  10: 0.625,
  12: 0.75,
  14: 0.875,
  16: 1,
  20: 1.25,
  24: 1.5,
  32: 2,
  40: 2.5,
  48: 3
}

const Element = styled.p<ReturningUseText>`
  ${({ size, lineHeight, color, weight, align, wrap }) => css`
    color: ${color || 'inherit'};
    font-size: ${fontSizeMapper[size ?? 16]}rem;
    line-height: ${lineHeight ? `${lineHeight}px` : 1.5};
    
    ${
      weight &&
      css`
        font-weight: ${weight};
      `
    };};
    ${
      align &&
      css`
        text-align: ${align};
      `
    };
    ${
      !wrap &&
      css`
        white-space: nowrap;
      `
    };

    & strong, & bold {
      font-weight: 800;
    }
  `}
`
