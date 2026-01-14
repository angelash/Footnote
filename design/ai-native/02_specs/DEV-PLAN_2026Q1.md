# DEV 计划：2026Q1（4~6 周）里程碑与验收标准

> **输入依据**：
> - `design/ai-native/01_bibles/tech_bible.md`
> - `design/ai-native/01_bibles/qa_bible.md`
> - `design/ai-native/01_bibles/production_plan.md`
> - `design/ai-native/04_acceptance/PROJECT-QUALITY-REVIEW_2026-01-03.md`
> - `game/package.json`、`game/src/`、`game/tests/`
>
> **目标**：把"当前可运行"推进到"可验收、可规模化迭代"的工程状态，并对齐 Production Plan 的 M1→M3 路线。
>
> **验收证据产出位置**：
> - 里程碑质量报告：`design/ai-native/04_acceptance/M{N}_QUALITY_REPORT.md`
> - 门禁运行日志：`workflows/project/logs/automation_runs/`

---

## 0. Q1 目标（结果导向）

### 0.1 Q1 P0 目标（必须达成）
- **M1（基础可运行）可审计通过**：Typecheck/Lint/Unit/Coverage/E2E 冒烟门禁全部可跑且有稳定结果
- **数据/资源门禁可执行**：补齐 `validate:data` 与 `validate:assets`（与 Tech Bible 对齐）
- **继续游戏/存档体验可用**：读档后能进入正确 Zone（不回到硬编码默认）

### 0.2 Q1 P1 目标（尽量达成）
- **核心玩法闭环前置（M3 准备）**：`hasCard` 条件生效、时间干预回溯至少能"选择节点→回溯→污染落盘"
- **测试金字塔推进**：E2E 覆盖关键路径（序章→进入游戏→一次交互→存档→读档）
- **质量债收敛**：显著降低 lint warnings、减少 `any`、统一 UI 常量使用

---

## 1. 当前基线（可复现的门禁运行记录）

### 1.1 基线采集环境
- **采集时间**：2026-01-14
- **环境**：WSL2 Ubuntu 22.04, Node 20 LTS
- **工作目录**：`/mnt/f/workspace/github/Footnote/game`

### 1.2 门禁运行结果

| 门禁命令 | 结果 | 说明 |
|---------|------|------|
| `npm run typecheck` | ✅ 通过 | 0 errors |
| `npm run lint` | ⚠️ 通过但有警告 | 0 errors, ~150 warnings（`no-console`/`no-explicit-any`/回调缺返回类型） |
| `npm run test:coverage` | ✅ 通过 | 2 个单测文件，27 tests；覆盖率统计范围待确认 |
| `npm run test:e2e` | ❌ 阻断 | `test.info()` 误用 + reporter 目录冲突（需修复） |
| `npm run validate:data` | ❌ 缺失 | Tech Bible 要求存在，但脚本未实现 |
| `npm run validate:assets` | ❌ 缺失 | Tech Bible 要求存在，但脚本未实现 |

### 1.3 内容与数据规模（来自 `game/src/data`）
- scenes 配置：57 个 YAML
- dialogues：47 个 YAML
- cards：8 个 YAML
- foreshadows：1 个 YAML

---

## 2. 里程碑计划（6 周版本；4 周可裁剪）

> 周期定义：W1~W6。若资源不足，可只做 W1~W4，并把 W5~W6 作为可选延伸。

### W1：门禁修复周（目标：M1 可验收）

#### P0-1：修复 E2E 阻断
| 字段 | 值 |
|------|-----|
| **Owner** | L3_tester |
| **Estimate** | 1~2 人日 |
| **Dependencies** | 无 |
| **Deliverables** | `game/tests/e2e/game.spec.ts` 修复 + Playwright 配置修复 |

- 范围：`tests/e2e/game.spec.ts` 中 `test.info()` 误用；修复 Playwright reporter 输出目录冲突
- 验收：
  - [ ] `npm run test:e2e` 可启动并执行（至少 1 条用例 PASS）
  - [ ] `test-results` 与 HTML report 不互相清理/覆盖（以 Playwright 运行结果为准）

#### P0-2：补齐数据校验门禁（`validate:data`）
| 字段 | 值 |
|------|-----|
| **Owner** | L3_engineer |
| **Estimate** | 1~2 人日 |
| **Dependencies** | 无 |
| **Deliverables** | `game/scripts/validate-data.ts` + `package.json` scripts 更新 |

- **权威数据源定义**：
  - 对话：`game/src/data/dialogues/**/*.yaml`
  - 场景：`game/src/data/scenes/**/*.yaml`
  - 卡片：`game/src/data/cards/**/*.yaml`
  - 伏笔：`game/src/data/foreshadows/**/*.yaml`
- **最小校验规则**：
  - 必填字段：`id`（所有类型）、`text`（对话）、`name`（卡片）
  - ID 格式：`/^[A-Z][A-Z0-9_-]+$/`（全大写，允许下划线和连字符）
  - 引用存在性：`dialogueId`→`dialogues`、`sceneId`→`scenes`、`cardId`→`cards`
- 验收：
  - [ ] `npm run validate:data` 可运行，校验失败时返回非零退出码
  - [ ] 输出格式：`[ERROR/WARN] {file}:{line} - {message}`

#### P0-3：补齐资产校验门禁（`validate:assets`）
| 字段 | 值 |
|------|-----|
| **Owner** | L3_engineer |
| **Estimate** | 0.5~1 人日 |
| **Dependencies** | P0-2 完成后复用校验框架 |
| **Deliverables** | `game/scripts/validate-assets.ts` + `package.json` scripts 更新 |

- **权威数据源定义**：
  - 临时权威来源：`game/public/` 目录静态扫描
  - 后续收敛：待建立 `game/src/data/manifest.yaml` 作为正式资产清单
- **最小校验规则**：
  - 场景配置中引用的 `background`/`music`/`sfx` key 必须在 `public/` 或音频配置中存在
  - 允许 placeholder/白盒资产（以 `placeholder_` 或 `whitebox_` 前缀标记）
- 验收：
  - [ ] `npm run validate:assets` 可运行
  - [ ] 引用不存在的资产时输出警告（暂不阻断，后续根据策略升级为错误）

#### P0-4：读档继续游戏落点修复
| 字段 | 值 |
|------|-----|
| **Owner** | L3_engineer |
| **Estimate** | 0.5 人日 |
| **Dependencies** | 无 |
| **Deliverables** | `game/src/scenes/MenuScene.ts` 修改 |

- 范围：`MenuScene` 读档后从 `worldState` 取 current zone（替换硬编码 `'C0-Z1'`）
- 验收：
  - [ ] 手动创建存档后，"继续游戏"进入正确 Zone（可用 E2E/手测验证）

### W2：叙事/条件闭环周（目标：M2/M3 的关键缺口补齐一半）

#### P0-5：`hasCard` 条件接入
| 字段 | 值 |
|------|-----|
| **Owner** | L3_engineer |
| **Estimate** | 1~2 人日 |
| **Dependencies** | 无 |
| **Deliverables** | `game/src/systems/world/WorldState.ts` + 单测 |

- 方案：明确"卡片拥有状态"的权威来源为 `WorldState.inventory.cards[]`
- 验收：
  - [ ] `WorldState.checkCondition({ hasCard })` 在单测中可覆盖 true/false 两支
  - [ ] 至少 1 条剧情分支（基于 YAML 条件）可被验证触发/不触发

#### P0-6：覆盖率统计范围修正
| 字段 | 值 |
|------|-----|
| **Owner** | L3_tester |
| **Estimate** | 0.5~1 人日 |
| **Dependencies** | 无 |
| **Deliverables** | `game/vitest.config.ts` 修改 + 新增单测文件 |

- 目标：覆盖率报告不只出现单文件；至少覆盖 `systems/world` + `systems/save` + `systems/narrative` 的核心逻辑
- 验收：
  - [ ] `npm run test:coverage` 输出包含多文件覆盖明细
  - [ ] 覆盖率门禁阈值：核心系统（`src/systems/**`）lines ≥60%，branches ≥40%

### W3：时间干预最小闭环（目标：M3 核心玩法闭环最小可用）

#### P0-7：时间回溯最小实现
| 字段 | 值 |
|------|-----|
| **Owner** | L3_engineer |
| **Estimate** | 2~3 人日 |
| **Dependencies** | P0-5 完成 |
| **Deliverables** | `game/src/systems/ability/AbilitySystem.ts` 修改 + 单测 |

- **最小闭环定义**：能列出"可回溯节点"→选择节点→执行回溯→产生污染并写入世界状态→触发必要 UI/事件反馈
- **时间干预规则契约**（最小定义）：

| 字段 | 类型 | 说明 |
|------|------|------|
| `pollution` | `number` | 污染累计值，每次回溯 +1~3（取决于回溯跨度） |
| `rewindTargets` | `string[]` | 可回溯节点 ID 列表，来源于 `worldState.checkpoints[]` |
| `W` | `number` | 世界可读性，初始值 100，每次回溯：`W = W - pollution_delta * 2` |
| `P` | `number` | 观察者压力，每次回溯：`P = P + 1` |

- **示例场景**：

| 初始状态 | 回溯操作 | 最终状态 |
|----------|----------|----------|
| W=100, P=0, pollution=0 | 回溯 1 个节点（delta=1） | W=98, P=1, pollution=1 |
| W=98, P=1, pollution=1 | 回溯 3 个节点（delta=3） | W=92, P=2, pollution=4 |

- 验收：
  - [ ] 单测：回溯触发后污染数量变化、W/P 值变化符合规则
  - [ ] E2E（可用 `__DEBUG__` 或测试 hook）：能触发一次时间干预并观察到预期状态变化

### W4：关键路径 E2E + 存档健壮性（目标：可回归、可发布的基础）

#### P0-8：E2E 冒烟清单落地（≤10 条）
| 字段 | 值 |
|------|-----|
| **Owner** | L3_tester |
| **Estimate** | 2~3 人日 |
| **Dependencies** | P0-1、P0-4 完成 |
| **Deliverables** | `game/tests/e2e/*.spec.ts` 更新 |

- 建议覆盖：启动→菜单→新游戏→进入一个 Zone→一次交互→获得卡片/对话推进→保存→退出→读档进入正确 Zone
- 验收：
  - [ ] `npm run test:e2e` 在本地稳定通过（至少连续 3 次不 flaky）

#### P0-9：存档版本/兼容性护栏
| 字段 | 值 |
|------|-----|
| **Owner** | L3_engineer |
| **Estimate** | 0.5~1 人日 |
| **Dependencies** | 无 |
| **Deliverables** | `game/src/systems/save/SaveManager.ts` 修改 + 迁移测试 |

- 验收：
  - [ ] 存档结构版本字段存在并可迁移（如已存在则补迁移测试）
  - [ ] 读写失败有可观测提示且不破坏已有存档

### W5~W6（可选）：质量债与体验收敛

#### P1-1：lint warnings 收敛
- 验收：warnings 从 ~150 降至可控阈值
  - W5 目标：≤80
  - W6 目标：≤30
- 制定剩余项的"债务清单"并记录于 `design/ai-native/04_acceptance/LINT_DEBT.md`

#### P1-2：UI 常量一致性治理
- 目标：消灭关键界面中的硬编码字号/间距（对齐 `game/src/config/ui.config.ts`）
- 验收：抽查 `MenuScene/GameScene/AbilitySystem` 等关键 UI 文件，不再出现硬编码 `fontSize: 'xxpx'`（或只允许极少数例外并写明原因）

#### P1-3：依赖安全治理
- 验收：`npm audit` moderate 漏洞下降；若需要升级依赖，走 CR/风险评估并做回归

---

## 3. P0 / P1 任务清单汇总

### P0（必须做）
| ID | 任务 | Owner | Estimate | Week |
|----|------|-------|----------|------|
| P0-1 | E2E 阻断修复 | L3_tester | 1~2d | W1 |
| P0-2 | 补齐 `validate:data` | L3_engineer | 1~2d | W1 |
| P0-3 | 补齐 `validate:assets` | L3_engineer | 0.5~1d | W1 |
| P0-4 | 读档继续游戏落点 | L3_engineer | 0.5d | W1 |
| P0-5 | hasCard 条件接入 | L3_engineer | 1~2d | W2 |
| P0-6 | 覆盖率统计范围修正 | L3_tester | 0.5~1d | W2 |
| P0-7 | 时间回溯最小闭环 | L3_engineer | 2~3d | W3 |
| P0-8 | 关键路径 E2E 冒烟 | L3_tester | 2~3d | W4 |
| P0-9 | 存档版本兼容性 | L3_engineer | 0.5~1d | W4 |

### P1（可选/按资源推进）
| ID | 任务 | Owner | Estimate | Week |
|----|------|-------|----------|------|
| P1-1 | lint warnings 收敛 | L3_engineer | 2~3d | W5~W6 |
| P1-2 | UI 常量治理 | L3_engineer | 1~2d | W5~W6 |
| P1-3 | 依赖安全治理 | L3_engineer | 1d | W5~W6 |

---

## 4. 验收标准（按里程碑）

### M1（基础可运行）验收（Q1 W1~W2 必达）

| 门禁 | 阈值 | 统计口径 |
|------|------|----------|
| `npm run typecheck` | 0 errors | 全量 `src/**/*.ts` |
| `npm run lint` | 0 errors, ≤150 warnings | 全量 `src/**/*.ts` |
| `npm run test:coverage` | tests 100% pass | - |
| `npm run test:coverage` | lines ≥60% | 仅 `src/systems/**` |
| `npm run test:coverage` | branches ≥40% | 仅 `src/systems/**` |
| `npm run test:e2e` | ≥1 条冒烟 PASS | - |
| `npm run validate:data` | 0 errors | `src/data/**/*.yaml` |
| `npm run validate:assets` | 0 blocking errors | `src/data/**/*.yaml` 引用 |
| 继续游戏/读档 | 进入正确 Zone | 手测/E2E 验证 |

**验收产出物**：
- `design/ai-native/04_acceptance/M1_QUALITY_REPORT.md`
- `workflows/project/logs/automation_runs/RUN-{timestamp}/`（门禁日志）

### M2/M3（叙事可用 / 玩法闭环）验收（Q1 W3~W4 尽量达成）

| 项目 | 验收条件 |
|------|----------|
| `hasCard` 条件 | 单测覆盖 + 至少 1 条剧情用例验证 |
| 时间干预回溯 | 可触发，污染/计数器后果可观测且有单测 |
| 关键路径 E2E | 启动→进入→交互→存档→读档 稳定通过 |

**验收产出物**：
- `design/ai-native/04_acceptance/M3_QUALITY_REPORT.md`
- E2E 测试报告截图/日志

---

## 5. 需要 L0/L1 参与的决策点

### 决策 1：E2E 交互策略
| 选项 | 说明 | 默认 |
|------|------|------|
| A | 继续采用 Canvas 坐标点击（维护成本高、易 flaky） | - |
| B | 强化 `__DEBUG__` / test hooks，使 E2E 通过状态驱动验证 | ✅ 默认 |

**时间盒**：W1 结束前决策，否则采用默认选项 B

### 决策 2：lint warnings 门禁策略
| 选项 | 说明 | 默认 |
|------|------|------|
| A | 保持 warnings 不阻断，但设上限（W1≤150, W4≤80, W6≤30）并逐周下降 | ✅ 默认 |
| B | 逐步把部分 warnings 升级为 error（更严格） | - |

**时间盒**：W2 结束前决策

### 决策 3：数据校验严格程度
| 选项 | 说明 | 默认 |
|------|------|------|
| A | 最小校验（必填/ID格式/引用存在性） | ✅ 默认 |
| B | 全字段 Schema 约束 | - |

**时间盒**：W1 结束前确认，后续迭代逐步加严

---

## 6. 风险与对策（Q1）

| 风险 | 触发信号 | 对策 |
|------|----------|------|
| E2E 持续 flaky | 同一套件重复跑不稳定 | 优先转向 `__DEBUG__` 状态驱动；减少坐标点击依赖 |
| 数据错误运行时才暴露 | 章节/Zone 进入时报错 | 先做最小 `validate:data`（ID/引用/必填），再逐步加严 |
| 质量债滚雪球 | lint warnings 长期不降 | 建立"warnings 上限"与每周收敛目标；把高频问题模板化修复 |
| 依赖安全升级打断节奏 | audit 漏洞增多/CI 阻断 | 预留治理窗口（W5~W6），并走 CR 做风险评估与回归 |

---

*文档版本: v2.0*
*更新日期: 2026-01-14*
*变更记录: 统一路径引用、合并重复段落、补齐可判定阈值与派单要素、新增时间干预规则契约*
