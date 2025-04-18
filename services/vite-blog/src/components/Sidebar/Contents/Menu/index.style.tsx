import { css } from '@emotion/react'
import styled from '@emotion/styled'

interface MenuProps {
  active: boolean
}

export const _Menu = styled.a<MenuProps>`
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;
  padding: 6px 0;
  transition: border 0.2s ease;
  gap: 6px;

  ${({ theme, active }) => css`
    ${active &&
    css`
      border-left: 6px solid ${theme.colors.HIGHLIGHT.PINK};
      padding-left: 12px;
    `};

    & > div {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 6px;
      color: ${theme.colors.PRIMARY.ACCENT_4};
    }

    &:hover {
      background-color: ${theme.colors.PRIMARY.ACCENT_2};
    }
  `}

  & > svg {
    width: 20px;
    height: 20px;
  }

  & > span {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: block;
    flex: 1; // 공간 채우도록
  }
`
