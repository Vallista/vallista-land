import { DEFINE_ICON_SIZE } from '@/utils/constant'
import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const _ThemeToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.FOREGROUND};
  `}

  & > label {
    margin: 0 12px;
  }

  & > svg {
    width: ${DEFINE_ICON_SIZE}px;
    height: ${DEFINE_ICON_SIZE}px;
  }
`
