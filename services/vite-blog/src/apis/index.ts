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

/**
 * 작성한 포스트에 대한 모든 콘텐츠 데이터를 가져옵니다.
 */
export async function fetchContents() {
  return (await fetch('/contents/index.json')).json() as unknown as Record<string, Post>
}

/**
 * 작성한 포스트에 대한 단일 콘텐츠를 가져옵니다.
 * @param path - {@link fetchContents}에서 가져온 path를 넣어주세요.
 */
export async function fetctContent(path: string) {
  return (await fetch(path)).text()
}
