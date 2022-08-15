import { useLocation } from '@reach/router'
import { useEffect, useMemo, useRef, VFC } from 'react'

import * as Styled from './Markdown.style'

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
            <svg aria-hidden="true" focusable="false" height="16" version="1.1" viewBox="0 0 16 16" width="16" 
            stroke='currentColor'
            stroke-width='1'
            stroke-linecap='round'
            stroke-linejoin='round'
            fill='none'
            shape-rendering='geometricPrecision'>
              <path
                fill-rule="evenodd" 
                d="M4 9h1v1H4c-1.5 0-3-1.69-3-3.5S2.55 3 4 3h4c1.45 0 3 1.69 3 3.5 0 1.41-.91 2.72-2 3.25V8.59c.58-.45 1-1.27 1-2.09C10 5.22 8.98 4 8 4H4c-.98 0-2 1.22-2 2.5S3 9 4 9zm9-3h-1v1h1c1 0 2 1.22 2 2.5S13.98 12 13 12H9c-.98 0-2-1.22-2-2.5 0-.83.42-1.64 1-2.09V6.25c-1.09.53-2 1.84-2 3.25C6 11.31 7.55 13 9 13h4c1.45 0 3-1.69 3-3.5S14.5 6 13 6z">
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
      <Styled._Contents ref={ref} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
