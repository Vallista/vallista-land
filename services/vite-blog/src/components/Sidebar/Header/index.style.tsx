import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { DEFINE_SIDEBAR_HEADER_HEIGHT, DEFINE_SIDEBAR_WIDTH } from '../utils'

interface WrapProps {
  fold: boolean
}

export const _Wrap = styled.div<WrapProps>`
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 80px;
  transform: translate3d(0, 0, 1);
  width: ${DEFINE_SIDEBAR_WIDTH}px;

  ${({ theme, fold }) => css`
    z-index: ${theme.layers.AFTER_STANDARD};
    background: ${theme.colors.PRIMARY.ACCENT_1};

    ${
      fold &&
      css`
      left: -${DEFINE_SIDEBAR_WIDTH}px;

      & > div:first-of-type {
        left: -${DEFINE_SIDEBAR_WIDTH}px;
      }
    `
    }
  `}

  @media screen and (max-width: 1024px) {
    left: -${DEFINE_SIDEBAR_WIDTH}px;

    & > div:first-of-type {
      left: -${DEFINE_SIDEBAR_WIDTH}px;
    }
  }
`

export const _Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${DEFINE_SIDEBAR_HEADER_HEIGHT}px;
  font-weight: 600;
  font-size: 14px;
  padding: 0 28px 2px;

  & > p {
    padding-top: 3px;
  }
`

export const _Search = styled.div`
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 24px;
  max-width: 100%;

  & > div {
    width: 100%;
  }
`

export const _TypeButton = styled.button`
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
