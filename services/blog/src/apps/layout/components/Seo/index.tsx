import { FC, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'

interface SeoProps {
  description: string
  name: string
  image?: string
  isPost?: boolean
  pathname: string
  siteUrl?: string
}

export const Seo: FC<SeoProps> = ({
  name,
  image,
  isPost = false,
  siteUrl = 'https://vallista.kr',
  pathname,
  description
}) => {
  const { titleTemplate, defaultImage } = {
    titleTemplate: '%s - vallista.dev',
    defaultImage: '/profile.png'
  }

  const seo = {
    title: name,
    description: description,
    image: `${siteUrl}${image || defaultImage}`,
    url: `${siteUrl}${decodeURIComponent(pathname)}`
  }

  useEffect(() => {
    document.title = `${name} - vallista.dev`
  }, [name])

  return (
    <Helmet>
      <title>{titleTemplate.replace('%s', seo.title)}</title>
      <meta name='description' content={seo.description} />
      <meta name='image' content={seo.image} />
      {seo.url && <meta property='og:url' content={seo.url} />}
      <meta property='og:type' content={isPost ? 'article' : 'website'} />
      {seo.title && <meta property='og:title' content={seo.title} />}
      {seo.description && <meta property='og:description' content={seo.description} />}
      {seo.image && <meta property='og:image' content={seo.image} />}
      <meta name='twitter:card' content='summary_large_image' />
      {seo.title && <meta name='twitter:title' content={seo.title} />}
      {seo.description && <meta name='twitter:description' content={seo.description} />}
      {seo.image && <meta name='twitter:image' content={seo.image} />}
      <meta name='google-site-verification' content='wPI09aIL9InuxJwKlMkLE-4mzzfbNhQqRCJ760C-8nQ' />
    </Helmet>
  )
}
export default Seo
