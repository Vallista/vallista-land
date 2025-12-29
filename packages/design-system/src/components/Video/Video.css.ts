import { style } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'
import { COLOR_TOKENS } from '../../theme/colorTokens'

// Base video container styles
const videoContainerBase = style({
  position: 'relative',
  width: '100%',
  height: 'auto',
  backgroundColor: COLOR_TOKENS.PRIMARY.BLACK,
  borderRadius: '8px',
  overflow: 'hidden'
})

// Base video element styles
const videoElementBase = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
})

// Video preview styles
const videoPreviewBase = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  pointerEvents: 'none',
  zIndex: 1
})

const videoPreviewVisible = style({
  opacity: 1
})

// Loading overlay styles
const loadingOverlayBase = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10
})

const loadingSpinnerBase = style({
  width: '40px',
  height: '40px',
  border: '3px solid rgba(255, 255, 255, 0.3)',
  borderTop: '3px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
})

// Top controls styles
const topControlsBase = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  padding: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  background: 'linear-gradient(rgba(0, 0, 0, 0.6), transparent)',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  zIndex: 5,
  selectors: {
    '&:hover': {
      opacity: 1
    }
  }
})

// Bottom controls styles
const bottomControlsBase = style({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.9))',
  padding: '20px 16px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  zIndex: 5,
  selectors: {
    [`${videoContainerBase}:hover &`]: {
      opacity: 1
    }
  }
})

// Controls row styles
const controlsRowBase = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%'
})

// Time display styles
const timeDisplayBase = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: 'var(--primary-background)',
  fontSize: '14px',
  fontWeight: '500'
})

const currentTimeBase = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
})

const timeCircleBase = style({
  width: '8px',
  height: '8px',
  backgroundColor: 'var(--success-default)',
  borderRadius: '50%',
  animation: 'pulse 2s infinite'
})

// Timeline styles
const timelineBase = style({
  width: '100%',
  height: '6px',
  backgroundColor: 'rgba(255, 255, 255, 0.4)',
  borderRadius: '3px',
  cursor: 'pointer',
  position: 'relative'
})

// Timeline preview overlay styles
const timelinePreviewOverlayBase = style({
  position: 'absolute',
  bottom: '20px',
  left: '0',
  width: '160px',
  height: '90px',
  backgroundColor: 'var(--primary-foreground)',
  borderRadius: '8px',
  border: '2px solid rgba(255, 255, 255, 0.4)',
  overflow: 'hidden',
  opacity: 0,
  visibility: 'hidden',
  transition: 'opacity 0.3s ease, visibility 0.3s ease',
  zIndex: 10,
  transform: 'translateX(-50%)',
  pointerEvents: 'none'
})

const timelinePreviewOverlayVisible = style({
  opacity: 1,
  visibility: 'visible'
})

// Timeline preview video styles
const timelinePreviewVideoBase = style({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
})

// Drag area styles
const dragAreaBase = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  cursor: 'pointer'
})

// Progress bar styles
const progressBase = style({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '100%',
  backgroundColor: 'var(--success-default)',
  borderRadius: '3px',
  transition: 'width 0.1s ease'
})

// Handle styles
const handleBase = style({
  position: 'absolute',
  top: '50%',
  width: '16px',
  height: '16px',
  backgroundColor: 'var(--primary-background)',
  borderRadius: '50%',
  transform: 'translate(-50%, -50%)',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
  transition: 'transform 0.2s ease',
  selectors: {
    '&:hover': {
      transform: 'translate(-50%, -50%) scale(1.2)'
    }
  }
})

// Button styles
const buttonBase = style({
  background: 'rgba(0, 0, 0, 0.7)',
  border: 'none',
  color: 'var(--primary-background)',
  cursor: 'pointer',
  padding: '8px',
  borderRadius: '6px',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  selectors: {
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      transform: 'scale(1.05)'
    }
  }
})

// Disabled button styles
const buttonDisabledBase = style({
  background: 'rgba(0, 0, 0, 0.4)',
  border: 'none',
  color: 'var(--primary-accent-3)',
  cursor: 'not-allowed',
  padding: '8px',
  borderRadius: '6px',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.5
})

export const videoContainer = recipe({
  base: videoContainerBase
})

export const videoElement = recipe({
  base: videoElementBase
})

export const videoPreview = recipe({
  base: videoPreviewBase,
  variants: {
    visible: {
      true: videoPreviewVisible
    }
  }
})

export const loadingOverlay = recipe({
  base: loadingOverlayBase
})

export const loadingSpinner = recipe({
  base: loadingSpinnerBase
})

export const topControls = recipe({
  base: topControlsBase
})

export const bottomControls = recipe({
  base: bottomControlsBase
})

export const controlsRow = recipe({
  base: controlsRowBase
})

export const timeDisplay = recipe({
  base: timeDisplayBase
})

export const currentTime = recipe({
  base: currentTimeBase
})

export const timeCircle = recipe({
  base: timeCircleBase
})

export const timeline = recipe({
  base: timelineBase
})

export const timelinePreviewOverlay = recipe({
  base: timelinePreviewOverlayBase,
  variants: {
    visible: {
      true: timelinePreviewOverlayVisible
    }
  }
})

export const timelinePreviewVideo = recipe({
  base: timelinePreviewVideoBase
})

export const dragArea = recipe({
  base: dragAreaBase
})

export const progress = progressBase

export const handle = recipe({
  base: handleBase
})

export const button = recipe({
  base: buttonBase,
  variants: {
    disabled: {
      true: buttonDisabledBase
    }
  }
})

export type VideoVariants = RecipeVariants<typeof videoContainer>
