import styled from '@emotion/styled'
import { Spinner } from '@vallista/core'
import { VFC } from 'react'

const SpinnerPlayground: VFC = () => {
  return (
    <TemporaryContainer>
      <Spinner />
      <Spinner size={50} />
    </TemporaryContainer>
  )
}

const TemporaryContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin: 32px 0;
  padding: 0 8px;
`

export default SpinnerPlayground
