import { style, keyframes } from '@vanilla-extract/css'
import { DEFINE_CONTENTS_MIN_WIDTH, DEFINE_CONTENTS_PADDING, DEFINE_CONTENTS_WIDTH } from '@/utils/constant'
import { COLOR_TOKENS } from '@vallista/design-system'

// shimmer 애니메이션 정의
const shimmer = keyframes({
  '0%': {
    backgroundPosition: '-200% 0'
  },
  '100%': {
    backgroundPosition: '200% 0'
  }
})

// 공통 스켈레톤 스타일
const skeletonBase = {
  backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_300,
  backgroundImage:
    'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) 100%)',
  backgroundSize: '200% 100%',
  backgroundRepeat: 'no-repeat',
  animation: `${shimmer} 1.5s infinite`,
  borderRadius: '8px'
}

export const skeletonImage = style({
  ...skeletonBase,
  width: '100%',
  aspectRatio: '2 / 1',
  borderRadius: '12px',
  marginBottom: '24px'
})

export const skeletonTextLine = style({
  ...skeletonBase,
  height: '16px',
  marginBottom: '12px',
  borderRadius: '6px'
})

export const skeletonWrap = style({
  boxSizing: 'border-box',
  minWidth: `${DEFINE_CONTENTS_MIN_WIDTH}px`,
  maxWidth: `${DEFINE_CONTENTS_WIDTH}px`,
  padding: `${DEFINE_CONTENTS_PADDING}px`
})

const root = style({
  margin: '0 auto',
  boxSizing: 'border-box',
  minWidth: `${DEFINE_CONTENTS_MIN_WIDTH}px`,
  maxWidth: `${DEFINE_CONTENTS_WIDTH}px`,
  padding: `${DEFINE_CONTENTS_PADDING}px`,

  selectors: {
    '& > p, & > ul, & > ol': {
      fontSize: '1rem'
    }
  },

  '@media': {
    'screen and (max-width: 1024px)': {
      padding: `${DEFINE_CONTENTS_PADDING}px 16px`,

      selectors: {
        '& > p, & > ul, & > ol': {
          fontSize: '0.875em' // 14px
        }
      }
    }
  }
})

const fadeIn = keyframes({
  '0%': {
    opacity: 0
  },
  '100%': {
    opacity: 1
  }
})

const image = style({
  selectors: {
    '& > p:has(img)': {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '32px 0 !important',
      gap: '12px',
      fontSize: '0.875em',
      lineHeight: '1.5em',
      color: COLOR_TOKENS.PRIMARY.GRAY_700
    },

    '& > p:has(img):first-of-type': {
      marginTop: '0 !important'
    },

    '& > p > img': {
      display: 'block',
      width: '100%',
      height: 'auto',
      borderRadius: '8px',
      aspectRatio: '2 / 1',
      objectFit: 'cover',
      opacity: 0,
      animation: `${fadeIn} 0.1s ease-in-out`
    },

    '& > p > img.loaded': {
      opacity: '1 !important'
    }
  }
})

const text = style({
  selectors: {
    '& > p': {
      lineHeight: '1.6em'
    },

    '& > p:not(:last-of-type)': {
      margin: '1.5em 0'
    }
  }
})

const heading = style({
  selectors: {
    '& > h1, & > h2, & > h3, & > h4': {
      fontWeight: 700,
      lineHeight: 1.4
    }
  }
})

const h1 = style({
  selectors: {
    '& > h1, & > blockquote > h1': {
      fontSize: '2em', // 32px
      marginBottom: '1em'
    },

    '& > h1': {
      marginTop: '2.5em'
    }
  },

  '@media': {
    'screen and (max-width: 1024px)': {
      selectors: {
        '& > h1, & > blockquote > h1': {
          fontSize: '1.75em' // 28px
        }
      }
    }
  }
})

const h2 = style({
  selectors: {
    '& > h2, & > blockquote > h2': {
      fontSize: '1.75em', // 26px
      marginBottom: '1em'
    },

    '& > h2': {
      marginTop: '2em'
    }
  },

  '@media': {
    'screen and (max-width: 1024px)': {
      selectors: {
        '& > h2, & > blockquote > h2': {
          fontSize: '1.5em' // 24px
        }
      }
    }
  }
})

const h3 = style({
  selectors: {
    '& > h3, & > blockquote > h3': {
      fontSize: '1.5em', // 22px
      marginBottom: '1em'
    },

    '& > h3': {
      marginTop: '1.725em'
    }
  },

  '@media': {
    'screen and (max-width: 1024px)': {
      selectors: {
        '& > h3, & > blockquote > h3': {
          fontSize: '1.25em' // 20px
        }
      }
    }
  }
})

const h4 = style({
  selectors: {
    '& > h4, & > blockquote > h4': {
      fontSize: '1.25em', // 18px
      fontWeight: 600,
      marginBottom: '1em'
    },

    '& > h4': {
      marginTop: '1.5em'
    }
  },

  '@media': {
    'screen and (max-width: 1024px)': {
      selectors: {
        '& > h4, & > blockquote > h4': {
          fontSize: '1.125em' // 18px
        }
      }
    }
  }
})

const h5 = style({
  selectors: {
    '& > h5, & > blockquote > h5': {
      fontSize: '1em', // 18px
      fontWeight: 600,
      marginBottom: '1em'
    },

    '& > h4': {
      marginTop: '1.5em'
    }
  },

  '@media': {
    'screen and (max-width: 1024px)': {
      selectors: {
        '& > h5, & > blockquote > h5': {
          fontSize: '0.875em' // 14px
        }
      }
    }
  }
})

const ul = style({
  selectors: {
    '& > ul': {
      listStyle: 'none',
      marginTop: '1.5em',
      marginBottom: '1.5em'
    }
  }
})

const ol = style({
  selectors: {
    '& > ol': {
      listStyle: 'none',
      marginTop: '1.5em',
      marginBottom: '1.5em',
      counterReset: 'list-counter'
    },

    '& > blockquote > ol': {
      listStyle: 'none',
      marginTop: '1.5em',
      marginBottom: '1.5em',
      counterReset: 'list-counter'
    }
  }
})

const li = style({
  selectors: {
    '& > ul code': {
      whiteSpace: 'normal',
      wordWrap: 'break-word',
      wordBreak: 'break-word'
    },

    '& > ul > li, & > blockquote > ul > li': {
      position: 'relative',
      paddingLeft: '1.5em',
      lineHeight: '1.5em'
    },

    '& > ul > li:not(:last-of-type), & > blockquote > ul > li:not(:last-of-type)': {
      marginBottom: '0.5em'
    },

    '& > ul > li::before, & > blockquote > ul > li::before': {
      content: "''",
      position: 'absolute',
      background: COLOR_TOKENS.PRIMARY.GRAY_800,
      left: 0,
      top: '0.6em',
      width: '0.4em',
      height: '0.4em',
      borderRadius: '50%'
    },

    '& > ol > li, & > blockquote > ol > li': {
      counterIncrement: 'list-counter',
      position: 'relative',
      paddingLeft: '1.5em',
      lineHeight: '1.5em'
    },

    '& > ol > li:not(:last-of-type), & > blockquote > ol > li:not(:last-of-type)': {
      marginBottom: '0.5em'
    },

    '& > ol > li::before, & > blockquote > ol > li::before': {
      content: 'counter(list-counter) "."',
      position: 'absolute',
      color: COLOR_TOKENS.PRIMARY.GRAY_800,
      left: 0,
      width: '0.4em',
      height: '0.4em',
      borderRadius: '50%'
    }
  }
})

const blockquote = style({
  selectors: {
    '& > blockquote': {
      margin: '2em 0',
      padding: '1em 1.25em',
      background: COLOR_TOKENS.PRIMARY.GRAY_50,
      borderLeft: `4px solid ${COLOR_TOKENS.PRIMARY.GRAY_500}`,
      color: COLOR_TOKENS.PRIMARY.GRAY_800,
      fontStyle: 'italic',
      lineHeight: 1.6
    },

    '& > blockquote > p:not(:last-of-type)': {
      marginBottom: '1em'
    }
  }
})

const pre = style({
  selectors: {
    '& pre code': {
      width: '100%',
      display: 'block',
      overflowX: 'auto'
    },

    '& figure pre': {
      boxSizing: 'border-box',
      fontFamily: "'Fira Code', 'Source Code Pro', 'JetBrains Mono', monospace",
      fontSize: '1em',
      backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_800,
      color: COLOR_TOKENS.PRIMARY.GRAY_100,
      padding: '1rem 1.25rem',
      borderRadius: '8px',
      lineHeight: 1.6,
      overflowX: 'auto',
      whiteSpace: 'pre',
      wordBreak: 'normal',
      margin: '2rem 0',
      boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.05) inset'
    },

    '& figure pre code': {
      display: 'block'
    },

    '& figure pre .line': {
      display: 'block',
      padding: '0 0.25rem'
    },

    '& figure pre .line.highlighted': {
      backgroundColor: 'rgba(255, 255, 255, 0.07)'
    },

    '& figure pre .word': {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      padding: '0.1em 0.2em',
      borderRadius: '4px'
    },

    '& figure pre::-webkit-scrollbar': {
      height: '8px'
    },

    '& figure pre::-webkit-scrollbar-thumb': {
      backgroundColor: COLOR_TOKENS.PRIMARY.GRAY_600,
      borderRadius: '4px'
    },

    '& figure pre::-webkit-scrollbar-track': {
      background: 'transparent'
    }
  },

  '@media': {
    'screen and (max-width: 1024px)': {
      selectors: {
        '& figure pre': {
          fontSize: '0.75em' // 12px
        }
      }
    }
  }
})

const strong = style({
  selectors: {
    '& > p > strong': {
      fontWeight: 700
    }
  }
})

export const markdown = style([root, image, text, heading, h1, h2, h3, h4, h5, ul, li, ol, blockquote, pre, strong])
