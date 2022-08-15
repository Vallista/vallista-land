import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const _List = styled.ol`
  padding-left: 1.5rem;
  box-sizing: border-box;
  line-height: 1.6;
  list-style: decimal;
`

export const _Item = styled.li<{ timeToRead: number }>`
  ${({ theme, timeToRead }) => css`
    margin-bottom: 0.5rem;
    &::marker {
      font-weight: 600;
      color: ${theme.colors.HIGHLIGHT.PINK};
    }

    &::after {
      content: '- ${timeToRead}분';
      margin-left: 0.2rem;
      font-size: 0.8rem;
    }

    & > span {
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
