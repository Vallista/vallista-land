import styled from '@emotion/styled'
import { DEFINE_HEADER_HEIGHT } from '../utils'
import { DEFINE_SIDEBAR_WIDTH } from '../../Sidebar/utils'

export const _Wrap = styled.div`
  display: flex;
  align-items: center;

  width: ${DEFINE_SIDEBAR_WIDTH}px;
  height: ${DEFINE_HEADER_HEIGHT}px;
  padding: 0 28px;

  border-bottom: 1px solid ${({ theme }) => theme.colors.PRIMARY.ACCENT_2};
  cursor: pointer;

  & > p {
    border-bottom: 3px solid transparent;
    border-top: 3px solid transparent;
    transition: border-bottom 0.2s ease;
  }

  &:hover > p {
    border-bottom: 3px solid ${({ theme }) => theme.colors.HIGHLIGHT.PINK};
  }
`
