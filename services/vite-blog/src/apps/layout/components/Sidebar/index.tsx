import { SidebarProvider } from './Provider'
import { Contents } from './Contents'
import { SidebarContent } from './types'
import * as Styled from './index.style'
import { useSidebar } from './useSidebar'

export interface SidebarProps {
  contents: SidebarContent[]
}

export const Sidebar = (props: SidebarProps) => {
  const { visible, fold } = useSidebar()

  return (
    <SidebarProvider>
      <Styled._Wrap fold={fold} visible={visible}>
        <Contents count={props.contents.length} contents={props.contents} />
      </Styled._Wrap>
    </SidebarProvider>
  )
}
