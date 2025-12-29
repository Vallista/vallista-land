import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

import { VideoProps, NeedVideoProp, ReturningUseVideo } from './type'

const initProps: Pick<VideoProps, 'fullscreenable' | 'autoPlay' | 'loop'> = {
  fullscreenable: true,
  autoPlay: false,
  loop: false
}

const toVideoTime = (seconds: number): string => {
  const min = `${Math.floor(seconds / 60)}`
  const sec = `${Math.floor(seconds % 60)}`
  return `${min.padStart(2, '0')}:${sec.padStart(2, '0')}`
}

export const useVideo = <T extends NeedVideoProp>(props: T): ReturningUseVideo => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)

  const [isPlay, setPlay] = useState(false)
  const [currentTime, setCurrentTime] = useState('00:00')
  const [totalTime, setTotalTime] = useState('00:00')
  const [percent, setPercent] = useState(0)
  const [mouseDown, setMouseDown] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isBuffering, setIsBuffering] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showTimelinePreview, setShowTimelinePreview] = useState(false)
  const [timelinePreviewPosition, setTimelinePreviewPosition] = useState(0)

  const onPlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlay) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setPlay(!isPlay)
    }
  }, [isPlay])

  const setMouseSeek = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const position = event.clientX - rect.left
    const dragPercent = position / rect.width

    const videoElement = videoRef?.current
    const previewElement = previewRef?.current
    const moveTime = (videoElement?.duration || 0) * dragPercent

    if (videoElement) videoElement.currentTime = moveTime
    if (previewElement) previewElement.currentTime = moveTime

    setPercent(dragPercent * 100)
  }, [])

  const onFullscreen = useCallback(() => {
    if (videoRef.current && props.fullscreenable) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoRef.current.requestFullscreen()
      }
    }
  }, [props.fullscreenable])

  const handleTimelineHover = useCallback((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const position = event.clientX - rect.left
    const hoverPercent = position / rect.width

    const previewElement = previewRef?.current
    if (previewElement && previewElement.duration) {
      const previewTime = previewElement.duration * hoverPercent
      previewElement.currentTime = previewTime
      setShowPreview(true)
    }

    // 타임라인 프리뷰 표시
    setShowTimelinePreview(true)
    setTimelinePreviewPosition(hoverPercent * 100)
  }, [])

  const handleTimelineLeave = useCallback(() => {
    setShowPreview(false)
    setShowTimelinePreview(false)
  }, [])

  useEffect(() => {
    const videoElement = videoRef?.current
    const previewElement = previewRef?.current
    if (!videoElement) return

    const handleLoadedMetadata = () => {
      setTotalTime(toVideoTime(videoElement.duration))
      setIsLoading(false)

      // 프리뷰 비디오도 같은 메타데이터 로드
      if (previewElement) {
        previewElement.src = videoElement.src
        previewElement.load()
      }
    }

    const handleCanPlay = () => {
      setIsLoading(false)
      setIsBuffering(false)
    }

    const handleWaiting = () => {
      setIsBuffering(true)
    }

    const handlePlaying = () => {
      setIsBuffering(false)
    }

    const handleTimeUpdate = () => {
      const time = videoElement.currentTime
      const duration = videoElement.duration

      setCurrentTime(toVideoTime(time))
      setPercent((time / duration) * 100)
      if (time >= duration) setPlay(false)
    }

    const handleEnded = () => {
      setPlay(false)
      setPercent(0)
      setCurrentTime('00:00')
    }

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata)
    videoElement.addEventListener('canplay', handleCanPlay)
    videoElement.addEventListener('waiting', handleWaiting)
    videoElement.addEventListener('playing', handlePlaying)
    videoElement.addEventListener('timeupdate', handleTimeUpdate)
    videoElement.addEventListener('ended', handleEnded)

    if (props.autoPlay) {
      videoElement.play().then(() => setPlay(true))
    }

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoElement.removeEventListener('canplay', handleCanPlay)
      videoElement.removeEventListener('waiting', handleWaiting)
      videoElement.removeEventListener('playing', handlePlaying)
      videoElement.removeEventListener('timeupdate', handleTimeUpdate)
      videoElement.removeEventListener('ended', handleEnded)
    }
  }, [props.autoPlay])

  return {
    ...initProps,
    ...props,
    videoRef: videoRef as RefObject<HTMLVideoElement>,
    previewRef: previewRef as RefObject<HTMLVideoElement>,
    width: props.width ? `${props.width}px` : '100%',
    height: props.height ? `${props.height}px` : '100%',
    percent,
    currentTime,
    totalTime,
    isPlay,
    isLoading: isLoading || isBuffering,
    showPreview,
    showTimelinePreview,
    timelinePreviewPosition,
    onPlay,
    muted: props.autoPlay || false,
    onFullscreen,
    handleTimelineHover,
    handleTimelineLeave,
    dragArea: {
      onMouseDown: () => setMouseDown(true),
      onMouseUp: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (mouseDown) {
          setMouseSeek(event)
          setMouseDown(false)
        }
      },
      onMouseMove: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (mouseDown) setMouseSeek(event)
      },
      onMouseLeave: () => setMouseDown(false)
    }
  }
}
