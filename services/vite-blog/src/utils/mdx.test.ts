import { expect, expectTypeOf, test } from 'vitest'
import * as mdx from './mdx'

test('mdx', () => {
  const articles = mdx.loadMdxWithFolder('articles')
  expect(articles).toBeDefined()
  expectTypeOf(articles[0]).toEqualTypeOf<{
    data: {
      title: string
      tags: string[]
      date: string
      draft: boolean
      info: boolean
      image: string
      series: string
      seriesPriority: number
      slug: string
    }
    content: string
    fileName: string
  }>()
})
