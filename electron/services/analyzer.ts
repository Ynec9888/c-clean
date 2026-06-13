import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
  level: 'safe' | 'caution' | 'dangerous'
  score: number // 0-100，越低越安全
  reasons: string[]
  canDelete: boolean
  backupRecommended: boolean
}

// 已知软件数据库
const KNOWN_SOFTWARE: Record<string, SoftwareInfo> = {
  'microsoft visual c++': {
    name: 'Microsoft Visual C++ Redistributable',
    publisher: 'Microsoft Corporation',
    version: '',
    installPath: '',
    isEssential: true,
    category: 'runtime'
  },
  '.net framework': {
    name: '.NET Framework',
    publisher: 'Microsoft Corporation',
    version: '',
    installPath: '',
    isEssential: true,
    category: 'runtime'
  },
  'java': {
    name: 'Java Runtime Environment',
    publisher: 'Oracle Corporation',
    version: '',
    installPath: '',
    isEssential: true,
    category: 'runtime'
  },
  'python': {
    name: 'Python',
    publisher: 'Python Software Foundation',
    version: '',
    installPath: '',
    isEssential: false,
    category: 'runtime'
  },
  'node.js': {
    name: 'Node.js',
    publisher: 'Node.js Foundation',
    version: '',
    installPath: '',
    isEssential: false,
    category: 'runtime'
  },
  'directx': {
    name: 'Microsoft DirectX',
    publisher: 'Microsoft Corporation',
    version: '',
    installPath: '',
    isEssential: true,
    category: 'runtime'
  },
  'windows defender': {
    name: 'Windows Defender',
    publisher: 'Microsoft Corporation',
    version: '',
    installPath: '',
    isEssential: true,
    category: 'system'
  },
  'chrome': {
    name: 'Google Chrome',
    publisher: 'Google LLC',
    version: '',
    installPath: '',
    isEssential: false,
    category: 'application'
  },
  'firefox': {
    name: 'Mozilla Firefox',
    publisher: 'Mozilla Foundation',
    version: '',
    installPath: '',
    isEssential: false,
    category: 'application'
  },
  'edge': {
    name: 'Microsoft Edge',
    publisher: 'Microsoft Corporation',
    version: '',
    installPath: '',
    isEssential: false,
    category: 'application'
  }
}

// 危险文件模式
const DANGEROUS_PATTERNS = [
  { pattern: /system32\\drivers/i, reason: '系统驱动文件' },
  { pattern: /system32\\config/i, reason: '系统注册表文件' },
  { pattern: /winsxs/i, reason: 'Windows组件存储' },
  { pattern: /installer/i, reason: '安装程序缓存，卸载软件需要' },
  { pattern: /manifest/i, reason: '系统清单文件' },
  { pattern: /catroot/i, reason: '系统安全目录' },
  { pattern: /bootmgr/i, reason: '启动管理器' },
  { pattern: /ntldr/i, reason: 'NT加载器' },
  { pattern: /pagefile\.sys/i, reason: '页面文件' },
  { pattern: /hiberfil\.sys/i, reason: '休眠文件' },
  { pattern: /swapfile\.sys/i, reason: '交换文件' }
]

export class FileAnalyzer {
  private installedSoftware: SoftwareInfo[] = []
  private softwareCache: Map<string, SoftwareInfo> = new Map()

  async analyzeFiles(files: string[]): Promise<FileAnalysis[]> {
    // 预加载已安装软件列表
    await this.loadInstalledSoftware()

    const analyses: FileAnalysis[] = []

    for (const file of files) {
      const analysis = await this.analyzeFile(file)
      if (analysis) {
        analyses.push(analysis)
      }
    }

    return analyses
  }

  async analyzeFile(filePath: string): Promise<FileAnalysis | null> {
    try {
      if (!fs.existsSync(filePath)) return null

      const software = this.identifySoftware(filePath)
      const riskAssessment = this.assessRisk(filePath, software)
      const dependencies = await this.findDependencies(filePath)
      const recommendations = this.generateRecommendations(filePath, software, riskAssessment)

      return {
        filePath,
        software,
        riskAssessment,
        dependencies,
        recommendations
      }
    } catch (error) {
      return null
    }
  }

  async aiAnalyze(
    files: string[],
    apiKey: string,
    provider: 'openai' | 'claude'
  ): Promise<FileAnalysis[]> {
    // 准备文件信息用于AI分析
    const fileInfos = files.map(f => ({
      path: f,
      name: path.basename(f),
      ext: path.extname(f),
      size: this.getFileSize(f),
      lastModified: this.getLastModified(f)
    }))

    // 调用AI API分析
    const prompt = `分析以下C盘文件，判断它们是否可以安全删除：

${JSON.stringify(fileInfos, null, 2)}

请返回JSON格式的分析结果，包含：
1. 每个文件的风险等级 (safe/caution/dangerous)
2. 所属软件或系统组件
3. 删除建议
4. 风险说明`

    try {
      const aiResult = await this.callAI(prompt, apiKey, provider)
      return this.parseAIResult(files, aiResult)
    } catch (error) {
      console.error('AI分析失败:', error)
      // 降级到本地分析
      return this.analyzeFiles(files)
    }
  }

  private async loadInstalledSoftware(): Promise<void> {
    try {
      // 从注册表读取已安装软件
      const { stdout } = await execAsync(
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /f "DisplayName" /t REG_SZ'
      )

      const softwareList: SoftwareInfo[] = []
      const blocks = stdout.split('\n\n')

      for (const block of blocks) {
        const nameMatch = block.match(/DisplayName\s+REG_SZ\s+(.+)/)
        const publisherMatch = block.match(/Publisher\s+REG_SZ\s+(.+)/)
        const versionMatch = block.match(/DisplayVersion\s+REG_SZ\s+(.+)/)
        const pathMatch = block.match(/InstallLocation\s+REG_SZ\s+(.+)/)

        if (nameMatch) {
          softwareList.push({
            name: nameMatch[1].trim(),
            publisher: publisherMatch?.[1]?.trim() || 'Unknown',
            version: versionMatch?.[1]?.trim() || '',
            installPath: pathMatch?.[1]?.trim() || '',
            isEssential: false,
            category: 'application'
          })
        }
      }

      this.installedSoftware = softwareList
    } catch (error) {
      console.error('加载已安装软件列表失败:', error)
    }
  }

  private identifySoftware(filePath: string): SoftwareInfo | null {
    const lowerPath = filePath.toLowerCase()

    // 检查已知软件
    for (const [key, software] of Object.entries(KNOWN_SOFTWARE)) {
      if (lowerPath.includes(key)) {
        return { ...software }
      }
    }

    // 检查已安装软件
    for (const software of this.installedSoftware) {
      if (software.installPath && lowerPath.includes(software.installPath.toLowerCase())) {
        return software
      }
    }

    // 尝试从路径推断
    const parts = filePath.split(path.sep)
    const appDataIndex = parts.findIndex(p => p.toLowerCase() === 'appdata')

    if (appDataIndex !== -1 && appDataIndex + 2 < parts.length) {
      const softwareName = parts[appDataIndex + 2]
      return {
        name: softwareName,
        publisher: 'Unknown',
        version: '',
        installPath: '',
        isEssential: false,
        category: 'application'
      }
    }

    return null
  }

  private assessRisk(filePath: string, software: SoftwareInfo | null): RiskAssessment {
    const reasons: string[] = []
    let score = 0

    // 检查危险模式
    for (const { pattern, reason } of DANGEROUS_PATTERNS) {
      if (pattern.test(filePath)) {
        reasons.push(reason)
        score += 50
      }
    }

    // 检查是否为系统关键软件
    if (software?.isEssential) {
      reasons.push(`${software.name} 是系统关键组件`)
      score += 40
    }

    // 检查软件类别
    if (software?.category === 'system') {
      reasons.push('系统文件，不可删除')
      score += 60
    } else if (software?.category === 'runtime') {
      reasons.push('运行时文件，删除可能导致其他软件无法运行')
      score += 30
    }

    // 检查文件位置
    if (filePath.toLowerCase().includes('windows\\system32')) {
      reasons.push('系统核心目录')
      score += 70
    }

    // 检查文件扩展名
    const ext = path.extname(filePath).toLowerCase()
    if (['.sys', '.dll', '.exe'].includes(ext)) {
      if (this.isSystemFile(filePath)) {
        reasons.push('系统可执行文件')
        score += 50
      }
    }

    // 计算最终风险等级
    let level: 'safe' | 'caution' | 'dangerous'
    if (score >= 50) {
      level = 'dangerous'
    } else if (score >= 20) {
      level = 'caution'
    } else {
      level = 'safe'
    }

    return {
      level,
      score: Math.min(100, score),
      reasons,
      canDelete: level === 'safe',
      backupRecommended: level === 'caution'
    }
  }

  private isSystemFile(filePath: string): boolean {
    const systemPaths = [
      'windows\\system32',
      'windows\\syswow64',
      'windows\\winsxs'
    ]
    const lowerPath = filePath.toLowerCase()
    return systemPaths.some(p => lowerPath.includes(p))
  }

  private async findDependencies(filePath: string): Promise<string[]> {
    const dependencies: string[] = []
    const ext = path.extname(filePath).toLowerCase()

    // 检查DLL依赖
    if (ext === '.dll' || ext === '.exe') {
      try {
        // 使用dumpbin或类似工具分析PE文件
        // 这里简化处理，实际应该解析PE导入表
        const { stdout } = await execAsync(`dumpbin /dependents "${filePath}"`, { timeout: 5000 })
        const dllMatches = stdout.match(/\S+\.dll/gi)
        if (dllMatches) {
          dependencies.push(...dllMatches)
        }
      } catch (error) {
        // 忽略错误
      }
    }

    return [...new Set(dependencies)]
  }

  private generateRecommendations(
    filePath: string,
    software: SoftwareInfo | null,
    risk: RiskAssessment
  ): string[] {
    const recommendations: string[] = []

    if (risk.level === 'dangerous') {
      recommendations.push('⚠️ 强烈建议不要删除此文件')
      if (risk.reasons.length > 0) {
        recommendations.push(`原因: ${risk.reasons.join(', ')}`)
      }
    } else if (risk.level === 'caution') {
      recommendations.push('⚠️ 删除前请确认')
      if (software) {
        recommendations.push(`此文件属于 ${software.name}`)
      }
      recommendations.push('建议先备份再删除')
    } else {
      recommendations.push('✅ 可安全删除')
      if (this.isInTempDirectory(filePath)) {
        recommendations.push('这是临时文件，删除后不会影响系统运行')
      }
    }

    return recommendations
  }

  private isInTempDirectory(filePath: string): boolean {
    const tempPaths = ['\\temp\\', '\\tmp\\', '\\cache\\', 'softwaredistribution']
    const lowerPath = filePath.toLowerCase()
    return tempPaths.some(p => lowerPath.includes(p))
  }

  private getFileSize(filePath: string): number {
    try {
      return fs.statSync(filePath).size
    } catch {
      return 0
    }
  }

  private getLastModified(filePath: string): Date | null {
    try {
      return fs.statSync(filePath).mtime
    } catch {
      return null
    }
  }

  private async callAI(prompt: string, apiKey: string, provider: string): Promise<string> {
    let url = ''
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    let body: any

    switch (provider) {
      case 'deepseek':
        // DeepSeek API (兼容 OpenAI 格式)
        url = 'https://api.deepseek.com/v1/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        body = {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        }
        break

      case 'mimo':
        // 小米 MiMo 官方 API (OpenAI 兼容协议)
        url = 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        body = {
          model: 'mimo-v2.5',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        }
        break

      case 'openai':
        url = 'https://api.openai.com/v1/chat/completions'
        headers['Authorization'] = `Bearer ${apiKey}`
        body = {
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3
        }
        break

      case 'claude':
        url = 'https://api.anthropic.com/v1/messages'
        headers['x-api-key'] = apiKey
        headers['anthropic-version'] = '2023-06-01'
        body = {
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000
        }
        break

      default:
        throw new Error(`不支持的AI提供商: ${provider}`)
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`AI API 请求失败: ${response.status} - ${errorData}`)
    }

    const data = await response.json()

    // Claude 的响应格式不同
    if (provider === 'claude') {
      return data.content[0].text
    }

    // DeepSeek、MiMo、OpenAI 都使用相同的响应格式
    return data.choices[0].message.content
  }

  private parseAIResult(files: string[], aiResult: string): FileAnalysis[] {
    try {
      // 尝试解析AI返回的JSON
      const jsonMatch = aiResult.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return parsed.map((item: any, index: number) => ({
          filePath: files[index],
          software: item.software ? {
            name: item.software,
            publisher: 'Unknown',
            version: '',
            installPath: '',
            isEssential: false,
            category: 'application'
          } : null,
          riskAssessment: {
            level: item.risk || 'safe',
            score: item.score || 0,
            reasons: item.reasons || [],
            canDelete: item.risk === 'safe',
            backupRecommended: item.risk === 'caution'
          },
          dependencies: item.dependencies || [],
          recommendations: item.recommendations || []
        }))
      }
    } catch (error) {
      console.error('解析AI结果失败:', error)
    }

    // 降级到本地分析
    return []
  }
}
