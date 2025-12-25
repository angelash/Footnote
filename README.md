# 📘 备注 / Footnote

> **叙事驱动的 2D 系统策略冒险 H5 游戏**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Phaser](https://img.shields.io/badge/Phaser-3.70-6c5ce7)](https://phaser.io/)
[![License](https://img.shields.io/badge/License-UNLICENSED-red)](./LICENSE)

## 🎮 游戏简介

**你生活在一个二维世界，但你能短暂触碰更高维度——代价是：世界会记住你做过的一切。**

- **游戏时长**：10-12 小时
- **平台**：H5 竖版手机游戏
- **核心体验**：维度不是空间，而是资源与代价

📖 详细游戏设计文档请查看 [`design/README.md`](./design/README.md)

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** 或 **pnpm**
- **Python** 3.8+（用于资源生成脚本）

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/YourOrg/Footnote.git
cd Footnote

# 安装 Node.js 依赖
npm install

# 安装 Playwright 浏览器（用于 E2E 测试）
npx playwright install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173 即可预览游戏。

---

## 📦 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建产物 |
| `npm run test` | 运行单元测试 |
| `npm run test:ui` | 测试 UI 界面 |
| `npm run test:e2e` | 运行 E2E 测试 |
| `npm run lint` | 代码检查 |
| `npm run lint:fix` | 自动修复 lint 问题 |
| `npm run typecheck` | TypeScript 类型检查 |

### 资源生成

```bash
# 生成像素风格资源
npm run generate:pixel-assets

# 生成 128px 像素资源（带动画序列）
npm run generate:pixel-assets:128
```

---

## 📁 项目结构

```
Footnote/
├── src/                    # 源代码
│   ├── scenes/            # Phaser 场景
│   ├── systems/           # 核心系统
│   │   ├── narrative/     # 叙事引擎
│   │   ├── world/         # 世界状态
│   │   ├── ability/       # 能力系统
│   │   ├── save/          # 存档系统
│   │   ├── ui/            # UI 组件
│   │   └── audio/         # 音频管理
│   ├── data/              # 游戏数据 (YAML)
│   │   ├── dialogues/     # 对白数据
│   │   ├── cards/         # 卡片数据
│   │   └── scenes/        # 场景配置
│   ├── config/            # 配置文件
│   └── types/             # TypeScript 类型定义
├── assets/                 # 游戏资源
│   ├── audio/             # 音频文件
│   ├── images/            # 图片资源
│   └── fonts/             # 字体文件
├── design/                 # 策划设计文档
│   ├── 00-overview/       # 项目总览
│   ├── 01-narrative/      # 叙事设计
│   ├── 02-system/         # 系统设计
│   ├── 03-art/            # 美术设计
│   ├── 04-audio/          # 音频设计
│   ├── 05-tech/           # 技术设计
│   └── 06-operation/      # 运营设计
├── docs/                   # 技术开发文档
│   └── art/               # 美术工作流文档
├── tests/                  # 测试代码
│   ├── unit/              # 单元测试
│   └── e2e/               # E2E 测试
├── scripts/                # 构建脚本
└── public/                 # 静态资源
```

---

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| **游戏引擎** | Phaser 3 |
| **语言** | TypeScript (strict mode) |
| **构建工具** | Vite |
| **存档系统** | IndexedDB (idb) |
| **数据格式** | YAML |
| **单元测试** | Vitest |
| **E2E 测试** | Playwright |
| **代码规范** | ESLint + Prettier |

---

## 🎯 核心系统

### 三种能力（按解锁顺序）

1. **深度感知** (C2 解锁) - 只看不动，认知冲击
2. **深度介入** (C3 解锁) - 可改变结构，留下伤痕
3. **时间干预** (C4 解锁) - 回溯节点，产生污染

### 隐藏计数器

| 计数器 | 说明 |
|--------|------|
| **R** (无收益残差) | 无奖励行为累积 |
| **P** (观察者压力) | 高维能力使用累积 |
| **W** (世界可读性) | 综合稳定度 |

---

## 📖 文档索引

- **游戏设计** → [`design/README.md`](./design/README.md)
- **技术设计** → [`design/05-tech/`](./design/05-tech/)
- **美术规范** → [`docs/art/`](./docs/art/)
- **贡献指南** → [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- **更新日志** → [`CHANGELOG.md`](./CHANGELOG.md)

---

## 🤝 参与贡献

我们欢迎各种形式的贡献！请先阅读 [贡献指南](./CONTRIBUTING.md)。

```bash
# 1. Fork 本仓库
# 2. 创建功能分支
git checkout -b feature/amazing-feature

# 3. 提交更改
git commit -m 'feat: add amazing feature'

# 4. 推送分支
git push origin feature/amazing-feature

# 5. 创建 Pull Request
```

---

## 📄 许可证

本项目为私有项目，暂不开源。详见 [LICENSE](./LICENSE)。

---

## 👥 团队

**Footnote Team** - *Initial work*

---

<p align="center">
  <i>「你不是在玩解谜，你是在承担后果。」</i>
</p>
