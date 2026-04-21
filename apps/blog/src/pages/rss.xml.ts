import type { APIContext } from 'astro'
import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET(context: APIContext): Promise<Response> {
  const site = context.site?.toString() ?? 'https://vallista.kr/'
  const articles = await getCollection('articles', (a) => !a.data.draft)
  articles.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())

  return rss({
    title: 'Vallista Blog',
    description: 'Vallista의 기술 블로그',
    site,
    items: articles.slice(0, 20).map((a) => ({
      title: a.data.title,
      description: a.data.dek || a.data.description || '',
      link: `/articles/${a.id}`,
      pubDate: a.data.date
    })),
    customData: '<language>ko-KR</language>'
  })
}
