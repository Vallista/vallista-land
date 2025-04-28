import styled from '@emotion/styled'
import { css } from '@emotion/react'
import { DEFINE_ICON_SIZE } from '@/utils/constant'

export const _Button = styled.button<{ popup: boolean }>`
  cursor: pointer;
  border: none;
  background: none;
  outline: none;
  padding: 0;
  margin: 0;
  height: 18px;
  transition: color 0.2s cubic-bezier(0.215, 0.61, 0.355, 1);

  ${({ theme, popup }) => css`
    ${popup
      ? css`
          color: ${theme.colors.HIGHLIGHT.PINK};
        `
      : css`
          &:hover {
            color: ${theme.colors.PRIMARY.FOREGROUND};
          }
          color: ${theme.colors.PRIMARY.ACCENT_4};
        `}
  `}

  width: ${DEFINE_ICON_SIZE}px;
  height: ${DEFINE_ICON_SIZE}px;
`

export const _EnvironmentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

export const _SelectGaugeWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 10px;
  border-radius: 5px;
  margin: 0.5rem 0;
  ${({ theme }) => css`
    background-color: ${theme.colors.PRIMARY.ACCENT_2};
  `}
`

export const _SelectGauge = styled.div<{ idx: number; max: number; value: number; selected: number }>`
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 10px;
  transform: translate(-50%, -50%);
  cursor: pointer;

  ${({ theme, idx, max, value, selected }) => css`
    left: ${(idx / (max - 1)) * 100}%;
    top: 50%;
    background-color: ${selected === value ? theme.colors.HIGHLIGHT.PINK : theme.colors.PRIMARY.ACCENT_8};

    &:first-of-type {
      left: 1.5%;
    }

    &:last-of-type {
      right: 95%;
    }

    &::after {
      content: '${value}';
      position: absolute;
      left: 50%;
      transform: translate(-50%, -50%);
      top: 30px;
    }
  `}
`
