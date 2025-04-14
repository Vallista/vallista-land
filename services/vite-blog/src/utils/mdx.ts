import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { toText } from '.'

const excludes = ['.DS_Store']

export function loadMdxWithFolder(name: string) {
  const directoryPath = path.join(process.cwd(), 'content/', name)
  const fileNames = fs.readdirSync(directoryPath).filter((fileName) => !excludes.includes(fileName))

  return fileNames.map((fileName) => {
    const isFolder = fs.lstatSync(path.join(directoryPath, fileName)).isDirectory()
    const filePath = isFolder ? path.join(directoryPath, fileName, 'index.') : path.join(directoryPath, fileName)
    const fileExtension = fs.existsSync(`${filePath}mdx`) ? 'mdx' : 'md'
    const filePathWithExtension = `${filePath}${isFolder ? fileExtension : ''}`
    const fileContents = fs.readFileSync(filePathWithExtension, 'utf8')
    const { data, content } = matter(fileContents)

    return {
      data: {
        ...data,
        title: toText(fileName),
        slug: fileName
      } as {
        title: string
        tags: string[]
        date: string
        draft: boolean
        info: boolean
        image: string
        series: string
        seriesPriority: number
        slug: string
      },
      content,
      fileName
    }
  })
}
