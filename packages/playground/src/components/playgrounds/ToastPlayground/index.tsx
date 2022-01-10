import { Button, Container, useToasts } from '@vallista-land/core'
import { VFC } from 'react'

const TogglePlayground: VFC = () => {
  const { message } = useToasts()

  return (
    <Container row>
      <Container center>
        <Button onClick={() => message({ text: 'Hello' })}>Toast 출력!</Button>
      </Container>
    </Container>
  )
}

export default TogglePlayground
