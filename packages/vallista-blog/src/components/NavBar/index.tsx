import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { useLocation } from '@reach/router'
import { Text, Tooltip } from '@vallista-land/core'
import { navigate } from 'gatsby'
import { useMemo, VFC } from 'react'

import { NavCategory, NavFooter } from '../../../config/navbar'

export const NavBar: VFC = () => {
  const location = useLocation()
  const categories = useMemo(() => Object.values(NavCategory), [])
  const footer = useMemo(() => Object.values(NavFooter), [])

  return (
    <Container>
      <Section>
        <Wrapper>
          {categories.map((it) => (
            <Category checked={isCategoryActive(it.link)} key={it.name} onClick={() => moveToLocation(it.link)}>
              <Tooltip text={<Text>{it.name}</Text>} position='right'>
                <div>{it.icon}</div>
              </Tooltip>
            </Category>
          ))}
        </Wrapper>
        <Wrapper>
          {footer.map((it) =>
            it.link === '' ? undefined : (
              <Category key={it.name} onClick={() => moveToLocation(it.link, true)}>
                <Tooltip text={<Text>{it.name}</Text>} position='right'>
                  <div>{it.icon}</div>
                </Tooltip>
              </Category>
            )
          )}
        </Wrapper>
      </Section>
    </Container>
  )

  function moveToLocation(target: string, isNewTab = false): void {
    if (isNewTab) {
      window.open(target, '_blank')
      return
    }

    navigate(target)
  }

  function isCategoryActive(target: string): boolean {
    return location.pathname === target
  }
}

const Container = styled.aside`
  min-width: 80px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;

  ${({ theme }) => css`
    background: ${theme.colors.PRIMARY.ACCENT_2};
    z-index: ${theme.layers.AFTER_STANDARD};
  `}

  @media screen and (max-width: 1000px) {
    left: -9999px;
  }
`

const Section = styled.section`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`

const Wrapper = styled.nav``

const Category = styled.a<{ checked?: boolean }>`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  cursor: pointer;
  transition: background 0.2s ease;

  & > div {
    width: inherit;
    height: inherit;

    & img {
      border-radius: 12px;
    }
  }

  ${({ theme, checked }) => css`
    & > div > div:first-of-type {
      width: inherit;
      height: inherit;
      display: flex;
      justify-content: center;
      align-items: center;
      color: ${theme.colors.PRIMARY.FOREGROUND};
    }

    &:hover {
      background: ${theme.colors.PRIMARY.ACCENT_3};
    }

    &:hover > div > div:first-of-type {
      color: ${theme.colors.PRIMARY.BACKGROUND};
    }

    ${checked &&
    css`
      &:before {
        position: absolute;
        left: 0;
        top: 0;
        width: 80px;
        height: 80px;
        content: '';
        border-left: 1px solid ${theme.colors.HIGHLIGHT.PINK};
      }
    `}
  `}
`
