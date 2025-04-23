import { useEffect, useRef } from 'react'
import * as Styled from './index.style'

interface MarkdownProps {
  mdx?: string
  loading?: boolean
}

export const Markdown = (props: MarkdownProps) => {
  const { mdx, loading } = props
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const images = document.querySelectorAll<HTMLImageElement>('img.fade-image')

    images.forEach((img) => {
      const image = img

      const onLoad = () => {
        image.classList.add('loaded')
      }

      const onError = () => {
        const fallback = document.createElement('div')
        fallback.textContent = '🖼️ 이미지 로딩 실패'
        fallback.style.cssText = `
          border-radius: 8px;
          aspect-ratio: 2 / 1;
          width: 100%;
          height: auto;
          background: #eee;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #888;
          animation: fade-in 0.1s ease-in-out;
        `

        img.replaceWith(fallback)
      }

      if (image.complete && image.naturalHeight !== 0) {
        onLoad()
      } else {
        image.addEventListener('load', onLoad)
        image.addEventListener('error', onError)
      }

      return () => {
        image.removeEventListener('load', onLoad)
        image.removeEventListener('error', onError)
      }
    })
  }, [mdx])

  return !loading || !mdx ? (
    <Styled.SkeletonWrap>
      <Styled.SkeletonImage />
      <SkeletonTextBlock />
    </Styled.SkeletonWrap>
  ) : (
    <>
      <Styled._Markdown ref={containerRef} dangerouslySetInnerHTML={{ __html: mdx }} />
    </>
  )
}

const SkeletonTextBlock = () => (
  <div>
    <Styled.SkeletonTextLine width='80%' />
    <Styled.SkeletonTextLine width='90%' />
    <Styled.SkeletonTextLine width='95%' />
    <Styled.SkeletonTextLine width='60%' />
  </div>
)
