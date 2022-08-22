import { Container, LoadingDots } from '@vallista/core'
import { VFC } from 'react'

const ProgressPlayground: VFC = () => {
  return (
    <Container>
      <LoadingDots size={2} />
      <LoadingDots size={4} />
      <LoadingDots size={4}>로딩..</LoadingDots>
    </Container>
  )
}

export default ProgressPlayground
