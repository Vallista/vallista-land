import fs from 'fs'
import { createFolder, PUBLIC_PATH } from '../utils'
import { transformMdxFileToHTML } from './html'
import { transformMdxFrontMatterJson } from './mdx'
import { JSON_FILE_NAME } from '../utils'

interface MdxToHTMLReturns {
  success: boolean
  message: string
  error?: Error
}

type MdxToHTMLType = (contentPath: string, resultPath: string) => Promise<MdxToHTMLReturns>
type FileMdxToHTMlType = (contentPath: string, resultPath: string, changeFile: string) => Promise<MdxToHTMLReturns>

export const transformAllMdxToHTML: MdxToHTMLType = async (contentPath: string, resultPath: string) => {
  try {
    const categories = fs.readdirSync(contentPath)
    const jsonData: Record<string, Record<string, unknown>> = {}

    // NOTE: 카테고리 폴더 순회
    categories.forEach(async (category) => {
      const categoryPath = `${contentPath}/${category}`
      const resultCategoryPath = `${resultPath}/${category}`
      await createFolder(resultCategoryPath)

      const postNames = fs.readdirSync(categoryPath)

      postNames.forEach(async (postName) => {
        // NOTE: .DS_Store 파일은 무시
        if (postName.includes('.DS_Store')) {
          return
        }

        // NOTE: 콘텐트 폴더 경로
        const contentPath = `${categoryPath}/${postName}`
        const stat = fs.statSync(contentPath)

        // NOTE: 콘텐트가 폴더 인 경우
        if (stat.isDirectory()) {
          // NOTE: 읽을 폴더 경로
          const files = fs.readdirSync(contentPath)
          // NOTE: 결과물 경로
          const resultFolderPath = `${resultCategoryPath}/${postName}`

          // NOTE: 폴더가 존재하는 경우 > 폴더 내의 mdx 파일을 HTML로 변환
          // NOTE: 패턴) assets 폴더가 존재할 수 있고, mdx 파일은 항상 존재함.
          files.forEach(async (file) => {
            if (file.includes('.DS_Store')) {
              return
            }

            await createFolder(resultFolderPath)

            if (file.includes('assets')) {
              const assetsPath = `${contentPath}/${file}`
              const resultAssetsPath = `${resultFolderPath}/${file}`

              if (!resultFolderPath.includes('assets')) await createFolder(`${resultFolderPath}/assets`)

              const readAssets = fs.readdirSync(assetsPath)

              readAssets.forEach((assetsFile) => {
                const assetsFilePath = `${assetsPath}/${assetsFile}`
                const resultAssetsFilePath = `${resultAssetsPath}/${assetsFile}`
                fs.copyFileSync(assetsFilePath, resultAssetsFilePath)
              })
              return
            }

            const slug = postName
            const path = `${resultFolderPath}/${file}`.split(PUBLIC_PATH)[1].replace('.md', '.html')

            const mdx = await transformMdxFileToHTML(file, contentPath, resultFolderPath, slug, path)
            jsonData[postName] = await transformMdxFrontMatterJson(slug, category, path, mdx)
            fs.writeFileSync(`${resultPath}/${JSON_FILE_NAME}`, JSON.stringify(jsonData), 'utf-8')
          })
        } else {
          const resultFolderPath = `${resultCategoryPath}/${postName}`.split('/').slice(0, -1).join('/')
          const filePath = contentPath.replace(postName, '')
          const fileName = postName.split('.')[0]

          const slug = fileName
          const path = `${resultCategoryPath}/${postName}`.split(PUBLIC_PATH)[1].replace('.md', '.html')

          const mdx = await transformMdxFileToHTML(postName, filePath, resultFolderPath, slug, path)
          jsonData[fileName] = await transformMdxFrontMatterJson(slug, category, path, mdx)
          fs.writeFileSync(`${resultPath}/${JSON_FILE_NAME}`, JSON.stringify(jsonData), 'utf-8')
        }
      })
    })

    return {
      success: true,
      message: `MDX files transformed to HTML successfully`
    }
  } catch (err) {
    return {
      success: false,
      message: 'Error transforming mdx to HTML',
      error: err as Error
    }
  }
}

export const transformFileMdxToHTML: FileMdxToHTMlType = async (
  contentPath: string,
  resultPath: string,
  changeFile: string
) => {
  try {
    // NOTE: 아무런 파일도 생성되어 있지 않은 경우 = 모든 파일을 새로 생성한다.
    if (fs.readdirSync(contentPath).length === 0) {
      await transformAllMdxToHTML(contentPath, resultPath)
      return {
        success: true,
        message: `폴더가 존재하지 않아 모든 MDX 파일을 HTML로 변환했습니다.`
      }
    }

    // NOTE: 변경된 파일이 있는 경우
    const filePath = changeFile.split('/').slice(0, -1).join('/') // 파일명과 확장자 제거
    const fileName = changeFile.split('/').slice(-1).join('/') // 파일명과 확장자
    let originalFileName = fileName.split('.')[0] // 파일명만

    // NOTE: changeFile을 resultPath에 맞게 변환
    const resultFilePathWithFileName = changeFile.replace(contentPath, resultPath)
    const resultFilePath = resultFilePathWithFileName.split('/').slice(0, -1).join('/') // 파일명과 확장자 제거
    await createFolder(resultFilePath) // result path에 폴더가 존재하지 않는 경우 생성

    const category = resultFilePathWithFileName.split(PUBLIC_PATH)[1].split('/')[2] // 카테고리 이름

    if (fileName === 'index.md') {
      originalFileName = filePath.split('/').slice(-1).join('/')
    }

    // NOTE: assets 폴더가 존재하는 경우
    const assetsPath = `${filePath}/assets`
    const resultAssetsPath = `${resultFilePath}/assets`

    if (fs.existsSync(assetsPath)) {
      await createFolder(resultAssetsPath)
      const readAssets = fs.readdirSync(assetsPath)
      readAssets.forEach((assetsFile) => {
        const assetsFilePath = `${assetsPath}/${assetsFile}`
        const resultAssetsFilePath = `${resultAssetsPath}/${assetsFile}`
        fs.copyFileSync(assetsFilePath, resultAssetsFilePath)
      })
    }

    const slug = originalFileName
    const path = resultFilePathWithFileName.split(PUBLIC_PATH)[1].replace('.md', '.html')

    // NOTE: mdx 파일을 HTML로 변환
    const mdx = await transformMdxFileToHTML(fileName, filePath, resultFilePath, slug, path)
    const resultJsonFileName = `${resultPath}/${JSON_FILE_NAME}`
    const loadJsonData = fs.readFileSync(resultJsonFileName, 'utf-8')
    const jsonData = JSON.parse(loadJsonData)
    jsonData[originalFileName] = await transformMdxFrontMatterJson(slug, category, path, mdx)
    fs.writeFileSync(resultJsonFileName, JSON.stringify(jsonData), 'utf-8')

    return {
      success: true,
      message: `MDX 파일을 HTML로 변환했습니다.`
    }
  } catch (err) {
    return {
      success: false,
      message: 'MDX 파일을 HTML로 변환하는 중 에러가 발생했습니다.',
      error: err as Error
    }
  }
}
