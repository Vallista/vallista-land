import { DEFINE_CONTENTS_PADDING, DEFINE_CONTENTS_WIDTH } from '@/utils/constant'
import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const _Wrap = styled.footer``

export const _FooterBox = styled.div`
  ${({ theme }) => css`
    @media screen and (min-width: 1025px) {
      width: 100%;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      border-top: 1px solid ${theme.colors.PRIMARY.ACCENT_2};

      & > footer {
        width: ${DEFINE_CONTENTS_WIDTH}px;
        box-sizing: border-box;
        padding: ${DEFINE_CONTENTS_PADDING}px ${DEFINE_CONTENTS_PADDING}px ${DEFINE_CONTENTS_PADDING / 2}px
          ${DEFINE_CONTENTS_PADDING}px;
        border-top: none;

        & > nav {
          justify-content: flex-start;
          gap: 2rem;
        }
      }
    }
  `}
`

export const _FooterAllRightReserve = styled.p`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 60px;
  ${({ theme }) => css`
    /* background: ${theme.colors.PRIMARY.ACCENT_1}; */
    color: ${theme.colors.PRIMARY.ACCENT_3};

    & a {
      color: ${theme.colors.PRIMARY.FOREGROUND};
      text-decoration: none;
    }
  `}
`
