import { css } from '@emotion/react'
import styled from '@emotion/styled'

export const _Header = styled.header`
  text-align: center;
`

export const _Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  max-width: 900px;
  padding: 2rem;
  margin-left: auto;
  margin-right: auto;

  @media screen and (max-width: 1024px) {
    padding: 1.5rem 1rem;
  }
`

export const _BottomBox = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  @media screen and (max-width: 1024px) {
    flex-direction: column-reverse;
    align-items: flex-start;
    justify-content: center;
  }
`

export const _TextContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`

export const _IconContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`

export const _Icon = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  outline: none;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  padding: 0;

  ${({ theme }) => css`
    background: ${theme.colors.PRIMARY.FOREGROUND};
    color: ${theme.colors.PRIMARY.BACKGROUND};
  `}
`

export const _HeaderTitle = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  width: 100%;
  padding: 0 1.5rem;

  & > h1 {
    text-align: left;
  }
`

export const _ChildrenWrapper = styled.div`
  width: 100%;
`
