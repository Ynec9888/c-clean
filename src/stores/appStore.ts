import { create } from 'zustand'
import {
  ScannedFile,
  RuntimeInfo,
  CleanReport,
  DiskInfo,
  ScanProgress,
  RiskLevel
} from '@/types/electron'

interface AppState {
  // 主题
  theme: 'light' | 'dark'
  toggleTheme: () => void

  // 磁盘信息
  diskInfo: DiskInfo | null
  setDiskInfo: (info: DiskInfo) => void
  loadDiskInfo: () => Promise<void>

  // 扫描状态
  isScanning: boolean
  scanProgress: ScanProgress | null
  scannedFiles: ScannedFile[]
  selectedFiles: Set<string>
  startScan: (options?: any) => Promise<void>
  stopScan: () => void
  toggleFileSelection: (fileId: string) => void
  selectAllFiles: () => void
  deselectAllFiles: () => void
  selectByRisk: (risk: RiskLevel) => void

  // 运行时
  runtimes: RuntimeInfo[]
  isLoadingRuntimes: boolean
  loadRuntimes: () => Promise<void>

  // 清理
  isCleaning: boolean
  cleanReport: CleanReport | null
  cleanFiles: () => Promise<void>
  clearCleanReport: () => void

  // AI分析
  aiApiKey: string
  aiProvider: 'openai' | 'claude' | 'deepseek' | 'mimo'
  setAiConfig: (apiKey: string, provider: 'openai' | 'claude') => void
  isAiAnalyzing: boolean
  runAiAnalysis: () => Promise<void>

  // 统计
  getStats: () => {
    totalFiles: number
    totalSize: number
    safeFiles: number
    cautionFiles: number
    dangerousFiles: number
    selectedSize: number
  }

  // 视图
  currentView: 'dashboard' | 'scanner' | 'runtime' | 'settings'
  setCurrentView: (view: 'dashboard' | 'scanner' | 'runtime' | 'settings') => void

  // 侧边栏
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // 主题
  theme: 'light',
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light'
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      return { theme: newTheme }
    })
  },

  // 磁盘信息
  diskInfo: null,
  setDiskInfo: (info) => set({ diskInfo: info }),
  loadDiskInfo: async () => {
    try {
      const disks = await window.electronAPI.getDiskInfo()
      const cDisk = disks.find((d: DiskInfo) => d.mounted === 'C:')
      if (cDisk) {
        set({ diskInfo: cDisk })
      }
    } catch (error) {
      console.error('加载磁盘信息失败:', error)
    }
  },

  // 扫描状态
  isScanning: false,
  scanProgress: null,
  scannedFiles: [],
  selectedFiles: new Set(),
  startScan: async (options = {}) => {
    set({ isScanning: true, scanProgress: null, scannedFiles: [], selectedFiles: new Set() })

    // 监听进度
    const unsubscribe = window.electronAPI.scan.onProgress((progress) => {
      set({ scanProgress: progress })
    })

    try {
      const result = await window.electronAPI.scan.start(options)
      if (result.success && result.data) {
        // 自动选择安全文件
        const autoSelected = new Set(
          result.data
            .filter((f: ScannedFile) => f.riskLevel === 'safe')
            .map((f: ScannedFile) => f.id)
        )
        set({ scannedFiles: result.data, selectedFiles: autoSelected })
      }
    } catch (error) {
      console.error('扫描失败:', error)
    } finally {
      set({ isScanning: false })
      unsubscribe()
    }
  },
  stopScan: () => {
    // TODO: 实现停止扫描
    set({ isScanning: false })
  },
  toggleFileSelection: (fileId) => {
    set((state) => {
      const newSelected = new Set(state.selectedFiles)
      if (newSelected.has(fileId)) {
        newSelected.delete(fileId)
      } else {
        newSelected.add(fileId)
      }
      return { selectedFiles: newSelected }
    })
  },
  selectAllFiles: () => {
    set((state) => ({
      selectedFiles: new Set(state.scannedFiles.map((f) => f.id))
    }))
  },
  deselectAllFiles: () => {
    set({ selectedFiles: new Set() })
  },
  selectByRisk: (risk) => {
    set((state) => ({
      selectedFiles: new Set(
        state.scannedFiles
          .filter((f) => f.riskLevel === risk)
          .map((f) => f.id)
      )
    }))
  },

  // 运行时
  runtimes: [],
  isLoadingRuntimes: false,
  loadRuntimes: async () => {
    set({ isLoadingRuntimes: true })
    try {
      const result = await window.electronAPI.runtime.detect()
      if (result.success && result.data) {
        set({ runtimes: result.data })
      }
    } catch (error) {
      console.error('检测运行时失败:', error)
    } finally {
      set({ isLoadingRuntimes: false })
    }
  },

  // 清理
  isCleaning: false,
  cleanReport: null,
  cleanFiles: async () => {
    const { selectedFiles, scannedFiles } = get()
    const filesToClean = scannedFiles
      .filter((f) => selectedFiles.has(f.id))
      .map((f) => f.path)

    if (filesToClean.length === 0) return

    set({ isCleaning: true, cleanReport: null })
    try {
      const result = await window.electronAPI.clean.execute(filesToClean)
      if (result.success && result.data) {
        set({ cleanReport: result.data })
        // 重新扫描
        get().startScan()
      }
    } catch (error) {
      console.error('清理失败:', error)
    } finally {
      set({ isCleaning: false })
    }
  },
  clearCleanReport: () => set({ cleanReport: null }),

  // AI分析
  aiApiKey: '',
  aiProvider: 'deepseek' as 'openai' | 'claude' | 'deepseek' | 'mimo',
  setAiConfig: (apiKey, provider) => {
    set({ aiApiKey: apiKey, aiProvider: provider })
    // 持久化存储到 localStorage（不会被清理工具删除）
    try {
      localStorage.setItem('cclean-ai-config', JSON.stringify({ apiKey, provider }))
    } catch (e) {
      console.error('保存配置失败:', e)
    }
  },
  loadAiConfig: () => {
    try {
      const saved = localStorage.getItem('cclean-ai-config')
      if (saved) {
        const config = JSON.parse(saved)
        set({ aiApiKey: config.apiKey || '', aiProvider: config.provider || 'deepseek' })
      }
    } catch (e) {
      console.error('加载配置失败:', e)
    }
  },
  isAiAnalyzing: false,
  runAiAnalysis: async () => {
    const { aiApiKey, aiProvider, scannedFiles } = get()
    if (!aiApiKey || scannedFiles.length === 0) return

    set({ isAiAnalyzing: true })
    try {
      const result = await window.electronAPI.ai.analyze({
        apiKey: aiApiKey,
        provider: aiProvider,
        files: scannedFiles.map((f) => f.path)
      })
      if (result.success && result.data) {
        // 更新文件分析结果
        set((state) => ({
          scannedFiles: state.scannedFiles.map((file) => {
            const analysis = result.data?.find(
              (a: any) => a.filePath === file.path
            )
            if (analysis) {
              return {
                ...file,
                riskLevel: analysis.riskAssessment.level,
                software: analysis.software?.name || file.software,
                description: analysis.recommendations?.[0] || file.description
              }
            }
            return file
          })
        }))
      }
    } catch (error) {
      console.error('AI分析失败:', error)
    } finally {
      set({ isAiAnalyzing: false })
    }
  },

  // 统计
  getStats: () => {
    const { scannedFiles, selectedFiles } = get()
    return {
      totalFiles: scannedFiles.length,
      totalSize: scannedFiles.reduce((sum, f) => sum + f.size, 0),
      safeFiles: scannedFiles.filter((f) => f.riskLevel === 'safe').length,
      cautionFiles: scannedFiles.filter((f) => f.riskLevel === 'caution').length,
      dangerousFiles: scannedFiles.filter((f) => f.riskLevel === 'dangerous').length,
      selectedSize: scannedFiles
        .filter((f) => selectedFiles.has(f.id))
        .reduce((sum, f) => sum + f.size, 0)
    }
  },

  // 视图
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  // 侧边栏
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
}))
