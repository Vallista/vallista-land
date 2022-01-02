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
  timeToRead: number
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
  seriesGroup: { group: { fieldValue: string; totalCount: number }[] }
  markdownRemark: Post & {
    id: string
    headings: { depth: number; id: string | null; value: string }[]
  }
}

export interface PageProps<T> {
  data: T
}

export interface StaticQuery {
  site: {
    siteMetadata: {
      defaultTitle: string
      titleTemplate: string
      defaultDescription: string
      siteUrl: string
      defaultImage: string
      twitterUsername: string
    }
  }
}
