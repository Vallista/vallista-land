import styled from '@emotion/styled'
import { DEFINE_SIDEBAR_HEADER_HEIGHT } from '../../utils'
import { css } from '@emotion/react'

export const _Title = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: ${DEFINE_SIDEBAR_HEADER_HEIGHT}px;
  font-weight: 600;
  font-size: 14px;
  padding: 0 16px 2px;

  & > p {
    padding-top: 3px;
  }
`

export const _TitleWrap = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  width: 100%;
`

export const _TitleBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  gap: 6px;
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
  `}/* @media screen and (max-width: 1024px) {
    display: none;

    & + span {
      display: none;
    }
  } */
`
