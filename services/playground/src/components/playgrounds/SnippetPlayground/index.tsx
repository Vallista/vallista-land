import { Container, Snippet } from '@vallista/core'
import { VFC } from 'react'

const SnippetPlayground: VFC = () => {
  // const [expanded, setExpanded] = useState(false)

  return (
    <Container>
      <Container>
        <Snippet text='npm init next-app' width='300px' />
      </Container>
      <Container>
        <Snippet text={['npm init next-app', 'cd project', 'now']} width='100%' />
      </Container>
      <Container>
        <Snippet text='npm init next-app' width='300px' dark />
      </Container>
      <Container>
        <Snippet text='npm init next-app' width='300px' prompt={false} />
      </Container>
      <Container>
        <Snippet text='npm init next-app' width='300px' type='success' />
        <Snippet text='npm init next-app' width='300px' type='error' />
        <Snippet text='npm init next-app' width='300px' type='warning' />
        <Snippet text='npm init next-app' width='300px' type='secondary' />
        <Snippet text='npm init next-app' width='300px' type='lite' />
      </Container>
      <Container>
        <Snippet text='npm init next-app' width='300px' type='success' fill />
        <Snippet text='npm init next-app' width='300px' type='error' fill />
        <Snippet text='npm init next-app' width='300px' type='warning' fill />
        <Snippet text='npm init next-app' width='300px' type='secondary' fill />
        <Snippet text='npm init next-app' width='300px' type='lite' fill />
      </Container>
    </Container>
  )
}

export default SnippetPlayground
