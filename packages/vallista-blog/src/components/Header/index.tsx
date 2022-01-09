import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Modal, Spacer, Text, Toggle, useTheme } from '@vallista-land/core'
import { useEffect, useState, VFC } from 'react'

interface HeaderProps {
  fold: boolean
  folding: () => void
}

const fontSizeControllerMapper = [14, 16, 18, 20]

export const Header: VFC<HeaderProps> = (props) => {
  const { fold, folding } = props
  const theme = useTheme()
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (window.localStorage.getItem('theme') as 'light' | 'dark' | undefined) || 'light'
  })
  const [popup, setPopup] = useState(false)
  const [textSize, setTextSize] = useState(16)

  useEffect(() => {
    if (!mode) return

    theme.state.changeTheme(mode)
    window.localStorage.setItem('theme', mode)
  }, [mode])

  useEffect(() => {
    if (!document?.body?.parentElement) return
    if (textSize === 16) {
      const { fontSize, ...otherProps } = document.body.parentElement.style
      ;(document.body.parentElement as any).style = otherProps
      return
    }

    document.body.parentElement.style.fontSize = `${textSize}px`
  }, [textSize])

  return (
    <Container fold={fold}>
      <div>
        <FoldingButton fold={fold} onClick={folding}>
          <svg
            viewBox='0 0 24 24'
            width='18'
            height='18'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
            shapeRendering='geometricPrecision'
          >
            <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
            <path d='M9 3v18' />
          </svg>
        </FoldingButton>
        <Spacer />
        <SettingButton popup={popup} onClick={() => setPopup(!popup)}>
          <svg
            viewBox='0 0 24 24'
            width='18'
            height='18'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
            shapeRendering='geometricPrecision'
          >
            <circle cx='12' cy='12' r='3' />
            <path d='M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z' />
          </svg>
        </SettingButton>
      </div>
      <ThemeToggleContainer>
        <svg
          viewBox='0 0 24 24'
          width='18'
          height='18'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
          shapeRendering='geometricPrecision'
        >
          <circle cx='12' cy='12' r='5' />
          <path d='M12 1v2' />
          <path d='M12 21v2' />
          <path d='M4.22 4.22l1.42 1.42' />
          <path d='M18.36 18.36l1.42 1.42' />
          <path d='M1 12h2' />
          <path d='M21 12h2' />
          <path d='M4.22 19.78l1.42-1.42' />
          <path d='M18.36 5.64l1.42-1.42' />
        </svg>
        <Toggle toggle={mode === 'dark'} size='medium' onChange={handleDarkModeToggle} color='pink' />
        <svg
          viewBox='0 0 24 24'
          width='18'
          height='18'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
          shapeRendering='geometricPrecision'
        >
          <path d='M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z' />
        </svg>
      </ThemeToggleContainer>
      <Modal.Modal active={popup}>
        <Modal.Body>
          <Modal.Header>
            <Modal.Title>설정</Modal.Title>
            <Spacer y={2} />
            <EnvironmentContainer>
              <Text weight={500}>텍스트 크기</Text>
              <SelectGaugeWrapper>
                {fontSizeControllerMapper.map((it, idx, arr) => (
                  <SelectGauge
                    key={idx}
                    value={it}
                    idx={idx}
                    max={arr.length}
                    onClick={() => changeREM(it)}
                    selected={textSize}
                  />
                ))}
              </SelectGaugeWrapper>
            </EnvironmentContainer>
          </Modal.Header>
        </Modal.Body>
        <Modal.Actions>
          <Modal.Action onClick={() => setPopup(false)}>
            <Text>닫기</Text>
          </Modal.Action>
        </Modal.Actions>
      </Modal.Modal>
    </Container>
  )

  function handleDarkModeToggle(state: boolean): void {
    if (state) {
      setMode('dark')
    } else {
      setMode('light')
    }
  }

  function changeREM(size: number): void {
    setTextSize(size)
  }
}

const Container = styled.header<{ fold: boolean }>`
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

const FoldingButton = styled.button<{ fold: boolean }>`
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

const SettingButton = styled.button<{ popup: boolean }>`
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

const ThemeToggleContainer = styled.div`
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

const EnvironmentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`

const SelectGaugeWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 10px;
  border-radius: 5px;
  margin: 0.5rem 0;
  ${({ theme }) => css`
    background-color: ${theme.colors.PRIMARY.ACCENT_2};
  `}
`

const SelectGauge = styled.div<{ idx: number; max: number; value: number; selected: number }>`
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
