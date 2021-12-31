import { Container, Tags, Tag } from '@vallista-land/core'
import { useState, VFC } from 'react'

const TogglePlayground: VFC = () => {
  const [tags, setTags] = useState(['One', 'Two', 'Three'])

  return (
    <Container>
      <Container>
        <Tag>Vercel CLI</Tag>
      </Container>
      <Container>
        <Tags>
          {tags.map((tag) => (
            <Tag id={tag} key={tag} onRemove={(id) => setTags(tags.filter((t) => t !== id))}>
              {tag}
            </Tag>
          ))}
        </Tags>
      </Container>
    </Container>
  )
}

export default TogglePlayground
