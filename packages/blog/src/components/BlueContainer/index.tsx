import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Container as ContainerElement } from 'core'

export const BlueContainer = styled(ContainerElement)`
  border-radius: 5px;
  color: ${({ theme }) => theme.colors.PRIMARY.BACKGROUND};
  padding: 12px;
  ${({ theme }) =>
    css`
      background-color: ${theme.colors.SUCCESS.DEFAULT};
    `}
`
