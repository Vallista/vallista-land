import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const _Wrapper = styled.div`
  min-height: 100vh;
  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.FOREGROUND};
    background: ${theme.colors.PRIMARY.BACKGROUND};
  `}
`

export const _Main = styled.main<{ fold: boolean }>`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: calc(100vw - 400px);
  min-height: calc(100vh - 43px);
  margin-top: 43px;
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
