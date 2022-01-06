import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { useLocation } from '@reach/router'
import { useEffect, useMemo, useRef, VFC } from 'react'

interface MarkdownProps {
  html: string
}

export const Markdown: VFC<MarkdownProps> = (props) => {
  const location = useLocation()
  const ref = useRef<HTMLDivElement>(null)
  const html = useMemo(() => {
    const result = props.html
      // pre 태그 (소스코드)에 추가하여 wrapping 하는 div를 추가한다.
      // 해당 div는 스크롤 처리를 진행한다.
      .replaceAll('<pre', '<div class="markdown-wrapper"><pre')
      .replaceAll('</pre>', '</pre></div>')

    return result
  }, [])

  useEffect(() => {
    // heading 전부 체크해서 해시에 저장할 수 있는 버튼을 추가한다.
    // 버튼을 클릭하면 이동되도록 구현.
    Array.from(ref.current?.getElementsByTagName('*') ?? [])
      .filter((it) => Number(it.tagName?.[1] ?? '999') < 6)
      .forEach((it) => {
        if (it.getElementsByTagName('a').length > 0) return

        const name = it.innerHTML.replaceAll(' ', '-')

        it.innerHTML = `
          <a href="#${name}" aria-label="${name} permalink">
            <svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16">
              <path fill-rule="evenodd" d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z">
              </path>
            </svg>
          </a>
          ${it.innerHTML}
        `
        it.id = name
      })

    // 페이지가 로드되고 나서 선택된 해딩으로 이동한다.
    window.onload = () => {
      setTimeout(() => {
        const hashData = decodeURIComponent(location.hash).substring(1)
        if (hashData) {
          window.scrollTo(0, document.getElementById(hashData)?.getBoundingClientRect().bottom ?? 0)
        }
      })
    }
  }, [])

  return (
    <div>
      <Contents ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

const Wrapper = styled.section`
  width: 100%;
  max-width: 900px;
  padding: 2rem;
  margin-left: auto;
  margin-right: auto;

  @media screen and (max-width: 1000px) {
    padding: 1.5rem;
  }
`

const Contents = styled(Wrapper)`
  width: calc(100vw - 400px);

  @media screen and (max-width: 1308px) {
    width: calc(100vw - 408px);
  }

  @media screen and (max-width: 1000px) {
    width: calc(100vw - 8px);
  }

  ${({ theme }) => css`
    /** image */

    p > img {
      width: 100%;
    }

    /* Default Text */

    p {
      color: ${theme.colors.PRIMARY.ACCENT_8};
      font-weight: 400;
      line-height: 1.6;
      letter-spacing: -0.02rem;
    }

    p,
    table,
    ul,
    blockquote,
    ol {
      font-size: 1rem;
      margin: 0 0 2rem;
    }

    center {
      color: ${theme.colors.PRIMARY.ACCENT_5};
      font-size: 0.8rem;
      font-weight: 400;
      line-height: 1.5;
      letter-spacing: -0.02rem;
      margin: 0 0 2rem;
    }

    p + center,
    iframe + center {
      margin-top: -1rem;
    }

    /* Heading */

    h1,
    h2,
    h3,
    h4,
    h5 {
      position: relative;
      color: ${theme.colors.PRIMARY.FOREGROUND};
      line-height: 1.2;
      scroll-margin-top: 60px;
      letter-spacing: -0.02rem;
      font-weight: 600;
      background: none;

      & > a {
        opacity: 0;
        border: none;
        position: absolute;
        top: 0;
        left: 0;
        transform: translateX(-100%);
        padding-right: 4px;
      }

      &:hover > a {
        background: none;
        border: none;
        opacity: 1;
      }
    }

    h2:not(:first-of-type),
    h3:not(:first-of-type),
    h4:not(:first-of-type) {
      margin-top: 3rem;
    }

    h1,
    h2,
    h3,
    h4,
    h5 {
      margin: 0 0 1.25rem;
    }

    h1,
    h2 {
      font-size: 1.8rem;
      filter: brightness(1);
    }

    h3 {
      font-size: 1.4rem;
      filter: brightness(1.3);
    }

    h4 {
      filter: brightness(1.5);
      font-size: 1.1rem;
      padding-bottom: 0.25rem;
      text-transform: uppercase;
    }

    /* ul, li */

    ul,
    ol {
      padding-left: 1.5rem;
      box-sizing: border-box;
      line-height: 1.6;

      & ul {
        margin-top: 8px;
      }

      & ul,
      & ol {
        margin-bottom: 0;
      }
    }

    ul {
      list-style: disc;
    }

    ol {
      list-style: decimal;
    }

    ul li {
      margin-bottom: 0.5rem;

      &::marker {
        font-weight: 600;
        color: ${theme.colors.HIGHLIGHT.PINK};
      }
    }

    ol li {
      margin-bottom: 0.5rem;

      &::marker {
        font-weight: 600;
        color: ${theme.colors.HIGHLIGHT.PINK};
      }
    }

    li > a {
      white-space: inherit;
      word-wrap: break-word;
    }

    li {
      color: ${theme.colors.PRIMARY.FOREGROUND};
    }

    /* iframe */

    iframe {
      margin-bottom: 2rem;
    }

    /* Code */
    div[class*='markdown-wrapper'] {
      font-size: 0.9rem;
      text-size-adjust: none;
      margin: 1.5rem -1.5rem;
      overflow-x: auto;
      overflow-y: hidden;
      box-sizing: border-box;
      background-color: var(--scrollbar-background);
      padding-left: 2rem;

      /** 파이어폭스 스크롤 대응 */
      scrollbar-width: 8px;
      // thumb background 순
      scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-background);

      /** 사파리, 크롬 스크롤 대응 */
      &::-webkit-scrollbar {
        background: var(--scrollbar-background);
        height: 8px;
        width: 8px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--scrollbar-thumb);
        border-radius: 0;
      }

      @media screen and (min-width: 1350px) {
        margin-left: -3.5rem;
        margin-right: -3.5rem;
        margin-bottom: 2rem;
      }

      @media screen and (max-width: 1000px) {
        padding-left: 1.5rem;
      }
    }

    pre {
      border-radius: 0;
      float: left;
      margin-bottom: 0;
      margin-top: 0;
      min-width: calc(100% + 1rem);
      padding: 1rem 1rem 1rem 0;
      -webkit-font-smoothing: subpixel-antialiased;
      overflow: initial;
      white-space: pre;
      font-family: var(--code-font-family);
      word-wrap: normal;
      hyphens: none;
      line-height: 1.5;
      tab-size: 2;
      word-break: normal;
      word-spacing: normal;

      & > code {
        font-weight: 600;
        color: ${theme.colors.HIGHLIGHT.PINK};
        white-space: inherit;

        & * span {
          white-space: inherit;
        }

        & * span:not([class='grvsc-source']) {
          padding-left: 0 !important;
        }
      }
    }

    p > code {
      font-weight: 600;
      color: ${theme.colors.HIGHLIGHT.PINK};
      white-space: inherit;

      & * span {
        white-space: inherit;
      }

      & * span:not([class='grvsc-source']) {
        padding-left: 0 !important;
      }
    }

    img[class='gatsby-resp-image-image'] {
      box-shadow: none !important;
    }

    img[class='gatsby-resp-image-image'][alt]:after {
      display: flex;
      justify-content: center;
      align-items: center;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${theme.colors.PRIMARY.BACKGROUND};
      font-weight: 200;
      content: '이미지를 표시할 수 없어요. :(';
    }

    blockquote {
      background: ${theme.colors.PRIMARY.ACCENT_2};
      margin: 0 -1.5rem;
      margin-bottom: 2rem;
      padding: 1rem 1.5rem;
      border-left: 6px solid ${theme.colors.HIGHLIGHT.PINK};

      & > p {
        margin-bottom: 0;
      }

      @media screen and (min-width: 1350px) {
        margin-left: -3.5rem;
        margin-right: -3.5rem;
      }

      @media screen and (max-width: 1000px) {
        padding-left: 1.5rem;
      }
    }
  `}
`
