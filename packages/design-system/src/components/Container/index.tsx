import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { ContainerProps } from './type'

export const Container = styled.div<Partial<ContainerProps>>`
  display: flex;
  flex-direction: column;
  position: relative;
  min-width: 1px;
  max-width: 100%;
  justify-content: flex-start;
  align-items: stretch;
  flex-basis: auto;
  box-sizing: border-box;

  ${({ row, flex = 1, gap = 1, center, wrap = 'wrap' }) => css`
    flex: ${flex};
    flex-wrap: ${wrap};

    ${row
      ? css`
          flex-direction: row;
          & > *:not(:first-of-type) {
            margin-left: calc(${gap} * 1rem);
          }
        `
      : css`
          & > section,
          & > div,
          & > article,
          & > header,
          & > footer {
            gap: calc(${gap} * 1rem);
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
