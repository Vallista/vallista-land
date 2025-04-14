import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { createUniqueId } from '../../hooks/useUniqueId'
import { SwitchItem, SwitchProps, NeedSwitchProp } from './type'
import { useSwitch } from './useSwitch'

/**
 * # Switch
 *
 * @description [vercel design switch](https://vercel.com/design/switch)
 *
 * 기본적인 스위치 컴포넌트입니다. 해당 컴포넌트로 모든 스위치를 나타냅니다.
 *
 * @param {SwitchProps} {@link SwitchProps} 기본적인 Switch 요소
 *
 * @example ```tsx
 * const [active, setActive] = useState('item1')
 * <Switch
 *   active={active}
 *   onChange={(value) => setActive(value)}
 *   items={[
 *     {
 *       name: 'Item1',
 *       value: 'item1',
 *       width: 100
 *     },
 *     {
 *       name: 'Item2',
 *       value: 'item2',
 *       width: 100
 *     }
 *   ]}
 * />
 * ```
 */
export const Switch = (props: NeedSwitchProp) => {
  const { items, onChange, ...otherProps } = useSwitch(props)
  return (
    <Group {...otherProps}>
      {items?.map((item) => {
        const uniqueId = createUniqueId()
        return (
          <Button key={`${uniqueId}`} {...otherProps} {...item} onClick={() => onChange(item.value)}>
            {item.name}
          </Button>
        )
      })}
    </Group>
  )
}

const Group = styled.div<Pick<SwitchProps, 'size'>>`
  display: flex;

  ${({ size, theme }) => css`
    font-size: ${size === 'large' ? '1em' : '0.875em'};
    height: ${size === 'small' ? 32 : size === 'middle' ? 40 : 48}px;

    & > button {
      border-left: 0;
    }

    & > :first-of-type {
      border-radius: 5px 0 0 5px;
      border-left: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    }

    & > :last-of-type {
      border-radius: 0 5px 5px 0;
    }
  `}
`

const Button = styled.button<Pick<SwitchItem, 'width' | 'value' | 'disabled'> & Pick<SwitchProps, 'active'>>`
  font-size: inherit;
  padding: 1px 4px;
  cursor: pointer;

  ${({ width, value, active, disabled, theme }) => css`
    color: ${theme.colors.PRIMARY.FOREGROUND};
    border: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    min-width: ${width}px;

    ${value !== active &&
    css`
      background: none;
    `}

    ${value === active &&
    css`
      font-weight: 700;
      background-color: ${theme.colors.PRIMARY.ACCENT_1};
    `}

    ${disabled &&
    css`
      color: ${theme.colors.PRIMARY.ACCENT_3};
      cursor: not-allowed;
    `}
  `};
`
