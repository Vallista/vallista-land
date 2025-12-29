import { Helmet } from 'react-helmet-async'
import { SEOHeadProps } from '@shared/types'

/**
 * SEO 메타데이터를 관리하는 컴포넌트
 * 페이지별로 적절한 SEO 정보를 자동으로 설정합니다.
 */
export function SEOHead({ seoData, additionalMeta }: SEOHeadProps) {
  return (
    <Helmet>
      <title>{seoData.title}</title>
      <meta name='description' content={seoData.description} />
      <meta property='og:title' content={seoData.title} />
      <meta property='og:description' content={seoData.description} />
      <meta property='og:type' content={seoData.type} />
      <meta property='og:url' content={seoData.url} />
      {seoData.image && <meta property='og:image' content={seoData.image} />}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:title' content={seoData.title} />
      <meta name='twitter:description' content={seoData.description} />
      {seoData.image && <meta name='twitter:image' content={seoData.image} />}

      {/* 아티클 관련 메타데이터 */}
      {seoData.type === 'article' && (
        <>
          {seoData.publishedTime && <meta property='article:published_time' content={seoData.publishedTime} />}
          {seoData.modifiedTime && <meta property='article:modified_time' content={seoData.modifiedTime} />}
          {seoData.author && <meta property='article:author' content={seoData.author} />}
          {seoData.tags && seoData.tags.map((tag) => <meta key={tag} property='article:tag' content={tag} />)}
        </>
      )}

      {/* JSON-LD 구조화된 데이터 */}
      {seoData.type === 'article' && (
        <script type='application/ld+json'>
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: seoData.title,
            description: seoData.description,
            image: seoData.image,
            author: {
              '@type': 'Person',
              name: seoData.author || 'Vallista'
            },
            publisher: {
              '@type': 'Organization',
              name: 'Vallista Blog',
              logo: {
                '@type': 'ImageObject',
                url: 'https://vallista.kr/images/logo.png'
              }
            },
            datePublished: seoData.publishedTime,
            dateModified: seoData.modifiedTime,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': seoData.url
            }
          })}
        </script>
      )}

      {/* 추가 메타데이터 */}
      {additionalMeta}
    </Helmet>
  )
}
