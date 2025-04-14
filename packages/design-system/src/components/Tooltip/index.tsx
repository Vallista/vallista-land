import { css, Theme } from '@emotion/react'
import styled from '@emotion/styled'
import { useEffect, useRef, useState } from 'react'

import { AvailablePickedColor } from '../../components/ThemeProvider'
import { TooltipPosition, TooltipType, TooltipProps } from './type'
import { useTooltip } from './useTooltip'

export const Tooltip = (props: TooltipProps) => {
  const { text, position, type, children } = useTooltip(props)
  const childrenRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [isHover, setHover] = useState(false)
  const [isTransitionEnd, setTransitionEnd] = useState(true)

  useEffect(() => {
    if (childrenRef.current) {
      setWidth(childrenRef.current.getBoundingClientRect().width)
      setHeight(childrenRef.current.getBoundingClientRect().height)
    }
  }, [childrenRef])

  return (
    <Container onMouseOver={() => handleHover(true)} onMouseOut={() => handleHover(false)}>
      <ChildrenWrapper ref={childrenRef}>{children}</ChildrenWrapper>
      {(!isTransitionEnd || isHover) && (
        <Popup
          onMouseOver={() => handleHover(true)}
          onMouseOut={() => handleHover(false)}
          onTransitionEnd={() => setTransitionEnd(true)}
          isHover={isHover}
          position={position}
          type={type}
          width={width}
          height={height}
        >
          {text}
        </Popup>
      )}
    </Container>
  )

  function handleHover(flag: boolean): void {
    setHover(flag)
    setTransitionEnd(false)
  }
}

const Container = styled.div`
  position: relative;

  &:hover {
    & > div:last-of-type {
      opacity: 1;
    }
  }
`

const ChildrenWrapper = styled.div`
  position: relative;
`

const distanceGap = 10

const tooltipBackgroundMapper: (theme: Theme) => Record<TooltipType, AvailablePickedColor> = (theme) => ({
  primary: theme.colors.PRIMARY.FOREGROUND,
  success: theme.colors.SUCCESS.DEFAULT,
  warning: theme.colors.WARNING.DEFAULT,
  error: theme.colors.ERROR.DEFAULT,
  secondary: theme.colors.PRIMARY.ACCENT_5
})

const Popup = styled.div<{
  type: TooltipType
  isHover: boolean
  position: TooltipPosition
  width: number
  height: number
}>`
  cursor: default;
  max-width: 250px;
  width: auto;
  position: absolute;
  opacity: 0;
  transition: opacity 0.2s ease-in;
  text-align: center;

  & {
    white-space: pre;
  }

  ${({ theme, position, width, height, type }) => css`
    z-index: ${theme.layers.AFTER_STANDARD};
    color: ${theme.colors.PRIMARY.BACKGROUND};
    background: ${tooltipBackgroundMapper(theme)[type]};
    padding: 24px;
    border-radius: 5px;
    box-sizing: border-box;

    &::after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      background: ${tooltipBackgroundMapper(theme)[type]};
    }

    ${position === 'top' &&
    css`
      left: 50%;
      bottom: ${height}px;
      transform: translate(-50%, -${distanceGap}px);

      &::after {
        left: 50%;
        bottom: -5px;
        transform: translate(-50%, 0) rotate(45deg);
      }
    `}

    ${position === 'right' &&
    css`
      left: ${width}px;
      top: 50%;
      transform: translate(${distanceGap}px, -50%);

      &::after {
        left: -5px;
        top: 50%;
        transform: translate(0, -50%) rotate(45deg);
      }
    `}

    ${position === 'bottom' &&
    css`
      left: 50%;
      top: ${height}px;
      transform: translate(-50%, ${distanceGap}px);

      &::after {
        left: 50%;
        top: -5px;
        transform: translate(-50%, 0) rotate(45deg);
      }
    `}

    ${position === 'left' &&
    css`
      right: ${width}px;
      top: 50%;
      transform: translate(-${distanceGap}px, -50%);

      &::after {
        right: -5px;
        top: 50%;
        transform: translate(0, -50%) rotate(45deg);
      }
    `}
  `}
`
