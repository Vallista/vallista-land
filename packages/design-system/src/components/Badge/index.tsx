import { BadgeProps } from './type'
import { badge } from './Badge.css'

/**
 * # Badge
 * 
 * 뱃지 컴포넌트입니다.
 * 
 * @param {BadgeProps} {@link BadgeProps} 기본적인 프롭
 * 
 * @example ```tsx
    <Badge type='primary' outline>
      150
    </Badge>
    <Badge type='secondary' contrast>
      150
    </Badge>
    <Badge type='success' contrast>
      150
    </Badge>
    <Badge type='warning' contrast>
      150
    </Badge>
    <Badge type='error' contrast>
      150
    </Badge>
    <Badge type='violet' contrast>
      150
    </Badge>
 * ```
 */
export const Badge = (props: Partial<BadgeProps>) => {
  const { size = 'normal', type = 'primary', variant = 'primary', children, ...otherProps } = props

  const badgeClass = badge({
    size,
    type,
    ...(variant === 'outline' && { outline: type }),
    ...(variant === 'contrast' && { contrast: type })
  })

  return (
    <span className={badgeClass} {...otherProps}>
      {children}
    </span>
  )
}
