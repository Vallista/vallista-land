import { Container, Icon, Text } from '@vallista-land/core'
import { VFC } from 'react'

const IconPlayground: VFC = () => {
  return (
    <Container>
      <Container row>
        <Icon.Bell />
        <Text>
          align top
          <Icon.Aperture align='top' />
        </Text>
        <Text>
          align middle
          <Icon.Aperture align='middle' />
        </Text>
        <Text>
          align bottom
          <Icon.Aperture align='bottom' />
        </Text>
      </Container>
    </Container>
  )
}

export default IconPlayground
