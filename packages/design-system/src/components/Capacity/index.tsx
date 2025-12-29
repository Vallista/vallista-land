import { CapacityProps } from './type'
import { capacity, capacityProgress, capacityProgressColor } from './Capacity.css'

/**
 * # Capacity
 * 
 * 작은 게이지를 만들때 쓰입니다.
 * 
 * @param {CapacityProps} {@link CapacityProps} 기본적인 프롭
 * 
 * @example ```tsx
  <Capacity value={10} />
  <Capacity value={20} />
  <Capacity value={30} />
  <Capacity value={40} />
  <Capacity value={50} />
  <Capacity value={60} />
  <Capacity value={70} />
  <Capacity value={80} />
  <Capacity value={90} />
  <Capacity value={100} />
 * ```
 */
export const Capacity = (props: Partial<CapacityProps>) => {
  const { width = 100, value = 0, color = 'primary', ...otherProps } = props

  const colorVariant = color === 'low' ? 'success' : color === 'medium' ? 'warning' : 'error'
  const validWidth = (width as 50 | 100 | 150 | 200 | 250 | 300) || 100

  return (
    <div className={capacity({ width: validWidth })} {...otherProps}>
      <div className={`${capacityProgress} ${capacityProgressColor[colorVariant]}`} style={{ width: `${value}%` }} />
    </div>
  )
}
