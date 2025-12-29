import { useUniqueId } from '../../hooks/useUniqueId'
import { FooterGroupProps, FooterLinkProps, FooterProps } from './type'
import {
  footerContainer,
  footerGroupContainer,
  footerGroupTitleInput,
  footerGroupTitleLabel,
  footerLinkContainer,
  footerNav,
  footerGroupList,
  footerGroupTitle,
  footerLink
} from './Footer.css'

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
export const Footer = (props: FooterProps) => {
  const { children } = props

  return (
    <footer className={footerContainer}>
      <nav className={footerNav} role='navigation'>
        {children}
      </nav>
    </footer>
  )
}

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
export const FooterGroup = (props: FooterGroupProps) => {
  const { title, children } = props

  const id = useUniqueId()

  return (
    <div className={footerGroupContainer}>
      <input className={footerGroupTitleInput} type='checkbox' aria-label='' id={`footer-group-${id}`} />
      <label className={footerGroupTitleLabel} htmlFor={`footer-group-${id}`}>
        <h3 className={footerGroupTitle}>{title}</h3>
      </label>
      <ul className={footerGroupList}>{children}</ul>
    </div>
  )
}

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
export const FooterLink = (props: FooterLinkProps) => {
  const { href, custom = false, children } = props

  return (
    <li className={footerLinkContainer}>
      {custom ? (
        children
      ) : (
        <a href={href} className={footerLink}>
          {children}
        </a>
      )}
    </li>
  )
}
