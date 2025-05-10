import fs from 'fs/promises'
import path from 'path'
import { Node } from './buildTree'

/**
 * HTML 필드가 추가된 콘텐츠 트리를 순회하면서 HTML 파일을 생성합니다.
 * - `folderTrail + slug + index.html` 형식으로 저장
 * - assets가 있다면 같은 폴더 하위에 복사
 *
 * @param tree HTML이 포함된 콘텐츠 트리 (Node)
 * @param distPath 저장 대상 루트 디렉토리 (예: `/dist/files`)
 */
export async function writeHTMLFiles(tree: Node, distPath: string) {
  if (tree.type === 'content') {
    const slug = tree.frontmatter.slug
    const slugPath = path.join(distPath, 'files', ...tree.folderTrail, slug)
    const htmlPath = path.join(slugPath, 'index.html')

    await fs.mkdir(slugPath, { recursive: true })
    await fs.writeFile(htmlPath, tree.html ?? '', { encoding: 'utf-8' })

    // assets 복사
    for (const asset of tree.assets) {
      const assetDest = path.join(slugPath, 'assets', path.basename(asset))
      await fs.mkdir(path.dirname(assetDest), { recursive: true })
      await fs.copyFile(asset, assetDest)
    }

    return
  }

  // 디렉토리 노드: 하위 노드 순회
  for (const child of tree.children) {
    await writeHTMLFiles(child, distPath)
  }
}
