export const SITE_CONFIG = {
  name: 'Vallista Blog',
  description: 'Vallista의 기술 블로그',
  url: 'https://vallista.kr',
  author: 'Vallista',
  email: 'vallista@example.com',
  github: 'https://github.com/vallista',
  twitter: 'https://twitter.com/vallista',
  linkedin: 'https://linkedin.com/in/vallista',
  defaultImage: '/images/default-og.png',
  defaultLocale: 'ko-KR',
  supportedLocales: ['ko-KR', 'en-US']
} as const

export const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' ? 'https://api.vallista.kr' : 'http://localhost:3000',
  timeout: 10000,
  retries: 3
} as const

export const SEO_CONFIG = {
  defaultTitle: SITE_CONFIG.name,
  defaultDescription: SITE_CONFIG.description,
  defaultImage: SITE_CONFIG.defaultImage,
  twitterHandle: '@vallista',
  siteName: SITE_CONFIG.name
} as const

export const PAGINATION_CONFIG = {
  defaultPageSize: 10,
  maxPageSize: 50
} as const
