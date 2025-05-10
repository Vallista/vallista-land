export interface Post {
  category: string
  title: string
  tags?: string[]
  date: string
  path: string
  url: string
  draft?: boolean
  info: boolean
  slug: string
  series?: string | null
  seriesPrority?: number
  image?: string
}

interface PostResponse {
  date: string
  description: string
  draft: boolean
  info: boolean
  slug: string
  tags: string[]
  title: string
  trail: string[]
  series?: string | null
  seriesPrority?: number
  image?: string
  url: {
    api: string
    seo: string
  }
}

/**
 * 작성한 포스트에 대한 모든 콘텐츠 데이터를 가져옵니다.
 */
export async function fetchContents() {
  const result = await fetch('/index.json')
  const json = (await result.json()) as unknown as Record<string, PostResponse>

  // Record<string, Post>로 변환
  const posts = Object.entries(json).reduce(
    (acc, [key, value]) => {
      acc[key] = {
        ...value,
        category: value.trail[1].toUpperCase(),
        path: value.url.api,
        url: value.url.seo
      }

      return acc
    },
    {} as Record<string, Post>
  )

  return posts
}

/**
 * 작성한 포스트에 대한 단일 콘텐츠를 가져옵니다.
 * @param path - {@link fetchContents}에서 가져온 path를 넣어주세요.
 */
export async function fetctContent(url: string) {
  return (await fetch(url)).text()
}
