/** dark mode 인지 여부 */
export function isDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** 브라우저 혹은 운영체제의 모드 환경에 따라 이벤트를 받습니다. */
export function onChangeThemeEvent(func: (theme: 'DARK' | 'LIGHT') => void): void {
  if (typeof window === 'undefined') return
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    func(event.matches ? 'DARK' : 'LIGHT')
  })
}
