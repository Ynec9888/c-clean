import { contextBridge, ipcRenderer } from 'electron'

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close')
  },

  // Shell 操作
  shell: {
    openPath: (path: string) => ipcRenderer.invoke('shell:openPath', path),
    showItemInFolder: (path: string) => ipcRenderer.invoke('shell:showItemInFolder', path)
  },

  // 配置文件
  saveConfig: (config: any) => ipcRenderer.invoke('config:save', config),
  loadConfig: () => ipcRenderer.invoke('config:load'),

  // 磁盘信息
  getDiskInfo: () => ipcRenderer.invoke('get-disk-info'),

  // 扫描功能
  scan: {
    start: (options: any) => ipcRenderer.invoke('scan:start', options),
    stop: () => ipcRenderer.invoke('scan:stop'),
    onProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('scan:progress', (_, progress) => callback(progress))
      return () => {
        ipcRenderer.removeAllListeners('scan:progress')
      }
    }
  },

  // 文件分析
  analyze: {
    files: (files: any[]) => ipcRenderer.invoke('analyze:files', files)
  },

  // 运行时检测
  runtime: {
    detect: () => ipcRenderer.invoke('runtime:detect')
  },

  // 清理功能
  clean: {
    execute: (files: any[]) => ipcRenderer.invoke('clean:execute', files)
  },

  // AI分析
  ai: {
    analyze: (config: { apiKey: string; provider: string; files: any[] }) =>
      ipcRenderer.invoke('ai:analyze', config)
  }
})
