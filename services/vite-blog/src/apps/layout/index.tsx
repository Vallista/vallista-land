import { Container } from '@vallista/design-system'

import { NavBar } from './components/NavBar'
import * as Styled from './index.style'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
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
