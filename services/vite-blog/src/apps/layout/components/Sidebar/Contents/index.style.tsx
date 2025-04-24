import { css } from '@emotion/react'
import styled from '@emotion/styled'
import {
  DEFAULT_IOS_SCROLL_BOTTOM_GAP,
  DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT,
  DEFINE_SIDEBAR_WIDTH
} from '../utils'
import { DEFINE_NAVBAR_ITEM_HEIGHT } from '../../NavBar/utils'
import { DEFINE_HEADER_HEIGHT } from '../../Header/utils'

export const _Wrap = styled.div`
  height: 100%;

  ${({ theme }) => css`
    border-right: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
  `}
`

interface WrapListProps {
  scrollState: 'SHOW' | 'HIDE'
  isIos: boolean
}

const TOP_BLANK = DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT + DEFINE_HEADER_HEIGHT + DEFINE_NAVBAR_ITEM_HEIGHT

export const _ListWrap = styled.div<WrapListProps>`
  box-sizing: border-box;
  width: ${DEFINE_SIDEBAR_WIDTH}px;
  height: calc(100vh - ${DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT}px);
  padding: 16px 24px 0;

  ${({ scrollState }) => css`
    ${scrollState === 'SHOW' &&
    css`
      &:hover > div:last-of-type {
        margin-right: 0;
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
    padding: 16px 16px 32px;
    width: 100%;

    height: calc(
      100vh - ${({ isIos }) => (isIos ? `${TOP_BLANK + DEFAULT_IOS_SCROLL_BOTTOM_GAP}px` : `${TOP_BLANK}px`)}
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
      (var(--vh, 1vh) * 100) -
        ${DEFINE_NAVBAR_ITEM_HEIGHT + DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT + DEFINE_HEADER_HEIGHT}px
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
