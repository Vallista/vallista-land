import { fileURLToPath } from 'url'
import path from 'path'
import chalk from 'chalk'
import { Plugin } from 'vite'
import { transformAllMdxToHTML, transformFileMdxToHTML } from '../transforms'
import { Options } from 'rehype-pretty-code'
import { remarkAutoHighlight } from './remarkAutoHighlight'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type PluginOptions = {
  contentPath: string
  resultPath: string
}

async function transformMdxToHTML(contentPath: string, resultPath: string, changedFile?: string) {
  console.log(chalk.yellow('🔧 작업 시작...'))

  if (changedFile) {
    await transformFileMdxToHTML(contentPath, resultPath, changedFile)
    console.log(`${chalk.greenBright(`✅ 작업 완료:`)}${chalk.gray(` ${changedFile}`)}`)
  } else {
    await transformAllMdxToHTML(contentPath, resultPath)
    console.log(chalk.greenBright(`✅ 작업 완료:`))
  }
}

export const rehypePrettyCodeOptions: Options = {
  theme: 'one-dark-pro',
  keepBackground: false,

  onVisitLine(node) {
    if (node.children.length === 0) {
      node.children = [{ type: 'text', value: ' ' }]
    }
  },

  onVisitHighlightedLine(node) {
    node.properties.className ??= []
    node.properties.className.push('highlighted')
  },

  onVisitHighlightedChars(node) {
    node.properties.className ??= []
    node.properties.className.push('word')
  }
}

export default async (options: PluginOptions): Promise<Plugin> => {
  const { contentPath, resultPath } = options

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

  return {
    name: 'vite-plugin-mdx',
    enforce: 'pre',

    configResolved(config) {
      ;(config.plugins as Plugin[]).push(mdxPlugin)
    },

    async configureServer() {
      if (process.env.NODE_ENV === 'production') return

      const chokidar = await import('chokidar')
      const absContentPath = path.resolve(__dirname, contentPath)

      const watcher = chokidar.watch(absContentPath, { ignoreInitial: true })

      watcher.on('all', async (event, filePath) => {
        try {
          console.log(chalk.cyan(`[watcher] ${event.toUpperCase()} → ${filePath}`))
          await transformMdxToHTML(contentPath, resultPath, filePath)
        } catch (err) {
          console.error(chalk.bgRed.white('❌ 작업 중 에러:'), err)
        }
      })
    },

    async buildStart() {
      try {
        console.log(chalk.yellow('🔧 운영 빌드: 전체 파일 처리 시작'))
        await transformMdxToHTML(contentPath, resultPath)
        console.log(chalk.greenBright('✅ 운영 빌드: 전체 파일 처리 완료'))
      } catch (err) {
        console.error(chalk.bgRed.white('❌ 빌드 중 에러:'), err)
      }
    }
  }
}
