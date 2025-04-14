import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { useRef } from 'react'

import { Colors } from '../ThemeProvider/type'
import { SnippetMapperType, SnippetProps, SnippetType } from './type'
import { useSnippet } from './useSnippet'

/**
 * # Snippet
 *
 * 코드를 쉽게 공유할 때 사용하는 스니펫입니다.
 *
 * @param {SnippetProps} {@link SnippetProps}
 *
 * @example ```tsx
 * <Snippet text='npm init next-app' width='300px' type='success' fill />
 * ```
 */
export const Snippet = (props: Partial<SnippetProps>) => {
  const { width = '300px', text, handleCopy, fill, ...otherProps } = useSnippet(props)
  const ref = useRef<HTMLDivElement>(null)

  return (
    <Container width={width} fill={String(fill)} {...otherProps} ref={ref}>
      {text.map((it, idx) => (
        <Row key={`${it}-${idx}`} {...otherProps}>
          {it}
        </Row>
      ))}
      <CopyButton onClick={() => handleCopy(ref.current?.innerText ?? '')}>
        <svg
          viewBox='0 0 24 24'
          width='24'
          height='24'
          color='currentcolor'
          stroke='currentcolor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
          shapeRendering='geometricPrecision'
        >
          <path d='M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866m-6 .17h8c1.105 0 2 .91 2 2.035v10.857C20 21.09 19.105 22 18 22h-8c-1.105 0-2-.911-2-2.036V9.107c0-1.124.895-2.036 2-2.036z' />
        </svg>
      </CopyButton>
    </Container>
  )
}

const SnippetTypeMapper: (props: { fill?: boolean }) => SnippetMapperType = ({ fill }) => ({
  primary: {
    background: Colors.PRIMARY.BACKGROUND,
    border: Colors.PRIMARY.ACCENT_2,
    color: Colors.PRIMARY.FOREGROUND
  },
  secondary: {
    background: fill ? Colors.PRIMARY.ACCENT_5 : Colors.PRIMARY.BACKGROUND,
    border: Colors.PRIMARY.ACCENT_5,
    color: fill ? Colors.PRIMARY.BACKGROUND : Colors.PRIMARY.ACCENT_5
  },
  success: {
    background: fill ? Colors.SUCCESS.DEFAULT : Colors.PRIMARY.BACKGROUND,
    border: Colors.SUCCESS.DEFAULT,
    color: fill ? Colors.PRIMARY.BACKGROUND : Colors.SUCCESS.DEFAULT
  },
  error: {
    background: fill ? Colors.ERROR.DEFAULT : Colors.PRIMARY.BACKGROUND,
    border: Colors.ERROR.DEFAULT,
    color: fill ? Colors.PRIMARY.BACKGROUND : Colors.ERROR.DEFAULT
  },
  warning: {
    background: fill ? Colors.WARNING.DEFAULT : Colors.PRIMARY.BACKGROUND,
    border: Colors.WARNING.DEFAULT,
    color: fill ? Colors.PRIMARY.BACKGROUND : Colors.WARNING.DEFAULT
  },
  lite: {
    background: Colors.PRIMARY.ACCENT_1,
    border: Colors.PRIMARY.ACCENT_2,
    color: Colors.PRIMARY.FOREGROUND
  }
})

const Container = styled.div<{ width: string; type: SnippetType; dark?: boolean; fill?: string }>`
  ${({ theme, width, type, dark, fill }) => css`
    position: relative;
    width: ${width};
    max-width: 100%;
    padding: 9px 42px 9px 12px;
    box-sizing: border-box;
    border-radius: 5px;
    background: ${SnippetTypeMapper({ fill: fill === 'true' })[type]['background']};
    border: 1px solid ${SnippetTypeMapper({ fill: fill === 'true' })[type]['border']};
    color: ${SnippetTypeMapper({ fill: fill === 'true' })[type]['color']};

    ${dark &&
    css`
      background: ${theme.colors.PRIMARY.FOREGROUND};
      border: 1px solid ${theme.colors.PRIMARY.FOREGROUND};
      color: ${theme.colors.PRIMARY.BACKGROUND};
    `}
  `}
`

const Row = styled.pre<{ prompt: boolean }>`
  text-align: left;
  margin: 0;
  font-size: 13px;
  line-height: 20px;
  color: currentcolor;

  ${({ prompt }) =>
    prompt &&
    css`
      &:before {
        content: '$ ';
        user-select: none;
      }
    `}
`

const CopyButton = styled.button`
  color: currentcolor;
  outline: none;
  cursor: pointer;
  position: absolute;
  top: 3px;
  right: 0;
  display: flex;
  align-items: center;
  background: none;
  border: none;
  outline: none;
  padding: 4px 12px;
  border-radius: 0 5px 5px 0;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.5;
  }
`
