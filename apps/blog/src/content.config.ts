import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const COVERS = ['grid', 'stripes', 'dots', 'blocks', 'lines'] as const

function coerceTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter((s) => s.trim().length > 0)
  if (typeof v === 'string' && v.trim().length > 0) return [v]
  return []
}

function pickCover(slug: string): (typeof COVERS)[number] {
  let hash = 0
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0
  }
  return COVERS[hash % COVERS.length]!
}

const articleSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    dek: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.preprocess(coerceTags, z.array(z.string())),
    tag: z.string().optional(),
    slug: z.string().optional(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
    info: z.boolean().default(false),
    featured: z.boolean().default(false),
    cover: z.enum(COVERS).optional(),
    series: z
      .union([
        z.string(),
        z.object({
          slug: z.string().optional(),
          name: z.string().optional(),
          order: z.number().int().optional(),
          total: z.number().int().optional()
        })
      ])
      .optional()
  })
  .transform((data) => {
    const slug = data.slug ?? ''
    const series =
      typeof data.series === 'string' ? { name: data.series } : data.series
    return {
      ...data,
      series,
      dek: data.dek ?? data.description ?? '',
      description: data.description ?? data.dek ?? '',
      tag: data.tag ?? data.tags[0] ?? '미분류',
      cover: data.cover ?? pickCover(slug)
    }
  })

const articles = defineCollection({
  loader: glob({
    pattern: ['**/index.md', '**/*.md'],
    base: '../../contents/articles',
    generateId: ({ entry }) => {
      // 폴더형 글: "2017년-회고/index.md" → "2017년-회고"
      // 단일 파일:  "BNF-Backus-Naur-Form.md" → "BNF-Backus-Naur-Form"
      if (entry.endsWith('/index.md')) return entry.slice(0, -'/index.md'.length)
      if (entry.endsWith('.md')) return entry.slice(0, -'.md'.length)
      return entry
    }
  }),
  schema: articleSchema
})

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: '../../contents/notes' }),
  schema: z.object({
    title: z.string().optional(),
    date: z.coerce.date(),
    tags: z.preprocess(coerceTags, z.array(z.string())).default([]),
    slug: z.string().optional(),
    draft: z.boolean().default(false)
  })
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: '../../contents/projects' }),
  schema: z.object({
    slug: z.string(),
    title: z.string(),
    tag: z.string(),
    description: z.string(),
    status: z.enum(['active', 'maintenance', 'archived']),
    stars: z.number().int().default(0),
    cover: z.enum(COVERS).default('blocks'),
    links: z
      .object({
        github: z.string().url().optional(),
        demo: z.string().url().optional(),
        docs: z.string().url().optional()
      })
      .default({})
  })
})

export const collections = { articles, notes, projects }
