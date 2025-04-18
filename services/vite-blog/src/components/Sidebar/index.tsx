import { Header } from './Header'
import { SidebarProvider } from './Provider'
import { Contents } from './Contents'
import { SidebarContent } from './types'

export interface SidebarProps {
  contents: SidebarContent[]
}

export const Sidebar = (props: SidebarProps) => {
  return (
    <SidebarProvider>
      <aside>
        <Header count={props.contents.length} />
        <Contents contents={props.contents} />
      </aside>
    </SidebarProvider>
  )
}
