import { Global, ThemeProvider as BaseThemeProvider, css } from '@emotion/react'
import { FC, VFC } from 'react'

import { BaseThemeMapper, Colors, Layers, Shadows } from './type'

const Themes: BaseThemeMapper = {
  DEFAULT: {
    colors: Colors,
    layers: Layers,
    shadows: Shadows
  },
  DARK: {
    colors: Colors,
    layers: Layers,
    shadows: Shadows
  }
}

type ThemeKeys = keyof typeof Themes

/**
 * # ThemeProvider
 *
 * @description **[경고] ThemeProvider는 필수입니다. 항상 root에 넣어주세요!**
 *
 * @param {ThemeKeys} {@link ThemeKeys} theme에 넣으면 테마가 변경됩니다. 기본: DEFAULT
 *
 * @example ```tsx
 * <ThemeProvider theme='DARK'>
 *  ...
 * </ThemeProvider>
 * ```
 */
export const ThemeProvider: FC<{ theme?: ThemeKeys }> = ({ theme = 'DEFAULT', children }) => {
  return (
    <>
      <Reset />
      <BaseThemeProvider theme={Themes[theme]}>{children}</BaseThemeProvider>
    </>
  )
}

const Reset: VFC = () => {
  return (
    <Global
      styles={css`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

        :root {
          --font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu',
            'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          --code-font-family: Menlo, 'DM Mono', 'Roboto Mono', Courier New, monospace;
          --scrollbar-background: #1e1e1e;
          --scrollbar-thumb: #666;
          --scrollbar-thumb-highlight: #ff0080;
        }

        html {
          font-size: 16px;

          &::-webkit-scrollbar {
            background: var(--scrollbar-background);
            height: 8px;
            width: 8px;
          }

          &::-webkit-scrollbar-thumb {
            background: var(--scrollbar-thumb-highlight);
            border-radius: 0;
          }
        }

        html,
        body {
          font-family: var(--font-family) !important;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          font-size: 1rem;
        }

        div,
        article,
        section {
          box-sizing: border-box;
        }

        html,
        body,
        div,
        span,
        applet,
        object,
        iframe,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6,
        p,
        blockquote,
        pre,
        a,
        abbr,
        acronym,
        address,
        big,
        cite,
        code,
        del,
        dfn,
        em,
        img,
        ins,
        kbd,
        q,
        s,
        samp,
        small,
        strike,
        strong,
        sub,
        sup,
        tt,
        var,
        b,
        u,
        i,
        center,
        dl,
        dt,
        dd,
        ol,
        ul,
        li,
        fieldset,
        form,
        label,
        legend,
        table,
        caption,
        tbody,
        tfoot,
        thead,
        tr,
        th,
        td,
        article,
        aside,
        canvas,
        details,
        embed,
        figure,
        figcaption,
        footer,
        header,
        hgroup,
        menu,
        nav,
        output,
        ruby,
        section,
        summary,
        time,
        mark,
        audio,
        video {
          margin: 0;
          padding: 0;
          border: 0;
          font-size: 1rem;
          font: inherit;
          vertical-align: baseline;
        }

        /* HTML5 display-role reset for older browsers */
        article,
        aside,
        details,
        figcaption,
        figure,
        footer,
        header,
        hgroup,
        menu,
        nav,
        section {
          display: block;
        }

        body {
          line-height: 1;
        }

        ol,
        ul {
          list-style: none;
        }

        blockquote,
        q {
          quotes: none;
        }

        blockquote:before,
        blockquote:after,
        q:before,
        q:after {
          content: '';
          content: none;
        }

        table {
          border-collapse: collapse;
          border-spacing: 0;
        }
      `}
    />
  )
}
