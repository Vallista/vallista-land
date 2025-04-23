import { DEFINE_HEADER_HEIGHT } from '@/apps/layout/components/Header/utils'
import {
  DEFINE_CONTENTS_HEADER_ICON,
  DEFINE_CONTENTS_HEADER_PADDING_TOP,
  DEFINE_CONTENTS_PADDING,
  DEFINE_CONTENTS_WIDTH
} from '@/utils/constant'
import { css, keyframes } from '@emotion/react'
import styled from '@emotion/styled'

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

export const skeletonStyle = css`
  position: relative;
  overflow: hidden;
  background-color: #e0e0e0;
  border-radius: 4px;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -150%;
    width: 250%;
    height: 100%;
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.6) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 200% 100%; // ✅ 반드시 있어야 함
    background-position: -100% 0; // ✅ 시작 위치
    animation: ${shimmer} 1.5s infinite;
  }
`

export const _TitleSkeleton = styled.div`
  width: 100%;
  height: 3.5em;
  margin-bottom: 16px;
  ${skeletonStyle};

  @media screen and (max-width: 1024px) {
    width: 100vw;
    height: 1.3em;
    margin-bottom: 8px;
  }
`

export const _TitleIconSkeleton = styled.div`
  width: ${DEFINE_CONTENTS_HEADER_ICON}px;
  height: ${DEFINE_CONTENTS_HEADER_ICON}px;
  margin-bottom: 8px;
  ${skeletonStyle};

  @media screen and (max-width: 1024px) {
    width: ${DEFINE_CONTENTS_HEADER_ICON / 1.5}px;
    height: ${DEFINE_CONTENTS_HEADER_ICON / 1.5}px;
  }
`

export const _DateSkeleton = styled.div`
  width: 80px;
  height: 0.875em;
  ${skeletonStyle};

  @media screen and (max-width: 1024px) {
    height: 0.75em;
  }
`

export const _Wrap = styled.div<{ hasLoading: boolean }>`
  ${({ hasLoading }) =>
    hasLoading &&
    css`
      animation: ${fadeIn} 0.2s ease-in-out;
    `}

  display: flex;
  flex-direction: column;

  max-width: ${DEFINE_CONTENTS_WIDTH}px;
  padding: calc(${DEFINE_HEADER_HEIGHT}px + ${DEFINE_CONTENTS_PADDING}px + ${DEFINE_CONTENTS_HEADER_PADDING_TOP}px)
    ${DEFINE_CONTENTS_PADDING}px 0;

  font-size: 16px;

  @media screen and (min-width: 1025px) {
    width: ${DEFINE_CONTENTS_WIDTH}px;
  }
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
