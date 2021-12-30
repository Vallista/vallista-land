import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Children, FC, useEffect, useMemo, useRef, useState } from 'react'

import { createContext } from '../../utils/createContext'
import { CollapseProps, CollapseSizeType } from './type'
import { useCollapse } from './useCollapse'

/**
 * # Collapse
 * 
 * 데이터를 폴딩하고 보여주는데 최적화된 컴포넌트 입니다.
 * 
 * @props {CollapseProps} {@link CollapseProps} 기본적인 인자
 * 
 * @example ```tsx
 * <Collapse title='Question A'>
    <Text>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
      magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
      consequat.
    </Text>
  </Collapse>
 * ```
 */
export const Collapse: FC<Partial<CollapseProps>> = (props) => {
  const { title, subtitle, fold, expanded, size, card, children } = useCollapse(props)
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (!contentRef.current) return

    setContentHeight(contentRef.current.clientHeight)
  }, [contentRef])

  const contentsOptions = contentRef.current ? { height: expanded ? `${contentHeight}px` : 0 } : {}

  return (
    <Container card={card}>
      <Header size={size}>
        <Button onClick={fold} expanded={expanded}>
          <HeaderContents size={size}>
            {title}
            <Arrow expanded={expanded}>
              <svg
                viewBox='0 0 24 24'
                width='24'
                height='24'
                stroke='currentColor'
                stroke-width='1.5'
                stroke-linecap='round'
                stroke-linejoin='round'
                fill='none'
                shape-rendering='geometricPrecision'
              >
                <path d='M18 15l-6-6-6 6' />
              </svg>
            </Arrow>
          </HeaderContents>
        </Button>
        {subtitle && <SubTitle>{subtitle}</SubTitle>}
      </Header>
      <Contents ref={contentRef} style={contentsOptions}>
        <div>{children}</div>
      </Contents>
    </Container>
  )
}

const [CollapseContext, useContext] =
  createContext<{ expandedTarget: string | null; setExpandedTarget: (key: string) => void }>()

export const useCollapseContext = useContext

/**
 * # CollapseGroup
 * 
 * Collapse를 공유하는 그룹입니다.
 * 
 * @example ```tsx
 * 
  <CollapseGroup>
    <Collapse title='Question A'>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
        dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
        ea commodo consequat.
      </Text>
    </Collapse>

    <Collapse title='Question B'>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
        dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
        ea commodo consequat.
      </Text>
    </Collapse>
  </CollapseGroup>
 * ```
 */
export const CollapseGroup: FC = ({ children }) => {
  const collapses = useMemo(() => {
    const result: { key: string; expanded: boolean }[] = []
    Children.forEach(children, (c) => {
      if (!!c && typeof c === 'object' && 'props' in c) {
        result.push({ key: c.props?.title, expanded: c.props?.defaultExpanded || true })
      }
    })

    return result
  }, [children])

  const [expandedTarget, setExpandedTarget] = useState(() => {
    return collapses.find((it) => (it.expanded ? it.key : null))?.key || null
  })

  return <CollapseContext state={{ expandedTarget, setExpandedTarget }}>{children}</CollapseContext>
}

const Container = styled.div<{ card?: boolean }>`
  text-align: left;
  ${({ theme, card }) => css`
    border-top: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    border-bottom: 1px solid ${theme.colors.PRIMARY.ACCENT_2};

    ${card &&
    css`
      padding: 24px;
      box-shadow: ${theme.shadows.SMALL};
      border-radius: 5px;
      border: none;
    `}
  `}
`

const Header = styled.h3<{ size?: CollapseSizeType }>`
  ${({ size }) =>
    size === 'small'
      ? css`
          font-size: 16px;
          font-weight: 500;
        `
      : css`
          font-weight: 600;
          font-size: 21px;
        `}
  hyphens: auto;
  margin-top: 0;
  margin-bottom: 0;
`

const SubTitle = styled.span`
  font-size: 14px;
  font-weight: 400;
  letter-spacing: normal;
  margin-bottom: 0
  display: block;
  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.ACCENT_5};
  `}
`

const Button = styled.button<{ expanded: boolean }>`
  width: 100%;
  margin-bottom: 0;
  margin-top: 0;

  border: unset;
  background: unset;
  padding: unset;
  margin: unset;
  font: unset;
  text-align: unset;
  appearance: unset;
`

const HeaderContents = styled.span<{ size?: CollapseSizeType }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  vertical-align: baseline;

  ${({ size }) =>
    size === 'small'
      ? css`
          padding: 12px 0;
        `
      : css`
          padding: 24px 0;
        `}

  ${({ theme }) =>
    css`
      color: ${theme.colors.PRIMARY.FOREGROUND};
    `};
`

const Arrow = styled.span<{ expanded: boolean }>`
  transition: transform 0.2s ease;
  ${({ expanded }) =>
    expanded &&
    css`
      transform: rotate(180deg);
    `}
`

const Contents = styled.div`
  font-size: 16px;
  line-height: 26px;
  overflow-y: hidden;
  will-change: height;
  transition: height 0.2s ease;

  & > div {
    margin: 16px 0;
  }
`
