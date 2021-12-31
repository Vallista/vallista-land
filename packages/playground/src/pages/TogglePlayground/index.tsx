import { Container, Toggle } from 'core'
import { VFC } from 'react'

const TogglePlayground: VFC = () => {
  return (
    <Container row>
      <Container center>
        <Toggle />
      </Container>
      <Container center>
        <Toggle size='medium' />
      </Container>
      <Container center>
        <Toggle size='large' />
      </Container>
      <Container center>
        <Toggle disabled />
      </Container>
      <Container center>
        <Toggle disabled size='medium' />
      </Container>
      <Container center>
        <Toggle disabled size='large' />
      </Container>
    </Container>
  )
}

export default TogglePlayground
