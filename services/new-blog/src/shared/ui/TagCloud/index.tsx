import { Text } from '@vallista/design-system'

import * as styles from './TagCloud.css'

interface TagCloudProps {
  tags: Array<{
    name: string
    count: number
  }>
  selectedTags: string[]
  onTagClick: (tag: string) => void
  maxTags?: number
}

export function TagCloud({ tags, selectedTags, onTagClick, maxTags = 20 }: TagCloudProps) {
  const sortedTags = tags.sort((a, b) => b.count - a.count).slice(0, maxTags)

  const maxCount = Math.max(...sortedTags.map((tag) => tag.count))
  const minCount = Math.min(...sortedTags.map((tag) => tag.count))

  const getTagSize = (count: number) => {
    if (maxCount === minCount) return 1
    const normalized = (count - minCount) / (maxCount - minCount)
    return 0.8 + normalized * 0.6 // 0.8 ~ 1.4 사이의 크기
  }

  return (
    <div className={styles.container}>
      <Text size={20} weight={600}>
        인기 태그
      </Text>
      <div className={styles.tagGrid}>
        {sortedTags.map((tag) => {
          const isSelected = selectedTags.includes(tag.name)
          const size = getTagSize(tag.count)

          return (
            <button
              key={tag.name}
              className={`${styles.tagButton} ${isSelected ? styles.selected : ''}`}
              onClick={() => onTagClick(tag.name)}
              style={
                {
                  '--tag-size': `${size}rem`
                } as React.CSSProperties
              }
            >
              <Text size={14} weight={isSelected ? 600 : 500}>
                {tag.name}
              </Text>
              <span className={styles.count}>{tag.count}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
