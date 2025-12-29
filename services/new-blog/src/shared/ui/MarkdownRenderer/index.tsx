import ReactMarkdown from 'react-markdown'

import remarkGfm from 'remark-gfm'
import { Snippet } from '@vallista/design-system'

import * as styles from './MarkdownRenderer.css'

interface MarkdownRendererProps {
  content: string
  className?: string
  articleSlug?: string
}

export function MarkdownRenderer({ content, className, articleSlug }: MarkdownRendererProps) {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 코드 블록
          code({ node: _node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            const codeContent = String(children).replace(/\n$/, '')

            return !inline && match ? (
              <div className={styles.codeBlockWrapper}>
                <Snippet
                  text={codeContent}
                  width='full'
                  type='primary'
                  dark={false}
                  prompt={false}
                  onCopy={() => {}}
                  fill={false}
                  language={match[1]}
                  showSyntaxHighlighting={true}
                />
              </div>
            ) : (
              <span className={styles.inlineCodeWrapper}>
                <code className={styles.inlineCode} {...props}>
                  {children}
                </code>
              </span>
            )
          },

          // 제목들
          h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
          h4: ({ children }) => <h4 className={styles.h4}>{children}</h4>,
          h5: ({ children }) => <h5 className={styles.h5}>{children}</h5>,
          h6: ({ children }) => <h6 className={styles.h6}>{children}</h6>,

          // 링크
          a: ({ href, children }) => (
            <a href={href} className={styles.link} target='_blank' rel='noopener noreferrer'>
              {children}
            </a>
          ),

          // 이미지
          img: ({ src, alt }) => {
            // 상대 경로를 절대 경로로 변환
            let imageSrc = src
            if (src && src.startsWith('./assets/') && articleSlug) {
              imageSrc = `/contents/articles/${articleSlug}${src.slice(1)}` // ./assets/1.png -> /contents/articles/slug/assets/1.png
            }
            return <img src={imageSrc} alt={alt} className={styles.image} loading='lazy' />
          },

          // 인용구
          blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,

          // 테이블
          table: ({ children }) => (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>{children}</table>
            </div>
          ),
          th: ({ children }) => <th className={styles.tableHeader}>{children}</th>,
          td: ({ children }) => <td className={styles.tableCell}>{children}</td>,
          tr: ({ children }) => <tr className={styles.tableRow}>{children}</tr>,

          // 리스트
          ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
          li: ({ children }) => <li className={styles.li}>{children}</li>,

          // 강조
          strong: ({ children }) => <strong className={styles.strong}>{children}</strong>,
          em: ({ children }) => <em className={styles.em}>{children}</em>,

          // 구분선
          hr: () => <hr className={styles.hr} />,

          // 단락
          p: ({ children }) => <p className={styles.p}>{children}</p>
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
