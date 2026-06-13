import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'
import MainLayout from '@/components/layout/MainLayout'
import Dashboard from '@/components/dashboard/Dashboard'
import Scanner from '@/components/scanner/Scanner'
import Runtime from '@/components/runtime/Runtime'
import Settings from '@/components/settings/Settings'

function App() {
  const { currentView, theme, loadDiskInfo, loadAiConfig } = useAppStore()

  useEffect(() => {
    // 初始化主题
    document.documentElement.classList.toggle('dark', theme === 'dark')
    // 加载磁盘信息
    loadDiskInfo()
    // 加载保存的 AI 配置
    loadAiConfig()
  }, [])

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'scanner':
        return <Scanner />
      case 'runtime':
        return <Runtime />
      case 'settings':
        return <Settings />
      default:
        return <Dashboard />
    }
  }

  return (
    <MainLayout>
      {renderView()}
    </MainLayout>
  )
}

export default App
