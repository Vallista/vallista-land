import { useGlobalProvider } from '@/context/useProvider'
import { useContents } from '@/hooks/useContents'

export const useLayout = () => {
  const { state, dispatch } = useGlobalProvider()
  const { fold } = state
  const { contents } = useContents()

  return {
    fold,
    changeFold: () => {
      dispatch({
        type: 'changeFold',
        fold: !fold
      })
    },
    contents: contents.map((item) => ({
      name: item.title,
      slug: item.slug,
      tags: item.tags,
      url: item.url
    }))
  }
}
