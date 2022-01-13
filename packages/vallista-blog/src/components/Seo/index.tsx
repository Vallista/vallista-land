import { useLocation } from '@reach/router'
import { useStaticQuery, graphql } from 'gatsby'
import { VFC } from 'react'
import { Helmet } from 'react-helmet'

import { StaticQuery } from '../../types/type'

interface SeoProps {
  name?: string
  image?: string
  isPost?: boolean
}

export const Seo: VFC<SeoProps> = ({ name, image, isPost = false }) => {
  const location = useLocation()
  const { site } = useStaticQuery<StaticQuery>(query)
  const { defaultTitle, titleTemplate, defaultDescription, siteUrl, defaultImage, twitterUsername } = site.siteMetadata

  const seo = {
    title: name || defaultTitle,
    description: defaultDescription,
    image: `${siteUrl}${image || defaultImage}`,
    url: `${siteUrl}${decodeURIComponent(location.pathname)}`
  }

  return (
    <Helmet title={seo.title} titleTemplate={titleTemplate}>
      <title>{seo.title}</title>
      <meta name='description' content={seo.description} />
      <meta name='image' content={seo.image} />
      {seo.url && <meta property='og:url' content={seo.url} />}
      <meta property='og:type' content={isPost ? 'article' : 'website'} />
      {seo.title && <meta property='og:title' content={seo.title} />}
      {seo.description && <meta property='og:description' content={seo.description} />}
      {seo.image && <meta property='og:image' content={seo.image} />}
      <meta name='twitter:card' content='summary_large_image' />
      {twitterUsername && <meta name='twitter:creator' content={twitterUsername} />}
      {seo.title && <meta name='twitter:title' content={seo.title} />}
      {seo.description && <meta name='twitter:description' content={seo.description} />}
      {seo.image && <meta name='twitter:image' content={seo.image} />}
      <meta name='google-site-verification' content='wPI09aIL9InuxJwKlMkLE-4mzzfbNhQqRCJ760C-8nQ' />
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
