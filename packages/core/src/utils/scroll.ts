export function disableScroll(): void {
  // document.body.style.height: 100%;
  document.body.style.overflow = 'hidden'
}

export function enableScroll(): void {
  document.body.style.overflow = ''
}
