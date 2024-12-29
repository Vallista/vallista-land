import { Container, Capacity } from '@vallista/core'
import { VFC } from 'react'

const CapacityPlayground: VFC = () => {
  return (
    <Container>
      <Capacity value={10} />
      <Capacity value={20} />
      <Capacity value={30} />
      <Capacity value={40} />
      <Capacity value={50} />
      <Capacity value={60} />
      <Capacity value={70} />
      <Capacity value={80} />
      <Capacity value={90} />
      <Capacity value={100} />
    </Container>
  )
}

export default CapacityPlayground
