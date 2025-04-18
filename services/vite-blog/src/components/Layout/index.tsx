import { Container } from '@vallista/design-system'

import { NavBar } from '../NavBar'
import * as Styled from './Layout.style'
import { Sidebar } from '../Sidebar'
import { Header } from '../Header'
import { Footer } from '../Footer'
import { Outlet } from 'react-router'
import { useLayout } from './useLayout'

export const Layout = () => {
  const { contents, fold } = useLayout()

  return (
    <Styled._Wrapper>
      <Container>
        <NavBar />
        <Sidebar contents={contents} />
        <Header />
        <Styled._Main fold={fold}>
          <Styled._Article>
            <Outlet />
          </Styled._Article>
          <Footer />
        </Styled._Main>
      </Container>
    </Styled._Wrapper>
  )
}
