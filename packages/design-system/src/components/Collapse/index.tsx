/* eslint-disable react-refresh/only-export-components */
import { Children, createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'

import { CollapseProps } from './type'
import { useCollapse } from './useCollapse'
import {
  collapseContainer,
  header,
  headerContents,
  headerTitle,
  subtitle,
  arrow,
  contents,
  headerTitleContainer,
  contentsInner
} from './Collapse.css'

export const Collapse = (props: Partial<CollapseProps>) => {
  const {
    title,
    subtitle: subtitleText,
    children,
    size = 'medium',
    defaultExpanded = true,
    card = false
  } = useCollapse(props)
  const [expanded, setExpanded] = useState(defaultExpanded)
  const contentRef = useRef<HTMLDivElement>(null)

  const fold = useCallback(() => {
    setExpanded(!expanded)
  }, [expanded])

  const contentsOptions = expanded
    ? {
        height: expanded ? 'auto' : 0,
        opacity: expanded ? 1 : 0,
        visibility: expanded ? ('visible' as const) : ('hidden' as const),
        padding: expanded ? undefined : '0px',
        transition: 'none' // 애니메이션 제거
      }
    : {}

  return (
    <div className={collapseContainer({ variant: card ? 'card' : 'default' })}>
      <div className={header({ size })} onClick={fold}>
        <div className={headerContents()}>
          <div className={headerTitleContainer}>
            <h3 className={headerTitle()}>{title}</h3>
            {subtitleText && <p className={subtitle()}>{subtitleText}</p>}
          </div>
          <div className={arrow({ direction: expanded ? 'up' : 'down' })}>
            <svg
              viewBox='0 0 24 24'
              width='20'
              height='20'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
              fill='none'
              shapeRendering='geometricPrecision'
            >
              <path d='M18 15l-6-6-6 6' />
            </svg>
          </div>
        </div>
      </div>
      <div ref={contentRef} className={contents({ size, state: expanded ? 'open' : 'closed' })} style={contentsOptions}>
        <div className={contentsInner}>{children}</div>
      </div>
    </div>
  )
}

const CollapseContext = createContext<{
  expandedTarget: string | null
  setExpandedTarget: (key: string) => void
} | null>(null)

export const useCollapseContext = () => {
  const context = useContext(CollapseContext)
  if (!context) {
    throw new Error('useCollapseContext must be used within a CollapseGroup')
  }
  return context
}

interface CollapseGroupProps {
  children: React.ReactNode
}

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
export const CollapseGroup = ({ children }: CollapseGroupProps) => {
  const collapses = useMemo(() => {
    const result: { key: string; expanded: boolean }[] = []
    Children.forEach(children as ReactElement<CollapseProps>, (c: ReactElement<CollapseProps>) => {
      if (!!c && typeof c === 'object' && 'props' in c) {
        result.push({ key: c.props?.title, expanded: c.props?.defaultExpanded || true })
      }
    })

    return result
  }, [children])

  const [expandedTarget, setExpandedTarget] = useState(() => {
    const firstExpanded = collapses.find((c) => c.expanded)
    return firstExpanded?.key || null
  })

  return <CollapseContext.Provider value={{ expandedTarget, setExpandedTarget }}>{children}</CollapseContext.Provider>
}
