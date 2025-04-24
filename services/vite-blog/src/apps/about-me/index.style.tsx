import { DEFINE_CONTENTS_HEADER_PADDING_TOP, DEFINE_CONTENTS_WIDTH } from '@/utils/constant'

import styled from '@emotion/styled'
import { DEFINE_HEADER_HEIGHT } from '../layout/components/Header/utils'

export const Header = styled.header`
  margin-top: ${DEFINE_HEADER_HEIGHT + DEFINE_CONTENTS_HEADER_PADDING_TOP}px;
  width: ${DEFINE_CONTENTS_WIDTH}px;

  @media screen and (max-width: 1024px) {
    width: 100vw;
  }
`

export const Wrapper = styled.div`
  max-width: 550px;
  margin: 0 auto;
  padding: 28px;
`

export const Title = styled.div`
  margin-bottom: 3rem;

  & > span,
  & > h1 {
    position: relative;
    line-height: 1.4;
    letter-spacing: -1px;
  }

  @media screen and (max-width: 1024px) {
    margin-bottom: 2rem;

    & span,
    & h1 {
      font-size: 2rem;
    }
  }
`

export const SubTitle = styled.div`
  margin-bottom: 2rem;

  @media screen and (max-width: 1024px) {
    & p {
      font-size: 1rem;
    }

    & strong,
    & span {
      font-size: 1rem;
    }
  }
`
