import { Button, Container, Text } from '@vallista/design-system'
import { useNavigate } from 'react-router'

import * as Styled from './about-me.style'
import { ListTable } from '../components/ListTable'
import Seo from '../components/Seo'

const Page = () => {
  const navigate = useNavigate()

  const moveToLocation = (target: string) => {
    navigate(target)
  }

  return (
    <Container>
      <Seo name='홈' />
      <Styled.Header>
        <Styled.Wrapper>
          <Styled.Title>
            <Text as='span' size={48} weight={800}>
              어서오세요!
            </Text>
            <Text as='h1' size={48} weight={800} lineHeight={56}>
              저는 마광휘입니다.
            </Text>
          </Styled.Title>
          <Styled.SubTitle>
            <Text as='p' size={20} weight={400} lineHeight={40}>
              대한민국 서울에서 <strong>소프트웨어 엔지니어</strong>로 일하고 있어요. 한 분야에 국한되지 않는 여러
              문제를 해결하는 것에 즐거움을 느낍니다. 공부하고 느낀점을 위주로 블로그에 글을 작성하고 있어요. 최근에는
              프론트엔드 문제 해결에 관심이 많아, 많은 시간을 쏟고 있어요. 러스트를 기반으로한 웹 생태계가 기대돼요!
            </Text>
          </Styled.SubTitle>
          <Button size='large' color='alert' onClick={() => moveToLocation('/posts')}>
            <Text size={16} weight={800}>
              블로그 글 보러갈까요?
            </Text>
          </Button>
        </Styled.Wrapper>
      </Styled.Header>
      <Styled.Contents>
        <ListTable title='최근 글' list={[]} />
      </Styled.Contents>
    </Container>
  )
}

export default Page
