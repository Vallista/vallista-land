import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const _Container = styled.header<{ fold: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  left: 400px;
  top: 0;
  width: calc(100% - 400px);
  height: 43px;
  padding: 0 1rem;
  box-sizing: border-box;

  ${({ theme, fold }) => css`
    z-index: ${theme.layers.AFTER_STANDARD};
    background-color: ${theme.colors.PRIMARY.ACCENT_1};
    box-shadow: 0 2px 2px rgba(0, 0, 0, 0.1);

    ${fold &&
    css`
      width: calc(100% - 80px) !important;
      left: 80px;
    `}
  `}

  @media screen and (max-width: 1024px) {
    left: 0;
    width: 100% !important;
  }
`

export const _FoldingButton = styled.button<{ fold: boolean }>`
  cursor: pointer;
  border: none;
  background: none;
  outline: none;
  padding: 0;
  margin: 0;
  height: 18px;
  transition: color 0.2s cubic-bezier(0.215, 0.61, 0.355, 1);

  ${({ theme, fold }) => css`
    ${fold
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

  @media screen and (max-width: 1024px) {
    display: none;

    & + span {
      display: none;
    }
  }
`

export const _SettingButton = styled.button<{ popup: boolean }>`
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
`

export const _ThemeToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.FOREGROUND};
  `}

  & > label {
    margin: 0 12px;
  }
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
