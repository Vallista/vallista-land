import { app as electronApp, BrowserWindow, shell } from 'electron'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const DEV_URL = 'http://localhost:5977'
const isDev = !electronApp.isPackaged

function resolveRepoRoot(): string {
  if (process.env.VALLISTA_REPO_ROOT) return resolve(process.env.VALLISTA_REPO_ROOT)
  if (isDev) {
    // dist-electron/main.mjs → apps/admin → apps → monorepo root
    return resolve(HERE, '../../..')
  }
  // packaged 기본값. 추후 폴더 선택 UI로 교체 가능.
  return '/Users/mgh/Desktop/projects/vallista-land'
}

function loadDotEnv(path: string): void {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

const REPO_ROOT = resolveRepoRoot()
process.env.VALLISTA_REPO_ROOT = REPO_ROOT

// packaged 앱은 vite 의 loadEnv 경로를 거치지 않으므로 .env.local 을 직접 주입한다.
// GA_PROPERTY_ID · GOOGLE_APPLICATION_CREDENTIALS · GITHUB_TOKEN 등이 여기에 의존.
loadDotEnv(resolve(REPO_ROOT, 'apps/admin/.env.local'))
loadDotEnv(resolve(REPO_ROOT, 'apps/admin/.env'))

let serverHandle: { port: number; close(): Promise<void> } | null = null

async function bootServer(): Promise<string> {
  if (isDev) return DEV_URL
  const distRoot = resolve(HERE, '../dist')
  const mod = await import('../src/server/index.js')
  serverHandle = await mod.startServer({ staticRoot: distRoot })
  return `http://127.0.0.1:${serverHandle.port}`
}

async function createWindow(): Promise<void> {
  const targetUrl = await bootServer()
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    title: 'Vallista 블로그 운영 툴',
    backgroundColor: '#ffffff',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 14, y: 14 },
    webPreferences: {
      preload: resolve(HERE, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  await win.loadURL(targetUrl)
  if (isDev) win.webContents.openDevTools({ mode: 'detach' })
}

electronApp.whenReady().then(createWindow)

electronApp.on('window-all-closed', () => {
  if (process.platform !== 'darwin') electronApp.quit()
})

electronApp.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) void createWindow()
})

electronApp.on('before-quit', async () => {
  if (serverHandle) {
    try {
      await serverHandle.close()
    } catch {
      // noop
    }
  }
})
