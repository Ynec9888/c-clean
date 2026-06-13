import { useAppStore } from '@/stores/appStore'
import { Minus, Square, X, Moon, Sun } from 'lucide-react'

export default function TitleBar() {
  const { theme, toggleTheme } = useAppStore()

  const handleMinimize = () => {
    window.electronAPI.window.minimize()
  }

  const handleMaximize = () => {
    window.electronAPI.window.maximize()
  }

  const handleClose = () => {
    window.electronAPI.window.close()
  }

  return (
    <div
      className="h-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* 左侧：应用名称 */}
      <div className="flex items-center px-4">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-2">
          <span className="text-white text-xs font-bold">C</span>
        </div>
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          C-Clean
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
          智能C盘清理工具
        </span>
      </div>

      {/* 右侧：窗口控制 */}
      <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        {/* 主题切换 */}
        <button
          onClick={toggleTheme}
          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={theme === 'light' ? '切换到深色模式' : '切换到浅色模式'}
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-gray-600" />
          ) : (
            <Sun className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* 最小化 */}
        <button
          onClick={handleMinimize}
          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* 最大化 */}
        <button
          onClick={handleMaximize}
          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Square className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* 关闭 */}
        <button
          onClick={handleClose}
          className="px-3 py-2 hover:bg-red-500 hover:text-white transition-colors group"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400 group-hover:text-white" />
        </button>
      </div>
    </div>
  )
}
