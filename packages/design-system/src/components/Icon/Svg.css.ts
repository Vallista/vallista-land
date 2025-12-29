import { style, styleVariants } from '@vanilla-extract/css'

export const svgBase = style({
  color: 'currentcolor',
  stroke: 'currentcolor',
  strokeWidth: '1.5',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  shapeRendering: 'geometricPrecision'
})

export const svgAlign = styleVariants({
  bottom: {
    verticalAlign: 'text-bottom'
  },
  top: {
    verticalAlign: 'text-top'
  },
  middle: {
    verticalAlign: 'middle'
  }
})
