# Footnote 项目目录重构方案

> **创建日期**：2026-01-04  
> **状态**：待审核  
> **说明**：本文档展示目录重构后的结构，供审核确认后再执行实际操作

---

## 📋 重构原则

1. **产品相关产出**（美术资产、代码工程、测试相关）→ `game/` 目录
2. **可复用工作流**（相关度低）→ `workflows/reusable/` 目录
3. **项目特定工作流**（相关度高）→ `workflows/project/` 目录
4. **策划设计相关** → `design/` 目录（整合所有设计文档）
5. **小说漫画等其他文娱产出** → `content/` 目录
6. **项目规则** → 保持 `.cursor/rules/` 在根目录（Cursor要求）

---

## 🎯 重构后的目录结构

```
Footnote/
├── .cursor/                    # Cursor AI规则（保持不变）
│   └── rules/                  # 项目规则
│
├── game/                       # 🎮 产品相关产出（新建）
│   ├── src/                    # TypeScript源代码
│   ├── assets/                 # 美术资产
│   ├── tests/                  # 测试代码
│   ├── scripts/                # 构建和资源生成脚本
│   ├── dist/                   # 构建输出
│   ├── public/                 # 静态资源
│   ├── coverage/               # 测试覆盖率报告
│   ├── package.json            # 项目依赖和脚本
│   ├── package-lock.json       # 依赖锁定文件
│   ├── tsconfig.json           # TypeScript配置
│   ├── tsconfig.build.json     # 构建TypeScript配置
│   ├── vite.config.ts          # Vite构建配置
│   ├── vite.preview.config.ts  # 预览模式配置
│   ├── vitest.config.ts        # Vitest测试配置
│   ├── playwright.config.ts    # Playwright E2E测试配置
│   ├── index.html              # HTML入口
│   └── preview.html            # 预览HTML
│
├── workflows/                  # 🔧 工作流相关（新建）
│   ├── reusable/               # 可复用工作流（相关度低）
│   │   ├── mcp-runner/         # MCP服务器运行器（通用工具）
│   │   │   ├── server.mjs
│   │   │   ├── mcp-runner.mjs
│   │   │   ├── run-agent.ps1
│   │   │   └── README.md
│   │   ├── text2pic/           # 文本转图片工具（通用工具）
│   │   │   ├── batch_generate.py
│   │   │   ├── image_gen.py
│   │   │   ├── test_gen.py
│   │   │   ├── doc.md
│   │   │   ├── generated/
│   │   │   └── temp_serve/
│   │   └── n8n-common/         # n8n通用工作流配置（可复用部分）
│   │       ├── wsl-runner/      # WSL运行器（通用）
│   │       ├── dashboard/       # n8n仪表板（通用）
│   │       └── [通用工作流JSON和脚本]
│   │
│   └── project/                # 项目特定工作流（相关度高）
│       ├── promptx/            # PromptX角色定义（项目特定）
│       │   ├── roles/          # AI角色定义（L0-L3层级）
│       │   └── skills/         # 技能模板
│       ├── n8n/                # n8n项目特定工作流
│       │   ├── *.json          # 项目特定工作流定义
│       │   ├── cli-import/     # CLI导入的工作流
│       │   ├── *.ps1           # PowerShell部署/管理脚本
│       │   ├── *.sh            # Shell脚本
│       │   └── *.md            # 文档（部署指南、集群状态等）
│       ├── logs/               # 自动化运行日志（项目特定）
│       │   ├── automation_runs/  # 自动化运行记录
│       │   ├── decisions_log.md
│       │   ├── rollback_log.md
│       │   └── task_log.md
│       └── pipelines/          # 流水线规格文档（项目特定）
│           ├── asset_pipeline_spec.md
│           ├── content_pipeline_spec.md
│           ├── factory_pipeline_spec.md
│           ├── n8n_cursor_cli_overview.md
│           ├── n8n_cursor_cli_pipeline_spec.md
│           ├── n8n_cursor_cli_rollout_plan.md
│           ├── n8n_fixed_flow_standard.md
│           └── workstreams_boundary.md
│
├── design/                     # 📖 策划设计相关（整合）
│   ├── game/                   # 游戏设计文档（原 design/）
│   │   ├── 00-overview/        # 项目总览
│   │   ├── 01-narrative/      # 叙事设计
│   │   ├── 02-system/          # 系统设计
│   │   ├── 03-art/             # 美术设计
│   │   ├── 04-audio/           # 音频设计
│   │   ├── 05-tech/            # 技术设计
│   │   ├── 06-operation/       # 运营设计
│   │   └── README.md
│   │
│   ├── ai-native/              # AI-Native工作流设计文档（原 docs/）
│   │   ├── 00_charter/         # 宪法层文档
│   │   ├── 01_bibles/          # 总纲层文档（L1产出）
│   │   ├── 02_specs/           # 规格层文档（L2产出）
│   │   │   ├── systems/        # 系统规格
│   │   │   └── ui/             # UI规格
│   │   ├── 03_taskpacks/       # 任务包（L2派单给L3）
│   │   └── 04_acceptance/      # 验收层文档
│   │
│   ├── production/             # 生产相关设计文档（原 docs/）
│   │   ├── alignment/          # 剧情对齐分析
│   │   ├── art/                # 美术工作流文档
│   │   ├── chapters/           # 章节验收文档
│   │   ├── AI-Native流程改造落地计划.md
│   │   ├── AI-Native项目估算模型.md
│   │   ├── whitebox-development-guide.md
│   │   ├── 像素PNG资源生成方案.md
│   │   ├── 智绘AI生图自动化操作指南.md
│   │   ├── 智绘AI生图自动化演示文案.md
│   │   ├── 漫画生成工作流.md
│   │   ├── 漫画生成计划.md
│   │   ├── 美术生成问题和指导规范.md
│   │   ├── 落地计划书_v1.md
│   │   ├── 资产需求跟踪.md
│   │   ├── 资源生产清单_v1.md
│   │   ├── 资源生成报告_batch1.md
│   │   ├── 资源生成报告_batch2.md
│   │   └── 配置化场景搭建流程规范.md
│   │
│   └── README.md               # 设计文档索引
│
├── content/                    # 📚 小说漫画等其他文娱产出（新建）
│   ├── story/                  # 小说文本
│   │   ├── 1.md
│   │   ├── 2.md
│   │   ├── 3.md
│   │   ├── 4.md
│   │   └── 5.md
│   │
│   └── comics/                 # 漫画生成
│       ├── scripts/            # 漫画生成脚本
│       ├── generated/          # 生成的原始漫画
│       ├── output/             # 最终输出漫画
│       ├── processed/          # 处理后的漫画
│       ├── viewer/             # 漫画查看器
│       └── bak/                # 备份
│
├── logs/                       # 📝 运行时日志（保持根目录）
│   ├── mcp-runner-server-error.log
│   ├── mcp-runner-server-out.log
│   ├── n8n-primary-error.log
│   └── n8n-primary-out.log
│
├── node_modules/               # Node.js依赖（gitignore，保持不变）
│
├── README.md                   # 项目说明（更新路径引用）
├── CHANGELOG.md                # 更新日志
└── CONTRIBUTING.md             # 贡献指南
```

---

## 📊 目录迁移映射表

### 1. 产品相关产出 → `game/`

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `src/` | `game/src/` | TypeScript源代码 |
| `assets/` | `game/assets/` | 美术资产 |
| `tests/` | `game/tests/` | 测试代码 |
| `scripts/` | `game/scripts/` | 构建和资源生成脚本 |
| `dist/` | `game/dist/` | 构建输出 |
| `public/` | `game/public/` | 静态资源 |
| `coverage/` | `game/coverage/` | 测试覆盖率报告 |
| `package.json` | `game/package.json` | 项目依赖和脚本 |
| `package-lock.json` | `game/package-lock.json` | 依赖锁定文件 |
| `tsconfig.json` | `game/tsconfig.json` | TypeScript配置 |
| `tsconfig.build.json` | `game/tsconfig.build.json` | 构建TypeScript配置 |
| `vite.config.ts` | `game/vite.config.ts` | Vite构建配置 |
| `vite.preview.config.ts` | `game/vite.preview.config.ts` | 预览模式配置 |
| `vitest.config.ts` | `game/vitest.config.ts` | Vitest测试配置 |
| `playwright.config.ts` | `game/playwright.config.ts` | Playwright E2E测试配置 |
| `index.html` | `game/index.html` | HTML入口 |
| `preview.html` | `game/preview.html` | 预览HTML |

### 2. 可复用工作流 → `workflows/reusable/`

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `tools/mcp-runner/` | `workflows/reusable/mcp-runner/` | MCP服务器运行器（通用工具） |
| `text2pic/` | `workflows/reusable/text2pic/` | 文本转图片工具（通用工具） |
| `tools/n8n/wsl-runner/` | `workflows/reusable/n8n-common/wsl-runner/` | WSL运行器（通用） |
| `tools/n8n/dashboard/` | `workflows/reusable/n8n-common/dashboard/` | n8n仪表板（通用） |
| `tools/test-*.sh` | `workflows/reusable/n8n-common/` | 测试脚本（通用） |
| `tools/wsl-env-check.sh` | `workflows/reusable/n8n-common/` | WSL环境检查（通用） |

**注意**：`tools/n8n/` 中的工作流需要判断哪些是通用的，哪些是项目特定的。建议：
- 通用的基础设施脚本 → `workflows/reusable/n8n-common/`
- 项目特定的工作流JSON → `workflows/project/n8n/`

### 3. 项目特定工作流 → `workflows/project/`

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `promptx/` | `workflows/project/promptx/` | PromptX角色定义（项目特定） |
| `docs/05_logs/` | `workflows/project/logs/` | 自动化运行日志（项目特定） |
| `docs/02_specs/pipelines/` | `workflows/project/pipelines/` | 流水线规格文档（项目特定） |
| `tools/n8n/*.json` | `workflows/project/n8n/*.json` | 项目特定工作流定义 |
| `tools/n8n/cli-import/` | `workflows/project/n8n/cli-import/` | CLI导入的工作流 |
| `tools/n8n/*.ps1` | `workflows/project/n8n/*.ps1` | PowerShell部署/管理脚本 |
| `tools/n8n/*.sh` | `workflows/project/n8n/*.sh` | Shell脚本 |
| `tools/n8n/*.md` | `workflows/project/n8n/*.md` | 文档（部署指南、集群状态等） |
| `tools/README.md` | `workflows/project/n8n/README.md` | 工具说明 |

### 4. 策划设计相关 → `design/`（整合）

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `design/` | `design/game/` | 游戏设计文档 |
| `docs/00_charter/` | `design/ai-native/00_charter/` | 宪法层文档 |
| `docs/01_bibles/` | `design/ai-native/01_bibles/` | 总纲层文档 |
| `docs/02_specs/systems/` | `design/ai-native/02_specs/systems/` | 系统规格 |
| `docs/02_specs/ui/` | `design/ai-native/02_specs/ui/` | UI规格 |
| `docs/02_specs/DEV-PLAN_2026Q1.md` | `design/ai-native/02_specs/DEV-PLAN_2026Q1.md` | 开发计划 |
| `docs/03_taskpacks/` | `design/ai-native/03_taskpacks/` | 任务包 |
| `docs/04_acceptance/` | `design/ai-native/04_acceptance/` | 验收层文档 |
| `docs/alignment/` | `design/production/alignment/` | 剧情对齐分析 |
| `docs/art/` | `design/production/art/` | 美术工作流文档 |
| `docs/chapters/` | `design/production/chapters/` | 章节验收文档 |
| `docs/*.md`（生产相关） | `design/production/*.md` | 生产相关设计文档 |

### 5. 小说漫画等其他文娱产出 → `content/`

| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `story/` | `content/story/` | 小说文本 |
| `comics/` | `content/comics/` | 漫画生成 |

---

## ⚠️ 注意事项

### 1. 路径引用更新

重构后需要更新以下文件中的路径引用：

- **`README.md`** - 更新项目结构说明和快速开始指南
- **`package.json`** - 脚本路径可能需要调整（如果脚本引用相对路径）
- **`vite.config.ts`** - 资源路径配置
- **`.cursor/rules/*.mdc`** - 规则文件中的路径引用
- **`design/README.md`** - 设计文档索引中的路径
- **`workflows/project/n8n/*.md`** - 工作流文档中的路径引用
- **`workflows/project/pipelines/*.md`** - 流水线文档中的路径引用

### 2. Git 配置

- 确保 `.gitignore` 中的规则仍然有效
- 考虑使用 `git mv` 命令来保持文件历史记录

### 3. 构建配置

- `vite.config.ts` 中的 `root` 可能需要设置为 `game/`
- 或者保持根目录为 `game/`，调整所有相对路径

### 4. 工作流脚本

- `workflows/project/n8n/` 中的脚本可能需要更新路径引用
- MCP服务器配置可能需要更新工作目录

### 5. 测试配置

- 测试配置文件中的路径引用需要更新
- 覆盖率报告路径可能需要调整

---

## 🔄 执行步骤建议

1. **创建新目录结构**
   ```bash
   mkdir -p game workflows/reusable workflows/project design/ai-native design/production content
   ```

2. **迁移文件**（使用 `git mv` 保持历史）
   ```bash
   # 产品相关
   git mv src game/
   git mv assets game/
   git mv tests game/
   # ... 其他文件
   
   # 工作流相关
   git mv tools/mcp-runner workflows/reusable/
   git mv text2pic workflows/reusable/
   git mv promptx workflows/project/
   # ... 其他文件
   
   # 设计相关
   git mv design design/game
   git mv docs/00_charter design/ai-native/
   # ... 其他文件
   
   # 文娱产出
   git mv story content/
   git mv comics content/
   ```

3. **更新配置文件**
   - 更新所有路径引用
   - 更新构建配置
   - 更新测试配置

4. **验证**
   - 运行 `npm install`（在 `game/` 目录）
   - 运行 `npm run build`
   - 运行 `npm run test`
   - 检查工作流脚本是否正常

5. **提交**
   ```bash
   git add .
   git commit -m "refactor: 重构目录结构，按产品/工作流/设计/文娱分类"
   ```

---

## 📝 待确认事项

- [ ] 确认 `tools/n8n/` 中哪些是通用工作流，哪些是项目特定工作流
- [ ] 确认 `docs/` 下哪些文档属于设计，哪些属于工作流
- [ ] 确认是否需要保留 `tools/` 目录作为过渡
- [ ] 确认构建配置的调整方案（是否将工作目录改为 `game/`）
- [ ] 确认工作流脚本的路径更新方案

---

## 🎯 预期收益

1. **清晰的组织结构** - 产品、工作流、设计、文娱产出分离
2. **更好的可维护性** - 相关文件集中管理
3. **便于复用** - 可复用工作流独立管理
4. **便于扩展** - 新项目可以复用 `workflows/reusable/` 中的工具

---

*本文档待审核确认后执行实际操作*

