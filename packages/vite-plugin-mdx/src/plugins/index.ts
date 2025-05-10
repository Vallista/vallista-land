import { Plugin } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import chalk from 'chalk'

import {
  collectFileMeta,
  buildTreeFromMeta,
  Node,
  createTreeToHTML,
  createTreeToJson,
  writeHTMLFiles,
  Data
} from '../core'

import { transformMdxToHTML, removeFrontmatter, remarkAutoHighlight, rehypePrettyCodeOptions } from '../utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type PluginOptions = {
  contentPath: string
  resultPath: string
}

export default function vitePluginMdxTransform({ contentPath, resultPath }: PluginOptions): Plugin {
  const absContentPath = path.resolve(__dirname, contentPath)
  const absResultPath = path.resolve(__dirname, resultPath)
  const jsonPath = path.join(absResultPath, 'index.json')

  async function transformAll() {
    const meta = await collectFileMeta(absContentPath)
    if (!meta) throw new Error('콘텐츠 메타 수집 실패')

    const tree = buildTreeFromMeta(meta)

    const json = createTreeToJson(tree)
    await fs.mkdir(absResultPath, { recursive: true })
    await fs.writeFile(jsonPath, JSON.stringify(json, null, 2), 'utf-8')
    console.log(chalk.green('✅ JSON 생성 완료'))

    const htmlTree = await createTreeToHTML(tree)
    await writeHTMLFiles(htmlTree, absResultPath)
    console.log(chalk.green('✅ HTML 파일 저장 완료'))
  }

  async function transformOne(filePath: string) {
    const ext = path.extname(filePath)
    if (!['.md', '.mdx'].includes(ext)) return

    const stat = await fs.stat(filePath)
    if (!stat.isFile()) return

    const relativePath = path.relative(absContentPath, filePath)
    const parsed = path.parse(relativePath)
    const nodePath = path.join(parsed.dir, parsed.name).replace(/\\/g, '/')

    const mdx = await fs.readFile(filePath, 'utf-8')
    const content = removeFrontmatter(mdx)

    // 트리 메타 먼저 분석 → folderTrail, slug 확보
    const meta = await collectFileMeta(absContentPath)
    if (!meta) return
    const tree = buildTreeFromMeta(meta)
    const targetNode = findNodeByPath(tree, nodePath)
    if (!targetNode || targetNode.type !== 'content' || !targetNode.frontmatter?.slug) return

    console.log(targetNode.folderTrail)

    const html = await transformMdxToHTML(content, targetNode.folderTrail, targetNode.frontmatter.slug)
    const slug = targetNode.frontmatter.slug
    const slugPath = path.join(absResultPath, 'files', ...targetNode.folderTrail, slug)
    const htmlFilePath = path.join(slugPath, 'index.html')

    await fs.mkdir(path.dirname(htmlFilePath), { recursive: true })
    await fs.writeFile(htmlFilePath, html, 'utf-8')

    console.log(chalk.green(`✅ HTML 업데이트 완료 → ${slugPath}/index.html`))
    for (const asset of targetNode.assets) {
      const dest = path.join(slugPath, 'assets', path.basename(asset))
      await fs.mkdir(path.dirname(dest), { recursive: true })
      await fs.copyFile(asset, dest)
    }

    const updatedJsonNode = createTreeToJson(targetNode)
    updatedJsonNode[slug].trail = targetNode.folderTrail
    updatedJsonNode[slug].url = {
      api: `/files/${[...targetNode.folderTrail, slug].join('/')}/index.html`,
      seo: `/${[...targetNode.folderTrail, slug].join('/')}`
    }
    const jsonRaw = await fs.readFile(jsonPath, 'utf-8')
    const currentJson = JSON.parse(jsonRaw)
    const updatedJson = updateNodeInJsonTree(currentJson, updatedJsonNode)
    await fs.writeFile(jsonPath, JSON.stringify(updatedJson, null, 2), 'utf-8')
    console.log(chalk.green(`✅ JSON 업데이트 완료 → ${slug}`))
  }

  return {
    name: 'vite-plugin-mdx-transform',
    enforce: 'pre',

    async configResolved(config) {
      const mdxPkg = await import('@mdx-js/rollup')
      const remarkFrontmatter = (await import('remark-frontmatter')).default
      const remarkMdxFrontmatter = (await import('remark-mdx-frontmatter')).default
      const rehypePrettyCode = (await import('rehype-pretty-code')).default
      const mdx = mdxPkg.default

      const mdxPlugin = mdx({
        providerImportSource: '@mdx-js/react',
        jsxImportSource: '@emotion/react',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkAutoHighlight],
        rehypePlugins: [[rehypePrettyCode, rehypePrettyCodeOptions]]
      })

      ;(config.plugins as Plugin[]).push(mdxPlugin)
    },

    async configureServer() {
      if (process.env.NODE_ENV === 'production') return

      await transformAll()

      const chokidar = await import('chokidar')
      const watcher = chokidar.watch(absContentPath, { ignoreInitial: true })

      watcher.on('all', async (event, changedFile) => {
        console.log(chalk.cyan(`[watcher] ${event.toUpperCase()} → ${changedFile}`))
        try {
          await transformOne(changedFile)
        } catch (err) {
          console.error(chalk.bgRed.white('❌ 파일 처리 중 에러:'), err)
        }
      })
    },

    async buildStart() {
      console.log(chalk.yellow('🔧 운영 빌드: 전체 콘텐츠 처리'))
      await transformAll()
    }
  }
}

function findNodeByPath(tree: Node, targetPath: string): Node | null {
  if (tree.type === 'directory') {
    for (const child of tree.children) {
      const found = findNodeByPath(child, targetPath)
      if (found) return found
    }
  } else {
    if (targetPath.includes(tree.name)) return tree
  }
  return null
}

/**
 * slug 기반 JSON 데이터 병합 및 삭제
 *
 * @param json 기존 JSON 데이터 (Record<string, Data>)
 * @param patch 새로 반영할 데이터 (동일 slug key를 덮어씀)
 * @param remove 제거할 slug 키 배열
 * @returns 병합 및 삭제가 반영된 새 JSON 객체
 */
export function updateNodeInJsonTree(
  json: Record<string, Data>,
  patch: Record<string, Data>,
  remove: string[] = []
): Record<string, Data> {
  const updated = { ...json }

  // 덮어쓰기
  for (const [slug, data] of Object.entries(patch)) {
    updated[slug] = data
  }

  // 삭제
  for (const slug of remove) {
    delete updated[slug]
  }

  return updated
}
