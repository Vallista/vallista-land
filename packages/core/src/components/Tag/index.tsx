import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC } from 'react'

import { X } from '../Icon/assets'
import { ReturningUseTag, TagProps } from './type'
import { useTag } from './useTag'

export const Tag: FC<Partial<TagProps>> = (props) => {
  const { children, onRemove, id, ...otherProps } = useTag(props)

  return (
    <Wrapper {...otherProps}>
      <div>{children}</div>
      {otherProps.hasRemove && (
        <Button onClick={() => (id ? onRemove?.(id) : console.log('id가 지정되지 않았습니다.'))}>
          <X size={16} />
        </Button>
      )}
    </Wrapper>
  )
}

const Wrapper = styled.li<ReturningUseTag>`
  ${({ theme, hasRemove }) => css`
    display: flex;
    margin-bottom: 5px;
    margin-right: 5px;
    margin-top: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    color: ${theme.colors.PRIMARY.ACCENT_6};
    box-sizing: inherit;
    white-space: nowrap;
    height: 32px;

    & > div {
      background-color: ${theme.colors.PRIMARY.ACCENT_1};
      border: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
      border-radius: 5px;
      font-size: 0.9rem;
      padding: 0 6px;
      align-items: center;
      display: flex;
      overflow: hidden;
      text-overflow: ellipsis;

      ${hasRemove &&
      css`
        border-right: none;
        border-radius: 5px 0 0 5px;
      `}
    }
  `}
`

const Button = styled.button`
  ${({ theme }) => css`
    background-color: ${theme.colors.PRIMARY.ACCENT_1};
    border-radius: 0 5px 5px 0;
    border: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    color: ${theme.colors.PRIMARY.ACCENT_5};
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0;
    outline: 0;
    padding: 0 4px;
    transition: background-color 0.2s ease, border 0.2s ease, color 0.2s ease;

    &:hover {
      background-color: ${theme.colors.ERROR.DEFAULT};
      border-color: ${theme.colors.ERROR.DEFAULT};
      color: ${theme.colors.PRIMARY.BACKGROUND};
    }
  `}
`
