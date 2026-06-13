import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface CleanResult {
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

export interface CleanOptions {
  createRestorePoint?: boolean
  backupBeforeDelete?: boolean
  forceDelete?: boolean
  dryRun?: boolean
}

export class CleanerService {
  private cleanHistory: CleanResult[] = []

  async cleanFiles(
    files: string[],
    options: CleanOptions = {}
  ): Promise<CleanResult> {
    const result: CleanResult = {
      totalFiles: files.length,
      successCount: 0,
      failCount: 0,
      skippedCount: 0,
      totalSizeFreed: 0,
      errors: [],
      details: []
    }

    // 创建系统还原点（如果启用）
    if (options.createRestorePoint) {
      await this.createRestorePoint()
    }

    // 备份文件列表（如果启用）
    if (options.backupBeforeDelete) {
      await this.backupFileList(files)
    }

    // 逐个删除文件
    for (const filePath of files) {
      const detail = await this.deleteFile(filePath, options)
      result.details.push(detail)

      if (detail.status === 'success') {
        result.successCount++
        result.totalSizeFreed += detail.size
      } else if (detail.status === 'failed') {
        result.failCount++
        result.errors.push({
          filePath,
          error: detail.reason || '未知错误'
        })
      } else {
        result.skippedCount++
      }
    }

    // 记录清理历史
    this.cleanHistory.push(result)

    // 写入清理日志
    await this.writeCleanLog(result)

    return result
  }

  private async deleteFile(
    filePath: string,
    options: CleanOptions
  ): Promise<CleanDetail> {
    const detail: CleanDetail = {
      filePath,
      size: 0,
      status: 'skipped'
    }

    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        detail.reason = '文件不存在'
        return detail
      }

      // 获取文件大小
      const stats = fs.statSync(filePath)
      detail.size = stats.size

      // 检查是否为目录
      if (stats.isDirectory()) {
        if (options.forceDelete) {
          fs.rmSync(filePath, { recursive: true, force: true })
          detail.status = 'success'
        } else {
          detail.reason = '是目录，跳过'
        }
        return detail
      }

      // 干运行模式
      if (options.dryRun) {
        detail.status = 'success'
        detail.reason = '干运行模式，未实际删除'
        return detail
      }

      // 检查文件是否被占用
      if (await this.isFileLocked(filePath)) {
        detail.reason = '文件被占用'
        detail.status = 'skipped'
        return detail
      }

      // 尝试删除文件
      fs.unlinkSync(filePath)
      detail.status = 'success'

    } catch (error) {
      detail.status = 'failed'
      detail.reason = (error as Error).message
    }

    return detail
  }

  private async isFileLocked(filePath: string): Promise<boolean> {
    try {
      // 尝试以独占方式打开文件
      const fd = fs.openSync(filePath, 'r+')
      fs.closeSync(fd)
      return false
    } catch (error: any) {
      // EBUSY 或 EPERM 表示文件被占用
      if (error.code === 'EBUSY' || error.code === 'EPERM') {
        return true
      }
      return false
    }
  }

  private async createRestorePoint(): Promise<void> {
    try {
      // 使用PowerShell创建系统还原点
      await execAsync(
        'powershell -Command "Checkpoint-Computer -Description \'C-Clean 清理前还原点\' -RestorePointType MODIFY_SETTINGS"',
        { timeout: 60000 }
      )
    } catch (error) {
      console.error('创建还原点失败:', error)
      // 不阻断清理流程
    }
  }

  private async backupFileList(files: string[]): Promise<void> {
    try {
      const backupDir = path.join(
        process.env.APPDATA || '',
        'C-Clean',
        'backups'
      )

      // 创建备份目录
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupFile = path.join(backupDir, `backup-${timestamp}.json`)

      const backupData = {
        timestamp: new Date().toISOString(),
        files: files.map(f => ({
          path: f,
          exists: fs.existsSync(f),
          size: fs.existsSync(f) ? fs.statSync(f).size : 0
        }))
      }

      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
    } catch (error) {
      console.error('备份文件列表失败:', error)
    }
  }

  private async writeCleanLog(result: CleanResult): Promise<void> {
    try {
      const logDir = path.join(
        process.env.APPDATA || '',
        'C-Clean',
        'logs'
      )

      // 创建日志目录
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const logFile = path.join(logDir, `clean-${timestamp}.log`)

      const logContent = [
        `=== C-Clean 清理日志 ===`,
        `时间: ${new Date().toLocaleString()}`,
        `总计文件: ${result.totalFiles}`,
        `成功: ${result.successCount}`,
        `失败: ${result.failCount}`,
        `跳过: ${result.skippedCount}`,
        `释放空间: ${this.formatSize(result.totalSizeFreed)}`,
        ``,
        `--- 详细信息 ---`,
        ...result.details.map(d =>
          `[${d.status.toUpperCase()}] ${d.filePath} (${this.formatSize(d.size)})${d.reason ? ` - ${d.reason}` : ''}`
        ),
        ``,
        `--- 错误信息 ---`,
        ...result.errors.map(e =>
          `[ERROR] ${e.filePath}: ${e.error}`
        )
      ].join('\n')

      fs.writeFileSync(logFile, logContent)
    } catch (error) {
      console.error('写入清理日志失败:', error)
    }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
  }

  getCleanHistory(): CleanResult[] {
    return this.cleanHistory
  }

  async cleanTempFiles(): Promise<CleanResult> {
    const tempPaths = [
      process.env.TEMP,
      process.env.TMP,
      path.join(process.env.WINDIR || 'C:\\Windows', 'Temp')
    ].filter(Boolean) as string[]

    const files: string[] = []

    for (const tempPath of tempPaths) {
      try {
        if (fs.existsSync(tempPath)) {
          const entries = fs.readdirSync(tempPath)
          for (const entry of entries) {
            const fullPath = path.join(tempPath, entry)
            try {
              const stats = fs.statSync(fullPath)
              if (stats.isFile()) {
                files.push(fullPath)
              }
            } catch {}
          }
        }
      } catch {}
    }

    return this.cleanFiles(files, { backupBeforeDelete: true })
  }

  async cleanRecycleBin(): Promise<CleanResult> {
    try {
      // 使用PowerShell清空回收站
      await execAsync('powershell -Command "Clear-RecycleBin -Force"')
      return {
        totalFiles: 0,
        successCount: 0,
        failCount: 0,
        skippedCount: 0,
        totalSizeFreed: 0,
        errors: [],
        details: []
      }
    } catch (error) {
      throw new Error(`清空回收站失败: ${(error as Error).message}`)
    }
  }

  async cleanWindowsUpdateCache(): Promise<CleanResult> {
    const updateCachePath = path.join(
      process.env.WINDIR || 'C:\\Windows',
      'SoftwareDistribution',
      'Download'
    )

    const files: string[] = []

    try {
      if (fs.existsSync(updateCachePath)) {
        const entries = fs.readdirSync(updateCachePath)
        for (const entry of entries) {
          const fullPath = path.join(updateCachePath, entry)
          files.push(fullPath)
        }
      }
    } catch {}

    return this.cleanFiles(files, { forceDelete: true })
  }
}
