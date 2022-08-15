export interface Image {
  publicURL: string
}

export interface Post {
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
    draft?: boolean
  }
  html: string
}

export interface IndexQuery {
  allMarkdownRemark: {
    nodes: Post[]
    group?: { fieldValue: string; totalCount: number }[]
  }
}

export interface PostQuery extends IndexQuery {
  markdownRemark: Post & {
    id: string
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
  markdownRemark: Post
}

export interface SidebarPost {
  name: string
  slug: string
  series: string | null
  image: string | null
  tags: string[]
}
