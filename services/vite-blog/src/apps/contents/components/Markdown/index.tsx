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

      if (image.complete && image.naturalHeight !== 0) {
        onLoad()
      } else {
        image.addEventListener('load', onLoad)
      }

      return () => {
        image.removeEventListener('load', onLoad)
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
