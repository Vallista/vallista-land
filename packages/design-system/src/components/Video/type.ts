import React from 'react'

export interface VideoProps {
  src: string
  width?: number
  height?: number
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  fullscreenable?: boolean
  controls?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  poster?: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: React.EventHandler<React.SyntheticEvent<HTMLVideoElement, Event>>
  onLoadedMetadata?: () => void
  onError?: React.EventHandler<React.SyntheticEvent<HTMLVideoElement, Event>>
}

export type NeedVideoProp = Pick<VideoProps, 'src'> & Partial<Omit<VideoProps, 'src'>>

export interface ReturningUseVideo {
  videoRef: React.RefObject<HTMLVideoElement>
  previewRef: React.RefObject<HTMLVideoElement>
  width: string
  height: string
  percent: number
  currentTime: string
  totalTime: string
  isPlay: boolean
  isLoading: boolean
  showPreview: boolean
  showTimelinePreview: boolean
  timelinePreviewPosition: number
  onPlay: () => void
  onFullscreen: () => void
  handleTimelineHover: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  handleTimelineLeave: () => void
  dragArea: {
    onMouseDown: () => void
    onMouseUp: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
    onMouseMove: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
    onMouseLeave: () => void
  }
  // VideoProps의 나머지 속성들
  src: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
  fullscreenable?: boolean
  controls?: boolean
  preload?: 'none' | 'metadata' | 'auto'
  poster?: string
  onPause?: () => void
  onEnded?: () => void
  onTimeUpdate?: React.EventHandler<React.SyntheticEvent<HTMLVideoElement, Event>>
  onLoadedMetadata?: () => void
  onError?: React.EventHandler<React.SyntheticEvent<HTMLVideoElement, Event>>
}
