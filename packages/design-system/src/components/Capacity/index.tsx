import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { VFC } from 'react'

import { CapacityProps } from './type'

/**
 * # Capacity
 * 
 * 작은 게이지를 만들때 쓰입니다.
 * 
 * @param {CapacityProps} {@link CapacityProps} 기본적인 프롭
 * 
 * @example ```tsx
  <Capacity value={10} />
  <Capacity value={20} />
  <Capacity value={30} />
  <Capacity value={40} />
  <Capacity value={50} />
  <Capacity value={60} />
  <Capacity value={70} />
  <Capacity value={80} />
  <Capacity value={90} />
  <Capacity value={100} />
 * ```
 */
export const Capacity: VFC<CapacityProps> = (props) => {
  const { value, limit = 100 } = props

  return (
    <Container>
      <Progress percent={(value / limit) * 100} />
    </Container>
  )
}

const Container = styled.div`
  width: 50px;
  height: 10px;
  border-radius: 4px;
  ${({ theme }) => css`
    background: ${theme.colors.PRIMARY.ACCENT_2};
    overflow: hidden;
  `}
`

const Progress = styled.div<{ percent: number }>`
  height: 10px;
  ${({ percent, theme }) => css`
    width: ${percent < 15 ? 7 : (percent / 100) * 50}px;
    ${percent <= 100 &&
    css`
      background-color: ${theme.colors.ERROR.DEFAULT};
    `}
    ${percent < 66 &&
    css`
      background-color: ${theme.colors.WARNING.DEFAULT};
    `}
    ${percent < 33 &&
    css`
      background-color: ${theme.colors.CYAN.LIGHT};
    `}
  `}
`
