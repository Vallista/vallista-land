import { css } from '@emotion/react'
import styled from '@emotion/styled'
import React, { FC } from 'react'
import { TextProps, ReturningUseText } from './type'
import { useText } from './useText'

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
