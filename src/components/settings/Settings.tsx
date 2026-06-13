import { useState } from 'react'
import { useAppStore } from '@/stores/appStore'
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Key,
  Shield,
  Bell,
  Folder,
  Save,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import { motion } from 'framer-motion'

export default function Settings() {
  const { theme, toggleTheme, aiApiKey, aiProvider, setAiConfig } = useAppStore()

  const [localApiKey, setLocalApiKey] = useState(aiApiKey)
  const [localProvider, setLocalProvider] = useState<'openai' | 'claude'>(aiProvider)
  const [showApiKey, setShowApiKey] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSaveApiKey = () => {
    setAiConfig(localApiKey, localProvider)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          设置
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          配置软件选项和API设置
        </p>
      </div>

      {/* 主题设置 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mr-3">
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-purple-500" />
            ) : (
              <Moon className="w-5 h-5 text-purple-500" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              外观设置
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              自定义软件的外观主题
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="flex items-center">
            {theme === 'light' ? (
              <Sun className="w-5 h-5 text-yellow-500 mr-3" />
            ) : (
              <Moon className="w-5 h-5 text-blue-500 mr-3" />
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {theme === 'light' ? '浅色模式' : '深色模式'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                点击切换{theme === 'light' ? '深色' : '浅色'}模式
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </motion.div>

      {/* AI API设置 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mr-3">
            <Key className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI 智能分析
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              配置AI API以启用智能文件分析功能
            </p>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>什么是AI智能分析？</strong>
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                AI智能分析可以更准确地判断文件是否可以安全删除，识别文件所属软件，并提供个性化建议。
                不配置API时，软件仍可正常使用基础功能。
              </p>
            </div>
          </div>
        </div>

        {/* API提供商选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI 服务提供商
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setLocalProvider('deepseek')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                localProvider === 'deepseek'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">
                  DeepSeek
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  国产高性价比
                </p>
              </div>
            </button>
            <button
              onClick={() => setLocalProvider('mimo')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                localProvider === 'mimo'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">
                  小米 MiMo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Xiaomi MiMo v2.5
                </p>
              </div>
            </button>
            <button
              onClick={() => setLocalProvider('openai')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                localProvider === 'openai'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">
                  OpenAI
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  GPT-4o-mini
                </p>
              </div>
            </button>
            <button
              onClick={() => setLocalProvider('claude')}
              className={`p-4 rounded-lg border-2 transition-colors ${
                localProvider === 'claude'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <p className="font-semibold text-gray-900 dark:text-white">
                  Claude
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Claude 3 Haiku
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* API Key输入 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              placeholder={`输入${localProvider === 'deepseek' ? 'DeepSeek' : localProvider === 'mimo' ? '小米 MiMo' : localProvider === 'openai' ? 'OpenAI' : 'Claude'} API Key`}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? '隐藏' : '显示'}
            </button>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            API Key 将安全存储在本地
          </p>
          <button
            onClick={handleSaveApiKey}
            className="flex items-center px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                已保存
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存设置
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* 安全设置 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mr-3">
            <Shield className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              安全设置
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              配置清理保护和安全选项
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 自动创建还原点 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center">
              <RefreshCw className="w-5 h-5 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  清理前创建还原点
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  在清理文件前自动创建系统还原点
                </p>
              </div>
            </div>
            <div className="relative w-14 h-7 bg-blue-500 rounded-full">
              <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full translate-x-7" />
            </div>
          </div>

          {/* 危险文件警告 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  危险文件警告
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  删除高风险文件时显示警告
                </p>
              </div>
            </div>
            <div className="relative w-14 h-7 bg-blue-500 rounded-full">
              <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full translate-x-7" />
            </div>
          </div>

          {/* 备份删除文件 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center">
              <Folder className="w-5 h-5 text-purple-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  备份删除记录
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  记录所有删除的文件以便恢复
                </p>
              </div>
            </div>
            <div className="relative w-14 h-7 bg-blue-500 rounded-full">
              <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full translate-x-7" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* 关于 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mr-3">
            <Info className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              关于 C-Clean
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              智能C盘清理工具 v1.0.0
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            C-Clean 是一款智能的C盘清理工具，可以帮助您安全地清理C盘中的临时文件、缓存、日志等不需要的文件。
            软件具备智能识别功能，可以检测文件所属软件和运行时依赖，防止误删重要文件。
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-xs text-gray-400">版本: 1.0.0</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">Electron + React</span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-400">MIT License</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
