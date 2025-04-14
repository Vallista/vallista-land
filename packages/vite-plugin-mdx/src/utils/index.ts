import fs from 'fs'

/**
 * 폴더를 생성할 때 이미 있는 폴더인지 확인하고 생성합니다.
 *
 * @param {string} path - 생성할 폴더 경로
 */
export async function createFolder(path: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.mkdir(path, { recursive: true }, (err) => {
      if (err) {
        reject(`Error creating folder ${path}: ${err}`)
        return
      }
      resolve()
    })
  })
}

export async function createFile(
  path: string,
  data: string | NodeJS.ArrayBufferView,
  options: fs.WriteFileOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, options, (err) => {
      if (err) {
        reject(`Error writing file ${path}: ${err}`)
        return
      }

      resolve()
    })
  })
}
