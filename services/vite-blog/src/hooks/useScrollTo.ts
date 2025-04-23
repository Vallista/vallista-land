export const useScrollTo = () => {
  const scrollToTop = (smooth = true) => {
    // MEMO: 스크롤을 최상단으로 이동
    document.getElementsByTagName('main')[0].scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'instant'
    })

    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'instant'
    })
  }

  const scrollTo = (top: number, smooth = true) => {
    // MEMO: 스크롤을 최상단으로 이동
    document.getElementsByTagName('main')[0].scrollTo({
      top,
      behavior: smooth ? 'smooth' : 'instant'
    })

    window.scrollTo({
      top,
      behavior: smooth ? 'smooth' : 'instant'
    })
  }

  return { scrollTo, scrollToTop }
}
