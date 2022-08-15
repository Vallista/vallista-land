import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const _Wrapper = styled.div`
  max-width: 900px;
  width: 100%;
  margin: 4rem auto;
  box-sizing: border-box;
  padding: 2rem 2rem;
  border-top: 1px solid ${({ theme }) => theme.colors.PRIMARY.ACCENT_2};

  & > p {
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    ${({ theme }) => css`
      color: ${theme.colors.PRIMARY.FOREGROUND};
    `}
  }

  & > a {
    border: none !important;
    outline: none !important;
    transition: none !important;
    background: none !important;

    &:hover {
      background: none !important;
      border-color: none !important;
    }
  }
`
