import { TagsProps } from './type'
import { tagsContainer } from './Tags.css'

/**
 * # Tags
 *
 * 여러 Tag 컴포넌트를 그룹화하는 컨테이너 컴포넌트입니다.
 *
 * @param {TagsProps} {@link TagsProps} 기본적인 Tags Props
 *
 * @example ```tsx
 * <Tags gap={3} justifyContent="center">
 *   <Tag>React</Tag>
 *   <Tag>TypeScript</Tag>
 *   <Tag>Next.js</Tag>
 * </Tags>
 * ```
 */
export const Tags = (props: Partial<TagsProps>) => {
  const {
    children,
    gap = 2,
    justifyContent = 'flex-start',
    alignItems = 'center',
    maxWidth,
    minHeight,
    ...rest
  } = props

  return (
    <ul
      className={tagsContainer({ gap, justifyContent, alignItems })}
      style={{
        maxWidth,
        minHeight,
        ...rest
      }}
    >
      {children}
    </ul>
  )
}
