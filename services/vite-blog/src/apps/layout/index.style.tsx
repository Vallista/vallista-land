import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { DEFINE_SIDEBAR_WIDTH } from './components/Sidebar/utils'
import { DEFINE_NAVBAR_WIDTH } from './components/NavBar/utils'

export const _Wrapper = styled.div`
  min-height: 100vh;
  ${(params) => css`
    color: ${params.theme.colors.PRIMARY.FOREGROUND};
    background: ${params.theme.colors.PRIMARY.BACKGROUND};
  `}
`

const DEFINE_LEFT_POSITION = DEFINE_NAVBAR_WIDTH + DEFINE_SIDEBAR_WIDTH

export const _Main = styled.main<{ fold: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: calc(100vw - ${DEFINE_LEFT_POSITION}px);
  height: 100vh;
  margin-left: ${DEFINE_LEFT_POSITION}px;

  ${({ theme, fold }) => css`
    background: ${theme.colors.PRIMARY.BACKGROUND};
    ${fold &&
    css`
      width: calc(100vw - ${DEFINE_NAVBAR_WIDTH}px);
      margin-left: ${DEFINE_NAVBAR_WIDTH}px;
    `}
  `}

  @media screen and (max-width: 1024px) {
    margin-left: 0;
    width: 100vw;
    height: auto;
  }

  @media screen and (min-width: 1025px) {
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
  }
`

export const _Article = styled.article`
  box-sizing: border-box;
  margin: 0 auto;

  ${({ theme }) => css`
    a {
      cursor: pointer;
      border-bottom: 2px solid ${theme.colors.HIGHLIGHT.PINK};
      font-weight: 600;
      text-decoration: none;
      color: ${theme.colors.PRIMARY.FOREGROUND};
      transition: all 0.1s ease-out;

      &:hover {
        background: ${theme.colors.HIGHLIGHT.PINK};
        border-top: 2px solid ${theme.colors.HIGHLIGHT.PINK};
        color: ${theme.colors.PRIMARY.BACKGROUND};
      }
    }
  `}

  @media screen and (max-width: 1024px) {
    width: 100vw;
  }
`
