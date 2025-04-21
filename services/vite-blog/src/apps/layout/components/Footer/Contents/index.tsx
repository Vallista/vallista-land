import { Footer, FooterGroup, FooterLink } from '@vallista/design-system'
import { Link } from 'react-router-dom'

import rawData from '@/../config/footer.json'
import * as Styled from '../index.style'

export const Contents = () => {
  const footerData = Object.entries(rawData).map(([key, value]) => {
    return {
      title: key,
      value
    }
  })

  const groups = footerData.map((group) => {
    return (
      <FooterGroup title={group.title} key={group.title}>
        {group.value.map((item) =>
          item.url.startsWith('http') ? (
            <FooterLink href={item.url} key={item.title}>
              {item.title}
            </FooterLink>
          ) : (
            <FooterLink custom key={item.title}>
              <Link to={item.url}>{item.title}</Link>
            </FooterLink>
          )
        )}
      </FooterGroup>
    )
  })

  return (
    <Styled._FooterBox>
      <Footer>{groups}</Footer>
    </Styled._FooterBox>
  )
}
