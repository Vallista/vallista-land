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
  }
  html: string
}

export interface IndexQuery {
  allMarkdownRemark: {
    nodes: Post[]
  }
}

export interface PostQuery extends IndexQuery {
  seriesGroup: { group: { fieldValue: string; totalCount: number }[] }
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
}

export interface SidebarPost {
  name: string
  slug: string
  series: string | null
  image: string | null
}
