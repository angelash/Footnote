# Footnote 项目目录结构完整说明

> **最后更新**：2026-01-04  
> **项目名称**：《备注 / Footnote》  
> **项目类型**：叙事驱动的2D系统策略冒险H5竖版手机游戏

---

## 📋 目录分类总览

| 分类 | 主要目录 | 说明 |
|------|---------|------|
| 🔧 **工作流相关** | `tools/`, `promptx/`, `docs/05_logs/`, `docs/02_specs/pipelines/` | AI自动化工作流、n8n流程、MCP工具 |
| 📜 **项目规则** | `.cursor/rules/` | Cursor AI开发规范、代码规范、工作流规范 |
| 📖 **项目策划设计** | `design/`, `docs/01_bibles/`, `docs/02_specs/`, `docs/03_taskpacks/`, `docs/04_acceptance/` | 游戏设计文档、技术规格、任务包、验收清单 |
| 💻 **代码工程** | `src/`, `scripts/`, `tests/`, 配置文件 | TypeScript源代码、构建脚本、测试代码 |
| 🎨 **美术资产** | `assets/` | 音频、图片、字体等游戏资源 |
| 📚 **小说漫画** | `story/`, `comics/` | 小说文本、漫画生成脚本和输出 |
| 🧪 **测试相关** | `tests/`, `coverage/`, 测试配置 | 单元测试、E2E测试、测试覆盖率报告 |
| 📦 **构建产物** | `dist/`, `public/` | 构建输出、静态资源 |
| 🔬 **其他工具** | `text2pic/`, `logs/` | 文本转图片工具、日志文件 |

---

## 🔧 一、工作流相关

### 1.1 `tools/` - 自动化工具集

**用途**：AI自动化工作流工具、n8n流程配置、MCP服务器

```
tools/
├── mcp-runner/              # MCP服务器运行器
│   ├── server.mjs          # MCP服务器主程序
│   ├── mcp-runner.mjs      # 运行器脚本
│   ├── run-agent.ps1       # PowerShell启动脚本
│   └── README.md           # 使用说明
├── n8n/                    # n8n工作流配置
│   ├── *.json              # 工作流定义文件
│   ├── cli-import/         # CLI导入的工作流
│   ├── wsl-runner/         # WSL环境运行器
│   ├── dashboard/          # n8n仪表板
│   ├── *.ps1               # PowerShell部署/管理脚本
│   ├── *.sh                # Shell脚本
│   └── *.md                # 文档（部署指南、集群状态等）
├── wsl-runner/             # WSL运行器（可能为空）
├── test-*.sh               # 测试脚本
└── README.md               # 工具说明
```

**关键工作流**：
- `cursor-cli-task-workflow.json` - Cursor CLI任务工作流
- `factory-intake-workflow.json` - 工厂式任务接收
- `fixed-flow-pipeline.json` - 固定流程管道
- `launcher-*.json` - 各种启动器工作流

### 1.2 `promptx/` - PromptX角色和技能定义

**用途**：AI角色定义、技能模板（用于AI-Native工作流）

```
promptx/
├── roles/                  # AI角色定义（L0-L3层级）
│   ├── L0_producer.yaml    # L0制作人角色
│   ├── L1_*_director.yaml  # L1总监层角色（设计/技术/美术/QA/PMO）
│   ├── L2_*_lead.yaml      # L2组长层角色（叙事/系统/UI/事件/工具/写作/QA）
│   └── L3_*.yaml           # L3执行层角色（工程师/测试/写作/脚本）
└── skills/                 # 技能模板
    ├── asset_review.yaml   # 资产审查技能
    ├── code_review.yaml    # 代码审查技能
    └── test_planning.yaml  # 测试规划技能
```

### 1.3 `docs/05_logs/` - 自动化运行日志

**用途**：记录AI自动化任务的执行日志

```
docs/05_logs/
├── automation_runs/        # 自动化运行记录
│   └── RUN-YYYYMMDD-*/    # 每次运行的目录
│       ├── 00_intake.json      # 任务接收参数
│       ├── 01_preflight.json   # 预检查结果
│       ├── 02_plan.json        # 执行计划
│       ├── 03_taskpack.md      # 任务包内容
│       ├── 04_execute.json     # 执行结果
│       ├── 05_validate.json    # 验证结果
│       ├── 06_git.json         # Git操作结果
│       ├── 07_notify.json      # 通知结果
│       └── status.json         # 状态摘要
├── decisions_log.md        # 决策日志
├── rollback_log.md         # 回滚日志
└── task_log.md             # 任务日志
```

### 1.4 `docs/02_specs/pipelines/` - 流水线规格文档

**用途**：定义各种自动化流水线的规格

```
docs/02_specs/pipelines/
├── asset_pipeline_spec.md           # 资产流水线规格
├── content_pipeline_spec.md         # 内容流水线规格
├── factory_pipeline_spec.md         # 工厂流水线规格
├── n8n_cursor_cli_overview.md       # n8n Cursor CLI概览
├── n8n_cursor_cli_pipeline_spec.md  # n8n Cursor CLI流水线规格
├── n8n_cursor_cli_rollout_plan.md   # 推广计划
├── n8n_fixed_flow_standard.md        # 固定流程标准
└── workstreams_boundary.md           # 工作流边界定义
```

---

## 📜 二、项目规则

### 2.1 `.cursor/rules/` - Cursor AI开发规范

**用途**：定义Cursor AI在开发过程中需要遵循的规则和规范

```
.cursor/rules/
├── 00-project.mdc              # 项目总览规则
├── 01-code-style.mdc           # TypeScript代码规范
├── 02-phaser.mdc               # Phaser 3游戏引擎开发规范
├── 03-narrative.mdc            # 叙事系统开发规范
├── 04-testing.mdc              # 测试规范和自动化测试指南
├── 05-assets.mdc               # 美术资源规范和工业化生产标准
├── 06-ai-art-generation.mdc    # 智绘AI生图工业化操作指南
├── 07-auto-testing.mdc        # 自动化测试验收开发流程规范
├── 08-ui-qa-rules.mdc         # UI质量检查和规则自更新规范
├── 09-ai-native-workflow.mdc  # AI-Native工作流规范
└── 10-novel-to-comic.mdc      # 小说转漫画工作流规范
```

**说明**：这些`.mdc`文件是Cursor AI的规则文件，定义了代码风格、开发流程、测试要求等。

---

## 📖 三、项目策划设计

### 3.1 `design/` - 游戏设计文档

**用途**：游戏策划设计文档，包含世界观、角色、系统设计等

```
design/
├── 00-overview/                    # 项目总览
│   ├── 游戏设计文档GDD_v1.md     # 游戏设计文档（GDD）
│   └── 立项书_商业分析_v1.md     # 商业分析
├── 01-narrative/                  # 叙事设计
│   ├── 世界观完整版 v3.md        # 三层世界结构设定
│   ├── 角色人生线档案 v2.md      # 8核心角色档案
│   ├── 对白词库 v1.md            # 全角色对白
│   ├── 伏笔索引 v2.md            # 20+伏笔系统
│   ├── 卡片文本全集 v1.md        # 110张卡片内容
│   ├── 台词状态机.md             # R/P值影响台词
│   └── 章节×区域叙事布置/        # Zone脚本（7个文件）
├── 02-system/                     # 系统设计
│   └── [4个系统设计文档]
├── 03-art/                        # 美术设计
│   └── [21个美术设计文档]
├── 04-audio/                      # 音频设计
│   └── [1个音频设计文档]
├── 05-tech/                       # 技术设计
│   └── [13个技术设计文档]
└── 06-operation/                  # 运营设计
    └── [1个运营设计文档]
```

### 3.2 `docs/01_bibles/` - 总纲层文档（Bible）

**用途**：AI-Native工作流中的总纲层文档（L1产出）

```
docs/01_bibles/
├── design_bible.md        # 设计总纲
├── tech_bible.md          # 技术总纲
├── art_bible.md           # 美术总纲
├── qa_bible.md            # QA总纲
└── production_plan.md     # 生产计划
```

### 3.3 `docs/02_specs/` - 规格层文档（Spec）

**用途**：AI-Native工作流中的规格层文档（L2产出）

```
docs/02_specs/
├── systems/               # 系统规格
│   ├── narrative_system_spec.md    # 叙事系统规格
│   ├── event_system_spec.md        # 事件系统规格
│   ├── choice_system_spec.md       # 选择系统规格
│   ├── save_system_spec.md         # 存档系统规格
│   └── ui_system_spec.md           # UI系统规格
├── ui/                    # UI规格
│   ├── ui_components_spec.md       # UI组件规格
│   └── ui_flow_spec.md             # UI流程规格
├── pipelines/             # 流水线规格（见1.4）
└── DEV-PLAN_2026Q1.md     # 2026 Q1开发计划
```

### 3.4 `docs/03_taskpacks/` - 任务包（Task Pack）

**用途**：AI-Native工作流中的派单层文档（L2派单给L3）

```
docs/03_taskpacks/
├── _template.md                    # 任务包模板
├── T-0001_c0_z1_dialogue.md       # 示例任务包
└── T-REVIEW-20260103_project_quality.md  # 项目质量审查任务包
```

### 3.5 `docs/04_acceptance/` - 验收层文档

**用途**：QA验收清单和标准

```
docs/04_acceptance/
├── qa_checklists/         # QA检查清单
│   ├── build_acceptance.md        # 构建验收
│   ├── milestone_acceptance.md    # 里程碑验收
│   └── smoke.md                   # 冒烟测试
└── PROJECT-QUALITY-REVIEW_2026-01-03.md  # 项目质量审查报告
```

### 3.6 `docs/` 其他设计相关文档

```
docs/
├── alignment/             # 剧情对齐分析
│   ├── alignment_check.json
│   ├── story_index.json
│   └── [对齐分析报告]
├── art/                   # 美术工作流文档
│   ├── specs/             # 资产规格模板
│   └── [美术工作流文档]
├── chapters/              # 章节验收文档
│   └── CH01-验收.md ~ CH23-验收.md
└── [其他设计文档]
```

---

## 💻 四、代码工程

### 4.1 `src/` - TypeScript源代码

**用途**：游戏核心代码，使用Phaser 3引擎

```
src/
├── main.ts                # 应用入口
├── preview.ts             # 预览模式入口
├── config/                # 配置文件
│   ├── game.config.ts     # 游戏配置
│   ├── ui.config.ts       # UI配置
│   ├── zones.config.ts    # Zone配置
│   ├── characters.config.ts  # 角色配置
│   ├── objects.config.ts  # 对象配置
│   └── assetMode.config.ts # 资产模式配置
├── scenes/                # Phaser场景
│   ├── BootScene.ts       # 启动场景
│   ├── PreloadScene.ts    # 预加载场景
│   ├── MenuScene.ts       # 菜单场景
│   ├── GameScene.ts       # 游戏主场景
│   └── preview/           # 预览场景
│       ├── CardPreviewScene.ts
│       ├── DialoguePreviewScene.ts
│       └── [其他预览场景]
├── systems/               # 核心系统
│   ├── narrative/        # 叙事引擎
│   ├── world/             # 世界状态
│   ├── ability/           # 能力系统
│   ├── save/              # 存档系统
│   ├── ui/                # UI组件
│   ├── audio/             # 音频管理
│   ├── scene/             # 场景组装
│   ├── whitebox/          # 白盒系统
│   ├── game/              # 游戏系统（成就/教程/NG+）
│   ├── input/             # 输入控制
│   ├── assets/            # 资产管理
│   ├── cloud/             # 云存档
│   ├── i18n/              # 国际化
│   ├── accessibility/     # 无障碍
│   ├── analytics/         # 数据分析
│   └── debug/             # 调试工具
├── data/                  # 游戏数据（YAML）
│   ├── dialogues/         # 对白数据（按章节Zone）
│   ├── cards/             # 卡片数据（按章节）
│   ├── scenes/            # 场景配置（按章节Zone）
│   ├── foreshadows/       # 伏笔数据
│   └── audio/             # 音频配置
├── types/                  # TypeScript类型定义
│   ├── index.ts
│   └── scene.ts
└── tests/                  # 源代码测试（可能为空）
```

### 4.2 `scripts/` - 构建和资源生成脚本

**用途**：Python/Node.js脚本，用于资源生成、下载等

```
scripts/
├── generate_*.py          # 资源生成脚本
│   ├── generate_pixel_assets.py      # 像素资源生成
│   ├── generate_audio.py              # 音频生成
│   ├── generate_bgm.py                # BGM生成
│   └── generate_placeholders.py      # 占位符生成
├── download_*.py          # 资源下载脚本
│   ├── download_all_assets.py
│   ├── download_characters.py
│   ├── download_backgrounds.py
│   └── [其他下载脚本]
└── convert_to_mp3.py      # 音频转换
```

### 4.3 `tests/` - 测试代码

**用途**：单元测试、E2E测试、自动化测试

```
tests/
├── unit/                  # 单元测试
│   ├── scenes/
│   └── systems/
├── e2e/                   # E2E测试
│   ├── game.spec.ts
│   └── prologue.spec.ts
├── auto/                  # 自动化测试
│   └── TestRunner.ts
├── setup.ts               # 测试设置
└── vitest-globals.d.ts    # Vitest全局类型
```

### 4.4 配置文件

**用途**：项目构建、类型检查、测试配置

```
根目录/
├── package.json           # 项目依赖和脚本
├── package-lock.json      # 依赖锁定文件
├── tsconfig.json          # TypeScript配置
├── tsconfig.build.json    # 构建TypeScript配置
├── vite.config.ts         # Vite构建配置
├── vite.preview.config.ts # 预览模式配置
├── vitest.config.ts       # Vitest测试配置
├── playwright.config.ts   # Playwright E2E测试配置
└── index.html             # HTML入口
```

---

## 🎨 五、美术资产

### 5.1 `assets/` - 游戏资源

**用途**：游戏中使用的所有资源文件

```
assets/
├── audio/                 # 音频资源
│   ├── bgm/              # 背景音乐（8个文件）
│   ├── sfx/               # 音效（34个文件）
│   └── ambience/          # 环境音（7个文件）
├── images/                # 图片资源
│   └── animated/         # 动画序列
├── fonts/                 # 字体文件
└── bak/                   # 备份资源
    ├── backgrounds/       # 背景图备份
    ├── cards/             # 卡片备份
    ├── characters/       # 角色备份
    ├── effects/           # 特效备份
    ├── objects/           # 对象备份
    ├── ui/                # UI备份
    └── [其他备份]
```

---

## 📚 六、小说漫画

### 6.1 `story/` - 小说文本

**用途**：游戏相关的小说文本

```
story/
├── 1.md
├── 2.md
├── 3.md
├── 4.md
└── 5.md
```

### 6.2 `comics/` - 漫画生成

**用途**：从小说生成漫画的工作流和输出

```
comics/
├── scripts/               # 漫画生成脚本
│   ├── alignment/        # 对齐脚本
│   ├── chapters/         # 章节脚本（142个文件）
│   ├── download_images.py
│   ├── generate_comic.py
│   └── select_best.py
├── generated/            # 生成的原始漫画
│   └── ch01/ ~ ch22/     # 按章节组织
│       └── raw/          # 原始图片
├── output/               # 最终输出漫画
│   └── ch01/ ~ ch22/     # 按章节组织
│       └── page-*.webp   # 漫画页面（每章8页）
├── processed/            # 处理后的漫画
│   └── ep01/
│       ├── pages/
│       └── panels/
├── viewer/               # 漫画查看器
│   ├── index.html
│   ├── style.css
│   └── data.json
└── bak/                  # 备份
```

---

## 🧪 七、测试相关

### 7.1 `tests/` - 测试代码

见 **4.3 代码工程 - tests/**

### 7.2 `coverage/` - 测试覆盖率报告

**用途**：代码覆盖率报告（由Vitest生成）

```
coverage/
├── index.html             # 覆盖率报告首页
├── lcov.info              # LCOV格式报告
└── lcov-report/           # HTML报告
    └── [各文件的覆盖率详情]
```

### 7.3 测试配置文件

- `vitest.config.ts` - Vitest单元测试配置
- `playwright.config.ts` - Playwright E2E测试配置
- `tests/setup.ts` - 测试环境设置

---

## 📦 八、构建产物

### 8.1 `dist/` - 构建输出

**用途**：Vite构建后的生产版本

```
dist/
├── index.html             # 入口HTML
├── assets/                # 打包后的资源
├── icons/                 # 图标
├── screenshots/           # 截图
├── sw.js                  # Service Worker
├── manifest.json          # PWA清单
└── favicon.ico            # 网站图标
```

### 8.2 `public/` - 静态资源

**用途**：不会被Vite处理的静态资源（直接复制到dist）

```
public/
├── icons/                 # 图标
├── screenshots/           # 截图
├── manifest.json          # PWA清单
├── sw.js                  # Service Worker
└── favicon.ico            # 网站图标
```

---

## 🔬 九、其他工具和文件

### 9.1 `text2pic/` - 文本转图片工具

**用途**：文本转图片的生成工具

```
text2pic/
├── batch_generate.py      # 批量生成
├── image_gen.py           # 图片生成
├── test_gen.py            # 测试生成
├── doc.md                 # 文档
├── generated/             # 生成的图片
└── temp_serve/            # 临时服务
```

### 9.2 `logs/` - 日志文件

**用途**：运行时日志

```
logs/
├── mcp-runner-server-error.log
├── mcp-runner-server-out.log
├── n8n-primary-error.log
└── n8n-primary-out.log
```

### 9.3 其他根目录文件

```
根目录/
├── README.md              # 项目说明
├── CHANGELOG.md           # 更新日志
├── CONTRIBUTING.md        # 贡献指南
├── preview.html           # 预览HTML
└── node_modules/          # Node.js依赖（gitignore）
```

---

## 📊 目录统计

| 分类 | 主要目录数 | 说明 |
|------|-----------|------|
| 工作流相关 | 4个主要目录 | tools/, promptx/, docs/05_logs/, docs/02_specs/pipelines/ |
| 项目规则 | 1个目录 | .cursor/rules/ (10个规则文件) |
| 项目策划设计 | 5个主要目录 | design/, docs/01_bibles/, docs/02_specs/, docs/03_taskpacks/, docs/04_acceptance/ |
| 代码工程 | 4个主要目录 | src/, scripts/, tests/, 配置文件 |
| 美术资产 | 1个目录 | assets/ |
| 小说漫画 | 2个目录 | story/, comics/ |
| 测试相关 | 3个主要目录 | tests/, coverage/, 测试配置 |
| 构建产物 | 2个目录 | dist/, public/ |
| 其他工具 | 3个目录 | text2pic/, logs/, 根目录文件 |

---

## 🔍 快速查找指南

### 查找游戏设计文档
→ `design/` 目录

### 查找代码实现
→ `src/` 目录

### 查找游戏数据（对白/卡片/场景）
→ `src/data/` 目录

### 查找工作流配置
→ `tools/n8n/` 目录

### 查找AI角色定义
→ `promptx/roles/` 目录

### 查找测试代码
→ `tests/` 目录

### 查找美术资源
→ `assets/` 目录

### 查找漫画输出
→ `comics/output/` 目录

### 查找自动化运行日志
→ `docs/05_logs/automation_runs/` 目录

---

## 📝 维护说明

- 本文档应随项目结构变化及时更新
- 新增目录时，请同步更新本文档
- 建议在每次重大结构调整后更新统计信息

---

*最后更新：2026-01-04*

