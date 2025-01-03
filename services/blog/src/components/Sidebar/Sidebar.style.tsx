import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { CommonLayoutProps } from './Sidebar.type'

const DEFINE_SIDEBAR_HEADER_HEIGHT = 43
const DEFINE_SIDEBAR_SEARCH_HEIGHT = 38
const DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT = DEFINE_SIDEBAR_HEADER_HEIGHT + DEFINE_SIDEBAR_SEARCH_HEIGHT

export const _SidebarContainer = styled.div<CommonLayoutProps>`
  position: fixed;
  width: 320px;
  height: calc(100vh - ${DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT}px);
  top: ${DEFINE_SIDEBAR_ABSOLUTE_TOP_BLANK_SCROLL_HEIGHT}px;
  left: 80px;
  overflow-x: hidden;
  overflow-y: hidden;

  ${({ theme, scrollState, fold }) => css`
    z-index: ${theme.layers.AFTER_STANDARD - 1};
    background: ${theme.colors.PRIMARY.ACCENT_1};
    box-shadow: ${theme.shadows.SMALL};

    ${scrollState === 'SHOW' &&
    css`
      &:hover > div:last-of-type {
        margin-right: -8px;
      }
    `}

    ${fold &&
    css`
      left: -320px;

      & > div:first-of-type {
        left: -320px;
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
    left: -320px;

    & > div:first-of-type {
      left: -320px;
    }
  }

  &:hover {
    overflow-y: auto;
  }
`

export const _Header = styled.div<CommonLayoutProps>`
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 80px;
  transform: translate3d(0, 0, 1);
  width: 320px;

  ${({ theme, fold }) => css`
    z-index: ${theme.layers.AFTER_STANDARD};
    background: ${theme.colors.PRIMARY.ACCENT_1};

    ${fold &&
    css`
      left: -320px;

      & > div:first-of-type {
        left: -320px;
      }
    `}
  `}

  @media screen and (max-width: 1024px) {
    left: -320px;

    & > div:first-of-type {
      left: -320px;
    }
  }
`

export const _Button = styled.button`
  border: none;
  background: none;
  outline: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s cubic-bezier(0.215, 0.61, 0.355, 1);

  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.ACCENT_4};
    &:hover {
      color: ${theme.colors.PRIMARY.FOREGROUND};
    }
  `}
`

export const _Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 43px;
  font-weight: 600;
  font-size: 14px;
  padding: 0 28px 2px;

  & > p {
    padding-top: 3px;
  }
`

export const _SearchBox = styled.div`
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 24px;
  max-width: 100%;

  & > div {
    width: 100%;
  }
`

export const _Categories = styled.div`
  padding: 16px 24px 32px;
`

export const _CardStyle = styled.nav`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
`

type CardStyleItemProps = Partial<CommonLayoutProps> & { image: string | null; text: string; isActive: boolean }
export const _CardStyleItem = styled.a<CardStyleItemProps>`
  position: relative;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  width: 130px;
  height: 130px;
  margin-bottom: 12px;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  transform: scale(1, 1);
  transition: transform 0.2s cubic-bezier(0.075, 0.82, 0.165, 1);

  ${({ theme, image, text, isActive }) => css`
    background-image: url(${image});
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    box-shadow: ${theme.shadows.SMALL};
    color: ${theme.colors.PRIMARY.BACKGROUND};

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: inherit;
      height: inherit;
      background: ${isActive ? theme.colors.HIGHLIGHT.PINK : theme.colors.PRIMARY.FOREGROUND};
      opacity: ${isActive ? 0.5 : 0.3};
      border-radius: 12px;
    }

    &::after {
      content: '${text}';
      position: absolute;
      right: 0;
      bottom: 0;
      font-size: 16px;
      font-weight: 600;
      line-height: 1.1;
      color: ${theme.colors.PRIMARY.BACKGROUND};
      text-align: right;
      margin: 6px 6px 12px;
      word-break: keep-all;
      letter-spacing: -0.02rem;
    }
  `}

  &:hover {
    transform: scale(1.1, 1.1);
  }
`

export const _ListStyle = styled.nav`
  display: flex;
  flex-direction: column;
  margin: 12px 0 0;

  &:first-child {
    margin-top: 0;
  }
`

export const _ListHeader = styled.div`
  ${({ theme }) => css`
    cursor: pointer;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-size: 14px;
    background-color: ${theme.colors.PRIMARY.ACCENT_1};
    padding: 0;
    margin: 0 0 6px 0;
    height: 30px;
  `}/* & > div {
    margin-right: 8px;
  } */
`

export const _ListFoldIcon = styled.div<{ fold: boolean }>`
  display: flex;
  justify-content: flex-start;
  align-items: flex-end;

  & > div {
    & > svg {
      position: relative;
      ${({ fold }) =>
        !fold &&
        css`
          top: -2px;
          left: -2px;
        `}
    }
  }
`

export const _ListBody = styled.div<{ fold: boolean }>`
  overflow-y: hidden;
  will-change: height;
  transition: height 0.2s ease;

  ${({ fold }) => css`
    height: ${fold ? 0 : 'auto'};
  `}
`

export const _ListStyleItem = styled.a<Pick<CardStyleItemProps, 'isActive'>>`
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  cursor: pointer;
  padding: 6px 0;
  transition: border 0.2s ease;

  ${({ theme, isActive }) => css`
    ${isActive &&
    css`
      border-left: 6px solid ${theme.colors.HIGHLIGHT.PINK};
      padding-left: 12px;
    `};

    & > div {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 6px;
      color: ${theme.colors.PRIMARY.ACCENT_4};
    }

    &:hover {
      background-color: ${theme.colors.PRIMARY.ACCENT_2};
    }

    /* &::before {
    content: '';
    transform: translateY(-50%);
    
    font-size: 1rem;
  } */
  `}

  & > svg {
    width: 20px;
    height: 20px;
  }
`

export const _ChangeListButton = styled.button`
  cursor: pointer;
  border: none;
  background: none;
  outline: none;
  padding: 0;
  margin: 0;
  height: 18px;
  transition: color 0.2s cubic-bezier(0.215, 0.61, 0.355, 1);

  ${({ theme }) => css`
    &:hover {
      color: ${theme.colors.PRIMARY.FOREGROUND};
    }
    color: ${theme.colors.PRIMARY.ACCENT_4};
  `}

  @media screen and (max-width: 1024px) {
    display: none;

    & + span {
      display: none;
    }
  }
`
