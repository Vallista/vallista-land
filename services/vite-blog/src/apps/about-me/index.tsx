import { Colors, Container, Text } from '@vallista/design-system'

import * as Styled from './index.style'
import Seo from '../layout/components/Seo'
import { useEffect } from 'react'
import { useScrollTo } from '@/hooks/useScrollTo'

const Page = () => {
  const { scrollToTop } = useScrollTo()

  useEffect(() => {
    scrollToTop(false)
  }, [])

  return (
    <Container>
      <Seo name='홈' pathname='' siteUrl='' />
      <Styled.Header>
        <Styled.Wrapper>
          <Styled.Title>
            <Text as='span' size={48} weight={800}>
              안녕하세요.
            </Text>
            <Text as='h1' size={48} weight={800} lineHeight={56}>
              저는{' '}
              <Text as='span' size={48} weight={800} lineHeight={56} color={Colors.HIGHLIGHT.PINK}>
                마광휘
              </Text>
              입니다.
            </Text>
          </Styled.Title>
          <Styled.SubTitle>
            <Text as='p' size={20} weight={400} lineHeight={32}>
              대한민국 서울, 잠실의 우아한형제들에서{' '}
              <Text as='span' weight={700} size={20}>
                시니어 소프트웨어 엔지니어
              </Text>
              로 일하고 있어요. 한 분야에 국한되지 않는 여러 문제를 해결하는 것에 즐거움을 느낍니다.
              <br />
              <br />
              최근에는 프론트엔드에 집중해서 소프트웨어 엔지니어링을 기반으로 의사결정을 하고 있고 매니징을 함께
              진행하면서 여러명의 엔지니어와 함께 빠른 가치를 만들어 나아가고 있습니다.
              <br />
              <br />
              블로그는 아티클, 노트, 프로젝트의 세 가지를 분리해서 글을 작성하고 있습니다. 아티클은 기술에 대한 리뷰
              혹은 생각을 정제하여 포스팅합니다. 노트는 제 개인적인 생각을 다룹니다. 마지막으로 프로젝트는 지금까지
              회사에서 진행했던 프로젝트를 이야기합니다.
              <br />
              <br />
              아래의 링크를 통해 사이트맵을 돌아보실 수 있고, 관련 사이트를 확인하실 수 있고, 왼쪽의 메뉴를 통해 다른
              카테고리를 탐색하거나 GitHub, 페이스북을 가실 수 있고 다른 글을 보실 수 있어요.
            </Text>
          </Styled.SubTitle>
        </Styled.Wrapper>
      </Styled.Header>
    </Container>
  )
}

export default Page
