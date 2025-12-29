import { useRef } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

import { SnippetProps } from './type'
import { useSnippet } from './useSnippet'
import {
  snippet,
  snippetRow,
  snippetCopyButton,
  snippetPrompt,
  snippetSyntaxHighlighter,
  snippetCodeTag,
  snippetPreTag,
  snippetContent
} from './Snippet.css'

/**
 * # Snippet
 *
 * 코드를 쉽게 공유할 때 사용하는 스니펫입니다.
 *
 * @param {SnippetProps} {@link SnippetProps}
 *
 * @example ```tsx
 * <Snippet text='npm init next-app' width='300px' type='success' fill />
 * ```
 */
export const Snippet = (props: Partial<SnippetProps>) => {
  const {
    width = '300px',
    text,
    handleCopy,
    fill,
    type = 'primary',
    dark,
    prompt,
    language,
    showSyntaxHighlighting = false,
    ...otherProps
  } = useSnippet(props)
  const ref = useRef<HTMLDivElement>(null)

  // width를 CSS variant에 맞는 타입으로 변환
  const widthVariant =
    width === '300px' || width === '400px' || width === '500px' || width === '600px' || width === 'full'
      ? width
      : '300px'

  const snippetClass = snippet({
    width: widthVariant,
    type,
    ...(fill && { fill: type }),
    dark: dark === true
  })

  const codeContent = text.join('\n')

  return (
    <div className={snippetClass} {...otherProps} ref={ref}>
      <div className={snippetContent}>
        {prompt && <span className={snippetPrompt}>{prompt}</span>}
        {showSyntaxHighlighting && language ? (
          <SyntaxHighlighter
            language={language}
            style={oneLight}
            customStyle={snippetSyntaxHighlighter}
            showLineNumbers={true}
            CodeTag={({ children, style: _style, ...props }: any) => (
              <code {...props} className={snippetCodeTag}>
                {children}
              </code>
            )}
            PreTag={({ children, style: _style, ...props }: any) => (
              <pre {...props} className={snippetPreTag}>
                {children}
              </pre>
            )}
          >
            {codeContent}
          </SyntaxHighlighter>
        ) : (
          text.map((it, idx) => (
            <pre key={`${it}-${idx}`} className={snippetRow}>
              {it}
            </pre>
          ))
        )}
        <button className={snippetCopyButton} onClick={() => handleCopy(codeContent)}>
          <svg
            viewBox='0 0 24 24'
            width='24'
            height='24'
            color='currentcolor'
            stroke='currentcolor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
            shapeRendering='geometricPrecision'
          >
            <path d='M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z' />
          </svg>
        </button>
      </div>
    </div>
  )
}
