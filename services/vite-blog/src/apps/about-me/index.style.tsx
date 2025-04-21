import { DEFINE_CONTENTS_HEADER_PADDING_TOP, DEFINE_CONTENTS_WIDTH } from '@/utils/constant'

import styled from '@emotion/styled'
import { DEFINE_HEADER_HEIGHT } from '../layout/components/Header/utils'

export const Wrapper = styled.div`
  padding: 28px;
`

export const Header = styled.header`
  margin-top: ${DEFINE_HEADER_HEIGHT + DEFINE_CONTENTS_HEADER_PADDING_TOP}px;
  width: ${DEFINE_CONTENTS_WIDTH}px;
`

export const Title = styled.div`
  margin-bottom: 3rem;

  & > span,
  & > h1 {
    position: relative;
    line-height: 1.4;
    letter-spacing: -1px;
  }
`

export const SubTitle = styled.div`
  max-width: 550px;
  margin-bottom: 2rem;
`
