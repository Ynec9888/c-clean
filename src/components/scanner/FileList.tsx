import { useState } from 'react'
import { ScannedFile } from '@/types/electron'
import { useAppStore } from '@/stores/appStore'
import {
  formatFileSize,
  formatDate,
  formatRelativeTime,
  getCategoryLabel,
  getRiskLabel,
  getRiskColor
} from '@/utils/format'
import {
  File,
  Folder,
  CheckSquare,
  Square,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface FileListProps {
  files: ScannedFile[]
}

export default function FileList({ files }: FileListProps) {
  const { selectedFiles, toggleFileSelection } = useAppStore()
  const [expandedFile, setExpandedFile] = useState<string | null>(null)

  if (files.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-100 dark:border-gray-700 text-center">
        <p className="text-gray-500 dark:text-gray-400">没有找到匹配的文件</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* 表头 */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
          <div className="col-span-1">选择</div>
          <div className="col-span-5">文件名</div>
          <div className="col-span-2">大小</div>
          <div className="col-span-2">类别</div>
          <div className="col-span-2">风险</div>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
        {files.map((file, index) => {
          const isSelected = selectedFiles.has(file.id)
          const isExpanded = expandedFile === file.id
          const riskColors = getRiskColor(file.riskLevel)

          return (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              {/* 文件行 */}
              <div
                className={`px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                  isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                }`}
                onClick={() => toggleFileSelection(file.id)}
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* 选择框 */}
                  <div className="col-span-1">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>

                  {/* 文件名 */}
                  <div className="col-span-5 flex items-center">
                    <File className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      {file.software && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                          {file.software}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 大小 */}
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* 类别 */}
                  <div className="col-span-2">
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      {getCategoryLabel(file.category)}
                    </span>
                  </div>

                  {/* 风险 */}
                  <div className="col-span-2 flex items-center justify-between">
                    <span
                      className={`px-2 py-1 text-xs ${riskColors.bg} ${riskColors.text} rounded-full`}
                    >
                      {getRiskLabel(file.riskLevel)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setExpandedFile(isExpanded ? null : file.id)
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 展开详情 */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gray-50 dark:bg-gray-900/50 overflow-hidden"
                  >
                    <div className="px-6 py-4 pl-12">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            完整路径
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 break-all">
                            {file.path}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            文件信息
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              扩展名: {file.extension || '无'}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              创建时间: {formatDate(file.createdAt)}
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              修改时间: {formatRelativeTime(file.modifiedAt)}
                            </p>
                          </div>
                        </div>
                        {file.description && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              说明
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {file.description}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="mt-4 flex items-center space-x-2">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            // 在文件资源管理器中显示文件
                            try {
                              await window.electronAPI.shell.showItemInFolder(file.path)
                            } catch (err) {
                              console.error('打开目录失败:', err)
                            }
                          }}
                          className="flex items-center px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Folder className="w-3.5 h-3.5 mr-1.5" />
                          打开目录
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            // 打开文件属性（通过打开文件所在目录并选中文件）
                            try {
                              await window.electronAPI.shell.showItemInFolder(file.path)
                            } catch (err) {
                              console.error('显示文件信息失败:', err)
                            }
                          }}
                          className="flex items-center px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Info className="w-3.5 h-3.5 mr-1.5" />
                          详细信息
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* 底部统计 */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>共 {files.length} 个文件</span>
          <span>
            总大小: {formatFileSize(files.reduce((sum, f) => sum + f.size, 0))}
          </span>
        </div>
      </div>
    </div>
  )
}
