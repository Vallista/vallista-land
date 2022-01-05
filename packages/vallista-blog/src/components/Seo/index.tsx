import { useLocation } from '@reach/router'
import { useStaticQuery, graphql } from 'gatsby'
import { VFC } from 'react'
import { Helmet } from 'react-helmet'

import { StaticQuery } from '../../types/type'

interface SeoProps {
  name?: string
  image?: string
  excerpt?: string
}

export const Seo: VFC<SeoProps> = ({ name, image, excerpt }) => {
  const location = useLocation()
  const { site } = useStaticQuery<StaticQuery>(query)
  const { defaultTitle, titleTemplate, defaultDescription, siteUrl, defaultImage, twitterUsername } = site.siteMetadata

  const seo = {
    title: name || defaultTitle,
    description: excerpt || defaultDescription,
    image: `${siteUrl}${image || defaultImage}`,
    url: `${siteUrl}${decodeURIComponent(location.pathname)}`
  }

  return (
    <Helmet title={seo.title} titleTemplate={titleTemplate}>
      <title>{seo.title}</title>
      <meta name='description' content={seo.description} />
      <meta name='image' content={seo.image} />
      {seo.url && <meta property='og:url' content={seo.url} />}
      {(excerpt ? true : null) && <meta property='og:type' content='article' />}
      {seo.title && <meta property='og:title' content={seo.title} />}
      {seo.description && <meta property='og:description' content={seo.description} />}
      {seo.image && <meta property='og:image' content={seo.image} />}
      <meta name='twitter:card' content='summary_large_image' />
      {twitterUsername && <meta name='twitter:creator' content={twitterUsername} />}
      {seo.title && <meta name='twitter:title' content={seo.title} />}
      {seo.description && <meta name='twitter:description' content={seo.description} />}
      {seo.image && <meta name='twitter:image' content={seo.image} />}
    </Helmet>
  )
}
export default Seo

const query = graphql`
  query SeoQuery {
    site {
      siteMetadata {
        defaultTitle: title
        titleTemplate
        defaultDescription: description
        siteUrl: url
        defaultImage: image
        twitterUsername
      }
    }
  }
`
