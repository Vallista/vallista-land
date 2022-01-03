import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { Toggle, useTheme } from '@vallista-land/core'
import { useEffect, useState, VFC } from 'react'

interface HeaderProps {
  fold: boolean
  folding: () => void
}

export const Header: VFC<HeaderProps> = (props) => {
  const { fold, folding } = props
  const theme = useTheme()
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    return (window.localStorage.getItem('theme') as 'light' | 'dark' | undefined) || 'light'
  })

  useEffect(() => {
    if (!mode) return

    theme.state.changeTheme(mode)
    window.localStorage.setItem('theme', mode)
  }, [mode])

  return (
    <Container fold={fold}>
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
        <Toggle toggle={mode === 'dark'} size='medium' onChange={handleDarkModeToggle} />
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
    </Container>
  )

  function handleDarkModeToggle(state: boolean): void {
    if (state) {
      setMode('dark')
    } else {
      setMode('light')
    }
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

  @media screen and (max-width: 1000px) {
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

  @media screen and (max-width: 1000px) {
    visibility: hidden;
  }
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
