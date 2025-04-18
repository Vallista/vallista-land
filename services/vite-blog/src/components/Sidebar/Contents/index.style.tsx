import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT, DEFINE_SIDEBAR_WIDTH } from '../utils'

interface WrapProps {
  scrollState: 'SHOW' | 'HIDE'
  fold: boolean
}

export const _Wrap = styled.div<WrapProps>`
  position: fixed;
  width: ${DEFINE_SIDEBAR_WIDTH}px;
  height: calc(100vh - ${DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT}px);
  top: ${DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT}px;
  left: 80px;
  overflow-x: hidden;
  overflow-y: hidden;

  ${({ theme, scrollState, fold }) => css`
    z-index: ${theme.layers.AFTER_STANDARD - 1};
    background: ${theme.colors.PRIMARY.ACCENT_1};
    box-shadow: ${theme.shadows.SMALL};

    ${scrollState === 'SHOW' &&
    css`
      &:hover > div:last-of-type {
        margin-right: 0px;
      }
    `}

    ${fold &&
    css`
      left: -${DEFINE_SIDEBAR_WIDTH}px;

      & > div:first-of-type {
        left: -${DEFINE_SIDEBAR_WIDTH}px;
      }
    `}

  /* ipad Portrait and Landscape */
  @media only screen and (min-device-width: 768px) and (max-device-width: 1024px) {
      overflow-y: auto;

      ${scrollState === 'SHOW' &&
      css`
        &:hover > div:last-of-type {
          margin-right: 0;
        }
      `}
    }
  `}

  @media screen and (max-width: 1024px) {
    left: -${DEFINE_SIDEBAR_WIDTH}px;

    & > div:first-of-type {
      left: -${DEFINE_SIDEBAR_WIDTH}px;
    }
  }

  &:hover {
    overflow-y: auto;
  }
`

export const _Padding = styled.div`
  padding: 16px 24px 32px;
`

export const _MenuWrap = styled.nav`
  width: 100%;
`
