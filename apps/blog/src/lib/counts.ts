import { getCollection } from 'astro:content'

export type SiteCounts = {
  articles: number
  notes: number
  projects: number
}

export async function getSiteCounts(): Promise<SiteCounts> {
  const [articles, notes, projects] = await Promise.all([
    getCollection('articles', (a) => !a.data.draft),
    getCollection('notes', (n) => !n.data.draft),
    getCollection('projects').catch(() => [])
  ])
  return {
    articles: articles.length,
    notes: notes.length,
    projects: projects.length
  }
}
