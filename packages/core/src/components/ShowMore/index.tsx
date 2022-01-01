import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { MouseEvent, VFC } from 'react'

interface ShowMoreProps {
  expanded: boolean
  onClick: (() => void) | ((e: MouseEvent<HTMLButtonElement>) => void)
}

/**
 * # ShowMore
 *
 * 더 보기를 구현할 때 이걸로 구현하세요.
 *
 * @param {ShowMoreProps} {@link ShowMoreProps}
 *
 * @example ```tsx
 * const [expanded, setExpanded] = useState(false)
 *
 * <ShowMore expanded={expanded} onClick={() => setExpanded(!expanded)} />
 * ```
 *
 */
export const ShowMore: VFC<ShowMoreProps> = (props) => {
  const { expanded, onClick } = props

  return (
    <Container>
      <Line />
      <Button onClick={onClick}>
        {expanded ? 'SHOW LESS' : 'SHOW MORE'}
        <Svg
          expanded={expanded}
          viewBox='0 0 24 24'
          width='18'
          height='18'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
          shapeRendering='geometricPrecision'
        >
          <path d='M6 9l6 6 6-6' />
        </Svg>
      </Button>
      <Line />
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  width: calc(100% - 40px);
  margin-top: 20px;
  margin-left: 20px;
  box-align: center;
  align-items: center;
  min-height: 30px;

  &,
  & * {
    gap: 0 !important;
  }
`

const Button = styled.button`
  ${({ theme }) => css`
    border: 0;
    padding: 5px 15px;
    border-radius: 100px;
    box-shadow: ${theme.shadows.SMALL};
    outline: 0;
    cursor: pointer;
    font-size: 12px;
    text-transform: uppercase;
    color ${theme.colors.PRIMARY.ACCENT_5};
    height: 28px;
    background-color: ${theme.colors.PRIMARY.BACKGROUND};
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    max-width: 100%;

    &:hover {
      color: ${theme.colors.PRIMARY.FOREGROUND};
      box-shadow: ${theme.shadows.MEDIUM};
    }
  `}
`

const Line = styled.div`
  ${({ theme }) => css`
    -webkit-box-flex: 1;
    flex-grow: 1;
    height: 1px;
    background-color: ${theme.colors.PRIMARY.ACCENT_2};
  `}
`

const Svg = styled.svg<{ expanded: boolean }>`
  margin-left: 6px;
  transition: transform 0.2s ease-in-out;
  ${({ expanded }) =>
    expanded &&
    css`
      transform: rotate(180deg);
    `}
`
