import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { DEFINE_ICON_SIZE } from '@/utils/constant'

export const _Button = styled.button<{ fold: boolean }>`
  cursor: pointer;
  border: none;
  background: none;
  outline: none;
  padding: 0;
  margin: 0;
  height: 18px;
  transition: color 0.2s cubic-bezier(0.215, 0.61, 0.355, 1);

  ${({ theme, fold }) => css`
    ${fold
      ? css`
          color: ${theme.colors.HIGHLIGHT.PINK};
        `
      : css`
          &:hover {
            color: ${theme.colors.PRIMARY.FOREGROUND};
          }
          color: ${theme.colors.PRIMARY.ACCENT_4};
        `}
  `}

  & > svg {
    width: ${DEFINE_ICON_SIZE}px;
    height: ${DEFINE_ICON_SIZE}px;
  }

  @media screen and (max-width: 1024px) {
    display: none;

    & + span {
      display: none;
    }
  }
`
