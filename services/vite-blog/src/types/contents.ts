export interface BaseContent {
  /** 콘텐츠의 타입 */
  type: 'ARTICLE' | 'NOTE' | 'PROJECT'
  /** 콘텐츠의 고유 ID */
  slug: string
  /** 콘텐츠의 제목 */
  title: string
  /** 콘텐츠의 작성 날짜 */
  date: string
  /** 콘텐츠의 태그 */
  tags: string[]
  /** 콘텐츠의 경로 */
  path: string
  /** 콘텐츠의 주소 */
  url: string
  /**
   * 콘텐츠를 작성중인가?
   * @default true
   */
  draft?: boolean
  /** 콘텐츠의 대표 이미지 */
  thumbnail?: string
}

export interface Article extends BaseContent {
  type: 'ARTICLE'
  /** 콘텐츠가 시리즈물인가? */
  series?: {
    /** 시리즈 이름 */
    name: string
    /** 시리즈에서 몇 번째 편인가? default = 1 */
    priority?: number
  }
}

export interface Note extends BaseContent {
  type: 'NOTE'
}

export interface Project extends BaseContent {
  type: 'PROJECT'
}

export type Content = Article | Note | Project
export type ContentWithRaw = Content & {
  /** 콘텐츠의 원본 데이터 */
  raw: string
}
export type ContentType = Content['type']
