import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { VFC } from 'react'

import { AvailablePickedColor, Colors } from '../ThemeProvider/type'
import { ProgressMapperType, ProgressProps, ProgressType } from './type'
import { useProgress } from './useProgress'

/**
 * # Progress
 *
 * 진행상황을 쉽게 컨트롤 할 때 사용하세요.
 *
 * @param {ProgressProps} {@link ProgressProps}
 *
 * @example ```tsx
 * const [value, setValue] = useState(0)
 * 
  <Progress
    value={value}
    colors={{
      0: Colors.PRIMARY.FOREGROUND,
      25: Colors.PRIMARY.ACCENT_5,
      50: Colors.WARNING.DEFAULT,
      75: Colors.HIGHLIGHT.PINK,
      100: Colors.SUCCESS.DEFAULT
    }}
  />
  <Button
    onClick={() => {
      if (value < 100) setValue(value + 10)
    }}
    size='medium'
  >
    Increase
  </Button>

  <Button
    onClick={() => {
      if (value > 0) setValue(value - 10)
    }}
    color='secondary'
  >
    Decrease
  </Button>
 * ```
 */
export const Progress: VFC<Partial<ProgressProps>> = (props) => {
  const { ...otherProps } = useProgress(props)

  return <Bar {...otherProps} />
}

const ProgressTypeMapper: ProgressMapperType = {
  primary: {
    background: Colors.PRIMARY.FOREGROUND
  },
  secondary: {
    background: Colors.PRIMARY.ACCENT_5
  },
  success: {
    background: Colors.SUCCESS.DEFAULT
  },
  error: {
    background: Colors.ERROR.DEFAULT
  },
  warning: {
    background: Colors.WARNING.DEFAULT
  }
}

const Bar = styled.progress<{ nowColor?: AvailablePickedColor; type: ProgressType }>`
  appearance: none;
  border: none;
  width: 100%;
  height: 10px;
  display: block;
  vertical-align: unset;

  ${({ type }) => css`
    &[value]::-webkit-progress-value {
      background: ${ProgressTypeMapper[type].background};
    }

    &[value]::-moz-progress-bar {
      background: ${ProgressTypeMapper[type].background};
    }
  `}

  ${({ theme, nowColor }) => css`
    &[value]::-webkit-progress-bar {
      background: ${theme.colors.PRIMARY.ACCENT_2};
      border-radius: 5px;
    }

    @-moz-document url-prefix() {
      border-radius: 5px;
      background: ${theme.colors.PRIMARY.ACCENT_2};
    }

    &[value]::-webkit-progress-value {
      ${nowColor &&
      css`
        background: ${nowColor};
      `};
      border-radius: 5px;
      transition: width 0.15s ease;
    }

    &[value]::-moz-progress-bar {
      ${nowColor &&
      css`
        background: ${nowColor};
      `};
      border-radius: 5px;
      transition: width 0.15s ease;
    }
  `}
`
