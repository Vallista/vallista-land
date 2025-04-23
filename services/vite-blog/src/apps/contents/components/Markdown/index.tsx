import { useEffect, useRef, useState } from 'react'
import * as Styled from './index.style'

interface MarkdownProps {
  mdx?: string
  loading?: boolean
}

export const Markdown = (props: MarkdownProps) => {
  const { mdx, loading } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const images = container.querySelectorAll('img')
    if (images.length === 0) {
      setVisible(true)
      return
    }

    let handled = 0
    const total = images.length

    const checkDone = () => {
      handled += 1
      if (handled === total) {
        console.log('done')
        setVisible(true)
      }
    }

    images.forEach((img) => {
      const isLoaded = img.complete && img.naturalHeight !== 0
      const isErrored = img.complete && img.naturalHeight === 0

      if (isLoaded || isErrored) {
        // 캐시된 성공 or 실패
        checkDone()
      } else {
        img.addEventListener('load', checkDone)
        img.addEventListener('error', checkDone)
      }
    })

    return () => {
      images.forEach((img) => {
        img.removeEventListener('load', checkDone)
        img.removeEventListener('error', checkDone)
      })
    }
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
