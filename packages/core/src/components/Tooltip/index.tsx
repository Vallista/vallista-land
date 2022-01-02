import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC, useEffect, useRef, useState } from 'react'

import { AvailablePickedColor, Colors } from '../../components/ThemeProvider'
import { TooltipPosition, TooltipType, TooltipProps } from './type'
import { useTooltip } from './useTooltip'

export const Tooltip: FC<TooltipProps> = (props) => {
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

const ChildrenWrapper = styled.div``

const distanceGap = 10

const tooltipBackgroundMapper: Record<TooltipType, AvailablePickedColor> = {
  primary: Colors.PRIMARY.FOREGROUND,
  success: Colors.SUCCESS.DEFAULT,
  warning: Colors.WARNING.DEFAULT,
  error: Colors.ERROR.DEFAULT,
  secondary: Colors.PRIMARY.ACCENT_5
}

const Popup = styled.div<{
  type: TooltipType
  isHover: boolean
  position: TooltipPosition
  width: number
  height: number
}>`
  width: 250px;
  position: absolute;
  opacity: 0;
  transition: opacity 0.2s ease-in;
  ${({ theme, position, width, height, type }) => css`
    z-index: ${theme.layers.FOREGROUND};
    color: ${theme.colors.PRIMARY.BACKGROUND};
    background: ${tooltipBackgroundMapper[type]};
    padding: 24px;
    border-radius: 5px;
    box-sizing: border-box;

    &::after {
      content: '';
      position: absolute;
      width: 10px;
      height: 10px;
      background: ${tooltipBackgroundMapper[type]};
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
