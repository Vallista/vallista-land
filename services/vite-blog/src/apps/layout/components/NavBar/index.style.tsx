import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { DEFINE_NAVBAR_ITEM_HEIGHT, DEFINE_NAVBAR_ITEM_WIDTH, DEFINE_NAVBAR_WIDTH } from './utils'
import { DEFINE_HEADER_HEIGHT } from '../Header/utils'
import { DEFINE_ICON_SIZE } from '@/utils/constant'

export const _Container = styled.aside`
  position: fixed;
  top: ${DEFINE_HEADER_HEIGHT}px;
  left: 0;
  width: ${DEFINE_NAVBAR_WIDTH}px;

  ${({ theme }) => css`
    border-right: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    z-index: ${theme.layers.AFTER_STANDARD + 1};
  `}

  @media screen and (min-width: 1025px) {
    min-width: ${DEFINE_NAVBAR_WIDTH}px;
    height: 100vh;
  }

  @media screen and (max-width: 1024px) {
    top: 43px;
    min-height: ${DEFINE_NAVBAR_WIDTH}px;
    width: 100vw;
    overflow-y: hidden;
    overflow-x: auto;

    /** 파이어폭스 스크롤 대응 */
    scrollbar-width: 8px;
    // thumb background 순
    scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-background);

    /** 사파리 크롬 스크롤 대응 */
    &::-webkit-scrollbar {
      background: var(--scrollbar-background);
      height: 8px;
      width: 8px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--scrollbar-thumb);
      border-radius: 0;
    }
  }
`

export const _Section = styled.section`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: calc(100vh - ${DEFINE_HEADER_HEIGHT}px);

  @media screen and (min-width: 1025px) {
    flex-direction: column;
  }

  @media screen and (max-width: 1024px) {
    flex-direction: row;
  }
`

export const _Wrapper = styled.nav`
  display: flex;
  flex-direction: column;

  &:last-of-type {
    justify-content: flex-end;
  }

  @media screen and (max-width: 1024px) {
    flex-direction: row;
  }
`

export const _Category = styled.a<{ checked?: boolean }>`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  width: ${DEFINE_NAVBAR_ITEM_WIDTH}px;
  height: ${DEFINE_NAVBAR_ITEM_HEIGHT}px;
  cursor: pointer;
  transition: background 0.2s ease;

  & > svg {
    width: ${DEFINE_ICON_SIZE}px;
    height: ${DEFINE_ICON_SIZE}px;
  }

  @media screen and (max-width: 1024px) {
    width: ${DEFINE_NAVBAR_ITEM_WIDTH}px;
    height: ${DEFINE_NAVBAR_ITEM_WIDTH}px;

    & > figure {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      overflow: hidden;
    }

    & > svg {
      width: ${DEFINE_ICON_SIZE}px;
      height: ${DEFINE_ICON_SIZE}px;
    }
  }

  & > div {
    width: inherit;
    height: inherit;
  }

  ${({ theme, checked }) => css`
    & > div > div:first-of-type {
      width: inherit;
      height: inherit;
      display: flex;
      justify-content: center;
      align-items: center;
      color: ${theme.colors.PRIMARY.FOREGROUND};
    }

    &:hover {
      background: ${theme.colors.PRIMARY.ACCENT_3};
    }

    &:hover > div > div:first-of-type {
      color: ${theme.colors.PRIMARY.BACKGROUND};
    }

    ${checked &&
    css`
      &:before {
        position: absolute;
        left: 0;
        top: 0;
        width: ${DEFINE_NAVBAR_ITEM_WIDTH}px;
        height: ${DEFINE_NAVBAR_ITEM_HEIGHT}px;
        content: '';
        border-left: 4px solid ${theme.colors.HIGHLIGHT.PINK};
        box-sizing: border-box;

        @media screen and (max-width: 1024px) {
          width: 60px;
          height: 60px;
          border-left: none;

          border-bottom: 3px solid ${theme.colors.HIGHLIGHT.PINK};
        }
      }
    `}
  `}
`
