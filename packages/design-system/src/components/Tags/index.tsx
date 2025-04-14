import styled from '@emotion/styled'

import { TagsProps } from './type'

export const Tags = (props: Partial<TagsProps>) => {
  const { children } = props

  return <Container>{children}</Container>
}

const Container = styled.ul`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  list-style: none;
  padding: 0;
  margin: 0;
`
