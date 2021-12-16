import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { VFC } from 'react'

import { NeedTabsProps } from './type'
import { useTabs } from './useTabs'

/**
 *
 */
export const Tabs: VFC<NeedTabsProps> = (props) => {
  const { selected, setSelected, tabs, disabled } = useTabs(props)

  return (
    <Container>
      {tabs.map((it) => (
        <Tab active={isActive(it.value)} onClick={() => handleSelect(it.value)} disabled={disabled}>
          <TabContents active={isActive(it.value)} disabled={disabled}>
            {it.icon && <IconWrapper>{it.icon}</IconWrapper>}
            {it.title}
          </TabContents>
        </Tab>
      ))}
    </Container>
  )

  function isActive(target: string): boolean {
    return selected === target
  }

  function handleSelect(target: string): void {
    if (disabled) return

    setSelected(target)
  }
}

const Container = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  padding-bottom: 1px;
  overflow-x: auto;
  ${({ theme }) => css`
    box-shadow: 0 -1px 0 ${theme.colors.PRIMARY.ACCENT_2} inset;
  `}

  &, & > * {
    gap: 0 !important;
  }
`

const Tab = styled.div<{ active: boolean; disabled?: boolean }>`
  ${({ theme, disabled }) => css`
    cursor: pointer;
    padding: 0 12px;
    margin-bottom: -1px;
    border-bottom: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    outline: 0;

    &:first-of-type {
      padding-left: 12px;
    }

    ${disabled &&
    css`
      cursor: not-allowed;
    `}
  `}
`

const TabContents = styled.div<{ active: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  padding: 6px 2px;
  margin-bottom: -1px;
  ${({ theme, active }) => css`
    color: ${theme.colors.PRIMARY.ACCENT_4};
    border-bottom: 1px solid transparent;

    ${active &&
    css`
      border-bottom: 2px solid ${theme.colors.PRIMARY.FOREGROUND};
      color: ${theme.colors.PRIMARY.FOREGROUND};
    `}
  `}
`

const IconWrapper = styled.div`
  margin-right: 6px;
  margin-bottom: -3px;

  & > svg {
    width: 14px !important;
    height: 14px !important;
  }
`
