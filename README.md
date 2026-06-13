# C-Clean - 智能C盘清理工具

一款智能、安全的C盘清理工具，帮助您轻松管理和清理C盘空间。

![C-Clean](build/icon.svg)

## ✨ 功能特性

### 🔍 智能文件扫描
- 扫描临时文件、缓存、日志、下载文件等
- 智能识别文件所属软件
- 风险评估：安全 / 谨慎 / 危险

### 🔧 运行时检测
- 检测 Visual C++ Redistributable
- 检测 .NET Framework / .NET 6/7/8
- 检测 Java / Python / Node.js 运行时
- 检测 DirectX 等系统组件
- 显示依赖该运行时的软件列表

### 🤖 AI智能分析（可选）
- 支持 OpenAI / Claude API
- 智能分析文件用途和删除风险
- 提供个性化清理建议

### 🛡️ 安全保护
- 白名单机制保护系统文件
- 清理前可选创建系统还原点
- 操作日志记录
- 危险文件二次确认

### 🎨 现代化UI
- Windows 11 风格设计
- 浅色/深色主题切换
- 流畅动画效果
- 响应式布局

## 📥 下载使用

### 方式一：直接下载（推荐）

从 [Releases](https://github.com/Ynec9888/c-clean/releases) 页面下载最新版本：

| 文件 | 说明 |
|------|------|
| `C-Clean-1.0.0-portable.exe` | **便携版** - 双击直接运行，无需安装 |

### 方式二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/Ynec9888/c-clean.git
cd c-clean

# 安装依赖
npm install

# 运行开发模式
npm run dev

# 或打包成 exe
npm run package
```

## 📦 技术栈

- **前端**: React 18 + TypeScript + TailwindCSS
- **桌面框架**: Electron 28
- **构建工具**: Vite + electron-vite
- **状态管理**: Zustand
- **动画**: Framer Motion
- **图表**: Recharts
- **图标**: Lucide React

## 📁 项目结构

```
c-clean/
├── electron/              # Electron主进程
│   ├── main.ts           # 主进程入口
│   ├── preload.ts        # 预加载脚本
│   └── services/         # 后端服务
│       ├── scanner.ts    # 文件扫描
│       ├── analyzer.ts   # 文件分析
│       ├── cleaner.ts    # 清理执行
│       └── runtime-detector.ts  # 运行时检测
├── src/                   # React前端
│   ├── components/       # UI组件
│   ├── stores/           # 状态管理
│   ├── utils/            # 工具函数
│   └── types/            # TypeScript类型
└── build/                 # 构建资源
```

## ⚙️ 配置 AI 功能

1. 打开设置页面
2. 选择 AI 服务提供商（OpenAI 或 Claude）
3. 输入您的 API Key
4. 点击保存

配置完成后，在扫描页面点击"AI分析"按钮即可使用智能分析功能。

## 🔒 安全说明

本软件遵循以下安全原则：

1. **最小权限原则** - 只请求必要的文件系统权限
2. **白名单机制** - 维护已知安全文件列表
3. **二次确认** - 删除前必须用户确认
4. **操作日志** - 记录所有删除操作
5. **系统保护** - 永远不删除系统关键文件

## 📝 注意事项

- 清理前建议仔细检查文件列表
- 对于不确定的文件，建议保留
- 运行时库（如 VC++、.NET）请谨慎删除
- 建议定期清理以保持系统良好状态

## 📄 许可证

MIT License

## 🙏 致谢

感谢以下开源项目：

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Framer Motion](https://www.framer.com/motion/)
