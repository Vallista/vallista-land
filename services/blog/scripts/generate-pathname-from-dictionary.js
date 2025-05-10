import fs from 'fs/promises'
import path from 'path'
import yaml from 'js-yaml'

const contentsDir = path.resolve('contents')
const dictPath = path.resolve('scripts/word-dictionary.json')

async function walkContents(dir) {
  let results = []
  const list = await fs.readdir(dir, { withFileTypes: true })

  for (const file of list) {
    const filePath = path.join(dir, file.name)
    if (file.isDirectory()) {
      const deeper = await walkContents(filePath)
      results = results.concat(deeper)
    } else if (/\.(md|mdx)$/.test(file.name)) {
      results.push(filePath)
    }
  }
  return results
}

function slugifyTitle(title, wordDictionary) {
  const blocks = title.match(/([0-9]+|[가-힣]+)/g)

  if (blocks && blocks.length > 0) {
    const slugParts = blocks
      .map((block) => {
        if (/^[0-9]+$/.test(block)) return block
        return wordDictionary[block] || ''
      })
      .filter(Boolean)

    return slugParts.join('-').toLowerCase()
  } else {
    return title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
  }
}

async function generatePathname() {
  const wordDictionary = JSON.parse(await fs.readFile(dictPath, 'utf-8'))
  const files = await walkContents(contentsDir)

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf-8')
    const frontmatterMatch = raw.match(/^---\s*([\s\S]*?)\s*---/)
    if (!frontmatterMatch) {
      console.warn(`⚠️ 프론트매터를 찾을 수 없습니다: ${filePath}`)
      continue
    }

    const frontmatterRaw = frontmatterMatch[1]
    const body = raw.slice(frontmatterMatch[0].length).trim()

    let meta = {}
    try {
      meta = yaml.load(frontmatterRaw) || {}
    } catch (err) {
      console.warn(`⚠️ YAML 파싱 실패: ${filePath}`)
      continue
    }

    if (!meta.title) {
      console.warn(`⚠️ 타이틀(title)을 찾을 수 없습니다: ${filePath}`)
      continue
    }

    // ⛔ 기존 pathname 무시하고 항상 새로 생성
    const slugBase =
      path.basename(filePath).replace(/\.(md|mdx)$/, '') === 'index'
        ? path.basename(path.dirname(filePath))
        : path.basename(filePath).replace(/\.(md|mdx)$/, '')

    const slug = slugifyTitle(slugBase, wordDictionary)
    const relativeToContents = path.relative(contentsDir, path.dirname(filePath))
    // const urlDirPart = relativeToContents.split(path.sep).join('/')

    // const sluggedTitle = meta.title.split(' ').join('-')
    // meta.pathname = `/contents/${urlDirPart ? urlDirPart + '/' : ''}${slug}`.replace(/\/+/g, '/')
    // meta.pathname = meta.pathname.replace(`/${sluggedTitle}`, '')
    meta.slug = slug
    console.log(`✏️ slug 덮어쓰기 완료: ${meta.slug} (파일: ${filePath})`)

    // pathname 삭제
    delete meta.pathname
    const newFrontmatter = yaml.dump(meta, { lineWidth: -1 }).trim()
    const newContent = `---\n${newFrontmatter}\n---\n\n${body}`

    await fs.writeFile(filePath, newContent)
    console.log(`💾 저장 완료: ${filePath}`)
  }

  console.log('\n🎉 모든 MDX 파일의 pathname 갱신 완료!')
}

generatePathname()
