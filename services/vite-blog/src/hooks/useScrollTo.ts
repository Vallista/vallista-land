export const useScrollTo = () => {
  const scrollToTop = (smooth: boolean = true) => {
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

  return { scrollToTop }
}
