import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC } from 'react'

interface SpacerProps {
  x: number
  y: number
}

/**
 * # Spacer
 * 
 * 공백 및 크기를 쉽게 나타낼 수 있는 컴포넌트입니다.
 * 
 * @param {SpacerProps} {@link SpacerProps} 기본적인 Spacer Props
 * 
 * @example ```tsx
 * <Container>
      <Container>
        <Container style={{ background: Colors.PRIMARY.FOREGROUND }}>
          <Spacer />
        </Container>
        <Container style={{ background: Colors.PRIMARY.FOREGROUND }}>
          <Spacer y={2} />
        </Container>
        <Container style={{ background: Colors.PRIMARY.FOREGROUND }}>
          <Spacer y={3} />
        </Container>
      </Container>
      <Container row>
        <Container style={{ background: Colors.PRIMARY.FOREGROUND }} />
        <Spacer x={3} y={3} />
        <Container style={{ background: Colors.PRIMARY.FOREGROUND }} />
      </Container>
    </Container>
 * ```
 */
export const Spacer: FC<Partial<SpacerProps>> = (props) => {
  const { x = 1, y = 1 } = props

  return <Space x={x} y={y} />
}

const Space = styled.span<SpacerProps>`
  ${({ x, y }) => css`
    margin-left: calc(${24 * x}px - 1px);
    margin-top: calc(${24 * y}px - 1px);
  `}

  width: 1px;
  height: 1px;
  min-width: 1px;
  min-height: 1px;
`
