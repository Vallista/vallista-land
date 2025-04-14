import fs from 'fs'
import { transformMdx } from './mdx'
import { createFile } from '../utils'

/**
 * mdx 파일을 HTML 파일로 변환합니다.
 *
 * @param {string} file - 파일 이름
 * @param {string} filePath - 파일 경로
 * @param {string} resultPath - 결과물 경로
 */
export async function transformMdxFileToHTML(file: string, filePath: string, resultPath: string): Promise<void> {
  const resultFilePath = `${filePath}/${file}`

  return new Promise(async (resolve, reject) => {
    fs.readFile(resultFilePath, 'utf-8', async (err, data) => {
      if (err) {
        reject(`Error reading file ${resultFilePath}: ${err}`)
        return
      }

      const htmlContent = await transformMdx(data)
      const createNewFolder = `${resultPath}/${file.replace('.md', '.html')}`

      try {
        await createFile(createNewFolder, htmlContent, {
          encoding: 'utf-8'
        })

        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })
}
