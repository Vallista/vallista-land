import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC } from 'react'

import { useModalContext } from '../context'

interface ActionProps {
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick: (() => void) | (() => Promise<void>)
  children: React.ReactNode
}

/**
 * # Modal.Action
 *
 * 모달의 버튼 영역입니다. Actions 하위로 배치해주세요.
 *
 * @prop {ActionProps} {@link ActionProps} 기본 버튼 액션
 *
 * @example ```tsx
 * <Modal.Action onClick={() => void 0}>Button</Modal.Action>
 * ```
 */
const Action: FC<ActionProps> = (props) => {
  const { children, type = 'button', disabled, onClick } = useModalContext(props)

  return (
    <Button type={type} onClick={onClick} disabled={disabled}>
      {children}
    </Button>
  )
}

const Button = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1 1 100%;
  padding: 1rem 0;
  border: none;
  outline: none;
  margin: 0;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  text-decoration: none;

  ${({ theme }) => css`
    background: ${theme.colors.PRIMARY.BACKGROUND};
    color: ${theme.colors.PRIMARY.ACCENT_5};
    border-right: 1px solid ${theme.colors.PRIMARY.ACCENT_2};

    &:hover {
      color: ${theme.colors.PRIMARY.FOREGROUND};
    }

    &:disabled {
      color: ${theme.colors.PRIMARY.ACCENT_4};
      background: ${theme.colors.PRIMARY.ACCENT_1};
      cursor: not-allowed;
    }

    &:last-child {
      border-right: none;
    }
  `};
`

export { Action }
