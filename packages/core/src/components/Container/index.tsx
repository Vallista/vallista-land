import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC } from 'react'

import { ContainerProps } from './type'

export const Container: FC<Partial<ContainerProps>> = (props) => {
  const { children, ...otherProps } = props

  return <ContainerElement {...otherProps}>{children}</ContainerElement>
}

export const ContainerElement = styled.div<Partial<ContainerProps>>`
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 1px;
  max-width: 100%;
  justify-content: flex-start;
  align-items: stretch;
  flex-basis: auto;
  box-sizing: border-box;

  ${({ row, flex = 1, gap = 1, center, direction, wrap = 'wrap' }) => css`
    flex: ${flex};
    flex-wrap: ${wrap};

    ${row
      ? css`
          flex-direction: row;
          & > *:not(:first-of-type) {
            margin-left: ${gap * 24}px;
          }
        `
      : css`
          & > section,
          & > div,
          & > article,
          & > header,
          & > footer {
            gap: ${gap * 24}px;
          }

          &:last-of-type {
            margin-bottom: 0;
          }
        `}

    ${center &&
    css`
      justify-content: center;
      align-items: center;
    `}
  `}
`
