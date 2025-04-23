import { DEFINE_CONTENTS_MIN_WIDTH, DEFINE_CONTENTS_PADDING, DEFINE_CONTENTS_WIDTH } from '@/utils/constant'
import { keyframes, Theme } from '@emotion/react'
import { css } from '@emotion/react'
import styled from '@emotion/styled'

// shimmer 애니메이션 정의
const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`

// 공통 스켈레톤 스타일
const skeletonBase = css`
  background-color: #e0e0e0;
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 200% 100%;
  background-repeat: no-repeat;
  animation: ${shimmer} 1.5s infinite;
  border-radius: 8px;
`

export const SkeletonImage = styled.div`
  ${skeletonBase};
  width: 100%;
  aspect-ratio: 2 / 1;
  border-radius: 12px;
  margin-bottom: 24px;
`

export const SkeletonTextLine = styled.div<{ width: string }>`
  ${skeletonBase};
  height: 16px;
  width: ${({ width }) => width};
  margin-bottom: 12px;
  border-radius: 6px;
`

export const SkeletonWrap = styled.div`
  box-sizing: border-box;
  min-width: ${DEFINE_CONTENTS_MIN_WIDTH}px;
  max-width: ${DEFINE_CONTENTS_WIDTH}px;
  padding: ${DEFINE_CONTENTS_PADDING}px;
`

const root = css`
  box-sizing: border-box;
  min-width: ${DEFINE_CONTENTS_MIN_WIDTH}px;
  max-width: ${DEFINE_CONTENTS_WIDTH}px;
  padding: ${DEFINE_CONTENTS_PADDING}px;

  & > p,
  & > ul,
  & > ol {
    font-size: 1rem;
  }

  @media screen and (max-width: 1024px) {
    padding: ${DEFINE_CONTENTS_PADDING}px 16px;

    & > p,
    & > ul,
    & > ol {
      font-size: 0.875em; /* 14px */
    }
  }
`

const image = (theme: Theme) => css`
  @keyframes fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  & > p:has(img) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin: 32px 0 !important;
    gap: 12px;
    font-size: 0.875em;
    line-height: 1.5em;
    color: ${theme.colors.PRIMARY.ACCENT_7};

    &:first-of-type {
      margin-top: 0 !important;
    }
  }

  & > p > img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 8px;

    aspect-ratio: 2 / 1;
    object-fit: cover;
    opacity: 0;
    transition: opacity 0.1s ease-in-out;

    &.loaded {
      opacity: 1 !important;
    }
  }
`

const text = css`
  & > p {
    line-height: 1.6em;
  }

  & > p:not(:last-of-type) {
    margin: 1.5em 0;
  }
`

const heading = css`
  & > h1,
  & > h2,
  & > h3,
  & > h4 {
    font-weight: 700;
    line-height: 1.4;
  }
`

const h1 = css`
  & > h1,
  & > blockquote > h1 {
    font-size: 2em; /* 32px */
    margin-bottom: 1em;
  }

  & > h1 {
    margin-top: 2.5em;
  }

  @media screen and (max-width: 1024px) {
    & > h1,
    & > blockquote > h1 {
      font-size: 1.75em; /* 28px */
    }
  }
`

const h2 = css`
  & > h2,
  & > blockquote > h2 {
    font-size: 1.75em; /* 26px */
    margin-bottom: 1em;
  }

  & > h2 {
    margin-top: 2em;
  }

  @media screen and (max-width: 1024px) {
    & > h2,
    & > blockquote > h2 {
      font-size: 1.5em; /* 24px */
    }
  }
`

const h3 = css`
  & > h3,
  & > blockquote > h3 {
    font-size: 1.5em; /* 22px */
    margin-bottom: 1em;
  }

  & > h3 {
    margin-top: 1.725em;
  }

  @media screen and (max-width: 1024px) {
    & > h3,
    & > blockquote > h3 {
      font-size: 1.25em; /* 20px */
    }
  }
`

const h4 = css`
  & > h4,
  & > blockquote > h4 {
    font-size: 1.25em; /* 18px */
    font-weight: 600;
    margin-bottom: 1em;
  }

  & > h4 {
    margin-top: 1.5em;
  }

  @media screen and (max-width: 1024px) {
    & > h4,
    & > blockquote > h4 {
      font-size: 1.125em; /* 18px */
    }
  }
`

const h5 = css`
  & > h5,
  & > blockquote > h5 {
    font-size: 1em; /* 18px */
    font-weight: 600;
    margin-bottom: 1em;
  }

  & > h4 {
    margin-top: 1.5em;
  }

  @media screen and (max-width: 1024px) {
    & > h5,
    & > blockquote > h5 {
      font-size: 0.875em; /* 14px */
    }
  }
`

const ul = css`
  & > ul {
    list-style: none;
    margin-top: 1.5em;
    margin-bottom: 1.5em;
  }
`

const ol = css`
  & > ol {
    list-style: none;
    margin-top: 1.5em;
    margin-bottom: 1.5em;
    counter-reset: list-counter;
  }

  & > blockquote > ol {
    list-style: none;
    margin-top: 1.5em;
    margin-bottom: 1.5em;
    counter-reset: list-counter;
  }
`

const li = (theme: Theme) => css`
  & > ul > li,
  & > blockquote > ul > li {
    position: relative;
    padding-left: 1.5em;
    line-height: 1.5em;

    &:not(:last-of-type) {
      margin-bottom: 0.5em;
    }

    &::before {
      content: '';
      position: absolute;
      background: ${theme.colors.PRIMARY.ACCENT_8};
      left: 0;
      top: 0.6em;
      width: 0.4em;
      height: 0.4em;
      border-radius: 50%;
    }
  }

  & > ol > li,
  & > blockquote > ol > li {
    counter-increment: list-counter;
    position: relative;
    padding-left: 1.5em;
    line-height: 1.5em;

    &:not(:last-of-type) {
      margin-bottom: 0.5em;
    }

    &::before {
      content: counter(list-counter) '.';
      position: absolute;
      color: ${theme.colors.PRIMARY.ACCENT_8};
      left: 0;
      width: 0.4em;
      height: 0.4em;
      border-radius: 50%;
    }
  }
`

const blockquote = (theme: Theme) => css`
  & > blockquote {
    margin: 2em 0;
    padding: 1em 1.25em;
    background: ${theme.colors.PRIMARY.ACCENT_1};
    border-left: 4px solid ${theme.colors.PRIMARY.ACCENT_5};
    color: ${theme.colors.PRIMARY.ACCENT_8};
    font-style: italic;
    line-height: 1.6;
  }

  & > blockquote > p:not(:last-of-type) {
    margin-bottom: 1em;
  }
`

const pre = css`
  & pre code {
    width: 100%;
    display: block;
    overflow-x: auto;
  }

  & figure pre {
    box-sizing: border-box;
    font-family: 'Fira Code', 'Source Code Pro', 'JetBrains Mono', monospace;
    font-size: 1em;
    background-color: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre;
    word-break: normal;
    margin: 2rem 0;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05) inset;

    @media screen and (max-width: 1024px) {
      font-size: 0.75em; /* 12px */
    }
  }

  & figure pre code {
    display: block;
  }

  /* 줄별 하이라이트 지원 (rehype-pretty-code에서 생성) */
  & figure pre .line {
    display: block;
    padding: 0 0.25rem;
  }

  & figure pre .line.highlighted {
    background-color: rgba(255, 255, 255, 0.07);
  }

  /* 문자 강조 (예: [6:14]) */
  & figure pre .word {
    background-color: rgba(255, 255, 255, 0.12);
    padding: 0.1em 0.2em;
    border-radius: 4px;
  }

  /* 스크롤바 커스텀 */
  & figure pre::-webkit-scrollbar {
    height: 8px;
  }

  & figure pre::-webkit-scrollbar-thumb {
    background-color: #444;
    border-radius: 4px;
  }

  & figure pre::-webkit-scrollbar-track {
    background: transparent;
  }
`

const strong = css`
  & > p > strong {
    font-weight: 700;
  }
`

export const _Markdown = styled.div`
  ${root}
  ${({ theme }) => image(theme)}
  ${text}
  ${heading}
  ${h1}
  ${h2}
  ${h3}
  ${h4}
  ${h5}
  ${ul}
  ${({ theme }) => li(theme)}
  ${ol}
  ${({ theme }) => blockquote(theme)}
  ${pre}
  ${strong}
`
