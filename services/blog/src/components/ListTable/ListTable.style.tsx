import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const _TitleWrapper = styled.header<{ underline: boolean }>`
  ${({ theme, underline }) => css`
    ${underline &&
    css`
      border-bottom: 1px solid ${theme.colors.PRIMARY.ACCENT_4};
    `}
  `}
`

export const _List = styled.div``

export const _ListItem = styled.a`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: none !important;
  border-radius: 6px;
  padding: 0.625rem 1.5rem;
  margin: 0 -1.5rem;

  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.ACCENT_6} !important;

    &:hover {
      background: ${theme.colors.PRIMARY.ACCENT_2} !important;
      color: ${theme.colors.PRIMARY.FOREGROUND} !important;
    }

    & > span:first-of-type {
      max-width: 85%;
    }

    & > span:last-of-type {
      max-width: 15%;
      white-space: nowrap;
    }

    &:last-of-type {
      color: ${theme.colors.PRIMARY.ACCENT_3};
    }
  `}
`
