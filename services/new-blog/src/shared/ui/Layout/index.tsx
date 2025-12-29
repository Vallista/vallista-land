import { Container } from '@vallista/design-system'
import { Outlet, useLocation } from 'react-router-dom'
import { useLayoutEffect, useRef, useEffect } from 'react'
import { NavBar } from '@shared/ui/NavBar'
import { Sidebar } from '@shared/ui/Sidebar'
import { Header } from '@shared/ui/Header'
import { useSidebar } from '@shared/context/SidebarContext'
import { useNav } from '@shared/context/NavContext'
import * as Styled from './Layout.css'

export const Layout = () => {
  const { isOpen } = useSidebar()
  const { selectedCategory } = useNav()
  const location = useLocation()
  const previousPathnameRef = useRef<string>('')
  const mainRef = useRef<HTMLElement | null>(null)

  // 페이지 변경 시 스크롤을 최상단으로 이동 (DOM 렌더링 후 최종적으로 실행)
  useLayoutEffect(() => {
    const currentPathname = location.pathname

    // 경로가 변경된 경우에만 스크롤 초기화
    if (previousPathnameRef.current !== currentPathname) {
      previousPathnameRef.current = currentPathname

      const scrollToTop = () => {
        if (mainRef.current) {
          mainRef.current.scrollTo(0, 0)
        } else {
          window.scrollTo(0, 0)
        }
      }

      // 즉시 스크롤
      scrollToTop()
    }
  }, [location.pathname, location.key])

  // DOM 렌더링 완료 후 최종적으로 스크롤 위치 확인
  useEffect(() => {
    const scrollToTop = () => {
      if (mainRef.current) {
        mainRef.current.scrollTo(0, 0)
      } else {
        window.scrollTo(0, 0)
      }
    }

    // 여러 타이밍에서 스크롤을 보장하여 모든 렌더링이 완료된 후에도 확실하게 처리
    const timeout1 = setTimeout(scrollToTop, 0)
    const timeout2 = setTimeout(scrollToTop, 50)
    const timeout3 = setTimeout(scrollToTop, 100)
    const timeout4 = setTimeout(scrollToTop, 200)
    const timeout5 = setTimeout(scrollToTop, 300)

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
      clearTimeout(timeout4)
      clearTimeout(timeout5)
    }
  }, [location.pathname, location.key])

  return (
    <div className={Styled.wrapper}>
      <Container>
        <NavBar />
        <Sidebar selectedCategory={selectedCategory} />
        <Header />
        <main ref={mainRef} className={`${isOpen ? Styled.main : Styled.mainFolded} ${Styled.container}`}>
          <article className={Styled.article} role='main' aria-label='Main content'>
            <Outlet />
          </article>
        </main>
      </Container>
    </div>
  )
}
