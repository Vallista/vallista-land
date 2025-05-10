import fs from 'fs/promises'
import path from 'path'
import { frontmatterToJSON, Frontmatter } from '../utils'

/**
 * 지원되는 파일 확장자 목록
 */
const allowedFileExtensions = ['.mdx', '.md', '.png', '.jpg', '.jpeg', '.gif', '.webp']

/**
 * 콘텐츠 트리의 노드 타입 (최종 사용 구조)
 */
export type Node = DirectoryNode | ContentNode

/**
 * 디렉토리 노드
 */
export interface DirectoryNode {
  /** 폴더 이름 */
  name: string
  /** 고정 값: 'directory' */
  type: 'directory'
  /** basePath 기준 상대 경로 (확장자 없음) */
  path: string
  /** 상위 폴더 경로들의 배열 */
  folderTrail: string[]
  /** 하위 노드들 (디렉토리 or 콘텐츠) */
  children: Node[]
}

/**
 * 콘텐츠 노드
 */
export interface ContentNode {
  /** 파일 이름 (확장자 제외) */
  name: string
  /** 고정 값: 'content' */
  type: 'content'
  /** 소스 타입: index.mdx 기반인지 단일 파일인지 */
  sourceType: 'folder' | 'file'
  /** basePath 기준 상대 경로 (확장자 없음) */
  path: string
  /** `/files/...html` 형식의 URL 경로 */
  url: string
  /** 원본 mdx 파일 절대 경로 */
  mdxFilePath: string
  /** HTML 변환 결과 (선택적) */
  html?: string
  /** assets 폴더 내 이미지 경로들 */
  assets: string[]
  /** frontmatter 메타데이터 */
  frontmatter: Frontmatter
  /** 상위 폴더 경로들의 배열 */
  folderTrail: string[]
}

/**
 * File 시스템 탐색 중간 결과 구조
 */
export interface FileMeta {
  name: string
  type: 'directory' | 'content'
  sourceType?: 'folder' | 'file'
  mdxFilePath?: string
  html?: string
  path: string
  url?: string
  assets?: string[]
  frontmatter?: Frontmatter
  folderTrail: string[]
  children?: FileMeta[]
}

/**
 * FileMeta → Node 트리 구조로 변환합니다.
 *
 * @param meta FileMeta 타입 노드
 * @returns 변환된 Node 트리 노드
 */
export function buildTreeFromMeta(meta: FileMeta): Node {
  if (meta.type === 'directory') {
    return {
      name: meta.name,
      type: 'directory',
      path: meta.path,
      folderTrail: meta.folderTrail,
      children: (meta.children ?? []).map(buildTreeFromMeta)
    }
  } else {
    return {
      name: meta.name,
      type: 'content',
      sourceType: meta.sourceType!,
      path: meta.path,
      url: meta.url!,
      mdxFilePath: meta.mdxFilePath!,
      html: meta.html,
      assets: meta.assets ?? [],
      frontmatter: meta.frontmatter!,
      folderTrail: meta.folderTrail
    }
  }
}

/**
 * 지정된 디렉토리 경로를 기준으로 콘텐츠 파일들을 재귀 탐색하여 FileMeta 구조를 생성합니다.
 * 내부적으로 basePath는 자동 유지되며, 외부에선 단일 인자만 넘기면 됩니다.
 *
 * @param rootPath 콘텐츠 루트 디렉토리 경로 (예: `${cwd}/contents`)
 * @returns FileMeta 트리 구조 또는 null
 */
export async function collectFileMeta(rootPath: string): Promise<FileMeta | null> {
  const basePath = rootPath

  /**
   * 주어진 경로의 디렉토리를 재귀 탐색하여 FileMeta 트리를 생성합니다.
   *
   * @param currentPath 현재 탐색 중인 디렉토리 경로
   * @param folderTrail 상위 폴더 이름 경로 스택
   * @returns FileMeta 노드
   */
  async function walk(currentPath: string, folderTrail: string[]): Promise<FileMeta | null> {
    const stat = await fs.stat(currentPath)
    if (!stat.isDirectory()) return null

    const entries = await fs.readdir(currentPath, { withFileTypes: true })
    const folderName = path.basename(currentPath)
    const newTrail = [...folderTrail, folderName]

    const indexFile = entries.find((e) => e.isFile() && ['index.mdx', 'index.md'].includes(e.name))
    const assetsPath = entries.find((e) => e.isDirectory() && e.name === 'assets')
    const assets = assetsPath ? await readAssetsFolder(path.join(currentPath, 'assets')) : []

    const children: FileMeta[] = []

    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name)

      if (entry.isDirectory() && entry.name !== 'assets') {
        const child = await walk(entryPath, newTrail)
        if (child) children.push(child)
      }

      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        const base = path.basename(entry.name)
        if (allowedFileExtensions.includes(ext)) {
          if (!base.startsWith('index') && ['.mdx', '.md'].includes(ext)) {
            const meta = await buildFileMeta(entryPath, newTrail)
            children.push(meta)
          }
        }
      }
    }

    if (indexFile) {
      return await buildFolderMeta(path.join(currentPath, indexFile.name), currentPath, assets, folderTrail)
    }

    return {
      name: folderName,
      type: 'directory',
      path: relativePath(currentPath),
      folderTrail,
      children
    }
  }

  /** basePath 기준 상대 경로로 변환 */
  function relativePath(p: string) {
    return path.relative(basePath, p).replace(/\\/g, '/')
  }

  /** .mdx에서 확장자를 제거한 경로 생성 */
  function toContentPath(filePath: string): string {
    const parsed = path.parse(filePath)
    const cleanPath = path.join(parsed.dir, parsed.name)
    return relativePath(cleanPath)
  }

  /** 콘텐츠 URL 생성 (/files/...) */
  function convertToUrl(filePath: string): string {
    return `/files/${toContentPath(filePath)}.html`
  }

  /**
   * assets 폴더 내 파일 목록을 반환합니다.
   * @param dir assets 폴더 경로
   * @returns 파일 경로 배열
   */
  async function readAssetsFolder(dir: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dir, { withFileTypes: true })
      return files.filter((f) => f.isFile()).map((f) => path.join(dir, f.name))
    } catch {
      return []
    }
  }

  /**
   * 일반 .mdx 파일을 기반으로 콘텐츠 메타 정보를 생성합니다.
   */
  async function buildFileMeta(filePath: string, folderTrail: string[]): Promise<FileMeta> {
    const frontmatter = await readFrontmatter(filePath)
    return {
      name: path.parse(filePath).name,
      type: 'content',
      sourceType: 'file',
      path: toContentPath(filePath),
      url: convertToUrl(filePath),
      mdxFilePath: filePath,
      assets: [],
      frontmatter,
      folderTrail
    }
  }

  /**
   * index.mdx 기반의 폴더 콘텐츠 메타 정보를 생성합니다.
   */
  async function buildFolderMeta(
    indexPath: string,
    folderPath: string,
    assets: string[],
    folderTrail: string[]
  ): Promise<FileMeta> {
    const frontmatter = await readFrontmatter(indexPath)
    return {
      name: path.basename(folderPath),
      type: 'content',
      sourceType: 'folder',
      path: relativePath(folderPath),
      url: convertToUrl(folderPath),
      mdxFilePath: indexPath,
      assets,
      frontmatter,
      folderTrail
    }
  }

  /** MDX 파일에서 frontmatter 추출 */
  async function readFrontmatter(filePath: string): Promise<Frontmatter> {
    const content = await fs.readFile(filePath, 'utf-8')
    return frontmatterToJSON(content)
  }

  return walk(rootPath, [])
}
