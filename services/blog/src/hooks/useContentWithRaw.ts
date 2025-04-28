import { useQuery } from '@tanstack/react-query'
import { ContentWithRaw } from '../types'
import * as API from '../apis'
import { Content } from '../types'

export const useContentWithRaw = (slug: string, contents: Content[]) => {
  return useQuery<ContentWithRaw>({
    queryKey: ['content-with-raw', slug],
    queryFn: async () => {
      const content = contents.find((c) => c.slug === slug)
      if (!content) throw new Error('콘텐츠를 찾을 수 없습니다.')
      const raw = await API.fetctContent(content.path)
      return { ...content, raw }
    },
    enabled: contents.length > 0 && !!slug
  })
}
