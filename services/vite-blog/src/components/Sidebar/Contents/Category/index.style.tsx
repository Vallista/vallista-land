import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const _ListStyle = styled.nav`
  display: flex;
  flex-direction: column;
  margin: 12px 0 0;
  width: 100%;

  &:first-of-type {
    margin-top: 0;
  }
`

export const _ListHeader = styled.div`
  ${({ theme }) => css`
    cursor: pointer;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-size: 14px;
    background-color: ${theme.colors.PRIMARY.ACCENT_1};
    padding: 0;
    margin: 0 0 6px 0;
    height: 30px;
    gap: 6px;
  `}
`

export const _ListFoldIcon = styled.div<{ fold: boolean }>`
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;
  width: 20px;

  & > div {
    & > svg {
      position: relative;
      ${({ fold }) =>
        !fold &&
        css`
          top: -2px;
          left: -2px;
        `}
    }
  }
`

export const _ListBody = styled.div<{ fold: boolean }>`
  overflow-y: hidden;
  will-change: height;
  transition: height 0.2s ease;

  ${({ fold }) => css`
    height: ${fold ? 0 : 'auto'};
  `}

  & > a {
    padding-left: 12px;
  }
`
