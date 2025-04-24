import { useEffect } from 'react'

export const useViewportHeight = () => {
  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setVh()

    // 주소창 나타나고 사라지는 상황에 대응
    window.addEventListener('resize', setVh)
    window.addEventListener('scroll', setVh)
    window.addEventListener('orientationchange', setVh)

    return () => {
      window.removeEventListener('resize', setVh)
      window.removeEventListener('scroll', setVh)
      window.removeEventListener('orientationchange', setVh)
    }
  }, [])
}
