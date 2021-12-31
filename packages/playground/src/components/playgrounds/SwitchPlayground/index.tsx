import { Container, Switch, SwitchItem } from '@vallista-land/core'
import { useState, VFC } from 'react'

const items: SwitchItem[] = [
  {
    name: 'Item1',
    value: 'item1',
    width: 80
  },
  {
    name: 'Item2',
    value: 'item2',
    width: 80
  }
]
const SwitchPlayground: VFC = () => {
  const [active, setActive] = useState('item1')
  const [active2, setActive2] = useState('item1')

  return (
    <Container>
      <p>Default</p>
      <Container row>
        <Switch active={active} onChange={(value) => setActive(value)} items={items} />
        <Switch
          active={active2}
          onChange={(value) => setActive2(value)}
          items={[
            ...items,
            {
              name: 'Item3',
              value: 'item3',
              width: 80
            }
          ]}
        />
      </Container>
      <p>Sizes</p>
      <Container row>
        <Switch active={active} onChange={(value) => setActive(value)} items={items} size='small' />
        <Switch active={active} onChange={(value) => setActive(value)} items={items} size='middle' />
        <Switch active={active} onChange={(value) => setActive(value)} items={items} size='large' />
      </Container>
      <p>Disabled</p>
      <Container row>
        <Switch
          active={active}
          onChange={(value) => setActive(value)}
          items={[
            {
              name: 'Item1',
              value: 'item1',
              width: 80
            },
            {
              name: 'Item2',
              value: 'item2',
              width: 80,
              disabled: true
            }
          ]}
        />
      </Container>
    </Container>
  )
}

export default SwitchPlayground
