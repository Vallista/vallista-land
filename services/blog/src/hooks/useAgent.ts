import { useEffect, useState } from 'react'

export const useAgent = () => {
  const [agent, setAgent] = useState({
    isIOS: false,
    isMobile: false,
    isTablet: false,
    isDesktop: false
  })

  useEffect(() => {
    const ua = navigator.userAgent
    const platform = navigator.platform
    const maxTouchPoints = navigator.maxTouchPoints || 0

    const isAppleDevice = /iPad|iPhone|iPod/.test(ua)
    const isModerniPad = platform === 'MacIntel' && maxTouchPoints > 1
    const isIOS = isAppleDevice || isModerniPad

    const width = window.innerWidth
    setAgent({
      isIOS,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024
    })
  }, [])

  return agent
}
