export const useAgent = () => {
  const isIOS = () => {
    if (typeof navigator === 'undefined') return false

    const ua = navigator.userAgent
    const platform = navigator.platform
    const maxTouchPoints = navigator.maxTouchPoints || 0

    const isAppleDevice = /iPad|iPhone|iPod/.test(ua)
    const isModerniPad = platform === 'MacIntel' && maxTouchPoints > 1 // iPadOS 13+

    return isAppleDevice || isModerniPad
  }

  return {
    isIOS: isIOS(),
    isMobile: window.innerWidth < 768,
    isDesktop: window.innerWidth >= 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024
  }
}
