import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT, DEFINE_SIDEBAR_WIDTH } from '../utils'
import { DEFINE_NAVBAR_ITEM_HEIGHT } from '../../NavBar/utils'
import { DEFINE_HEADER_HEIGHT } from '../../Header/utils'

export const _Wrap = styled.div`
  ${({ theme }) => css`
    border-right: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
  `}
`

interface WrapListProps {
  scrollState: 'SHOW' | 'HIDE'
}

export const _ListWrap = styled.div<WrapListProps>`
  width: ${DEFINE_SIDEBAR_WIDTH}px;
  height: calc(100vh - ${DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT}px);
  padding: 16px 24px 32px;

  ${({ scrollState }) => css`
    ${scrollState === 'SHOW' &&
    css`
      &:hover > div:last-of-type {
        margin-right: 0px;
      }
    `}
  `}

  @media screen and (min-width: 1025px) {
    overflow-x: hidden;
    overflow-y: hidden;

    &:hover {
      overflow-y: auto;
    }
  }

  @media screen and (max-width: 1024px) {
    width: 100%;
    height: calc(
      100vh - ${DEFINE_NAVBAR_ITEM_HEIGHT + DEFINE_HEADER_HEIGHT + DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT}px
    );
    left: -${DEFINE_SIDEBAR_WIDTH}px;
    cursor: pointer;
    overflow-y: scroll;

    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
    overflow-x: hidden;

    & > div:first-of-type {
      left: -${DEFINE_SIDEBAR_WIDTH}px;
    }
  }
`

export const _Padding = styled.div``

export const _MenuWrap = styled.nav`
  width: 100%;
`

export const _HeaderWrap = styled.div`
  display: flex;
  flex-direction: column;

  @media screen and (max-width: 1024px) {
    left: -${DEFINE_SIDEBAR_WIDTH}px;

    & > div:first-of-type {
      left: -${DEFINE_SIDEBAR_WIDTH}px;
    }
  }
`

export const _EmptyWrap = styled.div`
  width: ${DEFINE_SIDEBAR_WIDTH}px;
  height: calc(100vh - ${DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT}px);

  display: flex;
  justify-content: center;
  align-items: center;

  @media screen and (min-width: 1025px) {
    padding-bottom: 120px;
    min-height: 500px;
  }

  @media screen and (max-width: 1024px) {
    width: 100vw;
    height: calc(
      100vh - ${DEFINE_NAVBAR_ITEM_HEIGHT + DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT + DEFINE_HEADER_HEIGHT}px
    );
  }
`

export const _EmptyContents = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
`
