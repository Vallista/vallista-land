import { Container, Activity, Icon, Text } from 'core'
import { VFC } from 'react'

const IconPlayground: VFC = () => {
  return (
    <Container>
      <Container row>
        <Activity />
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
