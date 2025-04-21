import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { DEFINE_HEADER_HEIGHT, DEFINE_SAFE_SCROLL_WIDTH } from './utils'
import { DEFINE_NAVBAR_WIDTH } from '../NavBar/utils'

export const _Container = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  width: calc(100vw - ${DEFINE_SAFE_SCROLL_WIDTH}px);
  height: ${DEFINE_HEADER_HEIGHT}px;
  box-sizing: border-box;

  ${({ theme }) => css`
    z-index: ${theme.layers.AFTER_STANDARD};
    background: hsla(47, 33%, 89%, 0);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
  `}

  @media screen and (max-width: 1024px) {
    width: 100vw !important;
    height: ${DEFINE_HEADER_HEIGHT + DEFINE_NAVBAR_WIDTH}px;
    padding: 0 24px;
  }
`

export const _Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const _Wrap = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 12px;
`

export const _Left = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;

  @media screen and (max-width: 1024px) {
    & > div:last-of-type {
      display: none;
    }
  }
`

export const _LeftFirst = styled.div`
  width: ${DEFINE_NAVBAR_WIDTH}px;
  @media screen and (max-width: 1024px) {
    display: none;
  }
`
