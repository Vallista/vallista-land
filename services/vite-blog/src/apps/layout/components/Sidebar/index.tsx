import { SidebarProvider } from './Provider'
import { Contents } from './Contents'
import { SidebarContent } from './types'
import * as Styled from './index.style'
import { useSidebar } from './useSidebar'
import { useEffect } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export interface SidebarProps {
  contents: SidebarContent[]
}

export const Sidebar = (props: SidebarProps) => {
  const { visible, fold } = useSidebar()
  const isTabletOrSmaller = useMediaQuery('(max-width: 1024px)')

  useEffect(() => {
    if (visible && isTabletOrSmaller) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [visible, isTabletOrSmaller])

  return (
    <SidebarProvider>
      <Styled._Wrap fold={fold} visible={visible}>
        <Contents count={props.contents.length} contents={props.contents} />
      </Styled._Wrap>
    </SidebarProvider>
  )
}
