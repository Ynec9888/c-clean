# C-Clean - 智能C盘清理工具

一款智能、安全的C盘清理工具，帮助您轻松管理和清理C盘空间。

![C-Clean](build/icon.svg)

## ✨ 功能特性

### 🔍 智能文件扫描
- 扫描临时文件、缓存、日志、下载文件等
- 智能识别文件所属软件
- 风险评估：安全 / 谨慎 / 危险
- 详细的文件删除影响说明

### 🔧 运行时检测
- 检测 Visual C++ Redistributable
- 检测 .NET Framework / .NET 6/7/8
- 检测 Java / Python / Node.js 运行时
- 检测 DirectX 等系统组件
- 显示依赖该运行时的软件列表

### 🤖 AI智能分析（可选）
支持以下 AI 服务：
- **DeepSeek** - 国产高性价比 AI
- **小米 MiMo** - Xiaomi MiMo 大模型
- **OpenAI** - GPT-4o-mini
- **Claude** - Claude 3 Haiku

### 🛡️ 安全保护
- 白名单机制保护系统文件
- 清理前可选创建系统还原点
- 操作日志记录
- 危险文件二次确认
- 单实例锁定，防止重复打开

### 🎨 现代化UI
- Windows 11 风格设计
- 浅色/深色主题切换
- 流畅动画效果
- 响应式布局
- 窗口可拖动

## 📥 下载使用

### 方式一：从源码构建（推荐）

由于 exe 文件较大（约 140MB），建议从源码构建：

```bash
# 1. 克隆仓库
git clone https://github.com/Ynec9888/c-clean.git
cd c-clean

# 2. 安装依赖
npm install

# 3. 打包成 exe
npm run package

# 4. 生成的 exe 在 release 目录
```

### 方式二：直接运行开发模式

```bash
# 克隆仓库后
npm install
npm run dev
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
2. 选择 AI 服务提供商
3. 输入您的 API Key
4. 点击保存

### 各 AI 服务 API Key 获取方式

| AI 服务 | 官网 | API Key 获取 |
|---------|------|-------------|
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com) | [获取 API Key](https://platform.deepseek.com/api_keys) |
| 小米 MiMo | [mimo.mi.com](https://mimo.mi.com) | 官方文档获取 |
| OpenAI | [platform.openai.com](https://platform.openai.com) | [获取 API Key](https://platform.openai.com/api-keys) |
| Claude | [console.anthropic.com](https://console.anthropic.com) | [获取 API Key](https://console.anthropic.com/settings/keys) |

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
