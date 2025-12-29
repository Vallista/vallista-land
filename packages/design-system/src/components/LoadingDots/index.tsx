import { LoadingDotsProps } from './type'
import { useLoadingDots } from './useLoadingDots'
import { loadingDotsChildrenContainer, loadingDotsContainer, loadingDotsDot } from './LoadingDots.css'

export const LoadingDots = (props: Partial<LoadingDotsProps>) => {
  const { size, children } = useLoadingDots(props)

  return (
    <span className={loadingDotsContainer} style={{ '--loading-dots-size': `${size}px` } as React.CSSProperties}>
      {children && <div className={loadingDotsChildrenContainer}>{children}</div>}
      <span className={loadingDotsDot} />
      <span className={loadingDotsDot} />
      <span className={loadingDotsDot} />
    </span>
  )
}
