export interface ElectronAPI {
  window: {
    minimize: () => void
    maximize: () => void
    close: () => void
  }
  getDiskInfo: () => Promise<DiskInfo[]>
  scan: {
    start: (options: ScanOptions) => Promise<ScanResult>
    onProgress: (callback: (progress: ScanProgress) => void) => () => void
  }
  analyze: {
    files: (files: string[]) => Promise<AnalysisResult>
  }
  runtime: {
    detect: () => Promise<RuntimeResult>
  }
  clean: {
    execute: (files: string[]) => Promise<CleanResult>
  }
  ai: {
    analyze: (config: AIConfig) => Promise<AIResult>
  }
}

export interface DiskInfo {
  filesystem: string
  mounted: string
  size: number
  used: number
  available: number
  capacity: string
}

export interface ScanOptions {
  paths?: string[]
  categories?: string[]
  minSize?: number
  maxAge?: number
}

export interface ScanProgress {
  currentPath: string
  filesFound: number
  totalSize: number
  percentage: number
}

export interface ScanResult {
  success: boolean
  data?: ScannedFile[]
  error?: string
}

export interface ScannedFile {
  id: string
  path: string
  name: string
  extension: string
  size: number
  createdAt: string
  modifiedAt: string
  accessedAt: string
  category: FileCategory
  riskLevel: RiskLevel
  software?: string
  description?: string
}

export type FileCategory =
  | 'temp'
  | 'cache'
  | 'log'
  | 'download'
  | 'dump'
  | 'recycle'
  | 'update'
  | 'thumbnail'
  | 'crash'
  | 'other'

export type RiskLevel = 'safe' | 'caution' | 'dangerous'

export interface AnalysisResult {
  success: boolean
  data?: FileAnalysis[]
  error?: string
}

export interface FileAnalysis {
  filePath: string
  software: SoftwareInfo | null
  riskAssessment: RiskAssessment
  dependencies: string[]
  recommendations: string[]
}

export interface SoftwareInfo {
  name: string
  publisher: string
  version: string
  installPath: string
  isEssential: boolean
  category: 'system' | 'runtime' | 'application' | 'driver' | 'unknown'
}

export interface RiskAssessment {
  level: RiskLevel
  score: number
  reasons: string[]
  canDelete: boolean
  backupRecommended: boolean
}

export interface RuntimeResult {
  success: boolean
  data?: RuntimeInfo[]
  error?: string
}

export interface RuntimeInfo {
  id: string
  name: string
  type: RuntimeType
  version: string
  installPath: string
  isInstalled: boolean
  isEssential: boolean
  dependentSoftware: DependentSoftware[]
  status: 'healthy' | 'corrupted' | 'outdated' | 'missing'
  description: string
  downloadUrl?: string
}

export type RuntimeType =
  | 'vcredist'
  | 'dotnet'
  | 'java'
  | 'python'
  | 'nodejs'
  | 'directx'
  | 'opengl'
  | 'vulkan'
  | 'msvc'
  | 'other'

export interface DependentSoftware {
  name: string
  path: string
  requiredVersion?: string
}

export interface CleanResult {
  success: boolean
  data?: CleanReport
  error?: string
}

export interface CleanReport {
  totalFiles: number
  successCount: number
  failCount: number
  skippedCount: number
  totalSizeFreed: number
  errors: CleanError[]
  details: CleanDetail[]
}

export interface CleanError {
  filePath: string
  error: string
}

export interface CleanDetail {
  filePath: string
  size: number
  status: 'success' | 'failed' | 'skipped'
  reason?: string
}

export interface AIConfig {
  apiKey: string
  provider: 'openai' | 'claude'
  files: string[]
}

export interface AIResult {
  success: boolean
  data?: FileAnalysis[]
  error?: string
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
