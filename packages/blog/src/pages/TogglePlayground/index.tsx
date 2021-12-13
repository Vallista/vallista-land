import { Container, Toggle } from 'core'
import { VFC } from 'react'

export const TogglePlayground: VFC = () => {
  return (
    <Container row>
      <Toggle />
      <Toggle size='medium' />
      <Toggle size='large' />
    </Container>
  )
}
