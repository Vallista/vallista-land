import { useCallback, useEffect, useRef, useState } from 'react'

import { VideoProps, NeedVideoProp, ReturningUseVideo } from './type'

const initProps: Pick<VideoProps, 'fullscreenable' | 'autoPlay' | 'loop'> = {
  fullscreenable: true,
  autoPlay: false,
  loop: false
}

const toVideoTime = (seconds: number): string => {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  const mm = min < 10 ? `0${min}` : `${min}`
  const ss = sec < 10 ? `0${sec}` : `${sec}`
  return `${mm}:${ss}`
}

export const useVideo = <T extends NeedVideoProp>(props: T): ReturningUseVideo => {
  const videoRef = useRef<HTMLVideoElement>(null)

  const [isPlay, setPlay] = useState(false)
  const [currentTime, setCurrentTime] = useState('00:00')
  const [percent, setPercent] = useState(0)
  const [mouseDown, setMouseDown] = useState(false)

  const onPlay = useCallback(() => {
    setPlay(!isPlay)
    !isPlay ? videoRef?.current?.play() : videoRef?.current?.pause()
  }, [isPlay])

  const setMouseSeek = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const position = event.clientX - rect.left
    const dragPercent = position / rect.width

    const videoElement = videoRef?.current
    const moveTime = (videoElement?.duration || 0) * dragPercent
    videoElement && (videoElement.currentTime = moveTime)
    setPercent(dragPercent * 100)
  }, [])

  useEffect(() => {
    const videoElement = videoRef?.current
    videoElement?.addEventListener('timeupdate', () => {
      const time = videoElement.currentTime
      const duration = videoElement.duration

      setCurrentTime(toVideoTime(time))
      setPercent((time / duration) * 100)
      time >= duration && setPlay(false)
    })
    props.autoPlay && onPlay()
  }, [])

  return {
    ...initProps,
    ...props,
    videoRef,
    width: props.width ? `${props.width}px` : '100%',
    height: props.height ? `${props.height}px` : '100%',
    percent,
    currentTime,
    totalTime: toVideoTime(videoRef?.current?.duration || 0),
    isPlay,
    onPlay,
    muted: props.autoPlay || false,
    onFullscreen: () => videoRef?.current?.requestFullscreen(),
    dragArea: {
      onMouseDown: () => setMouseDown(true),
      onMouseUp: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        mouseDown && (setMouseSeek(event), setMouseDown(false))
      },
      onMouseMove: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        mouseDown && setMouseSeek(event)
      },
      onMouseLeave: () => setMouseDown(false)
    }
  }
}
