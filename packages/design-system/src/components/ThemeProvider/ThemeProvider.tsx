import { Global, ThemeProvider as BaseThemeProvider, css } from '@emotion/react'
import { ReactNode, useEffect, useState } from 'react'
import { createContext } from '../../utils/createContext'
import { ToastProvider } from '../Toast'
import { BaseThemeMapper, Colors, Layers, Shadows } from './type'

const Themes: BaseThemeMapper = {
  LIGHT: {
    colors: Colors,
    layers: Layers,
    shadows: Shadows()
  },
  DARK: {
    colors: {
      ...Colors,
      PRIMARY: {
        ACCENT_1: Colors.PRIMARY.ACCENT_8,
        ACCENT_2: Colors.PRIMARY.ACCENT_7,
        ACCENT_3: Colors.PRIMARY.ACCENT_6,
        ACCENT_4: Colors.PRIMARY.ACCENT_5,
        ACCENT_5: Colors.PRIMARY.ACCENT_4,
        ACCENT_6: Colors.PRIMARY.ACCENT_3,
        ACCENT_7: Colors.PRIMARY.ACCENT_2,
        ACCENT_8: Colors.PRIMARY.ACCENT_1,
        BACKGROUND: Colors.PRIMARY.FOREGROUND,
        FOREGROUND: Colors.PRIMARY.BACKGROUND
      }
    },
    layers: Layers,
    shadows: Shadows(true)
  }
}

const [Context, useTheme] = createContext<{
  changeTheme: (theme: 'LIGHT' | 'DARK') => void
}>()

type ThemeKeys = keyof typeof Themes

function getInitialTheme(): ThemeKeys {
  if (typeof window === 'undefined') return 'LIGHT'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'DARK' : 'LIGHT'
}

export const ThemeProvider = ({ theme = 'LIGHT', children }: { theme?: ThemeKeys; children: ReactNode }) => {
  const [themeState, setThemeState] = useState<ThemeKeys>(theme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const appliedTheme = Themes[themeState]

    // document.body.style.backgroundColor = appliedTheme.colors.PRIMARY.BACKGROUND
    // document.body.style.color = appliedTheme.colors.PRIMARY.FOREGROUND
    // document.body.style.transition = 'background-color 0.2s ease-in-out'

    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = appliedTheme.colors.PRIMARY.BACKGROUND

    setMounted(true)
  }, [themeState])

  const changeTheme = (next: ThemeKeys) => setThemeState(next)

  const currentTheme = mounted ? Themes[themeState] : Themes[getInitialTheme()]

  return (
    <Context state={{ changeTheme }}>
      <Reset />
      <BaseThemeProvider theme={currentTheme}>
        <ToastProvider>{children}</ToastProvider>
      </BaseThemeProvider>
    </Context>
  )
}

export { useTheme }

const Reset = () => (
  <Global
    styles={css`
      /* Pretendard font-face declarations */
      ${[900, 800, 700, 600, 500, 400, 300, 200, 100]
        .map(
          (weight) => `
        @font-face {
          font-family: 'Pretendard';
          font-weight: ${weight};
          font-display: swap;
          src: local('Pretendard'), 
               url(/fonts/pretendard/Pretendard-${getWeightName(weight)}.subset.woff2) format('woff2'),
               url(/fonts/pretendard/Pretendard-${getWeightName(weight)}.subset.woff) format('woff');
        }
      `
        )
        .join('\n')}

      :root {
        --vh: 1vh;
        --font-family: 'Pretendard', -apple-system, sans-serif;
        --code-font-family: Menlo, 'DM Mono', 'Roboto Mono', Courier New, monospace;
        --scrollbar-background: #1e1e1e;
        --scrollbar-thumb: #666;
        --scrollbar-thumb-highlight: #ff0080;
      }

      html {
        font-size: 14px;
        @media screen and (max-width: 1024px) {
          font-size: 14px;
          height: 100%;
          overflow-x: hidden;
          overflow-y: scroll;
          -webkit-overflow-scrolling: touch;
        }
        scrollbar-width: 8px;
        scrollbar-color: var(--scrollbar-thumb-highlight) var(--scrollbar-background);
        &::-webkit-scrollbar {
          background: var(--scrollbar-background);
          height: 8px;
          width: 8px;
        }
        &::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb-highlight);
        }
      }

      html,
      body {
        font-family: var(--font-family) !important;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        font-size: 1rem;
        margin: 0;
        padding: 0;
      }

      * {
        box-sizing: border-box;
      }

      ol,
      ul {
        list-style: none;
      }

      table {
        border-collapse: collapse;
        border-spacing: 0;
      }

      blockquote,
      q {
        quotes: none;
        &:before,
        &:after {
          content: '';
        }
      }

      label,
      input,
      button,
      a {
        -webkit-tap-highlight-color: transparent;
      }

      body {
        line-height: 1;
      }
    `}
  />
)

function getWeightName(weight: number): string {
  switch (weight) {
    case 900:
      return 'Black'
    case 800:
      return 'ExtraBold'
    case 700:
      return 'Bold'
    case 600:
      return 'SemiBold'
    case 500:
      return 'Medium'
    case 400:
      return 'Regular'
    case 300:
      return 'Light'
    case 200:
      return 'ExtraLight'
    case 100:
      return 'Thin'
    default:
      return ''
  }
}
