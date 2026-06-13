import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import { formatFileSize, getCategoryLabel, getRiskLabel, getRiskColor } from '@/utils/format'
import {
  Scan,
  StopCircle,
  Trash2,
  CheckSquare,
  Square,
  Filter,
  ChevronDown,
  AlertTriangle,
  Shield,
  Zap,
  Search
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import FileList from './FileList'
import ScanProgress from './ScanProgress'

export default function Scanner() {
  const {
    isScanning,
    scanProgress,
    scannedFiles,
    selectedFiles,
    startScan,
    stopScan,
    cleanFiles,
    selectAllFiles,
    deselectAllFiles,
    selectByRisk,
    getStats
  } = useAppStore()

  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterRisk, setFilterRisk] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const stats = getStats()

  const filteredFiles = scannedFiles.filter((file) => {
    if (filterCategory && file.category !== filterCategory) return false
    if (filterRisk && file.riskLevel !== filterRisk) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query) ||
        file.software?.toLowerCase().includes(query)
      )
    }
    return true
  })

  const handleStartScan = () => {
    startScan()
  }

  const handleClean = async () => {
    await cleanFiles()
  }

  const categories = [...new Set(scannedFiles.map((f) => f.category))]
  const risks = ['safe', 'caution', 'dangerous']

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          文件扫描
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          扫描并清理C盘不需要的文件
        </p>
      </div>

      {/* 扫描控制 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!isScanning ? (
              <button
                onClick={handleStartScan}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
              >
                <Scan className="w-5 h-5 mr-2" />
                开始扫描
              </button>
            ) : (
              <button
                onClick={stopScan}
                className="flex items-center px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                <StopCircle className="w-5 h-5 mr-2" />
                停止扫描
              </button>
            )}

            {scannedFiles.length > 0 && !isScanning && (
              <button
                onClick={handleClean}
                disabled={selectedFiles.size === 0}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                清理选中 ({selectedFiles.size})
              </button>
            )}
          </div>

          {scannedFiles.length > 0 && (
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                发现 {stats.totalFiles} 个文件
              </p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                总大小: {formatFileSize(stats.totalSize)}
              </p>
            </div>
          )}
        </div>

        {/* 扫描进度 */}
        <AnimatePresence>
          {isScanning && scanProgress && (
            <ScanProgress progress={scanProgress} />
          )}
        </AnimatePresence>
      </div>

      {/* 统计卡片 */}
      {scannedFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">
                  安全文件
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {stats.safeFiles}
                </p>
              </div>
              <Shield className="w-10 h-10 text-green-400" />
            </div>
            <button
              onClick={() => selectByRisk('safe')}
              className="mt-2 text-sm text-green-600 dark:text-green-400 hover:underline"
            >
              全选安全文件
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  谨慎文件
                </p>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {stats.cautionFiles}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-yellow-400" />
            </div>
            <button
              onClick={() => selectByRisk('caution')}
              className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 hover:underline"
            >
              全选谨慎文件
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  危险文件
                </p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {stats.dangerousFiles}
                </p>
              </div>
              <Zap className="w-10 h-10 text-red-400" />
            </div>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              不建议删除
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  已选中
                </p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {selectedFiles.size}
                </p>
              </div>
              <CheckSquare className="w-10 h-10 text-blue-400" />
            </div>
            <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
              {formatFileSize(stats.selectedSize)}
            </p>
          </motion.div>
        </div>
      )}

      {/* 筛选和搜索 */}
      {scannedFiles.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索文件名或路径..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 筛选按钮 */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                筛选
                <ChevronDown
                  className={`w-4 h-4 ml-2 transition-transform ${
                    showFilters ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>

            {/* 全选/取消全选 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAllFiles}
                className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                全选
              </button>
              <button
                onClick={deselectAllFiles}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                取消全选
              </button>
            </div>
          </div>

          {/* 筛选选项 */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <div className="flex flex-wrap gap-4">
                  {/* 类别筛选 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      文件类别
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilterCategory(null)}
                        className={`px-3 py-1 text-sm rounded-full ${
                          filterCategory === null
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        全部
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                          className={`px-3 py-1 text-sm rounded-full ${
                            filterCategory === cat
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {getCategoryLabel(cat)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 风险筛选 */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      风险等级
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilterRisk(null)}
                        className={`px-3 py-1 text-sm rounded-full ${
                          filterRisk === null
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        全部
                      </button>
                      {risks.map((risk) => {
                        const colors = getRiskColor(risk as any)
                        return (
                          <button
                            key={risk}
                            onClick={() => setFilterRisk(risk)}
                            className={`px-3 py-1 text-sm rounded-full ${
                              filterRisk === risk
                                ? `${colors.bg} ${colors.text}`
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {getRiskLabel(risk as any)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 文件列表 */}
      {scannedFiles.length > 0 && (
        <FileList files={filteredFiles} />
      )}

      {/* 空状态 */}
      {!isScanning && scannedFiles.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-100 dark:border-gray-700 text-center"
        >
          <Scan className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            开始扫描C盘
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            点击"开始扫描"按钮，软件将自动扫描C盘中的临时文件、缓存、日志等可清理文件
          </p>
          <button
            onClick={handleStartScan}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all duration-300"
          >
            开始扫描
          </button>
        </motion.div>
      )}
    </div>
  )
}
