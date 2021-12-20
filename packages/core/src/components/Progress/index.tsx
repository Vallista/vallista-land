import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { VFC } from 'react'

import { AvailablePickedColor, Colors } from '../ThemeProvider/type'
import { ProgressMapperType, ProgressProps, ProgressType } from './type'
import { useProgress } from './useProgress'

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
  `}

  ${({ theme, nowColor }) => css`
    &[value]::-webkit-progress-bar {
      background: ${theme.colors.PRIMARY.ACCENT_2};
      border-radius: 5px;
    }

    &[value]::-webkit-progress-value {
      ${nowColor &&
      css`
        background: ${nowColor};
      `};
      border-radius: 5px;
      transition: width 0.15s ease;
    }
  `}
`
