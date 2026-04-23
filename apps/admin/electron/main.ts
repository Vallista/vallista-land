import { app as electronApp, BrowserWindow, shell } from 'electron'
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

process.env.VALLISTA_REPO_ROOT = resolveRepoRoot()

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
    title: 'vallista admin',
    backgroundColor: '#ffffff',
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
