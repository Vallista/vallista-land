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
  overflow-x: hidden;
  overflow-y: hidden;

  ${({ scrollState }) => css`
    ${scrollState === 'SHOW' &&
    css`
      &:hover > div:last-of-type {
        margin-right: 0px;
      }
    `}

    /* ipad Portrait and Landscape */
  @media only screen and (min-device-width: 768px) and (max-device-width: 1024px) {
      overflow-y: auto;

      ${scrollState === 'SHOW' &&
      css`
        &:hover > div:last-of-type {
          margin-right: 0;
        }
      `}
    }
  `}

  @media screen and (max-width: 1024px) {
    width: 100%;
    height: calc(
      100vh - ${DEFINE_NAVBAR_ITEM_HEIGHT + DEFINE_HEADER_HEIGHT + DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT}px
    );
    left: -${DEFINE_SIDEBAR_WIDTH}px;
    overflow-y: auto;

    & > div:first-of-type {
      left: -${DEFINE_SIDEBAR_WIDTH}px;
    }
  }

  &:hover {
    overflow-y: auto;
  }
`

export const _Padding = styled.div`
  padding: 16px 24px 32px;
`

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
