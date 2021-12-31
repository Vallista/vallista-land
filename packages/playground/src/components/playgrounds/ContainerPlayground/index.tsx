import { Container, Text } from '@vallista-land/core'
import { VFC } from 'react'

import { BlueContainer } from '../../../components/BlueContainer'

const ContainerPlayground: VFC = () => {
  return (
    <Container>
      <Container row>
        <BlueContainer flex={2} style={{ height: 100 }}>
          <Text as='small'>Container</Text>
        </BlueContainer>
        <BlueContainer style={{ alignSelf: 'flex-start' }}>
          <Text as='small'>Container</Text>
        </BlueContainer>
        <BlueContainer style={{ alignSelf: 'center' }}>
          <Text as='small'>Container</Text>
        </BlueContainer>
        <BlueContainer style={{ alignSelf: 'flex-end' }}>
          <Text as='small'>Container</Text>
        </BlueContainer>
      </Container>
      <Container>
        <BlueContainer center>
          <Text as='small'>Container</Text>
        </BlueContainer>
        <BlueContainer style={{ alignSelf: 'flex-start' }}>
          <Text as='small'>Container</Text>
        </BlueContainer>
        <BlueContainer style={{ alignSelf: 'center' }}>
          <Text as='small'>Container</Text>
        </BlueContainer>
        <BlueContainer style={{ alignSelf: 'flex-end' }}>
          <Text as='small'>Container</Text>
        </BlueContainer>
      </Container>
    </Container>
  )
}

export default ContainerPlayground
