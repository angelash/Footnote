# 📋 更新日志

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

---

## [Unreleased]

### 🚀 新增
- 待添加

### 🐛 修复
- 待添加

### 📝 文档
- 新增 `CONTRIBUTING.md` 贡献指南
- 新增 `CHANGELOG.md` 更新日志
- 重写 `README.md` 为开发者指南
- 完善 `.gitignore` 规则

---

## [0.1.0] - 2024-12-26

### 🚀 新增

#### 核心系统
- **叙事系统** (`src/systems/narrative/`)
  - NarrativeEngine 叙事引擎
  - 对白数据加载器
  - 支持 YAML 格式对白文件

- **世界状态系统** (`src/systems/world/`)
  - WorldState 世界状态管理
  - R/P/W 隐藏计数器

- **能力系统** (`src/systems/ability/`)
  - 深度感知能力
  - 深度介入能力
  - 时间干预能力

- **存档系统** (`src/systems/save/`)
  - IndexedDB 本地存档
  - 多存档槽位支持

- **UI 系统** (`src/systems/ui/`)
  - 对话框组件
  - 卡片系统
  - 状态栏
  - 菜单系统

- **音频系统** (`src/systems/audio/`)
  - BGM 管理
  - 音效播放
  - 环境音

#### 场景
- BootScene 启动场景
- PreloadScene 预加载场景
- MenuScene 主菜单场景
- GameScene 游戏主场景

#### 数据
- 47 个对白文件 (`src/data/dialogues/`)
- 8 个卡片数据文件 (`src/data/cards/`)
- 57 个场景配置文件 (`src/data/scenes/`)
- 伏笔系统数据 (`src/data/foreshadows/`)
- 音频配置 (`src/data/audio/`)

#### 资源
- BGM 音乐 (8 首)
- 音效 (34 个)
- 环境音 (7 个)

### 📝 文档
- 完整的策划设计文档 (`design/`)
  - 游戏设计文档 GDD
  - 世界观设定 (v3)
  - 角色档案 (8 个核心角色)
  - 对白词库
  - 伏笔索引
  - Zone 脚本包 (C0-CF)
  - 系统设计文档
  - 美术风格指南
  - 技术设计文档

- 技术程序设计文档 (`design/05-tech/program-design/`)
  - 系统架构设计
  - 数据结构与接口设计
  - 各系统详细设计文档

- 美术工作流文档 (`docs/art/`)

### 🛠️ 基础设施
- Vite 构建配置
- TypeScript 严格模式
- ESLint + Prettier 代码规范
- Vitest 单元测试配置
- Playwright E2E 测试配置
- PWA 支持

---

## 版本说明

### 版本号格式

`MAJOR.MINOR.PATCH`

- **MAJOR**: 不兼容的 API 变更
- **MINOR**: 向后兼容的功能新增
- **PATCH**: 向后兼容的问题修复

### 变更类型

| 类型 | 说明 |
|------|------|
| 🚀 新增 | 新功能 |
| 🐛 修复 | Bug 修复 |
| 💥 破坏性变更 | 不兼容的变更 |
| 🗑️ 废弃 | 即将移除的功能 |
| 🔒 安全 | 安全相关修复 |
| 📝 文档 | 文档更新 |
| 🎨 样式 | 代码格式/UI 样式 |
| ♻️ 重构 | 代码重构 |
| ⚡ 性能 | 性能优化 |
| ✅ 测试 | 测试相关 |
| 🔧 配置 | 配置文件变更 |

---

[Unreleased]: https://github.com/YourOrg/Footnote/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/YourOrg/Footnote/releases/tag/v0.1.0

