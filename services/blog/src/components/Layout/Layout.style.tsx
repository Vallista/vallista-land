import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const _Wrapper = styled.div`
  min-height: 100vh;
  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.FOREGROUND};
    background: ${theme.colors.PRIMARY.BACKGROUND};
  `}
`

const DEFINE_SIDEBAR_HEADER_HEIGHT = 43

export const _Main = styled.main<{ fold: boolean }>`
  position: relative;
  top: ${DEFINE_SIDEBAR_HEADER_HEIGHT}px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: calc(100vw - 400px);
  height: calc(100vh - ${DEFINE_SIDEBAR_HEADER_HEIGHT}px);
  margin-left: 400px;

  ${({ theme, fold }) => css`
    background: ${theme.colors.PRIMARY.BACKGROUND};
    ${fold &&
    css`
      width: calc(100vw - 80px);
      margin-left: 80px;
    `}
  `}

  @media screen and (max-width: 1024px) {
    margin-left: 0;
    margin-top: 123px;
    width: 100%;
  }

  @media screen and (min-width: 1025px) {
    overflow-y: scroll;
    -webkit-overflow-scrolling: touch;
  }
`

export const _Article = styled.article`
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
`
