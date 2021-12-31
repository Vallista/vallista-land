import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { useEffect, useRef, useState, VFC } from 'react'

import { raiseDecimalPoint } from '../../utils/math'
import { ImageProps } from './type'

/**
 * # Image
 * 
 * 이미지 컴포넌트.
 * 
 * 1. 이미지를 불러오기 전 로딩을 진행하고
 * 2. 로딩이 완료되면 fade-in 애니메이션으로 보여줍니다.
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
  />
 * ```
 */
export const ImageComponent: VFC<ImageProps> = (props) => {
  const { caption, captionSpacing, src, ...otherProps } = props

  const ref = useRef<HTMLImageElement>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  useEffect(() => {
    const imageLoader = new Image()
    imageLoader.src = src

    imageLoader.onload = () => {
      setImgSrc(src)
    }
  }, [])

  const height = raiseDecimalPoint((otherProps.height / otherProps.width) * 100)
  const onlyProps = {
    src: imgSrc
  }

  return (
    <Container {...onlyProps} {...otherProps} show={!!imgSrc}>
      <Main width={otherProps.width}>
        <Wrapper height={height}>
          <Img ref={ref} decoding='async' src={imgSrc ?? ''} />
        </Wrapper>
        {caption && <Caption style={{ marginTop: `${captionSpacing}px` }}>{caption}</Caption>}
      </Main>
    </Container>
  )
}

const Container = styled.figure<{ show: boolean } & Pick<ImageProps, 'width' | 'height' | 'margin'>>`
  display: block;
  text-align: center;
  ${({ show, margin }) => css`
    margin: ${margin ?? 0}px 0;
    opacity: ${show ? 1 : 0};
    transition: opacity 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955);
  `}
`

const Main = styled.main<Pick<ImageProps, 'width'>>`
  ${({ width }) => css`
    width: ${width}px;
    margin: 0 auto;
    max-width: 100%;
  `}
`

const Wrapper = styled.div<{ height: number }>`
  display: flex;
  justify-content: center;
  position: relative;
  ${({ height }) => css`
    padding-bottom: ${height}%;
  `}
`

const Img = styled.img`
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
`

const Caption = styled.p`
  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.ACCENT_5};
    font-size: 14px;
    text-align: center;
  `}
`
