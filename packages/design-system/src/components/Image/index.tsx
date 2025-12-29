import { useEffect, useRef, useState } from 'react'

import { raiseDecimalPoint } from '../../utils/math'
import { ImageProps } from './type'
import {
  imageCaption,
  imageContainer,
  imageImg,
  imageMain,
  imageWrapper,
  imageHeader,
  imageTitle,
  imageCloseButton
} from './Image.css'

/**
 * # Image
 * 
 * 이미지 컴포넌트.
 * 
 * 1. 이미지를 불러오기 전 로딩을 진행하고
 * 2. 로딩이 완료되면 fade-in 애니메이션으로 보여줍니다.
 * 3. 선택적으로 헤더와 닫기 버튼을 포함할 수 있습니다.
 * 
 * @param {ImageProps} {@link ImageProps} 기본적인 프롭
 * 
 * @example ```tsx
  <Image
    src={`https://assets.vercel.com/image/upload/q_auto/front/zeit/og.png`}
    width={540}
    height={300}
    margin={0}
  />

  <Image
    src={`https://assets.vercel.com/image/upload/q_auto/front/assets/design/components/triangle.gif`}
    width={540}
    height={309}
    margin={0}
    caption='Source: giphy.com'
    captionSpacing={20}
    title='Image Title'
    onClose={() => {}}
  />
 * ```
 */
export const Image = (props: ImageProps) => {
  const { caption, captionSpacing, src, objectFit, objectPosition, title, onClose, ...otherProps } = props

  const ref = useRef<HTMLImageElement>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  useEffect(() => {
    const imageLoader = new window.Image()
    imageLoader.src = src

    imageLoader.onload = () => {
      setImgSrc(src)
    }

    return () => {
      imageLoader.onload = null
    }
  }, [src])

  const height = raiseDecimalPoint((otherProps.height / otherProps.width) * 100)

  return (
    <figure
      className={imageContainer}
      style={{
        margin: `${otherProps.margin ?? 0}px 0`,
        opacity: imgSrc ? 1 : 0,
        transition: 'opacity 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955)'
      }}
    >
      <main className={imageMain} style={{ width: `${otherProps.width}px` }}>
        {/* 헤더 영역 - title이 있을 때만 표시 */}
        {title && (
          <div className={imageHeader}>
            <p className={imageTitle}>{title}</p>
            {onClose && (
              <button className={imageCloseButton} onClick={onClose} type='button' aria-label='Close image'>
                <svg width='16' height='16' viewBox='0 0 16 16' fill='none' xmlns='http://www.w3.org/2000/svg'>
                  <path
                    d='M12 4L4 12M4 4L12 12'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        <div className={imageWrapper} style={{ paddingBottom: `${height}%` }}>
          {imgSrc && (
            <img
              ref={ref}
              className={imageImg}
              decoding='async'
              src={imgSrc ?? ''}
              style={{
                objectFit: objectFit || undefined,
                objectPosition: objectPosition || 'center'
              }}
            />
          )}
        </div>
        {caption && (
          <p className={imageCaption} style={{ marginTop: `${captionSpacing}px` }}>
            {caption}
          </p>
        )}
      </main>
    </figure>
  )
}
