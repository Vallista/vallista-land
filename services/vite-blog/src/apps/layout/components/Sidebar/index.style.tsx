import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { DEFINE_SIDEBAR_LEFT_POSITION, DEFINE_SIDEBAR_WIDTH } from './utils'
import { DEFINE_HEADER_HEIGHT } from '../Header/utils'

export const _Wrap = styled.aside<{ fold: boolean }>`
  position: fixed;
  top: ${DEFINE_HEADER_HEIGHT}px;
  left: ${DEFINE_SIDEBAR_LEFT_POSITION}px;
  width: ${DEFINE_SIDEBAR_WIDTH}px;
  height: 100vh;
  transform: translate3d(0, 0, 1);

  ${({ theme, fold }) => css`
    z-index: ${theme.layers.AFTER_STANDARD};

    ${fold &&
    css`
      left: -${DEFINE_SIDEBAR_WIDTH}px;

      & > div:first-of-type {
        left: -${DEFINE_SIDEBAR_WIDTH}px;
      }
    `}
  `}
`
