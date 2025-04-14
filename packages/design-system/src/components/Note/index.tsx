import { css } from '@emotion/react'
import styled from '@emotion/styled'

import { Colors } from '../ThemeProvider/type'
import { NoteProps, NoteMapperType } from './type'

export const Note = (props: Partial<NoteProps>) => {
  const {
    label = 'Note',
    fill = false,
    variant = 'standard',
    type = 'primary',
    action = null,
    size = 'medium',
    children
  } = props

  return (
    <Container label={label} fill={String(fill)} variant={variant} type={type} action={action} size={size}>
      <span>
        {!!label && <span>{label}: </span>}
        {children}
      </span>
      <div>{action && action}</div>
    </Container>
  )
}

const NoteTypeMapper: (props: Pick<NoteProps, 'variant' | 'fill'>) => NoteMapperType = ({ fill, variant }) => ({
  primary: {
    background: fill ? Colors.PRIMARY.FOREGROUND : Colors.PRIMARY.BACKGROUND,
    border: Colors.PRIMARY.ACCENT_2,
    color: fill ? Colors.PRIMARY.BACKGROUND : Colors.PRIMARY.FOREGROUND
  },
  secondary: {
    background:
      variant === 'contrast' ? Colors.PRIMARY.ACCENT_2 : fill ? Colors.PRIMARY.ACCENT_5 : Colors.PRIMARY.BACKGROUND,
    border: Colors.PRIMARY.ACCENT_5,
    color: variant === 'contrast' ? Colors.PRIMARY.ACCENT_7 : fill ? Colors.PRIMARY.BACKGROUND : Colors.PRIMARY.ACCENT_5
  },
  success: {
    background:
      variant === 'contrast' ? Colors.SUCCESS.LIGHTER : fill ? Colors.SUCCESS.DEFAULT : Colors.PRIMARY.BACKGROUND,
    border: Colors.SUCCESS.DEFAULT,
    color: variant === 'contrast' ? Colors.SUCCESS.DARK : fill ? Colors.PRIMARY.BACKGROUND : Colors.SUCCESS.DEFAULT
  },
  error: {
    background: variant === 'contrast' ? Colors.ERROR.LIGHTER : fill ? Colors.ERROR.DEFAULT : Colors.PRIMARY.BACKGROUND,
    border: Colors.ERROR.DEFAULT,
    color: variant === 'contrast' ? Colors.ERROR.DARK : fill ? Colors.PRIMARY.BACKGROUND : Colors.ERROR.DEFAULT
  },
  warning: {
    background:
      variant === 'contrast' ? Colors.WARNING.LIGHTER : fill ? Colors.WARNING.DEFAULT : Colors.PRIMARY.BACKGROUND,
    border: Colors.WARNING.DEFAULT,
    color: variant === 'contrast' ? Colors.WARNING.DARK : fill ? Colors.PRIMARY.BACKGROUND : Colors.WARNING.DEFAULT
  }
})

const Container = styled.div<Omit<NoteProps, 'fill'> & { fill?: string }>`
  display: flex;
  align-items: center;
  border-radius: 5px;
  line-height: 24px;
  font-size: 0.875rem;
  word-break: break-word;
  box-sizing: border-box;

  ${(props) => css`
    color: ${NoteTypeMapper({ ...props, fill: props.fill === 'true' })[props.type].color};
    background: ${NoteTypeMapper({ ...props, fill: props.fill === 'true' })[props.type].background};
    border: 1px solid ${NoteTypeMapper({ ...props, fill: props.fill === 'true' })[props.type].border};

    ${props.size === 'small' &&
    css`
      padding: 3px 12px;
      min-height: 32px;
    `}

    ${props.size === 'medium' &&
    css`
      padding: 7px 12px;
      min-height: 40px;
    `}

    ${props.size === 'large' &&
    css`
      padding: 11px 12px;
      min-height: 48px;
      font-size: 16px;
    `}
  `}

  & > span {
    & > span {
      font-weight: 600;
    }
  }

  & > div {
    margin-left: auto;
    padding-left: 0.75rem;
  }
`
