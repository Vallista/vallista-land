export interface Image {
  publicURL: string
  relativeDirectory: string
  relativePath: string
  root: string
  sourceInstanceName: string
}

export interface Post {
  excerpt: string
  fields: {
    slug: string
  }
  frontmatter: {
    title: string
    date: string
    tags: string[]
    image: Image | null
    series?: string | null
    seriesPriority?: number | null
  }
  html: string
}

export interface IndexQuery {
  allMarkdownRemark: {
    edges: {
      node: Post
    }[]
    group: { fieldValue: string; totalCount: number }[]
  }
}

export interface PostQuery extends IndexQuery {
  series: { group: { fieldValue: string; totalCount: number }[] }
  markdownRemark: Post & {
    id: string
    timeToRead: number
    headings: { depth: number; id: string | null; value: string }[]
  }
}

export interface PageProps<T> {
  data: T
}
