import { NeedVideoProp } from './type'
import { useVideo } from './useVideo'
import {
  videoContainer,
  videoElement,
  videoPreview,
  loadingOverlay,
  loadingSpinner,
  bottomControls,
  timeDisplay,
  currentTime,
  timeCircle,
  timeline,
  timelinePreviewOverlay,
  timelinePreviewVideo,
  dragArea,
  progress,
  handle,
  button,
  controlsRow
} from './Video.css'

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
export const Video = (props: NeedVideoProp) => {
  const {
    videoRef,
    previewRef,
    percent,
    currentTime: currentTimeValue,
    totalTime,
    isPlay,
    isLoading,
    showPreview,
    showTimelinePreview,
    timelinePreviewPosition,
    onPlay,
    onFullscreen,
    handleTimelineHover,
    handleTimelineLeave,
    dragArea: dragAreaProps,
    width,
    height,
    fullscreenable = true,
    ...otherProps
  } = useVideo(props)

  return (
    <div>
      <div className={videoContainer()} style={{ width, height }}>
        <video ref={videoRef} onClick={onPlay} preload='auto' className={videoElement()} {...otherProps} />

        {/* 비디오 프리뷰 */}
        <video ref={previewRef} className={videoPreview({ visible: showPreview })} muted preload='metadata' />

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className={loadingOverlay()}>
            <div className={loadingSpinner()} />
          </div>
        )}

        {/* 하단 컨트롤 (재생/일시정지, 전체화면, 시간 표시, 프로그레스바) */}
        <div className={bottomControls()}>
          {/* 프로그레스바 (상단) */}
          <div className={timeline()} onMouseMove={handleTimelineHover} onMouseLeave={handleTimelineLeave}>
            <div className={dragArea()} {...dragAreaProps} />
            <div className={progress} style={{ width: `${percent}%` }} />
            <div
              className={handle()}
              style={{
                left: `${percent}%`
              }}
            />

            {/* 타임라인 프리뷰 오버레이 */}
            <div
              className={timelinePreviewOverlay({ visible: showTimelinePreview })}
              style={{ left: `${timelinePreviewPosition}%` }}
            >
              <video ref={previewRef} className={timelinePreviewVideo()} muted preload='metadata' {...otherProps} />
            </div>
          </div>

          {/* 시간 표시 (중간) */}
          <div className={timeDisplay()}>
            <div className={currentTime()}>
              <div className={timeCircle()} />
              {currentTimeValue}
            </div>
            <span>{totalTime}</span>
          </div>

          {/* 컨트롤 버튼 행 (하단) */}
          <div className={controlsRow()}>
            <button className={button()} onClick={onPlay}>
              {isPlay ? <PauseSVG /> : <PlaySVG />}
            </button>
            {fullscreenable && (
              <button className={button()} onClick={onFullscreen}>
                <FullscreenSVG />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const PlaySVG = () => (
  <svg viewBox='0 0 24 24' width='16' height='16' stroke='currentColor' strokeWidth='2' fill='none'>
    <polygon points='5 3 19 12 5 21 5 3' fill='currentColor'></polygon>
  </svg>
)

const PauseSVG = () => (
  <svg viewBox='0 0 24 24' width='16' height='16' stroke='currentColor' strokeWidth='2' fill='none'>
    <rect x='6' y='4' width='4' height='16' fill='currentColor'></rect>
    <rect x='14' y='4' width='4' height='16' fill='currentColor'></rect>
  </svg>
)

const FullscreenSVG = () => (
  <svg viewBox='0 0 24 24' width='16' height='16' stroke='currentColor' strokeWidth='2' fill='none'>
    <path d='M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7M3 9V3m0 0h6M3 3l7 7m11 5v6m0 0h-6m6 0l-7-7'></path>
  </svg>
)
