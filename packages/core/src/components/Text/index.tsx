import { css } from '@emotion/react'
import styled from '@emotion/styled'
import React, { FC } from 'react'

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
export const Text: FC<Partial<TextProps>> = (props) => {
  const { as, children, transform, ...otherProps } = useText(props)

  const Render = Element.withComponent(as as keyof JSX.IntrinsicElements)
  return <Render {...otherProps}>{children}</Render>
}

const Element = styled.p<ReturningUseText>`
  ${(props) => css`
    color: ${props.color};
    font-size: ${props.size}px;
    ${
      props.lineHeight &&
      css`
        line-height: ${props.lineHeight};
      `
    };
    ${
      props.weight &&
      css`
        font-weight: ${props.weight};
      `
    };};
    ${
      props.align &&
      css`
        text-align: ${props.align};
      `
    };
    ${
      !props.wrap &&
      css`
        white-space: nowrap;
      `
    };
  `}
`
