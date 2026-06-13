import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { FileScanner } from './services/scanner'
import { FileAnalyzer } from './services/analyzer'
import { RuntimeDetector } from './services/runtime-detector'
import { CleanerService } from './services/cleaner'

const isDev = !app.isPackaged

let mainWindow: BrowserWindow | null = null
let scanner: FileScanner
let analyzer: FileAnalyzer
let runtimeDetector: RuntimeDetector
let cleaner: CleanerService

// ========== 单实例锁定 ==========
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  // 如果已经有实例在运行，直接退出
  app.quit()
} else {
  // 第二个实例启动时，聚焦到第一个实例的窗口
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    createWindow()
    setupIPC()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
// ========== 单实例锁定结束 ==========

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }

  // 初始化服务
  scanner = new FileScanner()
  analyzer = new FileAnalyzer()
  runtimeDetector = new RuntimeDetector()
  cleaner = new CleanerService()
}

// IPC通信处理
function setupIPC(): void {
  // 窗口控制
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.close())

  // 获取磁盘信息
  ipcMain.handle('get-disk-info', async () => {
    try {
      const nodeDiskInfo = await import('node-disk-info')
      const disks = await nodeDiskInfo.getDiskInfo()
      return disks.map(disk => ({
        filesystem: disk.filesystem,
        mounted: disk.mounted,
        size: disk.size,
        used: disk.used,
        available: disk.available,
        capacity: disk.capacity
      }))
    } catch (error) {
      console.error('获取磁盘信息失败:', error)
      return []
    }
  })

  // 扫描文件 - 使用 setImmediate 避免阻塞
  ipcMain.handle('scan:start', async (event, options) => {
    try {
      // 使用 Promise 包装，让出主线程
      const results = await new Promise((resolve, reject) => {
        setImmediate(async () => {
          try {
            const data = await scanner.scan(options, (progress) => {
              mainWindow?.webContents.send('scan:progress', progress)
            })
            resolve(data)
          } catch (err) {
            reject(err)
          }
        })
      })
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 停止扫描
  ipcMain.handle('scan:stop', async () => {
    try {
      scanner.stopScan()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 分析文件归属
  ipcMain.handle('analyze:files', async (event, files) => {
    try {
      const results = await analyzer.analyzeFiles(files)
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 检测运行时
  ipcMain.handle('runtime:detect', async () => {
    try {
      const runtimes = await runtimeDetector.detectAll()
      return { success: true, data: runtimes }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 清理文件
  ipcMain.handle('clean:execute', async (event, files) => {
    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'warning',
      buttons: ['取消', '确认清理'],
      defaultId: 0,
      title: '确认清理',
      message: `即将删除 ${files.length} 个文件`,
      detail: '此操作不可撤销，是否继续？'
    })

    if (result.response === 1) {
      try {
        const cleanResult = await cleaner.cleanFiles(files)
        return { success: true, data: cleanResult }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
    return { success: false, error: '用户取消操作' }
  })

  // AI分析
  ipcMain.handle('ai:analyze', async (event, { apiKey, provider, files }) => {
    try {
      const results = await analyzer.aiAnalyze(files, apiKey, provider)
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
