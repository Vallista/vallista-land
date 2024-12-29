import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { FC } from 'react'

import { useUniqueId } from '../../hooks/useUniqueId'
import { FooterGroupProps, FooterLinkProps, FooterProps } from './type'

/**
 * # Footer
 *
 * 푸터 래퍼 입니다.
 *
 * @param {FooterProps} {@link FooterProps} 기본적인 프롭
 *
 * @example ```tsx
 * <Footer>
 * </Footer>
 * ```
 *
 */
export const Footer: FC<FooterProps> = (props) => {
  const { children } = props

  return (
    <FooterContainer>
      <FooterNav role='navigation'>{children}</FooterNav>
    </FooterContainer>
  )
}

const FooterContainer = styled.footer`
  font-size: 0.875rem;
  ${({ theme }) => css`
    background: ${theme.colors.PRIMARY.ACCENT_1};
    border-top: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    padding: calc(1.5 * 1rem) 1rem 1rem;
  `}
`

const FooterNav = styled.nav`
  max-width: 1024px;
  margin: 0 auto;
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;

  @media screen and (max-width: 1024px) {
    flex-direction: column;
  }
`

/**
 * # FooterGroup
 *
 * 푸터 그룹 입니다.
 *
 * @param {FooterGroupProps} {@link FooterGroupProps} 기본적인 프롭
 *
 * @example ```tsx
  <Footer>
    <FooterGroup title='Company'>
      <FooterLink href='#'>Home</FooterLink>
      <FooterLink href='#'>About</FooterLink>
      <FooterLink href='#'>Careers</FooterLink>
      <FooterLink href='#'>Partners</FooterLink>
      <FooterLink href='#'>Blog</FooterLink>
      <FooterLink href='#'>Next.js Conf</FooterLink>
    </FooterGroup>
 * </Footer>
 * ```
 */
export const FooterGroup: FC<FooterGroupProps> = (props) => {
  const { title, children } = props

  const id = useUniqueId()

  return (
    <FooterGroupContainer>
      <FooterGroupTitleInput type='checkbox' aria-label='' id={`footer-group-${id}`} />
      <FooterGroupTitleLabel htmlFor={`footer-group-${id}`}>
        <h3>{title}</h3>
      </FooterGroupTitleLabel>
      <ul>{children}</ul>
    </FooterGroupContainer>
  )
}

const FooterGroupContainer = styled.div`
  &:not(:last-of-type) {
    margin-right: 1rem;
  }

  & > ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  @media screen and (max-width: 1024px) {
    margin-right: 0 !important;

    ${({ theme }) => css`
      border-bottom: 1px solid ${theme.colors.PRIMARY.ACCENT_2};
    `}

    & > ul {
      display: block;
      padding-left: 12px;
      padding-bottom: 12px;
    }
  }
`

const FooterGroupTitleInput = styled.input`
  border: 0;
  padding: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(100%);
  height: 1px;
  width: 1px;
  margin: -1px;
  overflow: hidden;
  position: absolute;
  appearance: none;
  white-space: nowrap;
  word-wrap: normal;

  @media screen and (max-width: 1024px) {
    & + label {
      cursor: pointer;
    }

    & + label + ul {
      display: none;
    }

    &:checked + label + ul {
      display: block;
    }
  }
`

const FooterGroupTitleLabel = styled.label`
  & > h3 {
    font-weight: 400;
    font-size: 0.875rem;
    margin: 0.75rem 0;
  }

  @media screen and (max-width: 1024px) {
    & > h3::after {
      content: '+';
      float: right;
      transition: transform 0.15s ease;
    }
  }
`

/**
 * # FooterLink
 *
 * 푸터 링크 입니다.
 *
 * @param {FooterLinkProps} {@link FooterLinkProps} 기본적인 프롭
 *
 * @example ```tsx
  <Footer>
    <FooterGroup title='Company'>
      <FooterLink href='#'>Home</FooterLink>
      <FooterLink href='#'>About</FooterLink>
      <FooterLink href='#'>Careers</FooterLink>
      <FooterLink href='#'>Partners</FooterLink>
      <FooterLink href='#'>Blog</FooterLink>
      <FooterLink href='#'>Next.js Conf</FooterLink>
    </FooterGroup>
 * </Footer>
 * ```
 */
export const FooterLink: FC<FooterLinkProps> = (props) => {
  const { href, custom = false, children } = props

  return <FooterLinkContainer>{custom ? children : <a href={href}>{children}</a>}</FooterLinkContainer>
}

const FooterLinkContainer = styled.li`
  ${({ theme }) => css`
    color: ${theme.colors.PRIMARY.ACCENT_5};
    padding: 0.5rem 0;

    & > a {
      color: ${theme.colors.PRIMARY.ACCENT_5};
      transition: color 0.1s ease;
      text-decoration: none;
      cursor: pointer;
      outline: none;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);

      &:hover {
        color: ${theme.colors.PRIMARY.FOREGROUND};
      }
    }
  `}
`
