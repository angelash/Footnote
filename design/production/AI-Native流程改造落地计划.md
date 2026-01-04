# 《备注 / Footnote》AI-Native 流程改造落地计划

> **版本**: v1.0  
> **创建日期**: 2025-12-29  
> **状态**: 规划中  
> **目标**: 建立100人虚拟工作室式的AI协作工作流

---

## 📋 文档概述

### 背景
基于 ChatGPT 生成的《AI-Native项目估算模型》，结合当前项目实际情况，制定一套可落地的流程改造计划。核心思想是：**让AI像100人团队一样逐级分工交付，靠工件契约而非长上下文记忆**。

### 目标
1. 建立 L0-L3 四层虚拟组织结构
2. 规范化工件分层（Charter/Bible/Spec/TaskPack）
3. 创建 PromptX 角色包体系
4. 落地 GitHub Issue/PR 模板
5. 实现任务派单→交付→验收闭环

### 质量标准
- 每个阶段必须通过验收清单
- 每个交付物必须可审计、可回滚
- 粒度控制在大模型稳定输出范围内

---

## 📊 当前状态评估

### 已有资产清单

| 类别 | 状态 | 数量/覆盖率 | 位置 |
|------|------|------------|------|
| **MDC规则** | ✅ 完成 | 8个 | `.cursor/rules/` |
| **设计文档** | ✅ 完成 | 40+个 | `design/` |
| **核心系统代码** | ✅ 完成 | 39个模块 | `src/systems/` |
| **场景代码** | ✅ 完成 | 17个 | `src/scenes/` |
| **对白数据** | ✅ 完成 | 46个Zone | `src/data/dialogues/` |
| **场景数据** | ✅ 完成 | 58个 | `src/data/scenes/` |
| **卡片数据** | ✅ 完成 | 8套 | `src/data/cards/` |
| **音频资源** | ✅ 完成 | 49个 | `assets/audio/` |
| **图像资源** | 🔄 85% | 106+个 | `assets/images/` |
| **调试系统** | ✅ 完成 | 完整API | `src/systems/debug/` |
| **测试框架** | 🔄 20% | 基础 | `tests/` |

### AI-Native 模型要求 vs 当前状态

| 模块 | 模型要求 | 当前状态 | 差距 | 优先级 |
|------|---------|---------|------|--------|
| 组织结构 | L0-L3四层 | 单人模式 | ⚠️ 大 | P0 |
| 工件分层 | Charter/Bible/Spec/TaskPack | 有文档未分层 | 🔶 中 | P0 |
| 角色包 | PromptX YAML | 无 | ⚠️ 大 | P1 |
| Issue/PR模板 | 完整体系 | 无 | ⚠️ 大 | P1 |
| 任务系统 | Task Pack派单 | 无 | ⚠️ 大 | P0 |
| 核心代码 | 从零开始 | 已完成 | ✅ 超越 | - |
| 内容数据 | 待生成 | 已完成 | ✅ 超越 | - |

---

## 🏗️ 目标架构

### 目录结构（最终形态）

```
Footnote/
├── docs/
│   ├── 00_charter/                    # 宪法层（冻结）
│   │   ├── project_charter.md         # 项目宪法：目标/范围/禁区
│   │   └── change_control.md          # 变更控制流程
│   │
│   ├── 01_bibles/                     # 总纲层（L1输出）
│   │   ├── design_bible.md            # 策划总纲
│   │   ├── tech_bible.md              # 技术总纲
│   │   ├── art_bible.md               # 美术总纲
│   │   ├── qa_bible.md                # QA总纲
│   │   └── production_plan.md         # 生产计划
│   │
│   ├── 02_specs/                      # 规格层（L2输出）
│   │   ├── systems/                   # 系统规格
│   │   │   ├── narrative_system_spec.md
│   │   │   ├── event_system_spec.md
│   │   │   ├── choice_system_spec.md
│   │   │   ├── ui_system_spec.md
│   │   │   └── save_system_spec.md
│   │   ├── ui/                        # UI规格
│   │   │   ├── ui_flow_spec.md
│   │   │   └── ui_components_spec.md
│   │   └── pipelines/                 # 管线规格
│   │       ├── content_pipeline_spec.md
│   │       └── asset_pipeline_spec.md
│   │
│   ├── 03_taskpacks/                  # 派单层（L2→L3）
│   │   ├── _template.md               # 任务包模板
│   │   └── T-xxxx_taskpack.md         # 具体任务包
│   │
│   ├── 04_acceptance/                 # 验收层（QA）
│   │   ├── build_acceptance.md        # 构建验收
│   │   ├── milestone_acceptance.md    # 里程碑验收
│   │   └── qa_checklists/
│   │       ├── smoke.md               # 冒烟清单
│   │       └── regression.md          # 回归清单
│   │
│   ├── 05_logs/                       # 审计层
│   │   ├── task_log.md                # 任务日志
│   │   ├── rollback_log.md            # 回滚日志
│   │   └── decisions_log.md           # 决策日志
│   │
│   └── AI-Native项目估算模型.md       # 原始参考文档
│   └── AI-Native流程改造落地计划.md   # 本文档
│
├── promptx/                           # 角色包
│   ├── roles/                         # 角色定义
│   │   ├── L0_producer.yaml
│   │   ├── L1_design_director.yaml
│   │   ├── L1_tech_director.yaml
│   │   ├── L1_art_director.yaml
│   │   ├── L1_qa_director.yaml
│   │   ├── L1_pmo.yaml
│   │   ├── L2_systems_lead.yaml
│   │   ├── L2_narrative_lead.yaml
│   │   ├── L2_writing_lead.yaml
│   │   ├── L2_event_lead.yaml
│   │   ├── L2_ui_lead.yaml
│   │   ├── L2_client_lead.yaml
│   │   ├── L2_tools_lead.yaml
│   │   ├── L2_qa_lead.yaml
│   │   ├── L3_writer.yaml
│   │   ├── L3_scripter.yaml
│   │   ├── L3_ui_engineer.yaml
│   │   ├── L3_gameplay_engineer.yaml
│   │   ├── L3_tools_engineer.yaml
│   │   └── L3_tester.yaml
│   │
│   └── skills/                        # 技能定义
│       ├── read_taskpack.yaml
│       ├── produce_receipt.yaml
│       └── enforce_guardrails.yaml
│
├── .github/                           # GitHub模板
│   ├── ISSUE_TEMPLATE/
│   │   ├── taskpack.yml               # 任务包模板
│   │   ├── change_request.yml         # 变更申请模板
│   │   └── bug_report.yml             # 缺陷报告模板
│   └── PULL_REQUEST_TEMPLATE.md       # PR模板
│
├── .cursor/rules/                     # MDC规则（保留并增强）
│   ├── 00-project.mdc
│   ├── 01-code-style.mdc
│   ├── ...
│   └── 09-ai-native-workflow.mdc      # 新增：AI-Native工作流规范
│
├── design/                            # 原设计文档（保留作为参考）
├── src/                               # 源代码
├── assets/                            # 资源文件
└── tests/                             # 测试文件
```

### 组织层级定义

```
┌─────────────────────────────────────────────────────────────────────┐
│  L0 制作委员会（你 + AI制作人）                                      │
│  职责：方向/决策/范围/质量门槛                                        │
│  产出：Charter / 里程碑 / 决策单                                     │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  L1 部门总监层（6人）                                                │
│  - AI制作人：里程碑/风险/决策                                         │
│  - 策划总监：Design Bible                                            │
│  - 技术总监：Tech Bible                                              │
│  - 美术总监：Art Bible                                               │
│  - QA总监：QA Bible / 门禁                                           │
│  - PMO：看板/排期/依赖                                               │
│  产出：Bible 文档 / 里程碑计划                                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  L2 组长层（8人）                                                    │
│  - 系统策划组长：System Spec                                         │
│  - 叙事结构组长：Chapter Pack                                        │
│  - 文案组长：Writing Guide / Text Pack                               │
│  - 脚本/事件组长：Event Schema / Script Pack                         │
│  - UI/UX组长：UI Flow / Components Spec                              │
│  - 客户端组长：Module Task Pack                                      │
│  - 工具/管线组长：Pipeline Spec / Tool Script                        │
│  - QA组长：Checklist / Bug Flow                                      │
│  产出：Spec 文档 / Task Pack                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  L3 执行岗层（按需）                                                 │
│  - 文案执行：对白包 / 卡片文本                                        │
│  - 脚本执行：事件脚本 JSON/YAML                                       │
│  - UI程序执行：UI模块 PR                                             │
│  - 玩法程序执行：系统模块 PR                                          │
│  - 工具执行：校验器 / 导入器脚本                                      │
│  - 测试执行：缺陷单 / 测试报告                                        │
│  产出：PR / 资源包 / 缺陷单                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📅 分阶段落地计划

### Phase 0: 准备阶段（Day 1）

**目标**：创建基础目录结构，建立工作基础

#### 任务清单

| ID | 任务 | 产出物 | 验收标准 | 预估 |
|----|------|--------|----------|------|
| P0-01 | 创建 docs 新目录结构 | 目录框架 | 所有目录存在且结构正确 | 10min |
| P0-02 | 创建 promptx 目录结构 | 目录框架 | 所有目录存在且结构正确 | 5min |
| P0-03 | 创建 .github 模板目录 | 目录框架 | 所有目录存在且结构正确 | 5min |
| P0-04 | 创建 _template.md | 任务包模板 | 模板完整可用 | 15min |

#### 验收清单
- [x] `docs/00_charter/` 目录存在 ✅
- [x] `docs/01_bibles/` 目录存在 ✅
- [x] `docs/02_specs/systems/` 目录存在 ✅
- [x] `docs/02_specs/ui/` 目录存在 ✅
- [x] `docs/02_specs/pipelines/` 目录存在 ✅
- [x] `docs/03_taskpacks/` 目录存在 ✅
- [x] `docs/04_acceptance/qa_checklists/` 目录存在 ✅
- [x] `docs/05_logs/` 目录存在 ✅
- [x] `promptx/roles/` 目录存在 ✅
- [x] `promptx/skills/` 目录存在 ✅
- [x] `.github/ISSUE_TEMPLATE/` 目录存在 ✅
- [x] 任务包模板文件存在 ✅

> **Phase 0 完成时间**: 2025-12-29

---

### Phase 1: 宪法层建设（Day 2-3）

**目标**：建立项目宪法，冻结核心目标和边界

#### 1.1 project_charter.md

**输入源**：
- `README.md`
- `design/00-overview/游戏设计文档GDD_v1.md`
- `design/00-overview/立项书_商业分析_v1.md`

**产出内容**：
```markdown
# Project Charter
## 1. 项目目标（MVP）
## 2. 项目范围（In-Scope / Out-of-Scope）
## 3. 质量门槛
## 4. 禁区（Forbidden）
## 5. 里程碑定义
## 6. 风险边界
```

**验收标准**：
- [x] 目标可量化验证 ✅
- [x] 范围边界明确 ✅
- [x] 禁区列表完整 ✅
- [x] 里程碑可测量 ✅

#### 1.2 change_control.md

**产出内容**：
```markdown
# 变更控制流程
## 1. 变更分类（范围/技术/资源）
## 2. 申请流程
## 3. 审批权限
## 4. 回滚策略
```

**验收标准**：
- [x] 流程步骤清晰 ✅
- [x] 审批层级明确 ✅
- [x] 回滚条件定义 ✅

#### 任务清单

| ID | 任务 | 产出物 | 验收标准 | 预估 | 状态 |
|----|------|--------|----------|------|------|
| P1-01 | 编写 project_charter.md | 宪法文档 | 通过验收清单 | 2h | ✅ |
| P1-02 | 编写 change_control.md | 变更流程 | 通过验收清单 | 1h | ✅ |

> **Phase 1 完成时间**: 2025-12-29

---

### Phase 2: 总纲层建设（Day 4-7）

**目标**：整合现有设计文档为 Bible 体系

#### 2.1 design_bible.md

**输入源**：
- `design/01-narrative/世界观完整版 v3.md`
- `design/01-narrative/角色人生线档案 v2.md`
- `design/01-narrative/伏笔索引 v2.md`
- `design/02-system/核心玩法系统设计_v1.md`
- `design/02-system/关卡设计规范_v1.md`

**产出结构**：
```markdown
# Design Bible v1.0
## 1. 体验目标
## 2. 世界观摘要（≤2页）
## 3. 核心角色（8个，每个≤30行）
## 4. 系统清单（表格）
   - 系统名 | 职责 | 输入 | 输出 | AI可改域
## 5. 章节结构（表格）
   - 章节 | Zone数 | 核心事件 | 解锁条件
## 6. 禁区声明
```

**验收标准**：
- [x] 总页数 ≤15页 ✅
- [x] 每个系统描述 ≤30行 ✅
- [x] 系统清单表格化 ✅
- [x] 可被 L2 拆解为 Spec ✅

#### 2.2 tech_bible.md

**输入源**：
- `design/05-tech/技术设计文档TDD_v1.md`
- `design/05-tech/program-design/*.md`
- `.cursor/rules/01-code-style.mdc`
- `.cursor/rules/02-phaser.mdc`

**产出结构**：
```markdown
# Tech Bible v1.0
## 1. 技术栈
## 2. 架构分层图
## 3. 模块清单（表格）
   - 模块 | 职责 | 接口 | 依赖 | 状态
## 4. 数据格式规范
   - 事件脚本 Schema
   - 对白数据 Schema
   - 存档格式
## 5. 编码规范摘要
## 6. 质量门禁
   - CI检查项
   - PR合并条件
```

**验收标准**：
- [x] 模块数量 ≤12 ✅
- [x] 每个模块有明确接口 ✅
- [x] Schema 可校验 ✅
- [x] 门禁可自动化 ✅

#### 2.3 art_bible.md

**输入源**：
- `design/03-art/美术风格指南_v1.md`
- `design/03-art/UI_UX设计规范_v1.md`
- `design/03-art/角色设计文档_v1.md`
- `design/04-audio/音频设计文档_v1.md`
- `.cursor/rules/05-assets.mdc`
- `.cursor/rules/06-ai-art-generation.mdc`

**产出结构**：
```markdown
# Art Bible v1.0
## 1. 视觉风格定义
## 2. 资产分类树
   - 角色 / 场景 / UI / 特效 / 音频
## 3. 输出规格（表格）
   - 类型 | 尺寸 | 格式 | 命名规则 | 锚点
## 4. 生成规范
   - AI生图约束
   - 风格一致性检查点
## 5. 音频规范
   - BGM / SFX / 环境音
```

**验收标准**：
- [x] 命名规则可脚本校验 ✅
- [x] 尺寸规格表格化 ✅
- [x] 生成约束明确 ✅

#### 2.4 qa_bible.md

**输入源**：
- `design/05-tech/测试计划_v1.md`
- `.cursor/rules/04-testing.mdc`
- `.cursor/rules/07-auto-testing.mdc`

**产出结构**：
```markdown
# QA Bible v1.0
## 1. 测试策略
## 2. 用例分层
   - 冒烟 / 功能 / 回归 / 性能
## 3. 缺陷分级
   - Blocker / Critical / Major / Minor
## 4. 验收门禁
   - 构建验收
   - 里程碑验收
## 5. 自动化策略
   - __DEBUG__ API 使用
   - E2E 测试框架
```

**验收标准**：
- [x] 缺陷分级明确 ✅
- [x] 门禁可执行 ✅
- [x] 自动化可落地 ✅

#### 2.5 production_plan.md

**输入源**：
- `docs/落地计划书_v1.md`
- 本文档

**产出结构**：
```markdown
# Production Plan v1.0
## 1. 里程碑定义
   - M1: 基础可运行
   - M2: 叙事系统可用
   - M3: 核心玩法闭环
   - M4: 全流程可玩
   - M5: 内测就绪
## 2. 当前进度
## 3. 依赖关系图
## 4. 风险台账
```

**验收标准**：
- [x] 里程碑可测量 ✅
- [x] 进度可追踪 ✅
- [x] 风险有应对 ✅

#### 任务清单

| ID | 任务 | 产出物 | 验收标准 | 预估 | 状态 |
|----|------|--------|----------|------|------|
| P2-01 | 整合 design_bible.md | 策划总纲 | 通过验收清单 | 4h | ✅ |
| P2-02 | 整合 tech_bible.md | 技术总纲 | 通过验收清单 | 3h | ✅ |
| P2-03 | 整合 art_bible.md | 美术总纲 | 通过验收清单 | 3h | ✅ |
| P2-04 | 编写 qa_bible.md | QA总纲 | 通过验收清单 | 2h | ✅ |
| P2-05 | 更新 production_plan.md | 生产计划 | 通过验收清单 | 2h | ✅ |

> **Phase 2 完成时间**: 2025-12-29

---

### Phase 3: 规格层建设（Day 8-10）

**目标**：建立 L2 层 Spec 规格体系

#### 3.1 系统规格

| 文件 | 输入源 | 验收标准 |
|------|--------|----------|
| `narrative_system_spec.md` | design_bible + tech_bible | 状态≤6，可测试 |
| `event_system_spec.md` | tech_bible + 现有实现 | Schema明确 |
| `choice_system_spec.md` | design_bible | 选项≤3 |
| `ui_system_spec.md` | design_bible + art_bible | 状态≤6 |
| `save_system_spec.md` | tech_bible + 现有实现 | 格式冻结 |

#### 3.2 UI规格

| 文件 | 输入源 | 验收标准 |
|------|--------|----------|
| `ui_flow_spec.md` | design_bible + art_bible | 流程图清晰 |
| `ui_components_spec.md` | art_bible + 现有实现 | 组件≤3变体 |

#### 3.3 管线规格

| 文件 | 输入源 | 验收标准 |
|------|--------|----------|
| `content_pipeline_spec.md` | tech_bible | 校验规则明确 |
| `asset_pipeline_spec.md` | art_bible | 入库流程明确 |

#### 任务清单

| ID | 任务 | 产出物 | 验收标准 | 预估 | 状态 |
|----|------|--------|----------|------|------|
| P3-01 | 编写 narrative_system_spec.md | 叙事规格 | ≤120行，状态≤6 | 2h | ✅ |
| P3-02 | 编写 event_system_spec.md | 事件规格 | Schema明确 | 2h | ✅ |
| P3-03 | 编写 choice_system_spec.md | 选择规格 | 选项≤3 | 1h | ✅ |
| P3-04 | 编写 ui_system_spec.md | UI系统规格 | 状态≤6 | 2h | ✅ |
| P3-05 | 编写 save_system_spec.md | 存档规格 | 格式冻结 | 1h | ✅ |
| P3-06 | 编写 ui_flow_spec.md | UI流程规格 | 流程图清晰 | 2h | ✅ |
| P3-07 | 编写 ui_components_spec.md | 组件规格 | 变体≤3 | 2h | ✅ |
| P3-08 | 编写 content_pipeline_spec.md | 内容管线 | 校验明确 | 1h | ✅ |
| P3-09 | 编写 asset_pipeline_spec.md | 资产管线 | 流程明确 | 1h | ✅ |

> **Phase 3 完成时间**: 2025-12-29

---

### Phase 4: 角色包建设（Day 11-13）

**目标**：创建 PromptX 角色包体系

#### 4.1 角色包模板

```yaml
# 角色包标准结构
id: L{N}_{ROLE_NAME}
name: "角色名称"
level: "L0/L1/L2/L3"
purpose: "一句话职责描述"

authority:
  can_read:
    - "允许读取的路径"
  can_write:
    - "允许写入的路径"
  forbidden_write:
    - "禁止写入的路径"

scope_guardrails:
  forbid_new_systems: true/false
  forbid_schema_changes_without_CR: true/false
  forbid_cross_module_refactor: true/false

stable_granularity_limits:
  # 根据角色定义具体限制
  
inputs_required:
  - "必需输入"

outputs_required:
  format: |
    【完成内容】
    - ...
    【输出文件】
    - ...
    【输入映射】
    - ...
    【自检】
    - [ ] ...
    【风险与未完成】
    - ...

rollback_triggers:
  - "回滚条件1"
  - "回滚条件2"
```

#### 4.2 角色包清单

**L0 层（1个）**
| 角色 | 文件 | 职责 |
|------|------|------|
| AI制作人 | `L0_producer.yaml` | 里程碑/决策/风险 |

**L1 层（5个）**
| 角色 | 文件 | 职责 |
|------|------|------|
| 策划总监 | `L1_design_director.yaml` | Design Bible |
| 技术总监 | `L1_tech_director.yaml` | Tech Bible |
| 美术总监 | `L1_art_director.yaml` | Art Bible |
| QA总监 | `L1_qa_director.yaml` | QA Bible |
| PMO | `L1_pmo.yaml` | 看板/排期 |

**L2 层（8个）**
| 角色 | 文件 | 职责 |
|------|------|------|
| 系统策划组长 | `L2_systems_lead.yaml` | System Spec |
| 叙事组长 | `L2_narrative_lead.yaml` | Chapter Pack |
| 文案组长 | `L2_writing_lead.yaml` | Writing Guide |
| 脚本组长 | `L2_event_lead.yaml` | Event Schema |
| UI组长 | `L2_ui_lead.yaml` | UI Spec |
| 客户端组长 | `L2_client_lead.yaml` | Module Task |
| 工具组长 | `L2_tools_lead.yaml` | Pipeline Spec |
| QA组长 | `L2_qa_lead.yaml` | Checklist |

**L3 层（5个）**
| 角色 | 文件 | 职责 |
|------|------|------|
| 文案执行 | `L3_writer.yaml` | 对白包 |
| 脚本执行 | `L3_scripter.yaml` | 事件脚本 |
| UI程序执行 | `L3_ui_engineer.yaml` | UI模块PR |
| 玩法程序执行 | `L3_gameplay_engineer.yaml` | 系统模块PR |
| 测试执行 | `L3_tester.yaml` | 缺陷单 |

#### 任务清单

| ID | 任务 | 产出物 | 验收标准 | 预估 | 状态 |
|----|------|--------|----------|------|------|
| P4-01 | 编写 L0_producer.yaml | 角色包 | 字段完整 | 30min | ✅ |
| P4-02 | 编写 L1层角色包（5个） | 角色包 | 字段完整 | 2h | ✅ |
| P4-03 | 编写 L2层角色包（8个） | 角色包 | 字段完整 | 3h | ✅ |
| P4-04 | 编写 L3层角色包（5个） | 角色包 | 字段完整 | 2h | ✅ |
| P4-05 | 编写技能包（3个） | 技能包 | 字段完整 | 1h | ✅ |

> **Phase 4 完成时间**: 2025-12-29
> **已完成技能包**: code_review, asset_review, test_planning
> **已完成角色包**: L0_producer, L1_design_director, L1_tech_director, L1_art_director, L1_qa_director, L1_pmo, L2_systems_lead, L2_narrative_lead, L2_writing_lead, L2_event_lead, L2_ui_lead, L2_tools_lead, L2_client_lead, L2_qa_lead, L3_writer, L3_scripter, L3_ui_engineer, L3_gameplay_engineer, L3_tester, L3_engineer

---

### Phase 5: 模板与工作流（Day 14-15）

**目标**：创建 GitHub 模板和 MDC 规则

#### 5.1 Issue 模板

**taskpack.yml**
```yaml
name: Task Pack
description: 派单包任务
title: "[T-XXXX] <描述>"
labels: ["taskpack", "ready"]
body:
  - type: input
    id: task_id
    attributes:
      label: Task ID
      placeholder: "T-0001"
    validations:
      required: true
  - type: dropdown
    id: level
    attributes:
      label: Level
      options: ["L1", "L2", "L3"]
    validations:
      required: true
  - type: input
    id: taskpack_path
    attributes:
      label: Task Pack 路径
      placeholder: "/docs/03_taskpacks/T-0001_taskpack.md"
    validations:
      required: true
  - type: input
    id: owner
    attributes:
      label: Owner（上游负责人）
    validations:
      required: true
  - type: input
    id: reviewer
    attributes:
      label: Reviewer（验收人）
    validations:
      required: true
  - type: input
    id: budget
    attributes:
      label: 对话预算
      placeholder: "1~2 / 3~7"
    validations:
      required: true
  - type: textarea
    id: notes
    attributes:
      label: 备注
```

**change_request.yml**
```yaml
name: Change Request
description: 变更申请
title: "[CR] <变更标题>"
labels: ["change-request", "needs-approval"]
body:
  - type: textarea
    id: background
    attributes:
      label: 背景
    validations:
      required: true
  - type: textarea
    id: change
    attributes:
      label: 变更内容
    validations:
      required: true
  - type: textarea
    id: impact
    attributes:
      label: 影响范围
    validations:
      required: true
  - type: dropdown
    id: risk
    attributes:
      label: 风险等级
      options: ["Low", "Medium", "High"]
    validations:
      required: true
```

**bug_report.yml**
```yaml
name: Bug Report
description: 缺陷报告
title: "[BUG] <描述>"
labels: ["bug", "triage"]
body:
  - type: textarea
    id: repro
    attributes:
      label: 复现步骤（≤6步）
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: 期望结果
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: 实际结果
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: 日志/截图
  - type: input
    id: env
    attributes:
      label: 环境信息
    validations:
      required: true
```

#### 5.2 PR 模板

```markdown
## 对应任务
- Task Pack: /docs/03_taskpacks/T-____.md
- Issue: #

## 完成内容
- [ ] ...

## 输出文件/模块
- ...

## 输入映射（Spec/Task Pack -> 输出）
- ...

## 自检
- [ ] 通过校验脚本（如有）
- [ ] 未修改冻结目录
- [ ] PR 粒度符合（≤400行净新增，≤6文件）
- [ ] 单模块改动

## 风险与未完成
- ...
```

#### 5.3 MDC 规则

**09-ai-native-workflow.mdc**
```markdown
---
description: AI-Native 工作流规范
globs: ["**/*"]
alwaysApply: true
---

# AI-Native 工作流规范

## 组织层级
- L0: 制作委员会（方向/决策）
- L1: 部门总监（Bible产出）
- L2: 组长层（Spec/TaskPack）
- L3: 执行岗（PR/资源包交付）

## 工件分层
- 宪法层: docs/00_charter（冻结）
- 总纲层: docs/01_bibles（L1产出）
- 规格层: docs/02_specs（L2产出）
- 派单层: docs/03_taskpacks（任务包）
- 验收层: docs/04_acceptance（QA）
- 审计层: docs/05_logs（日志）

## 执行规则
1. 执行前明确当前角色层级
2. 只读 Task Pack 中的 Allowed Inputs
3. 只写 Deliverables 指定路径
4. 禁止修改冻结目录（00_charter, 01_bibles）
5. 超过粒度上限必须拆分

## 粒度上限
- PR: ≤400行净新增，≤6文件
- 事件脚本: ≤120行，单任务3-8个事件
- 对白包: 单场景≤12轮，单句≤60字
- UI: 单界面≤6状态，单组件≤3变体
- Spec: ≤120行

## 交付格式（强制）
【完成内容】
- ...
【输出文件】
- ...
【输入映射】
- ...
【自检】
- [ ] ...
【风险与未完成】
- ...

## 回滚触发
- 修改冻结目录
- 引入新系统/Schema（未经CR）
- 超过粒度上限
- 输出未落指定路径
```

#### 任务清单

| ID | 任务 | 产出物 | 验收标准 | 预估 | 状态 |
|----|------|--------|----------|------|------|
| P5-01 | 创建 taskpack.yml | Issue模板 | 字段完整 | 30min | ✅ |
| P5-02 | 创建 change_request.yml | Issue模板 | 字段完整 | 30min | ✅ |
| P5-03 | 创建 bug_report.yml | Issue模板 | 字段完整 | 30min | ✅ |
| P5-04 | 创建 PULL_REQUEST_TEMPLATE.md | PR模板 | 字段完整 | 30min | ✅ |
| P5-05 | 创建 09-ai-native-workflow.mdc | MDC规则 | 规则完整 | 1h | ✅ |

> **Phase 5 完成时间**: 2025-12-29

---

### Phase 6: 验收体系（Day 16-17）

**目标**：建立 QA 验收清单体系

#### 6.1 构建验收

```markdown
# Build Acceptance Checklist

## 构建门禁
- [ ] TypeScript 编译通过
- [ ] ESLint 检查通过
- [ ] 单元测试通过
- [ ] Schema 校验通过
- [ ] 资源命名校验通过

## 运行门禁
- [ ] 游戏可启动
- [ ] 菜单可进入
- [ ] 对话可触发
- [ ] 存档可读写
```

#### 6.2 冒烟清单

```markdown
# Smoke Test Checklist

## 核心路径（≤30条）
- [ ] 游戏启动到主菜单
- [ ] 新游戏进入序章
- [ ] 对话系统正常
- [ ] 选择分支可触发
- [ ] 卡片收集正常
- [ ] 存档/读档正常
- [ ] 能力系统可用
- [ ] Zone切换正常
- [ ] 音频播放正常
- [ ] UI交互响应
```

#### 任务清单

| ID | 任务 | 产出物 | 验收标准 | 预估 | 状态 |
|----|------|--------|----------|------|------|
| P6-01 | 编写 build_acceptance.md | 构建验收 | 门禁可执行 | 1h | ✅ |
| P6-02 | 编写 smoke.md | 冒烟清单 | ≤30条 | 2h | ✅ |
| P6-03 | 编写 milestone_acceptance.md | 里程碑验收 | 每个里程碑明确 | 1h | ✅ |

> **Phase 6 完成时间**: 2025-12-29

---

## 📋 完整任务地图

### 汇总表

| Phase | 任务数 | 预估时间 | 状态 |
|-------|--------|----------|------|
| Phase 0: 准备 | 4 | 0.5h | ✅ 完成 |
| Phase 1: 宪法层 | 2 | 3h | ✅ 完成 |
| Phase 2: 总纲层 | 5 | 14h | ✅ 完成 |
| Phase 3: 规格层 | 9 | 14h | ✅ 完成 |
| Phase 4: 角色包 | 5 | 8.5h | ✅ 完成 |
| Phase 5: 模板 | 5 | 3h | ✅ 完成 |
| Phase 6: 验收 | 3 | 4h | ✅ 完成 |
| **总计** | **33** | **47h** | ✅ 核心完成 |

### 依赖关系

```
Phase 0 ──┬── Phase 1 ──┬── Phase 2 ──┬── Phase 3
          │             │             │
          └── Phase 5   │             └── Phase 4
                        │
                        └── Phase 6
```

---

## 🔧 工具与规范

### 稳定粒度上限表

| 工件类型 | 上限 | 超出处理 |
|---------|------|---------|
| PR | ≤400行净新增，≤6文件 | 拆分PR |
| 事件脚本 | ≤120行 | 拆分事件 |
| 章节包 | 2-4页，事件10-25 | 拆分章节 |
| 对白包 | 单场景≤12轮，单句≤60字 | 拆分场景 |
| UI界面 | ≤6状态 | 拆分页面 |
| UI组件 | ≤3变体 | 拆分组件 |
| Spec | ≤120行 | 拆分附录 |
| 冒烟清单 | ≤30条 | 分组 |

### 文档迁移映射表

| 现有文档 | 迁移到 | 方式 |
|---------|-------|------|
| design/00-overview/*.md | docs/00_charter/ | 提取 |
| design/01-narrative/*.md | docs/01_bibles/design_bible.md | 整合 |
| design/02-system/*.md | docs/01_bibles/design_bible.md | 整合 |
| design/03-art/*.md | docs/01_bibles/art_bible.md | 整合 |
| design/04-audio/*.md | docs/01_bibles/art_bible.md | 整合 |
| design/05-tech/*.md | docs/01_bibles/tech_bible.md | 整合 |
| docs/落地计划书_v1.md | docs/01_bibles/production_plan.md | 更新 |
| .cursor/rules/04-testing.mdc | docs/01_bibles/qa_bible.md | 扩展 |

---

## ✅ 交付质量标准

### ISO 交付标准

每个阶段交付必须满足：

1. **完整性**
   - 所有必需字段填写完整
   - 所有引用路径有效
   - 无遗留 TODO/FIXME

2. **一致性**
   - 格式符合模板规范
   - 命名符合约定
   - 术语统一

3. **可验证性**
   - 每个交付物有验收清单
   - 验收条件可客观判断
   - 通过/失败标准明确

4. **可追溯性**
   - 输入来源明确
   - 输出位置明确
   - 变更历史可查

### 验收流程

```
1. 自检（执行者）
   ├── 对照验收清单逐项检查
   ├── 填写交付回执
   └── 标记风险与未完成

2. Review（验收人）
   ├── 核对验收清单
   ├── 检查输出文件
   └── 判定：PASS / MINOR / MAJOR / ROLLBACK

3. 记录（PMO）
   ├── 更新任务日志
   ├── 更新进度看板
   └── 记录回滚（如有）
```

---

## 📝 执行说明

### 启动顺序

1. **立即执行 Phase 0**：创建目录结构
2. **然后执行 Phase 1**：建立宪法层
3. **并行执行 Phase 2 + Phase 5**：总纲层 + 模板
4. **然后执行 Phase 3**：规格层
5. **并行执行 Phase 4 + Phase 6**：角色包 + 验收

### 回滚策略

- **文档类**：Git revert 到上一版本
- **结构类**：删除新建目录/文件
- **规则类**：恢复原 MDC 文件

### 迭代节奏

- 每个 Phase 完成后进行验收
- 验收通过后进入下一 Phase
- 发现问题立即记录到 rollback_log.md
- 每周更新 production_plan.md

---

*文档版本: v1.0*  
*创建日期: 2025-12-29*  
*维护者: AI Assistant*

