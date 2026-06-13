import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import { FileScanner } from './services/scanner'
import { FileAnalyzer } from './services/analyzer'
import { RuntimeDetector } from './services/runtime-detector'
import { CleanerService } from './services/cleaner'

// 配置文件路径（项目目录下）
const getConfigPath = () => {
  const appPath = app.getAppPath()
  return join(appPath, 'config.json')
}

const isDev = !app.isPackaged

// ========== 减少磁盘占用和启动优化 ==========
// 禁用 GPU 缓存（减少磁盘占用）
app.commandLine.appendSwitch('--disable-gpu-cache')
// 禁用磁盘缓存
app.commandLine.appendSwitch('--disk-cache-size', '0')
// 禁用媒体缓存
app.commandLine.appendSwitch('--media-cache-size', '0')
// ========== 优化结束 ==========

let mainWindow: BrowserWindow | null = null
let scanner: FileScanner | null = null
let analyzer: FileAnalyzer | null = null
let runtimeDetector: RuntimeDetector | null = null
let cleaner: CleanerService | null = null

// ========== 单实例锁定 ==========
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
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
    // 启动优化：禁用一些不必要的功能
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // 禁用 spellcheck 减少内存占用
      spellcheck: false,
      // 禁用 web security 的一些检查（仅开发时）
      webSecurity: !isDev
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // 延迟初始化服务，加快启动速度
    setTimeout(initServices, 100)
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }
}

// 延迟初始化服务
function initServices(): void {
  if (!scanner) scanner = new FileScanner()
  if (!analyzer) analyzer = new FileAnalyzer()
  if (!runtimeDetector) runtimeDetector = new RuntimeDetector()
  if (!cleaner) cleaner = new CleanerService()
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

  // Shell 操作
  ipcMain.handle('shell:openPath', async (event, filePath: string) => {
    try {
      await shell.openPath(filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('shell:showItemInFolder', async (event, filePath: string) => {
    try {
      shell.showItemInFolder(filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 配置文件操作
  ipcMain.handle('config:save', async (event, config) => {
    try {
      const configPath = getConfigPath()
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('config:load', async () => {
    try {
      const configPath = getConfigPath()
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf-8')
        return JSON.parse(data)
      }
      return null
    } catch (error) {
      return null
    }
  })

  // 获取磁盘信息 - 使用 wmic 命令获取准确数据
  ipcMain.handle('get-disk-info', async () => {
    try {
      const { exec } = require('child_process')
      const { promisify } = require('util')
      const execAsync = promisify(exec)

      // 使用 wmic 获取 C 盘信息（更可靠）
      const { stdout } = await execAsync(
        'wmic logicaldisk where "DeviceID=\'C:\'" get Size,FreeSpace /format:csv',
        { timeout: 10000 }
      )

      const lines = stdout.trim().split('\n')
      if (lines.length >= 2) {
        const data = lines[lines.length - 1].split(',')
        const freeSpace = parseInt(data[1]) || 0
        const totalSize = parseInt(data[2]) || 0
        const usedSpace = totalSize - freeSpace

        return [{
          filesystem: 'NTFS',
          mounted: 'C:',
          size: totalSize,
          used: usedSpace,
          available: freeSpace,
          capacity: totalSize > 0 ? `${((usedSpace / totalSize) * 100).toFixed(1)}%` : '0%'
        }]
      }

      // 备用方案：使用 node-disk-info
      const nodeDiskInfo = await import('node-disk-info')
      const disks = await nodeDiskInfo.getDiskInfo()
      return disks.map(disk => ({
        filesystem: disk.filesystem,
        mounted: disk.mounted,
        size: Number(disk.size) || 0,
        used: Number(disk.used) || 0,
        available: Number(disk.available) || 0,
        capacity: disk.capacity
      }))
    } catch (error) {
      console.error('获取磁盘信息失败:', error)
      // 返回默认值避免 NaN
      return [{
        filesystem: 'NTFS',
        mounted: 'C:',
        size: 0,
        used: 0,
        available: 0,
        capacity: '0%'
      }]
    }
  })

  // 扫描文件 - 使用 setImmediate 避免阻塞
  ipcMain.handle('scan:start', async (event, options) => {
    if (!scanner) initServices()
    try {
      const results = await new Promise((resolve, reject) => {
        setImmediate(async () => {
          try {
            const data = await scanner!.scan(options, (progress) => {
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
      scanner?.stopScan()
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 分析文件归属
  ipcMain.handle('analyze:files', async (event, files) => {
    if (!analyzer) initServices()
    try {
      const results = await analyzer!.analyzeFiles(files)
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 检测运行时
  ipcMain.handle('runtime:detect', async () => {
    if (!runtimeDetector) initServices()
    try {
      const runtimes = await runtimeDetector!.detectAll()
      return { success: true, data: runtimes }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  // 清理文件
  ipcMain.handle('clean:execute', async (event, files) => {
    if (!cleaner) initServices()
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
        const cleanResult = await cleaner!.cleanFiles(files)
        return { success: true, data: cleanResult }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    }
    return { success: false, error: '用户取消操作' }
  })

  // AI分析
  ipcMain.handle('ai:analyze', async (event, { apiKey, provider, files }) => {
    if (!analyzer) initServices()
    try {
      const results = await analyzer!.aiAnalyze(files, apiKey, provider)
      return { success: true, data: results }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })
}
