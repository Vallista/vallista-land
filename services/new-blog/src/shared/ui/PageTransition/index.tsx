import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import * as styles from './PageTransition.css.ts'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    const timer = setTimeout(() => {
      setIsTransitioning(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [location.pathname])

  return <div className={`${styles.container} ${isTransitioning ? styles.transitioning : ''}`}>{children}</div>
}
