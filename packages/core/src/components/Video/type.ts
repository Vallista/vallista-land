import { RefObject } from 'react'

export interface VideoProps {
  src: string
  width: number
  height: number
  fullscreenable: boolean
  autoPlay: boolean
  loop: boolean
}

export type NeedVideoProp = Partial<Pick<VideoProps, 'width' | 'height' | 'fullscreenable' | 'autoPlay' | 'loop'>> &
  Pick<VideoProps, 'src'>

export type ReturningUseVideo<T extends NeedVideoProp = NeedVideoProp> = T & {
  videoRef: RefObject<HTMLVideoElement>
  width: string
  height: string
  currentTime: string
  totalTime: string
  percent: number
  isPlay: boolean
  onPlay: () => void
  onFullscreen: () => void
  dragArea: {
    onMouseDown: () => void
    onMouseUp: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
    onMouseMove: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
    onMouseLeave: () => void
  }
}
