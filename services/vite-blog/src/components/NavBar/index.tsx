import { useNavigate } from 'react-router'
import { Text, Tooltip, useWindowSize } from '@vallista/design-system'
import { useEffect, useMemo, useState } from 'react'

import { NavCategory, NavFooter } from '../../../config/navbar'
import * as Styled from './NavBar.style'

export const NavBar = () => {
  const navigate = useNavigate()
  const categories = useMemo(() => Object.values(NavCategory), [])
  const footer = useMemo(() => Object.values(NavFooter), [])
  const [visibleTooltip, setVisibleTooltip] = useState(true)
  const windowSize = useWindowSize()

  useEffect(() => {
    setVisibleTooltip(!((windowSize.width ?? 0) <= 1024))
  }, [windowSize])

  const moveToLocation = (target: string, isNewTab = false) => {
    if (isNewTab) {
      window.open(target, '_blank')
      return
    }

    navigate(target)
  }

  const isCategoryActive = (target: string) => {
    return location.pathname === target
  }

  return (
    <Styled._Container>
      <Styled._Section>
        <Styled._Wrapper>
          {categories.map((it) => (
            <Styled._Category checked={isCategoryActive(it.link)} key={it.name} onClick={() => moveToLocation(it.link)}>
              {visibleTooltip ? (
                <Tooltip text={<Text>{it.name}</Text>} position='right'>
                  <div>{it.icon}</div>
                </Tooltip>
              ) : (
                it.icon
              )}
            </Styled._Category>
          ))}
        </Styled._Wrapper>
        <Styled._Wrapper>
          {footer.map((it) => {
            if (it.link === '') return undefined

            return (
              <Styled._Category key={it.name} onClick={() => moveToLocation(it.link, true)}>
                {visibleTooltip ? (
                  <Tooltip text={<Text>{it.name}</Text>} position='right'>
                    {it.icon}
                  </Tooltip>
                ) : (
                  it.icon
                )}
              </Styled._Category>
            )
          })}
        </Styled._Wrapper>
      </Styled._Section>
    </Styled._Container>
  )
}
