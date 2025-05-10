import fs from 'fs'

/**
 * 폴더를 생성할 때 이미 있는 폴더인지 확인하고 생성합니다.
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

/**
 * 파일을 생성할 때, 내용을 작성합니다.
 * @param {string} path - 파일 경로
 * @param {string | NodeJS.ArrayBufferView} data - 파일에 쓸 데이터
 * @param {fs.WriteFileOptions} options - 파일 옵션
 */
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

/**
 * 경로의 파일을 utf-8로 읽어옵니다.
 * @param {string} path - 읽어올 파일 경로
 * @returns {Promise<string>} - 파일 내용
 */
export async function readFile(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) {
        reject(`Error reading file ${path}: ${err}`)
        return
      }
      resolve(data)
    })
  })
}
