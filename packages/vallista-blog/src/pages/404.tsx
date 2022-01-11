import styled from '@emotion/styled'
import { Image, Spacer, Text } from '@vallista-land/core'
import { Link } from 'gatsby'
import { VFC } from 'react'

import FailureImage from '../assets/images/failure.gif'

// markup
const NotFoundPage: VFC = () => {
  return (
    <Center>
      <Image src={FailureImage as string} width={400} height={400} />
      <Text size={16}>페이지를 찾지 못했어요 :(</Text>
      <Spacer y={0.5} />
      <Link to='/'>
        <Text size={16}>홈으로 가기</Text>
      </Link>
    </Center>
  )
}

const Center = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default NotFoundPage
