// scripts/extract-korean-words.js
import fs from 'fs/promises'
import path from 'path'

const contentsDir = path.resolve('contents')
const outputJson = path.resolve('scripts/word-dictionary.json')

// 한글 단어만 추출하는 정규식
const koreanWordRegex = /[가-힣]+/g

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

async function extractKoreanWords() {
  const files = await walkContents(contentsDir)
  const wordsSet = new Set()

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf-8')

    const frontmatterMatch = raw.match(/^---\s*([\s\S]*?)\s*---/)
    if (!frontmatterMatch) continue

    const frontmatterRaw = frontmatterMatch[1]
    const titleMatch = frontmatterRaw.match(/title:\s*(.*)/)

    if (!titleMatch) continue

    const title = titleMatch[1].trim()
    const matches = title.match(koreanWordRegex)

    if (matches) {
      matches.forEach((word) => wordsSet.add(word))
    }
  }

  const wordDictionary = {}
  Array.from(wordsSet)
    .sort()
    .forEach((word) => {
      wordDictionary[word] = ''
    })

  await fs.writeFile(outputJson, JSON.stringify(wordDictionary, null, 2), 'utf-8')
  console.log(`✅ 단어 후보 추출 완료: ${outputJson}`)
}

extractKoreanWords()
