import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

// 已知运行时配置
const RUNTIME_CONFIGS: Omit<RuntimeInfo, 'isInstalled' | 'installPath' | 'dependentSoftware' | 'status'>[] = [
  // Visual C++ Redistributable
  {
    id: 'vcredist-2005',
    name: 'Visual C++ 2005 Redistributable',
    type: 'vcredist',
    version: '8.0',
    isEssential: true,
    description: '许多旧版应用程序和游戏需要',
    downloadUrl: 'https://www.microsoft.com/en-us/download/details.aspx?id=26347'
  },
  {
    id: 'vcredist-2008',
    name: 'Visual C++ 2008 Redistributable',
    type: 'vcredist',
    version: '9.0',
    isEssential: true,
    description: 'Visual Studio 2008开发的应用程序需要',
    downloadUrl: 'https://www.microsoft.com/en-us/download/details.aspx?id=26368'
  },
  {
    id: 'vcredist-2010',
    name: 'Visual C++ 2010 Redistributable',
    type: 'vcredist',
    version: '10.0',
    isEssential: true,
    description: 'Visual Studio 2010开发的应用程序需要',
    downloadUrl: 'https://www.microsoft.com/en-us/download/details.aspx?id=26999'
  },
  {
    id: 'vcredist-2012',
    name: 'Visual C++ 2012 Redistributable',
    type: 'vcredist',
    version: '11.0',
    isEssential: true,
    description: 'Visual Studio 2012开发的应用程序需要',
    downloadUrl: 'https://www.microsoft.com/en-us/download/details.aspx?id=30679'
  },
  {
    id: 'vcredist-2013',
    name: 'Visual C++ 2013 Redistributable',
    type: 'vcredist',
    version: '12.0',
    isEssential: true,
    description: 'Visual Studio 2013开发的应用程序需要',
    downloadUrl: 'https://www.microsoft.com/en-us/download/details.aspx?id=40784'
  },
  {
    id: 'vcredist-2015-2022',
    name: 'Visual C++ 2015-2022 Redistributable',
    type: 'vcredist',
    version: '14.0',
    isEssential: true,
    description: '大多数现代应用程序和游戏需要',
    downloadUrl: 'https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist'
  },

  // .NET Framework
  {
    id: 'dotnet-4.8',
    name: '.NET Framework 4.8',
    type: 'dotnet',
    version: '4.8',
    isEssential: true,
    description: 'Windows 10/11内置，大量应用程序依赖',
    downloadUrl: 'https://dotnet.microsoft.com/en-us/download/dotnet-framework/net48'
  },
  {
    id: 'dotnet-6',
    name: '.NET 6.0 Runtime',
    type: 'dotnet',
    version: '6.0',
    isEssential: false,
    description: '现代.NET应用程序需要',
    downloadUrl: 'https://dotnet.microsoft.com/en-us/download/dotnet/6.0'
  },
  {
    id: 'dotnet-7',
    name: '.NET 7.0 Runtime',
    type: 'dotnet',
    version: '7.0',
    isEssential: false,
    description: '最新.NET应用程序需要',
    downloadUrl: 'https://dotnet.microsoft.com/en-us/download/dotnet/7.0'
  },
  {
    id: 'dotnet-8',
    name: '.NET 8.0 Runtime',
    type: 'dotnet',
    version: '8.0',
    isEssential: false,
    description: '最新长期支持版本',
    downloadUrl: 'https://dotnet.microsoft.com/en-us/download/dotnet/8.0'
  },

  // Java
  {
    id: 'java-8',
    name: 'Java Runtime Environment 8',
    type: 'java',
    version: '1.8',
    isEssential: false,
    description: '旧版Java应用程序和Minecraft等游戏需要',
    downloadUrl: 'https://www.oracle.com/java/technologies/javase-jre8-downloads.html'
  },
  {
    id: 'java-11',
    name: 'Java Runtime Environment 11',
    type: 'java',
    version: '11',
    isEssential: false,
    description: '企业级Java应用程序需要',
    downloadUrl: 'https://www.oracle.com/java/technologies/javase/jdk11-archive-downloads.html'
  },
  {
    id: 'java-17',
    name: 'Java Runtime Environment 17',
    type: 'java',
    version: '17',
    isEssential: false,
    description: '最新长期支持版本',
    downloadUrl: 'https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html'
  },
  {
    id: 'java-21',
    name: 'Java Runtime Environment 21',
    type: 'java',
    version: '21',
    isEssential: false,
    description: '最新版本',
    downloadUrl: 'https://www.oracle.com/java/technologies/javase/jdk21-archive-downloads.html'
  },

  // Python
  {
    id: 'python-3',
    name: 'Python 3.x',
    type: 'python',
    version: '3.x',
    isEssential: false,
    description: 'Python脚本和应用程序需要',
    downloadUrl: 'https://www.python.org/downloads/'
  },

  // Node.js
  {
    id: 'nodejs',
    name: 'Node.js',
    type: 'nodejs',
    version: 'LTS',
    isEssential: false,
    description: 'JavaScript/TypeScript应用程序需要',
    downloadUrl: 'https://nodejs.org/'
  },

  // DirectX
  {
    id: 'directx',
    name: 'Microsoft DirectX',
    type: 'directx',
    version: '12',
    isEssential: true,
    description: '游戏和多媒体应用程序必须',
    downloadUrl: 'https://www.microsoft.com/en-us/download/details.aspx?id=35'
  },

  // Visual Studio Build Tools
  {
    id: 'msvc-build-tools',
    name: 'MSVC Build Tools',
    type: 'msvc',
    version: '',
    isEssential: false,
    description: 'C/C++编译需要，部分Python包依赖',
    downloadUrl: 'https://visualstudio.microsoft.com/visual-cpp-build-tools/'
  }
]

export class RuntimeDetector {
  async detectAll(): Promise<RuntimeInfo[]> {
    const results: RuntimeInfo[] = []

    for (const config of RUNTIME_CONFIGS) {
      const runtime = await this.detectRuntime(config.id)
      results.push(runtime)
    }

    return results
  }

  async detectRuntime(runtimeId: string): Promise<RuntimeInfo> {
    const config = RUNTIME_CONFIGS.find(r => r.id === runtimeId)
    if (!config) {
      throw new Error(`Unknown runtime: ${runtimeId}`)
    }

    const base: RuntimeInfo = {
      ...config,
      isInstalled: false,
      installPath: '',
      dependentSoftware: [],
      status: 'missing'
    }

    switch (config.type) {
      case 'vcredist':
        return this.detectVCRedist(config.id, base)
      case 'dotnet':
        return this.detectDotNet(config.id, base)
      case 'java':
        return this.detectJava(config.id, base)
      case 'python':
        return this.detectPython(base)
      case 'nodejs':
        return this.detectNodeJS(base)
      case 'directx':
        return this.detectDirectX(base)
      case 'msvc':
        return this.detectMSVC(base)
      default:
        return base
    }
  }

  private async detectVCRedist(id: string, base: RuntimeInfo): Promise<RuntimeInfo> {
    try {
      // 从注册表检测VC++ Redistributable
      const year = id.split('-')[1]
      const { stdout } = await execAsync(
        `reg query "HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\${year}\\VC\\Runtimes\\x64" /v Version 2>nul`
      )

      const versionMatch = stdout.match(/Version\s+REG_SZ\s+(.+)/)
      if (versionMatch) {
        base.isInstalled = true
        base.version = versionMatch[1].trim()
        base.status = 'healthy'

        // 获取安装路径
        try {
          const { stdout: pathOut } = await execAsync(
            `reg query "HKLM\\SOFTWARE\\Microsoft\\VisualStudio\\${year}\\VC\\Runtimes\\x64" /v Installed 2>nul`
          )
          base.installPath = pathOut.match(/Installed\s+REG_SZ\s+(.+)/)?.[1]?.trim() || ''
        } catch {}

        // 查找依赖此运行时的软件
        base.dependentSoftware = await this.findVCRedistDependents(year)
      }
    } catch {}

    return base
  }

  private async detectDotNet(id: string, base: RuntimeInfo): Promise<RuntimeInfo> {
    try {
      if (id === 'dotnet-4.8') {
        // 检测.NET Framework 4.8
        const { stdout } = await execAsync(
          'reg query "HKLM\\SOFTWARE\\Microsoft\\NET Framework Setup\\NDP\\v4\\Full" /v Release 2>nul'
        )
        const releaseMatch = stdout.match(/Release\s+REG_DWORD\s+(0x[0-9a-fA-F]+)/)
        if (releaseMatch) {
          const release = parseInt(releaseMatch[1], 16)
          if (release >= 528040) {
            base.isInstalled = true
            base.version = '4.8'
            base.status = 'healthy'
          }
        }
      } else {
        // 检测.NET 6/7/8
        const version = id.split('-')[1]
        try {
          const { stdout } = await execAsync('dotnet --list-runtimes')
          const regex = new RegExp(`Microsoft\\.NETCore\\.Runtime\\s+${version}\\.(\\d+)`)
          const match = stdout.match(regex)
          if (match) {
            base.isInstalled = true
            base.version = `${version}.${match[1]}`
            base.status = 'healthy'
          }
        } catch {}
      }

      if (base.isInstalled) {
        base.dependentSoftware = await this.findDotNetDependents()
      }
    } catch {}

    return base
  }

  private async detectJava(id: string, base: RuntimeInfo): Promise<RuntimeInfo> {
    try {
      const { stdout } = await execAsync('java -version 2>&1')
      const versionMatch = stdout.match(/version\s+"(.+?)"/)
      if (versionMatch) {
        const fullVersion = versionMatch[1]
        const major = fullVersion.split('.')[0]

        // 检查是否匹配请求的版本
        const requestedMajor = id.split('-')[1]
        if (major === requestedMajor || (requestedMajor === '8' && major === '1')) {
          base.isInstalled = true
          base.version = fullVersion
          base.status = 'healthy'

          // 获取JAVA_HOME
          try {
            const { stdout: homeOut } = await execAsync('echo %JAVA_HOME%')
            base.installPath = homeOut.trim()
          } catch {}

          base.dependentSoftware = await this.findJavaDependents()
        }
      }
    } catch {}

    return base
  }

  private async detectPython(base: RuntimeInfo): Promise<RuntimeInfo> {
    try {
      const { stdout } = await execAsync('python --version 2>&1')
      const versionMatch = stdout.match(/Python\s+(.+)/)
      if (versionMatch) {
        base.isInstalled = true
        base.version = versionMatch[1].trim()
        base.status = 'healthy'

        // 获取Python路径
        try {
          const { stdout: pathOut } = await execAsync('where python')
          base.installPath = pathOut.split('\n')[0].trim()
        } catch {}

        base.dependentSoftware = await this.findPythonDependents()
      }
    } catch {}

    return base
  }

  private async detectNodeJS(base: RuntimeInfo): Promise<RuntimeInfo> {
    try {
      const { stdout } = await execAsync('node --version')
      const versionMatch = stdout.match(/v(.+)/)
      if (versionMatch) {
        base.isInstalled = true
        base.version = versionMatch[1].trim()
        base.status = 'healthy'

        try {
          const { stdout: pathOut } = await execAsync('where node')
          base.installPath = pathOut.split('\n')[0].trim()
        } catch {}

        base.dependentSoftware = await this.findNodeJSDependents()
      }
    } catch {}

    return base
  }

  private async detectDirectX(base: RuntimeInfo): Promise<RuntimeInfo> {
    try {
      // DirectX通常随Windows安装
      const dxPath = 'C:\\Windows\\System32\\D3D12.dll'
      if (fs.existsSync(dxPath)) {
        base.isInstalled = true
        base.installPath = 'C:\\Windows\\System32'
        base.status = 'healthy'

        // 获取版本信息
        try {
          const { stdout } = await execAsync(
            'reg query "HKLM\\SOFTWARE\\Microsoft\\DirectX" /v Version 2>nul'
          )
          const versionMatch = stdout.match(/Version\s+REG_SZ\s+(.+)/)
          if (versionMatch) {
            base.version = versionMatch[1].trim()
          }
        } catch {}
      }
    } catch {}

    return base
  }

  private async detectMSVC(base: RuntimeInfo): Promise<RuntimeInfo> {
    try {
      // 检测Visual Studio Build Tools
      const { stdout } = await execAsync(
        '"C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe" -latest -property installationPath 2>nul'
      )
      if (stdout.trim()) {
        base.isInstalled = true
        base.installPath = stdout.trim()
        base.status = 'healthy'

        try {
          const { stdout: versionOut } = await execAsync(
            '"C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe" -latest -property catalog_productDisplayVersion 2>nul'
          )
          base.version = versionOut.trim()
        } catch {}
      }
    } catch {}

    return base
  }

  private async findVCRedistDependents(year: string): Promise<DependentSoftware[]> {
    // 扫描Program Files查找依赖VC++的程序
    const dependents: DependentSoftware[] = []
    const programDirs = [
      'C:\\Program Files',
      'C:\\Program Files (x86)'
    ]

    for (const dir of programDirs) {
      try {
        const entries = fs.readdirSync(dir)
        for (const entry of entries) {
          const appDir = path.join(dir, entry)
          if (fs.statSync(appDir).isDirectory()) {
            // 检查是否包含VC++运行时DLL
            const hasVCRedist = this.directoryContainsVCRedist(appDir, year)
            if (hasVCRedist) {
              dependents.push({
                name: entry,
                path: appDir
              })
            }
          }
        }
      } catch {}
    }

    return dependents.slice(0, 10) // 限制返回数量
  }

  private directoryContainsVCRedist(dirPath: string, year: string): boolean {
    try {
      const vcDlls = ['msvcp140.dll', 'vcruntime140.dll', 'vcruntime140_1.dll']
      const files = fs.readdirSync(dirPath)
      return vcDlls.some(dll => files.includes(dll))
    } catch {
      return false
    }
  }

  private async findDotNetDependents(): Promise<DependentSoftware[]> {
    const dependents: DependentSoftware[] = []
    const programDirs = [
      'C:\\Program Files',
      'C:\\Program Files (x86)'
    ]

    for (const dir of programDirs) {
      try {
        const entries = fs.readdirSync(dir)
        for (const entry of entries) {
          const appDir = path.join(dir, entry)
          if (fs.statSync(appDir).isDirectory()) {
            const hasDotNet = this.directoryContainsDotNet(appDir)
            if (hasDotNet) {
              dependents.push({
                name: entry,
                path: appDir
              })
            }
          }
        }
      } catch {}
    }

    return dependents.slice(0, 10)
  }

  private directoryContainsDotNet(dirPath: string): boolean {
    try {
      const files = fs.readdirSync(dirPath)
      return files.some(f =>
        f.endsWith('.runtimeconfig.json') ||
        f === 'dotnet.exe' ||
        f.includes('.deps.json')
      )
    } catch {
      return false
    }
  }

  private async findJavaDependents(): Promise<DependentSoftware[]> {
    const dependents: DependentSoftware[] = []

    // 扫描包含.jar文件的目录
    const scanDirs = [
      'C:\\Program Files',
      'C:\\Program Files (x86)',
      path.join(process.env.LOCALAPPDATA || '', 'Programs')
    ]

    for (const dir of scanDirs) {
      try {
        const entries = fs.readdirSync(dir)
        for (const entry of entries) {
          const appDir = path.join(dir, entry)
          if (fs.statSync(appDir).isDirectory()) {
            const hasJava = this.directoryContainsJava(appDir)
            if (hasJava) {
              dependents.push({
                name: entry,
                path: appDir
              })
            }
          }
        }
      } catch {}
    }

    return dependents.slice(0, 10)
  }

  private directoryContainsJava(dirPath: string): boolean {
    try {
      const files = fs.readdirSync(dirPath)
      return files.some(f =>
        f.endsWith('.jar') ||
        f === 'java.exe' ||
        f === 'javaw.exe'
      )
    } catch {
      return false
    }
  }

  private async findPythonDependents(): Promise<DependentSoftware[]> {
    const dependents: DependentSoftware[] = []

    // 扫描包含.py文件或Python脚本的目录
    const scanDirs = [
      path.join(process.env.LOCALAPPDATA || '', 'Programs'),
      path.join(process.env.APPDATA || '')
    ]

    for (const dir of scanDirs) {
      try {
        const entries = fs.readdirSync(dir)
        for (const entry of entries) {
          const appDir = path.join(dir, entry)
          if (fs.statSync(appDir).isDirectory()) {
            const hasPython = this.directoryContainsPython(appDir)
            if (hasPython) {
              dependents.push({
                name: entry,
                path: appDir
              })
            }
          }
        }
      } catch {}
    }

    return dependents.slice(0, 10)
  }

  private directoryContainsPython(dirPath: string): boolean {
    try {
      const files = fs.readdirSync(dirPath)
      return files.some(f =>
        f === 'python.exe' ||
        f === 'pythonw.exe' ||
        f.endsWith('.py')
      )
    } catch {
      return false
    }
  }

  private async findNodeJSDependents(): Promise<DependentSoftware[]> {
    const dependents: DependentSoftware[] = []

    // 扫描包含package.json的目录
    const scanDirs = [
      'C:\\Program Files',
      path.join(process.env.LOCALAPPDATA || '', 'Programs')
    ]

    for (const dir of scanDirs) {
      try {
        const entries = fs.readdirSync(dir)
        for (const entry of entries) {
          const appDir = path.join(dir, entry)
          if (fs.statSync(appDir).isDirectory()) {
            const hasNode = this.directoryContainsNode(appDir)
            if (hasNode) {
              dependents.push({
                name: entry,
                path: appDir
              })
            }
          }
        }
      } catch {}
    }

    return dependents.slice(0, 10)
  }

  private directoryContainsNode(dirPath: string): boolean {
    try {
      const files = fs.readdirSync(dirPath)
      return files.some(f =>
        f === 'package.json' ||
        f === 'node.exe' ||
        f === 'node_modules'
      )
    } catch {
      return false
    }
  }
}
