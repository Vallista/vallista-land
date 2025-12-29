import { MouseEvent } from 'react'
import { showMoreButton, showMoreContainer, showMoreLine, showMoreSvg, showMoreSvgExpanded } from './ShowMore.css'

interface ShowMoreProps {
  expanded: boolean
  onClick: (() => void) | ((e: MouseEvent<HTMLButtonElement>) => void)
}

/**
 * # ShowMore
 *
 * 더 보기를 구현할 때 이걸로 구현하세요.
 *
 * @param {ShowMoreProps} {@link ShowMoreProps}
 *
 * @example ```tsx
 * const [expanded, setExpanded] = useState(false)
 *
 * <ShowMore expanded={expanded} onClick={() => setExpanded(!expanded)} />
 * ```
 *
 */
export const ShowMore = (props: ShowMoreProps) => {
  const { expanded, onClick } = props

  return (
    <div className={showMoreContainer}>
      <div className={showMoreLine} />
      <button className={showMoreButton} onClick={onClick}>
        {expanded ? 'SHOW LESS' : 'SHOW MORE'}
        <svg
          className={`${showMoreSvg} ${expanded ? showMoreSvgExpanded : ''}`}
          viewBox='0 0 24 24'
          width='18'
          height='18'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
          shapeRendering='geometricPrecision'
        >
          <path d='M6 9l6 6 6-6' />
        </svg>
      </button>
      <div className={showMoreLine} />
    </div>
  )
}
