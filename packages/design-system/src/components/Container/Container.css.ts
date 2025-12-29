import { style, styleVariants } from '@vanilla-extract/css'
import { recipe, RecipeVariants } from '@vanilla-extract/recipes'

// Base container styles
const containerBase = style({
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box'
})

// Direction variants
const containerDirection = styleVariants({
  row: {
    flexDirection: 'row'
  },
  column: {
    flexDirection: 'column'
  }
})

// Wrap variants
const containerWrap = styleVariants({
  wrap: {
    flexWrap: 'wrap'
  },
  nowrap: {
    flexWrap: 'nowrap'
  }
})

// Justify content variants
const containerJustify = styleVariants({
  start: {
    justifyContent: 'flex-start'
  },
  center: {
    justifyContent: 'center'
  },
  end: {
    justifyContent: 'flex-end'
  },
  between: {
    justifyContent: 'space-between'
  },
  around: {
    justifyContent: 'space-around'
  },
  evenly: {
    justifyContent: 'space-evenly'
  }
})

// Align items variants
const containerAlign = styleVariants({
  start: {
    alignItems: 'flex-start'
  },
  center: {
    alignItems: 'center'
  },
  end: {
    alignItems: 'flex-end'
  },
  stretch: {
    alignItems: 'stretch'
  },
  baseline: {
    alignItems: 'baseline'
  }
})

export const container = recipe({
  base: containerBase,
  variants: {
    direction: containerDirection,
    wrap: containerWrap,
    justify: containerJustify,
    align: containerAlign
  },
  defaultVariants: {
    direction: 'column',
    wrap: 'nowrap',
    justify: 'start',
    align: 'stretch'
  }
})

export type ContainerVariants = RecipeVariants<typeof container>
