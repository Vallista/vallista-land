import { ElementType } from 'react'

import { TextProps } from './type'
import { useText } from './useText'
import { text } from './Text.css'

/**
 * # Text
 *
 * @description [vercel design text](https://vercel.com/design/text)
 *
 * 기본적인 텍스트 컴포넌트입니다. 해당 컴포넌트로 모든 텍스트를 나타냅니다.
 *
 * @param {TextProps} {@link TextProps} 기본적인 Text 요소
 *
 * @example ```tsx
 * <Text color={Colors.HIGHLIGHT.PINK} size={20} as='h1'>Hello World!</Text>
 * ```
 */
export const Text = (props: Partial<TextProps>) => {
  const {
    as = 'p',
    children,
    size,
    lineHeight,
    weight,
    transform,
    align,
    color,
    textWrap,
    ...otherProps
  } = useText(props)

  const textClass = text({
    size,
    lineHeight,
    weight,
    transform,
    align,
    color: color as 'primary' | 'success' | 'error' | 'white' | 'secondary' | 'warning' | undefined
  })

  const Component = as as ElementType
  return (
    <Component
      className={textClass}
      style={{
        whiteSpace: textWrap === false ? 'nowrap' : undefined
      }}
      {...otherProps}
    >
      {children}
    </Component>
  )
}
