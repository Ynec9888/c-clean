import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface ScanOptions {
  paths?: string[]
  categories?: string[]
  minSize?: number
  maxAge?: number // 天数
  deepScan?: boolean // 是否深度扫描
}

export interface ScanProgress {
  currentPath: string
  filesFound: number
  totalSize: number
  percentage: number
}

export interface ScannedFile {
  id: string
  path: string
  name: string
  extension: string
  size: number
  createdAt: Date
  modifiedAt: Date
  accessedAt: Date
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

// 已知安全可删除的文件扩展名
const SAFE_EXTENSIONS = new Set([
  '.tmp', '.temp', '.log', '.bak', '.old', '.gid',
  '.chk', '.dmp', '.mdmp', '.wer', '.etl',
  '.crdownload', '.partial', '.download',
  '.thumbs.db', '.ds_store'
])

// 已知危险不可删除的文件
const DANGEROUS_PATTERNS = [
  /windows\\system32/i,
  /windows\\syswow64/i,
  /program files/i,
  /boot/i,
  /ntldr/i,
  /bootmgr/i,
  /pagefile\.sys/i,
  /hiberfil\.sys/i,
  /swapfile\.sys/i
]

// 白名单：这些路径下的文件不会被标记为可清理
const WHITELIST_PATTERNS = [
  /c-clean/i,           // C-Clean 自身的配置
  /cclean/i,            // CCleaner 的配置
  /\.config/i,          // 各种软件的配置目录
  /settings\.json/i,    // 配置文件
  /config\.json/i,      // 配置文件
  /\.env/i,             // 环境变量文件
  /\.git/i,             // Git 仓库
  /node_modules/i       // Node.js 依赖
]

// 临时文件路径模式
const TEMP_PATHS = [
  'Windows\\Temp',
  'AppData\\Local\\Temp',
  'AppData\\Local\\Microsoft\\Windows\\INetCache',
  'AppData\\Local\\Microsoft\\Windows\\Explorer',
  'AppData\\Local\\CrashDumps',
  'AppData\\Local\\D3DSCache'
]

export class FileScanner {
  private isScanning = false
  private shouldStop = false

  async scan(
    options: ScanOptions,
    onProgress: (progress: ScanProgress) => void
  ): Promise<ScannedFile[]> {
    if (this.isScanning) {
      throw new Error('扫描正在进行中')
    }

    this.isScanning = true
    this.shouldStop = false

    const scanPaths = options.paths || this.getDefaultScanPaths()
    const results: ScannedFile[] = []
    let totalFiles = 0
    let scannedPaths = 0

    try {
      for (const scanPath of scanPaths) {
        if (this.shouldStop) break

        // 每个目录扫描前让出主线程
        await this.delay(50)

        // 深度扫描用5层，快速扫描用2层
        const maxDepth = options.deepScan ? 5 : 2
        const files = await this.scanDirectory(scanPath, options, 0, maxDepth)

        // 批量处理文件，每批10个
        const batchSize = 10
        for (let i = 0; i < files.length; i += batchSize) {
          if (this.shouldStop) break

          const batch = files.slice(i, i + batchSize)

          for (const file of batch) {
            if (this.shouldStop) break

            const analyzed = await this.analyzeFile(file)
            if (analyzed && this.shouldInclude(analyzed, options)) {
              results.push(analyzed)
              totalFiles++

              // 每发现50个文件更新一次进度
              if (totalFiles % 50 === 0) {
                onProgress({
                  currentPath: file,
                  filesFound: totalFiles,
                  totalSize: results.reduce((sum, f) => sum + f.size, 0),
                  percentage: Math.round(((scannedPaths + 1) / scanPaths.length) * 100)
                })
              }
            }
          }

          // 每批处理完让出主线程，避免卡死
          await this.delay(20)
        }

        scannedPaths++
        // 更新进度
        onProgress({
          currentPath: scanPath,
          filesFound: totalFiles,
          totalSize: results.reduce((sum, f) => sum + f.size, 0),
          percentage: Math.round((scannedPaths / scanPaths.length) * 100)
        })
      }
    } finally {
      this.isScanning = false
    }

    return results
  }

  stopScan(): void {
    this.shouldStop = true
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private getDefaultScanPaths(): string[] {
    const userProfile = os.homedir()
    const windir = process.env.WINDIR || 'C:\\Windows'

    // 扫描整个 C 盘的主要目录
    return [
      // 系统临时文件
      path.join(windir, 'Temp'),
      path.join(userProfile, 'AppData', 'Local', 'Temp'),

      // 用户目录
      path.join(userProfile, 'Downloads'),
      path.join(userProfile, 'Documents'),
      path.join(userProfile, 'Desktop'),
      path.join(userProfile, 'Pictures'),
      path.join(userProfile, 'Videos'),
      path.join(userProfile, 'Music'),

      // AppData 整个目录（包含所有软件数据）
      path.join(userProfile, 'AppData', 'Local'),
      path.join(userProfile, 'AppData', 'Roaming'),
      path.join(userProfile, 'AppData', 'LocalLow'),

      // Program Files
      'C:\\Program Files',
      'C:\\Program Files (x86)',
      'C:\\ProgramData',

      // Windows 系统
      path.join(windir, 'SoftwareDistribution'),
      path.join(windir, 'Logs'),
      path.join(windir, 'Prefetch'),
      path.join(windir, 'Temp'),
      path.join(windir, 'Panther'),
      path.join(windir, 'WinSxS'),

      // 回收站
      'C:\\$Recycle.Bin',

      // 其他常见位置
      'C:\\Recovery',
      'C:\\PerfLogs'
    ]
  }

  private async scanDirectory(
    dirPath: string,
    options: ScanOptions,
    currentDepth: number,
    maxDepth: number
  ): Promise<string[]> {
    const files: string[] = []

    // 限制扫描深度，避免过深递归
    if (currentDepth >= maxDepth) return files
    if (this.shouldStop) return files

    try {
      if (!fs.existsSync(dirPath)) return files

      const stats = fs.statSync(dirPath)
      if (!stats.isDirectory()) return files

      const entries = fs.readdirSync(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        if (this.shouldStop) break

        const fullPath = path.join(dirPath, entry.name)

        try {
          if (entry.isDirectory()) {
            // 递归扫描子目录（限制深度）
            const subFiles = await this.scanDirectory(fullPath, options, currentDepth + 1, maxDepth)
            files.push(...subFiles)
          } else if (entry.isFile()) {
            files.push(fullPath)
          }
        } catch (error) {
          // 忽略无权限访问的文件
          continue
        }
      }
    } catch (error) {
      // 忽略无法访问的目录
    }

    return files
  }

  private async analyzeFile(filePath: string): Promise<ScannedFile | null> {
    try {
      if (this.shouldStop) return null

      const stats = fs.statSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const name = path.basename(filePath)

      // 检查是否为危险文件
      if (this.isDangerous(filePath)) {
        return null
      }

      // 检查是否在白名单中（保护配置文件）
      if (this.isWhitelisted(filePath)) {
        return null
      }

      return {
        id: this.generateId(),
        path: filePath,
        name,
        extension: ext,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
        accessedAt: stats.atime,
        category: this.categorizeFile(filePath, ext),
        riskLevel: this.assessRisk(filePath, ext, stats),
        software: this.identifySoftware(filePath),
        description: this.getDescription(filePath, ext)
      }
    } catch (error) {
      return null
    }
  }

  private isDangerous(filePath: string): boolean {
    return DANGEROUS_PATTERNS.some(pattern => pattern.test(filePath))
  }

  private isWhitelisted(filePath: string): boolean {
    return WHITELIST_PATTERNS.some(pattern => pattern.test(filePath))
  }

  private categorizeFile(filePath: string, ext: string): FileCategory {
    const lowerPath = filePath.toLowerCase()

    if (lowerPath.includes('\\temp\\') || lowerPath.includes('\\tmp\\')) return 'temp'
    if (lowerPath.includes('\\cache\\') || lowerPath.includes('\\cached\\')) return 'cache'
    if (ext === '.log' || ext === '.logs') return 'log'
    if (lowerPath.includes('\\downloads\\') || ext === '.crdownload') return 'download'
    if (ext === '.dmp' || ext === '.mdmp' || lowerPath.includes('\\crashdump')) return 'dump'
    if (lowerPath.includes('\\$recycle.bin')) return 'recycle'
    if (lowerPath.includes('\\softwaredistribution')) return 'update'
    if (lowerPath.includes('\\thumbcache') || ext === '.db' && lowerPath.includes('thumbs')) return 'thumbnail'
    if (lowerPath.includes('\\wer\\') || lowerPath.includes('\\crash')) return 'crash'

    return 'other'
  }

  private assessRisk(filePath: string, ext: string, stats: fs.Stats): RiskLevel {
    // 完全安全的文件
    if (SAFE_EXTENSIONS.has(ext)) return 'safe'
    if (this.isInTempDirectory(filePath)) return 'safe'
    if (this.isRecycleBin(filePath)) return 'safe'

    // 谨慎处理的文件
    const daysSinceModified = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceModified > 30 && this.isCacheOrLog(filePath)) return 'safe'
    if (daysSinceModified > 7 && this.isTempFile(filePath)) return 'safe'

    // 需要谨慎的文件
    if (this.isInAppData(filePath)) return 'caution'
    if (stats.size > 100 * 1024 * 1024) return 'caution' // 大于100MB需要确认

    return 'safe'
  }

  private isInTempDirectory(filePath: string): boolean {
    const lowerPath = filePath.toLowerCase()
    return TEMP_PATHS.some(p => lowerPath.includes(p.toLowerCase()))
  }

  private isRecycleBin(filePath: string): boolean {
    return filePath.toLowerCase().includes('$recycle.bin')
  }

  private isCacheOrLog(filePath: string): boolean {
    const lowerPath = filePath.toLowerCase()
    return lowerPath.includes('cache') || lowerPath.endsWith('.log')
  }

  private isTempFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase()
    return ext === '.tmp' || ext === '.temp'
  }

  private isInAppData(filePath: string): boolean {
    return filePath.toLowerCase().includes('appdata')
  }

  private identifySoftware(filePath: string): string | undefined {
    const lowerPath = filePath.toLowerCase()

    // 软件识别映射表
    const softwareMap: Record<string, string> = {
      // 社交通讯
      'tencent\\wechat': '微信',
      'tencent\\qq': 'QQ',
      'tencent\\weixin': '微信',
      'wechat files': '微信',
      'tencent files': 'QQ',
      'discord': 'Discord',
      'slack': 'Slack',
      'telegram': 'Telegram',
      'zoom': 'Zoom',
      'teams': 'Microsoft Teams',

      // 浏览器
      'google\\chrome': 'Google Chrome',
      'mozilla\\firefox': 'Mozilla Firefox',
      'microsoft\\edge': 'Microsoft Edge',
      'opera': 'Opera',
      'brave': 'Brave Browser',

      // 游戏
      'steam': 'Steam',
      'epicgames': 'Epic Games',
      'riot games': 'Riot Games',
      'blizzard': '暴雪',
      'ubisoft': '育碧',
      'ea games': 'EA Games',
      'minecraft': 'Minecraft',
      'roblox': 'Roblox',

      // 开发工具
      'visual studio code': 'VS Code',
      'visual studio': 'Visual Studio',
      'jetbrains': 'JetBrains',
      'git': 'Git',
      'nodejs': 'Node.js',
      'node_modules': 'Node.js',
      'npm-cache': 'npm',
      'python': 'Python',
      'pip': 'Python pip',
      'java': 'Java',
      'gradle': 'Gradle',
      'maven': 'Maven',
      'nuget': 'NuGet',
      'docker': 'Docker',

      // 办公软件
      'microsoft office': 'Microsoft Office',
      'wps': 'WPS Office',
      'adobe': 'Adobe',
      'photoshop': 'Photoshop',
      'premiere': 'Premiere Pro',

      // 媒体
      'spotify': 'Spotify',
      'netflix': 'Netflix',
      'vlc': 'VLC Media Player',
      'obs': 'OBS Studio',

      // 系统
      'windows': 'Windows 系统',
      'microsoft': 'Microsoft',
      'windows defender': 'Windows Defender',
      'windows update': 'Windows 更新',

      // 其他
      '7zip': '7-Zip',
      'winrar': 'WinRAR',
      'notepad++': 'Notepad++',
      'everything': 'Everything',
      'ccleaner': 'CCleaner'
    }

    // 遍历映射表进行匹配
    for (const [key, name] of Object.entries(softwareMap)) {
      if (lowerPath.includes(key)) {
        return name
      }
    }

    // 尝试从 AppData 路径推断
    const parts = filePath.split(path.sep)
    const appDataIndex = parts.findIndex(p => p.toLowerCase() === 'appdata')
    if (appDataIndex !== -1 && appDataIndex + 2 < parts.length) {
      return parts[appDataIndex + 2]
    }

    return undefined
  }

  private getDescription(filePath: string, ext: string): string {
    const lowerPath = filePath.toLowerCase()

    // 根据扩展名和路径提供详细描述
    if (ext === '.tmp' || ext === '.temp') {
      return '临时文件 - 程序运行时自动生成，关闭程序后不再需要，删除不影响系统运行'
    }
    if (ext === '.log') {
      return '日志文件 - 记录软件运行历史，删除后软件会重新创建，不影响功能'
    }
    if (ext === '.bak') {
      return '备份文件 - 软件自动生成的备份，如果不再需要还原可安全删除'
    }
    if (ext === '.dmp' || ext === '.mdmp') {
      return '崩溃转储 - 程序崩溃时生成的调试文件，用于分析问题，删除不影响系统'
    }
    if (ext === '.crdownload' || ext === '.partial') {
      return '未完成下载 - 浏览器下载中断的残留文件，可安全删除'
    }
    if (ext === '.thumbs.db') {
      return '缩略图缓存 - Windows文件夹预览图缓存，删除后会自动重建'
    }
    if (ext === '.wer') {
      return '错误报告 - Windows错误报告文件，已发送给微软后可删除'
    }
    if (ext === '.etl') {
      return '事件跟踪 - 系统事件日志，删除不影响系统运行'
    }
    if (ext === '.old') {
      return '旧文件 - 软件更新后的残留文件，可安全删除'
    }
    if (ext === '.gid') {
      return '帮助索引 - Windows帮助文件索引，删除后会自动重建'
    }
    if (ext === '.chk') {
      return '磁盘检查碎片 - 磁盘检查工具恢复的碎片文件，通常可安全删除'
    }

    // 根据路径判断
    if (lowerPath.includes('\\temp\\') || lowerPath.includes('\\tmp\\')) {
      return '临时目录文件 - 系统或软件临时使用，删除不影响正常运行'
    }
    if (lowerPath.includes('\\cache\\')) {
      return '缓存文件 - 加速软件运行的缓存，删除后软件会重新生成'
    }
    if (lowerPath.includes('\\prefetch\\')) {
      return '预读取文件 - Windows启动加速文件，删除后系统会自动重建'
    }
    if (lowerPath.includes('\\softwaredistribution')) {
      return 'Windows更新缓存 - 更新下载的临时文件，安装完成后可删除'
    }
    if (lowerPath.includes('\\crashdump')) {
      return '崩溃转储 - 程序崩溃时的内存快照，用于调试，可安全删除'
    }
    if (lowerPath.includes('inetcache') || lowerPath.includes('inetcache')) {
      return '浏览器缓存 - IE/Edge浏览器缓存文件，删除不影响浏览'
    }

    return '普通文件 - 请确认文件用途后再决定是否删除'
  }

  private shouldInclude(file: ScannedFile, options: ScanOptions): boolean {
    if (options.categories && !options.categories.includes(file.category)) {
      return false
    }
    if (options.minSize && file.size < options.minSize) {
      return false
    }
    if (options.maxAge) {
      const daysSinceAccess = (Date.now() - file.accessedAt.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceAccess < options.maxAge) {
        return false
      }
    }
    return true
  }

  private generateId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
