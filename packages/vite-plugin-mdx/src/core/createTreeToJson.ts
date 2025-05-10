import { Node } from './buildTree'

export interface Data {
  /**
   * 현재 구조는 본문의 데이터를 API로 불러오고, 나머지 데이터를 Frontmatter로 읽어옴
   * 그렇기 때문에 api를 참조할 url과 sidebar에서 참조할 url을 구분해야함
   */

  /** 영어화를 시킨 slug */
  slug: string
  /** 제목 타이틀 */
  title: string
  /** 설명 */
  description: string
  /**
   * 뎁스 배열
   * @example ["contents", "articles"]
   */
  trail: string[]
  /**
   * url 정보 모음
   */
  url: {
    /**
     * API 호출용 url
     * @example "/files/contents/articles/HTTP-프로토콜에서-HTTPS-URI-가져오기.html"
     */
    api: string
    /**
     * SEO용 url
     * sidebar에서 참조할 url 이기도 함.
     * @example "/contents/articles/HTTP-프로토콜에서-HTTPS-URI-가져오기"
     */
    seo: string
  }
  /** 태그 */
  tags: string[] | null

  /** 날짜 */
  date: string

  /** 작성중 */
  draft: boolean

  /** 노출 유무 */
  info: boolean
}

/**
 * 트리 구조를 JSON으로 변환합니다.
 * @param tree 트리 구조
 * @returns JSON 데이터
 */
export function createTreeToJson(tree: Node): Record<string, Data> {
  const result: Record<string, Data> = {}

  const traverse = (node: Node, parentPath: string[] = []) => {
    if (node.type === 'content') {
      const { frontmatter } = node
      if (!frontmatter?.slug) return

      const { slug, title, description, tags, date, draft, info } = frontmatter
      const trail = [...parentPath]

      result[slug] = {
        slug,
        title,
        description: description || '',
        trail,
        url: {
          api: `/files/${[...trail, slug].join('/')}/index.html`,
          seo: `/${[...trail, slug].join('/')}`
        },
        tags: tags || null,
        date,
        draft: draft || false,
        info: info || false
      }
    } else if (node.type === 'directory') {
      for (const child of node.children) {
        traverse(child, [...parentPath, node.name])
      }
    }
  }

  traverse(tree)
  return result
}
