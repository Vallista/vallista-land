import { DEFINE_HEADER_HEIGHT } from '@/apps/layout/components/Header/utils'
import {
  DEFINE_CONTENTS_HEADER_ICON,
  DEFINE_CONTENTS_HEADER_PADDING_TOP,
  DEFINE_CONTENTS_PADDING,
  DEFINE_CONTENTS_WIDTH
} from '@/utils/constant'
import styled from '@emotion/styled'

export const _Wrap = styled.div`
  display: flex;
  flex-direction: column;

  max-width: ${DEFINE_CONTENTS_WIDTH}px;
  padding: calc(${DEFINE_HEADER_HEIGHT}px + ${DEFINE_CONTENTS_PADDING}px + ${DEFINE_CONTENTS_HEADER_PADDING_TOP}px)
    ${DEFINE_CONTENTS_PADDING}px 0;

  font-size: 16px;
`

export const _TitleIcon = styled.div`
  width: ${DEFINE_CONTENTS_HEADER_ICON}px;
  height: ${DEFINE_CONTENTS_HEADER_ICON}px;
  margin-bottom: 8px;

  @media screen and (max-width: 1024px) {
    width: ${DEFINE_CONTENTS_HEADER_ICON / 1.5}px;
    height: ${DEFINE_CONTENTS_HEADER_ICON / 1.5}px;

    & svg {
      width: ${DEFINE_CONTENTS_HEADER_ICON / 1.5}px;
      height: ${DEFINE_CONTENTS_HEADER_ICON / 1.5}px;
    }
  }
`

export const _Title = styled.h1`
  font-size: 2.5em; /* 32px */
  font-weight: 800;
  line-height: 1.3em;
  letter-spacing: -1px;
  margin-bottom: 16px;

  @media screen and (max-width: 1024px) {
    font-size: 2em; /* 32px */
    margin-bottom: 8px;
  }
`

export const _DateWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`

export const _Date = styled.span`
  font-size: 0.875em; /* 14px */
  color: ${({ theme }) => theme.colors.PRIMARY.ACCENT_7};

  @media screen and (max-width: 1024px) {
    font-size: 0.75em; /* 12px */
  }
`

export const _TagWrap = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin: 12px 0 0;

  @media screen and (max-width: 1024px) {
    margin: 8px 0 0;
  }
`

export const _Tag = styled.span`
  font-size: 0.875em; /* 14px */
  font-weight: 300;
  color: ${({ theme }) => theme.colors.HIGHLIGHT.PINK};
  background-color: ${({ theme }) => theme.colors.PRIMARY.ACCENT_2};
  padding: 4px 8px;
  border-radius: 4px;

  @media screen and (max-width: 1024px) {
    font-size: 0.75em; /* 12px */
  }
`
