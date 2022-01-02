import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { VFC } from 'react'

import { VideoProps } from './type'
import { NeedVideoProp } from './type'
import { useVideo } from './useVideo'

/**
 * # Video
 *
 * @description [vercel design video](https://vercel.com/design/video)
 *
 * 기본적인 비디오 컴포넌트입니다. 해당 컴포넌트로 모든 비디오를 나타냅니다.
 *
 * @param {VideoProps} {@link VideoProps} 기본적인 Video 요소
 *
 * @example ```tsx
 * <Video src='https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_30mb.mp4' />

 * ```
 */
export const Video: VFC<NeedVideoProp> = (props) => {
  const {
    videoRef,
    percent,
    currentTime,
    totalTime,
    isPlay,
    onPlay,
    onFullscreen,
    dragArea,
    width,
    height,
    ...otherProps
  } = useVideo(props)

  return (
    <div>
      <Container width={width} height={height}>
        <Content ref={videoRef} onClick={onPlay} preload='auto' {...otherProps} />
        <Controls>
          <Button onClick={onPlay}>{isPlay ? <PauseSVG /> : <PlaySVG />}</Button>
          <span>{currentTime}</span>
          <Timeline>
            <DragArea {...dragArea} />
            <Progress value={percent} max={100} />
            <Handle
              style={{
                left: `${percent}%`
              }}
            />
          </Timeline>
          <span>{totalTime}</span>
          <Button onClick={onFullscreen}>
            <FullscreenSVG />
          </Button>
        </Controls>
      </Container>
    </div>
  )
}

const PlaySVG: VFC = () => (
  <svg viewBox='0 0 24 24' width='14' height='14' stroke='currentColor' strokeWidth='1.5'>
    <polygon points='5 3 19 12 5 21 5 3' fill='var(--geist-fill)'></polygon>
  </svg>
)

const PauseSVG: VFC = () => (
  <svg viewBox='0 0 24 24' width='14' height='14' stroke='currentColor'>
    <rect x='6' y='4' width='4' height='16' fill='var(--geist-fill)'></rect>
    <rect x='14' y='4' width='4' height='16' fill='var(--geist-fill)'></rect>
  </svg>
)

const FullscreenSVG: VFC = () => (
  <svg viewBox='0 0 24 24' width='18' height='18' stroke='currentColor' strokeWidth='1.5'>
    <path d='M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7M3 9V3m0 0h6M3 3l7 7m11 5v6m0 0h-6m6 0l-7-7'></path>
  </svg>
)

const Container = styled.div<Pick<VideoProps, 'width' | 'height'>>`
  position: relative;
  display: flex;
  justify-content: center;

  ${({ width, height }) => css`
    width: ${width};
    height: ${height};
  `}

  @media (min-width: 992px) {
    & > div {
      transform: translateY(10px);
      opacity: 0;
    }

    &:hover > div {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 992px) {
    & > div {
      transform: scaleY(0);
    }

    &:hover > div {
      transform: scaleY(1);
    }
  }
`

const Content = styled.video`
  width: 100%;
  height: 100%;
  cursor: pointer;
`

const Controls = styled.div`
  position: absolute;
  display: flex;
  bottom: 5%;
  width: 85%;
  height: 40px;
  padding: 0 0.5rem;
  align-items: center;
  transition: all 0.2s cubic-bezier(0.25, 0.57, 0.45, 0.94);

  ${({ theme }) => css`
    background-color: ${theme.colors.PRIMARY.BACKGROUND};
    box-shadow: ${theme.shadows.MEDIUM};
  `};

  & > span {
    box-sizing: border-box;
    width: 60px;
    line-height: 40px;
    padding: 0 12px;
    font-size: 14px;
    font-weight: 600;
  }

  & > button + span {
    padding-left: 0;
  }
`

const Timeline = styled.div`
  position: relative;
  display: flex;
  flex: 1 0 auto;
`

const DragArea = styled.div`
  width: 100%;
  height: 18px;
  background: none;
  cursor: pointer;

  & + progress + div {
    transform: translateX(-4px) scale(0);
  }

  &:hover + progress + div {
    transform: translateX(-4px) scale(1);
  }
`

const Progress = styled.progress`
  appearance: none;
  position: absolute;
  top: calc(50% - 1px);
  left: 0;
  border: none;
  width: 100%;
  height: 2px;
  pointer-events: none;

  ${({ theme }) => css`
    ::-webkit-progress-bar {
      background-color: ${theme.colors.PRIMARY.ACCENT_2};
    }

    ::-webkit-progress-value {
      background-color: ${theme.colors.PRIMARY.FOREGROUND};
    }

    @-moz-document url-prefix() {
      background-color: ${theme.colors.PRIMARY.ACCENT_2};
    }
    ::-moz-progress-bar {
      background-color: ${theme.colors.PRIMARY.FOREGROUND};
    }
  `}
`

const Handle = styled.div`
  position: absolute;
  top: calc(50% - 5px);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  pointer-events: none;
  transition: transform 0.1s ease;

  ${({ theme }) => css`
    background-color: ${theme.colors.PRIMARY.FOREGROUND};
  `}
`

const Button = styled.button`
  display: flex;
  background: none;
  border: 0;
  padding: 0;
  width: 40px;
  height: 40px;
  justify-content: center;
  align-items: center;
  cursor: pointer;

  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.FOREGROUND};
  `}
`
