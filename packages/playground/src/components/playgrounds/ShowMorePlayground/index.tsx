import { Container, ShowMore } from '@vallista-land/core'
import { useState, VFC } from 'react'

const TogglePlayground: VFC = () => {
  const [expanded, setExpanded] = useState(false)

  return (
    <Container>
      <ShowMore expanded={expanded} onClick={() => setExpanded(!expanded)} />
    </Container>
  )
}

export default TogglePlayground
