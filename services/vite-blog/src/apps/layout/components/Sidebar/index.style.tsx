import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { DEFINE_SIDEBAR_LEFT_POSITION, DEFINE_SIDEBAR_WIDTH } from './utils'
import { DEFINE_HEADER_HEIGHT } from '../Header/utils'
import { DEFINE_NAVBAR_ITEM_HEIGHT } from '../NavBar/utils'

export const _Wrap = styled.aside<{ fold: boolean; visible: boolean }>`
  position: fixed;
  top: ${DEFINE_HEADER_HEIGHT}px;
  left: ${DEFINE_SIDEBAR_LEFT_POSITION}px;
  width: ${DEFINE_SIDEBAR_WIDTH}px;
  height: 100vh;
  transform: translate3d(0, 0, 1);
  box-sizing: border-box;

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

  @media screen and (max-width: 1024px) {
    /* display: none; */
    width: 100vw;
    left: 0;
    background: hsla(47, 33%, 89%, 0);
    backdrop-filter: blur(10px);
    top: ${DEFINE_HEADER_HEIGHT + DEFINE_NAVBAR_ITEM_HEIGHT}px;

    ${({ visible }) =>
      !visible &&
      css`
        display: none;
      `}
  }
`
