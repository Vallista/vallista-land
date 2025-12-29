import { X } from '../Icon/assets'
import { TagProps } from './type'
import { useTag } from './useTag'
import { tagWrapper, tagContent, tagContentWithRemove, tagRemoveButton } from './Tag.css'

export const Tag = (props: Partial<TagProps>) => {
  const { children, onRemove, id, ...otherProps } = useTag(props)

  return (
    <li className={tagWrapper()}>
      <div className={`${tagContent} ${otherProps.hasRemove ? tagContentWithRemove : ''}`}>{children}</div>
      {otherProps.hasRemove && (
        <button
          className={tagRemoveButton}
          onClick={() => {
            if (id) {
              onRemove?.(id)
            }
          }}
        >
          <X size={16} />
        </button>
      )}
    </li>
  )
}
