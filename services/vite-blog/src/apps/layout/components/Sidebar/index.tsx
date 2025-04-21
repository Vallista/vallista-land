import { SidebarProvider } from './Provider'
import { Contents } from './Contents'
import { SidebarContent } from './types'
import * as Styled from './index.style'
import { useGlobalProvider } from '@/context/useProvider'

export interface SidebarProps {
  contents: SidebarContent[]
}

export const Sidebar = (props: SidebarProps) => {
  const { state } = useGlobalProvider()

  return (
    <SidebarProvider>
      <Styled._Wrap fold={state.fold}>
        <Contents count={props.contents.length} contents={props.contents} />
      </Styled._Wrap>
    </SidebarProvider>
  )
}
