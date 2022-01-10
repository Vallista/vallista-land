import { css, Theme } from '@emotion/react'
import styled from '@emotion/styled'
import { CSSProperties, useEffect, useRef, useState, VFC } from 'react'

import { useMount } from '../../hooks/useMount'
import { AvailablePickedColor } from '../ThemeProvider/type'
import { ToastElementProps, ToastType } from './type'

const REMOVE_TIME = 5000

/**
 * # Toast
 *
 * 실제로 사용되지 않습니다.
 * useToasts로 생성하면 자동으로 컴포넌트가 등록됩니다.
 */
export const Toast: VFC<ToastElementProps> = (props) => {
  const { order, hover, text, type, remove } = props
  const ref = useRef<HTMLDivElement>(null)
  const [styleProps, setStyleProps] = useState<CSSProperties>({})
  const [destroy, setDestroy] = useState(false)

  useMount(() => {
    // 삭제 이벤트
    // 1. 5초 후 삭제
    // 2. 애니메이션 (transition opacity) 후 삭제
    const destroyInstance = setTimeout(() => {
      setDestroy(true)

      ref.current?.addEventListener('transitionend', () => {
        remove()
      })
    }, REMOVE_TIME)

    return () => {
      clearTimeout(destroyInstance)
      if (ref.current) ref.current.ontransitionend = null
    }
  })

  useEffect(() => {
    const parentNodes = ref.current?.parentElement?.children
    // element 순서상 밑으로 갈 수록 앞에 있어야 함.
    // 역순이기 때문에 length 기준으로 order를 빼고 인덱스를 가져온다.
    const beforeToastIndex = (parentNodes?.length ?? 0) - 1 - order
    let beforeHeight = 50
    // 인덱스 기준까지의 height를 계산한다.
    beforeHeight = Array.from(parentNodes ?? [])
      .filter((_, idx) => beforeToastIndex < idx)
      .reduce<number>((acc, curr) => {
        acc += Math.floor(curr.getBoundingClientRect().height) + 20
        return acc
      }, 0)

    const height = ref.current?.getBoundingClientRect().height ?? '50'

    // 폴딩된 height
    let transform =
      order === 0
        ? 'none'
        : `translate3d(0, calc(${height}px + -100% + ${-20 * order}px), -${order}px) scale(${1 - order * 0.05})`

    // 폴딩 되지 않을 경우 계산된 height 높이만큼 올린다.
    if (hover && order !== 0) {
      transform = `translate3d(0, -${beforeHeight}px, -${order}px) scale(1)`
    }

    setStyleProps({
      opacity: '1',
      transform
    })
  }, [order, hover])

  return (
    <ToastContainer ref={ref} style={styleProps} type={type} destroy={destroy}>
      <ToastWrapper>
        <ToastMessage>{text}</ToastMessage>
      </ToastWrapper>
    </ToastContainer>
  )
}

const ToastTypeMapper: (theme: Theme) => Record<ToastType, AvailablePickedColor> = (theme) => ({
  primary: theme.colors.PRIMARY.BACKGROUND,
  success: theme.colors.SUCCESS.DEFAULT,
  error: theme.colors.ERROR.DEFAULT
})

const ToastContainer = styled.div<Pick<ToastElementProps, 'type'> & { destroy: boolean }>`
  position: absolute;
  bottom: 0;
  right: 0;
  border-radius: 5px;
  padding: 24px;
  transition: all 0.4s ease;
  box-sizing: border-box;
  opacity: 0;
  transform: translate3d(0, 100%, 150px) scale(1);

  ${({ theme, type, destroy }) => css`
    box-shadow: ${theme.shadows.SMALL};
    background: ${ToastTypeMapper(theme)[type]};
    color: ${type === 'primary' ? theme.colors.PRIMARY.FOREGROUND : '#fff'};
    z-index: ${theme.layers.SNACKBAR};

    ${destroy &&
    css`
      opacity: 0 !important;
    `}
  `}

  @media (max-width: 440px) {
    width: 90vw;
  }
`

const ToastWrapper = styled.div`
  max-width: 100%;
  width: 420px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
`

const ToastMessage = styled.div`
  margin-top: -1px;
  width: 100%;
  height: 100%;
  word-break: break-word;
`
