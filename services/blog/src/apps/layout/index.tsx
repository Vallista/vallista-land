import { Container } from '@vallista/design-system'

import { NavBar } from './components/NavBar'
import * as Styled from './index.style'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { Outlet } from 'react-router-dom'
import { useLayout } from './useLayout'

export const Layout = () => {
  const { contents, fold } = useLayout()

  return (
    <div className={Styled.wrapper}>
      <Container>
        <NavBar />
        <Sidebar contents={contents} />
        <Header />
        <main className={fold ? Styled.mainFolded : Styled.main}>
          <article className={Styled.article} role='main' aria-label='Main content'>
            <Outlet />
          </article>
          <Footer />
        </main>
      </Container>
    </div>
  )
}
