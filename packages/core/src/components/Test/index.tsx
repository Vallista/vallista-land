import styled from '@emotion/styled'
import React from 'react'

const Wrapper = styled.div`
  width: 200px;
  height: 200px;
  border-radius: 200px;
  background-color: ${({ theme }) => theme.colors.HIGHLIGHT.PINK};
`

export const HelloWorld: React.VFC = () => {
  return <Wrapper></Wrapper>
}
