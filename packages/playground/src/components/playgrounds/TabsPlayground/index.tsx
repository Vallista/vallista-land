import { Container, Tabs, Text, Icon } from '@vallista-land/core'
import { useState, VFC } from 'react'

const TogglePlayground: VFC = () => {
  const [selected, setSelected] = useState('hello')
  const [selected2, setSelected2] = useState('hello')
  const [selected3, setSelected3] = useState('hello')

  return (
    <Container>
      <Container>
        <Tabs
          tabs={[
            {
              title: 'Hello',
              value: 'hello'
            },
            {
              title: 'World',
              value: 'world'
            }
          ]}
          selected={selected}
          setSelected={setSelected}
        />
        <Text>{selected}</Text>
      </Container>
      <Container>
        <Tabs
          tabs={[
            {
              title: 'Hello',
              value: 'hello'
            },
            {
              title: 'World',
              value: 'world'
            }
          ]}
          selected={selected2}
          setSelected={setSelected2}
          disabled
        />
      </Container>
      <Text>{selected2}</Text>
      <Container>
        <Tabs
          tabs={[
            {
              title: 'Hello',
              value: 'hello',
              icon: <Icon.Activity />
            },
            {
              title: 'World',
              value: 'world',
              icon: <Icon.Airplay />
            }
          ]}
          selected={selected3}
          setSelected={setSelected3}
        />
      </Container>
      <Text>{selected3}</Text>
    </Container>
  )
}

export default TogglePlayground
