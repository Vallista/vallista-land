import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { VFC } from 'react'

type SearchBoxSize = 'small' | 'large'

interface SearchBoxProps {
  value: string
  onSearch: (target: string) => void
  size?: SearchBoxSize
  placeholder?: string
}

export const SearchBox: VFC<SearchBoxProps> = (props) => {
  const { value, onSearch, size = 'small', placeholder } = props

  const hasSearchText = value.length !== 0

  return (
    <Search hasSearchText={hasSearchText} size={size} placeholder={placeholder ?? ''}>
      <Input value={value} onChange={(e) => onSearch(e.currentTarget.value)} />
      <svg
        viewBox='0 0 24 24'
        width={sizeMapper[size]}
        height={sizeMapper[size]}
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
        shapeRendering='geometricPrecision'
      >
        <path d='M11 17.25a6.25 6.25 0 110-12.5 6.25 6.25 0 010 12.5z' />
        <path d='M16 16l4.5 4.5' />
      </svg>
      <svg
        onClick={() => onSearch('')}
        viewBox='0 0 24 24'
        width={sizeMapper[size]}
        height={sizeMapper[size]}
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
        fill='none'
        shapeRendering='geometricPrecision'
      >
        <path d='M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z' />
        <path d='M18 9l-6 6' />
        <path d='M12 9l6 6' />
      </svg>
    </Search>
  )
}

const sizeMapper = {
  small: 15,
  large: 24
}

const Search = styled.label<{ hasSearchText: boolean; size: SearchBoxSize; placeholder: string }>`
  display: flex;
  position: relative;
  width: 100%;
  height: 30px;
  border-radius: 15px;

  ${({ theme, size, placeholder, hasSearchText }) => css`
    background: ${theme.colors.PRIMARY.ACCENT_2};

    &::before {
      content: '${placeholder}';
      font-size: 1rem;
      position: absolute;
      left: 2.5rem;
      top: 50%;
      transform: translateY(-50%);
      color: ${theme.colors.PRIMARY.ACCENT_3};
      font-weight: 500;

      @media screen and (max-width: 1000px) {
        font-size: 0.875rem;
      }
    }

    ${hasSearchText &&
    css`
      &::before {
        opacity: 0;
      }
    `}

    ${size === 'large' &&
    css`
      height: 60px;
      border-radius: 24px;

      & input {
        font-size: 1.5rem;
        width: calc(100% - 100px);
        left: 50px;
      }

      &::before {
        left: 52px;
        font-size: 1.5rem;

        @media screen and (max-width: 1000px) {
          font-size: 1.25rem;
        }
      }
    `}
  `}

  & > svg {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  ${({ theme, hasSearchText }) => css`
    border: 1px solid transparent;
    transition: border 0.2s cubic-bezier(0.215, 0.61, 0.355, 1);

    &:focus-within {
      border: 1px solid ${theme.colors.PRIMARY.ACCENT_3};
    }

    & > svg:first-of-type {
      left: 12px;
      color: ${theme.colors.PRIMARY.ACCENT_4};
    }

    & > svg:last-of-type {
      cursor: pointer;
      opacity: ${hasSearchText ? 1 : 0};
      right: 12px;
      color: ${theme.colors.ERROR.DARK};
    }
  `}
`

const Input = styled.input`
  width: calc(100% - 85px);
  position: relative;
  left: 40px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  outline: none;

  :focus {
    background: none;
  }
`
