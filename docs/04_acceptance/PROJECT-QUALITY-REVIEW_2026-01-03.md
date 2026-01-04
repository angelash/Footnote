# 项目质检报告：完成度与质量评估（2026-01-03）

> Task Pack: `T-REVIEW-20260103_project_quality`  
> 角色：L3_engineer（按任务包要求输出可审计证据）  
> **证据来源约束**：本报告仅基于 Allowed Inputs 中允许读取的文件内容与本次门禁命令输出；未读取 `assets/` 等非允许目录，涉及资产的结论会显式标注“证据受限”。  

---

## 1. 执行范围与输入证据

### 1.1 允许输入（本次实际使用）
- `package.json`
- `src/`
- `tests/`
- `docs/01_bibles/tech_bible.md`
- `docs/01_bibles/qa_bible.md`
- `docs/01_bibles/production_plan.md`
- `docs/02_specs/pipelines/n8n_cursor_cli_pipeline_spec.md`

### 1.2 关键事实（可审计）
- **可用门禁脚本（来自 `package.json` scripts）**
  - `npm run typecheck`（`tsc -p tsconfig.build.json`）
  - `npm run lint`（`eslint src --ext .ts,.tsx`）
  - `npm run test:coverage`（`vitest run --coverage`）
  - `npm run test:e2e`（`playwright test`）
- **Tech Bible 宣称但当前仓库脚本缺失的门禁项**
  - `npm run validate:data`
  - `npm run validate:assets`
  - 结论：**“Schema/资源门禁”目前不可执行**（见 3.2 与 4.2）。

---

## 2. 当前实现完成度评估（按系统 / 数据 / 测试 / 资产）

> 注：完成度判定以“代码与数据是否存在 + 是否有可运行门禁与测试覆盖 + 是否存在明确 TODO/缺口”为准，不做无证据推断。

### 2.1 系统（Systems）完成度

#### 2.1.1 结构盘点（证据：`src/` 目录结构）
`src/systems/` 已存在并被 `GameScene` 集成的模块（非穷举）：
- **叙事**：`systems/narrative/NarrativeEngine.ts`
- **世界状态**：`systems/world/WorldState.ts`
- **存档**：`systems/save/SaveManager.ts`
- **能力**：`systems/ability/AbilitySystem.ts`
- **UI**：`systems/ui/*`（`DialogueUI`, `CardUI`, `InventoryUI`, `PauseMenu`, `ToastManager` 等）
- **场景装配**：`systems/scene/SceneAssembler.ts`
- **资源**：`systems/assets/AssetManager.ts`
- **音频**：`systems/audio/AudioManager.ts`
- **调试/性能**：`systems/debug/DebugCommands.ts`, `systems/debug/PerformanceMonitor.ts`

#### 2.1.2 明确未完成/待实现点（证据：源文件中的 TODO）
| 模块 | 证据位置 | 影响 |
|---|---|---|
| `NarrativeEngine.loadDialogue()` | `src/systems/narrative/NarrativeEngine.ts`：`// TODO: 从YAML文件加载` | 若对话未提前 register，将无法按 ID 动态加载（当前可被 DataLoader 的 register 方式规避，但属于潜在缺口）。 |
| 时间干预/回溯 | `src/systems/ability/AbilitySystem.ts`：`// TODO: 显示可回溯的时间节点列表`、`// TODO: 实际的回溯逻辑` | **核心能力之一未闭环**（与 Production Plan 的 M3/M4 目标相关）。 |
| 条件系统“持有卡片” | `src/systems/world/WorldState.ts`：`// TODO: 连接NarrativeEngine检查` | 任何依赖 `hasCard` 的条件判断可能失真（叙事分支/门槛）。 |
| 读档后进入当前 Zone | `src/scenes/MenuScene.ts`：`const currentZone = 'C0-Z1'; // TODO: 从 worldState 获取当前 zone` | **读档继续游戏可能永远回到 C0-Z1**（核心体验风险）。 |
| Zone 交互点创建 | `src/scenes/GameScene.ts`：`// TODO: 根据Zone数据创建交互点`（当前有 SceneAssembler 优先路径 + 硬编码兜底） | 若 Scene 配置缺失或交互未被 SceneAssembler 覆盖，会导致交互内容不完整。 |
| 调试命令“获得所有卡片” | `src/systems/debug/DebugCommands.ts`：`// TODO: 遍历所有卡片并获得` | 影响测试/调试效率（非运行时核心）。 |
| NG+ 伏笔收集统计 | `src/systems/game/NewGamePlus.ts`：`// TODO: 从ForeshadowManager获取实际数据` | 影响 NG+ 统计准确性。 |

**系统完成度结论**：
- **基础可运行（M1 倾向）**：启动/场景/世界状态/存档/UI 框架具备，`typecheck` 可通过。
- **核心玩法闭环（M3）**：仍存在显式未闭环点（时间回溯、hasCard 条件、读档落点），需在 Q1 前半优先修复。

### 2.2 数据（Data）完成度

#### 2.2.1 数据规模（证据：`src/data` 文件清单）
- **场景配置（YAML）**：57 个（`src/data/scenes/*.yaml`）
- **对白配置（YAML）**：47 个（`src/data/dialogues/*.yaml`，含 `ngplus_dialogues.yaml` / `rv_dialogues.yaml`）
- **卡片配置（YAML）**：8 套（`src/data/cards/*.yaml`）
- **伏笔配置（YAML）**：1 个（`src/data/foreshadows/foreshadows.yaml`）
- **音频配置（YAML）**：4 个（`src/data/audio/*.yaml`）+ TS 映射（`src/data/audioConfig.ts`）

#### 2.2.2 数据加载链路（证据：`src/data/NarrativeDataLoader.ts`）
存在 YAML 解析与结构转换逻辑（`yaml.parse` → `IDialogue/ICard/IForeshadow`），说明“数据驱动路线”已经落地一部分。

**数据完成度结论**：数据文件覆盖到章节/重返变体配置，规模与 Production Plan 的“全流程可玩”目标一致性较高；但**缺少可执行的 Schema 校验门禁**（见 4.2），数据正确性目前主要依赖运行时与少量测试兜底。

### 2.3 测试（Tests）完成度

#### 2.3.1 单元测试
（证据：`tests/unit/*` + `npm run test:coverage` 输出）
- 单测文件：2 个（`WorldState`, `GameScene`）
- 本次门禁：**27 tests 全通过**
- 覆盖率输出（istanbul）：`All files` 88.64% statements / 62.5% branches / 77.77% funcs / 92.09% lines
  - 但覆盖率报告中仅出现 `WorldState.ts`，说明当前覆盖率统计范围**很可能未覆盖大多数 src 文件**（需要后续修正 coverage include/exclude 规则）。

#### 2.3.2 E2E 测试
（证据：`tests/e2e/*` + `npm run test:e2e` 输出）
- E2E 文件：2 个（`prologue.spec.ts`, `game.spec.ts`）
- 当前状态：**E2E 门禁失败（无法运行）**
  - 失败 1：`test.info() can only be called while test is running`（`tests/e2e/game.spec.ts:342`）
  - 失败 2：`HTML reporter output folder clashes with the tests output folder`（Playwright 配置层面的冲突，未读取配置文件，仅以报错为证据）

**测试完成度结论**：单测可跑且对 `WorldState` 覆盖较深，但 E2E 当前属于阻断级；测试金字塔与 QA Bible 目标差距明显（E2E 关键路径与数据/存档/叙事分支尚未覆盖）。

### 2.4 资产（Assets）完成度（证据受限）

> 受 Task Pack Allowed Inputs 限制，本次未读取 `assets/` 与 `public/` 目录内容。仅能基于：
> - `src/data/audio/*.yaml`、`src/data/audioConfig.ts`（可审计）
> - 对话中提供的仓库结构快照（非文件读取）

结论（证据受限）：
- 音频侧：存在结构化配置与音频系统集成（可审计证据充分）。
- 图像/其他资源侧：**需补充“资源引用完整性/命名校验”的自动化门禁**（Tech Bible 也要求，但当前脚本缺失）。

---

## 3. 质量门禁状态（命令 + 结果）

### 3.1 依赖安装
命令：`npm ci`  
结果：成功（但存在 deprecated 警告与 **7 个 moderate 依赖漏洞**，建议纳入计划处理）。

### 3.2 TypeScript 编译门禁
命令：`npm run typecheck`  
结果：✅ 通过

### 3.3 ESLint 门禁
命令：`npm run lint`  
结果：⚠️ 无 error，但 **159 warnings**
- 主要类型：
  - `no-console`：大量运行期日志
  - `@typescript-eslint/no-explicit-any`：多处 `any`
  - `@typescript-eslint/explicit-function-return-type`：部分回调缺少显式返回类型（尤其在 `GameScene.ts`, `SaveManager.ts`, `CloudSaveManager.ts`）

### 3.4 单元测试 + 覆盖率门禁
命令：`npm run test:coverage`  
结果：✅ 通过  
测试：2 files / 27 tests 全通过  
覆盖率（istanbul）：88.64% statements / 62.5% branches / 77.77% funcs / 92.09% lines  
注意：覆盖率报告仅列出 `WorldState.ts`（疑似覆盖率统计范围配置问题）。

### 3.5 E2E 门禁
命令：`npm run test:e2e`  
结果：❌ 失败（阻断）
- `tests/e2e/game.spec.ts:342` 使用 `test.info()` 方式错误，导致套件无法启动
- Playwright reporter 输出目录与 test-results 目录冲突（导致 artifact 可能被清理）

---

## 4. 问题分级清单（Blocker / Critical / Major / Minor）

### 4.1 Blocker（阻断级：不修无法进入“可验收”）
1. **E2E 门禁不可运行**
   - **证据**：`npm run test:e2e` 直接失败；定位到 `tests/e2e/game.spec.ts:342`
   - **影响**：无法执行 QA Bible 要求的关键路径 E2E；里程碑验收缺少硬证据
   - **建议**：
     - 修复 `test.use({ ...test.info().project.use, hasTouch: true })` 的用法（改为项目级/describe 级静态配置；避免在 describe 顶层调用 `test.info()`）
     - 修复 reporter 输出目录冲突，确保 `test-results` 不被 HTML reporter 清理（以 Playwright 报错为准）

### 4.2 Critical（核心体验受损：24h 内应修）
1. **Tech Bible 要求的 `validate:data` / `validate:assets` 门禁缺失**
   - **证据**：`package.json` scripts 无对应命令；Tech Bible 明确列为必过门禁
   - **影响**：数据/资源错误只能在运行时暴露，稳定性与可审计性不足
2. **读档后继续游戏的 Zone 落点硬编码**
   - **证据**：`src/scenes/MenuScene.ts` 使用 `const currentZone = 'C0-Z1'`
   - **影响**：存档体验可能失效（继续游戏回到错误位置）

### 4.3 Major（重要问题：48h 内或当周应修）
1. **条件系统 hasCard 未接入**
   - **证据**：`src/systems/world/WorldState.ts` 的 `checkCondition` 对 `hasCard` 标注 TODO
   - **影响**：分支条件/门槛判断不可靠，影响叙事与奖励闭环
2. **时间干预能力未闭环**
   - **证据**：`src/systems/ability/AbilitySystem.ts` 中回溯节点列表与回溯逻辑 TODO
   - **影响**：与 Production Plan M3（核心玩法闭环）不一致
3. **Lint warnings 体量过大（159）**
   - **证据**：`npm run lint` 输出
   - **影响**：噪音掩盖真实问题；与代码规范（显式返回类型、避免 any）存在系统性偏差
4. **覆盖率统计范围可能失真**
   - **证据**：`npm run test:coverage` 报告仅列出 `WorldState.ts`
   - **影响**：覆盖率门禁无法真实反映工程风险
5. **UI 规范一致性问题（硬编码 fontSize 等）**
   - **证据**：`src/scenes/GameScene.ts` 等存在 `'14px'/'16px'` 等硬编码
   - **影响**：与项目 UI 常量化规则冲突，未来全局调整成本上升

### 4.4 Minor（小问题：可排期修）
1. **调试命令未完备**（如“获得所有卡片”待实现）
2. **NG+ 伏笔统计待接入**（影响统计准确性）
3. **依赖 deprecated / moderate vulnerabilities**
   - **证据**：`npm ci` 输出提示
   - **建议**：纳入季度治理任务，避免“被动安全升级”打断节奏

---

## 5. 修复策略（建议的“先后手”）

### 5.1 建议优先级（对齐 QA/Tech Bible 与 Production Plan）
- **P0（本周）**：修复 E2E 门禁可运行 + 建立 `validate:data`/`validate:assets` 的可执行入口
- **P0（本周）**：修复“读档继续游戏”落点（从 `worldState` 获取 current zone）
- **P1（1~2周）**：补齐 hasCard 条件、时间干预回溯闭环
- **P1（1~3周）**：降低 lint 噪音、收敛 `any`、补全回调返回类型（避免未来质量债滚雪球）
- **P1（持续）**：扩大单测覆盖到 `NarrativeEngine/SaveManager/SceneAssembler` 等核心模块；将覆盖率门禁变为“真实全局覆盖”

### 5.2 质量门禁“可验收”定义（建议）
参考 Tech Bible / QA Bible，建议在进入下一里程碑前固定为：
- [ ] `npm run typecheck` 0 errors
- [ ] `npm run lint` 0 errors（warnings 允许但必须有上限与收敛计划）
- [ ] `npm run test:coverage` 100% pass，且覆盖率统计范围覆盖核心系统（至少覆盖 `systems/*` 的关键模块）
- [ ] `npm run test:e2e` 可运行，至少 1 条冒烟用例通过（启动 → 菜单 → 进入游戏/加载存档）
- [ ] `npm run validate:data`、`npm run validate:assets` 可运行并作为门禁（与 Tech Bible 对齐）

---

## 6. 总结：当前质量门禁状态

| 维度 | 结论 |
|---|---|
| 完成度（系统/数据） | 系统框架与数据规模较完整，但存在数个“核心闭环缺口”（读档落点、hasCard、时间回溯） |
| Typecheck | ✅ 通过 |
| Lint | ⚠️ 通过但 159 warnings（质量债显著） |
| Unit / Coverage | ✅ 通过，但覆盖率统计范围疑似不足（报告仅列出 `WorldState.ts`） |
| E2E | ❌ 阻断（套件无法运行） |
| 数据/资源门禁 | ❌ Tech Bible 要求存在，但脚本缺失导致不可执行 |

# 项目质检/完成度评审 - 《备注 / Footnote》

**日期**: 2026-01-03  
**范围**: 代码实现完成度 + 质量门禁 + 风险分级 + 可交付程度评估  
**结论（TL;DR）**: **核心系统形态齐全，单元测试可跑通，但当前“构建门禁”未达标（TypeScript 编译失败、Lint 未通过、Coverage 门禁失败），不满足 M1 的“可稳定构建/可验收”定义。**

---

## 1. 审查输入与方法

### 1.1 参考输入
- **技术总纲**: `docs/01_bibles/tech_bible.md`
- **QA 总纲**: `docs/01_bibles/qa_bible.md`
- **生产计划**: `docs/01_bibles/production_plan.md`
- **工程结构**: `src/`（Scenes / Systems / Data / Tests）
- **自动化脚本**: `package.json` scripts（typecheck/lint/test/test:coverage/test:e2e）

### 1.2 本次执行的门禁命令（实际跑过）
- `npm run typecheck` → **失败（大量 TS error）**
- `npm run lint` → **失败（Prettier CRLF + 命名规范）**
- `npx vitest run` → **通过（2 files, 33 tests）**
- `npm run test:coverage` → **失败（coverage 统计为 0% 导致阈值不达标）**

---

## 2. 完成度总览（按技术总纲模块表）

> “完成度”分两层：  
> - **实现形态**（代码/模块是否存在、是否被主场景接入）  
> - **可交付质量**（是否能通过 build/typecheck/lint/coverage 等门禁）

### 2.1 结构实现（形态）
- **入口与场景**：`src/main.ts` 注册 `BootScene/PreloadScene/MenuScene/GameScene`（✅）
- **核心系统**（目录存在且在 `GameScene` 引用/初始化）：
  - **WorldState / Counters**：`src/systems/world/WorldState.ts`（✅）
  - **NarrativeEngine**：`src/systems/narrative/NarrativeEngine.ts`（✅）
  - **SaveManager（IndexedDB + 回退）**：`src/systems/save/SaveManager.ts`（✅）
  - **UI 系统**：`src/systems/ui/*`（✅）
  - **SceneAssembler（数据驱动）**：`src/systems/scene/SceneAssembler.ts`（✅）
  - **AudioManager**：`src/systems/audio/AudioManager.ts`（✅）
  - **DebugCommands**：`src/systems/debug/DebugCommands.ts`（✅）
- **数据层**：`src/data/dialogues/*.yaml`、`src/data/scenes/*.yaml`、`src/data/cards/*.yaml`（✅，数量上覆盖多章节）

### 2.2 质量门禁（可交付）

| 门禁 | 结果 | 影响 |
|---|---|---|
| **TypeScript typecheck** | ❌ | `npm run build` 也会失败（build=tsc+vite），属于 **Blocker** |
| **ESLint** | ❌ | PR/合并门禁不可用（规范一致性/风格回归风险上升） |
| **Unit tests（Vitest）** | ✅ | 基础逻辑有最小回归保护 |
| **Coverage（Vitest v8）** | ❌ | 当前输出 0%，导致阈值必失败（门禁失真） |
| **E2E（Playwright）** | 未执行 | 可用性/关键路径未被证据化 |

---

## 3. 问题清单（分级）

> 分级参考：`docs/01_bibles/qa_bible.md`（Blocker/Critical/Major/Minor）

### 3.1 Blocker（阻塞交付）

#### B-01 TypeScript 编译失败（主要集中在 Preview Scenes + 少量系统/测试类型）
- **复现**：运行 `npm run typecheck`
- **现象**：`src/scenes/preview/*` 存在大量 unused imports/vars、类型不匹配、方法不存在等错误；此外还有少量系统/测试类型错误（例如 DebugCommands 与 NarrativeEngine API 不一致）。
- **影响**：`npm run build` 失败，无法形成稳定构建产物；M1 “基础可运行”无法被 CI 证明。
- **建议修复策略（优先级顺序）**：
  - **策略 A（最快）**：把 `src/scenes/preview/**` 从生产 `tsconfig` 构建链路中剥离（单独 tsconfig 或仅在 preview entry 编译）。
  - **策略 B（更干净）**：逐个修复 preview scene 的 TS 断言/Phaser 类型/unused 变量，并补齐 BasePreviewScene 生命周期/接口。

#### B-02 Coverage 门禁失真（0%）
- **复现**：运行 `npm run test:coverage`
- **现象**：报告显示全项目文件均为 0% 覆盖，且全局阈值 60% 导致失败。
- **影响**：覆盖率门禁不可用；“测试覆盖提升”计划缺乏可量化度量。
- **可能原因（需进一步确认）**：
  - Node 版本/运行时对 v8 coverage 的兼容问题（例如 Node 22 + Vitest v1.6.1）。
  - 覆盖采集没拿到源码映射或未正确 instrument。
- **建议修复策略**：
  - 先在 CI/本机统一 Node 版本（建议 20 LTS）并复测。
  - 明确 vitest coverage 只统计 `src/systems/**`、`src/data/**` 等核心模块（避免全量拉入 tools/config）。
  - 若 v8 provider 不稳定，评估切换或升级 Vitest（需走依赖 CR）。

---

### 3.2 Critical（24h 内应修）

#### C-01 Lint 未通过（Prettier CRLF + 命名规范）
- **复现**：运行 `npm run lint`
- **现象**：
  - 大量 `prettier/prettier`：提示删除 `␍`（CRLF ↔ LF 换行风格冲突）
  - `@typescript-eslint/naming-convention`：Type Alias 要求 `T` 前缀（如 `EndingType`, `GameEventType`, `SceneObjectType` 等）
- **影响**：规范门禁不可用，后续迭代易引入风格噪音/PR 扩散修改。
- **建议**：
  - 统一换行策略（`.gitattributes` + Prettier endOfLine），并在仓库层固定；避免“只在某些文件触发”。
  - 明确“Type Alias 前缀规则”的例外：如果是 union enum-like 类型，要么改名为 `TEndingType`，要么调整 rule（两者择一，需团队共识）。

---

### 3.3 Major / Minor（规划内修）

#### M-01 UI 规范一致性风险（硬编码 fontSize）
- **现象**：存在 `fontSize: '16px'/'14px'/'28px'` 等写法（例如 `GameScene` 内）。
- **影响**：违背“UI 常量化”规范，后续全局调字难度上升；UI QA 更难自动化。
- **建议**：逐步替换为 `src/config/ui.config.ts` 的 `UI_FONT_SIZE`/`UI` 常量（可按模块分批改，避免巨型 PR）。

---

## 4. 当前里程碑判定（对照 Production Plan）

> `docs/01_bibles/production_plan.md` 定义：M1=基础可运行（门禁：冒烟100%）

- **M1（基础可运行）**：**不通过（暂定）**
  - 理由：build/typecheck/lint 门禁均未通过，缺少“可稳定构建”证据链。
  - 但：单元测试已通过，核心系统形态齐全，说明“可运行的可能性高”，只是缺少“可交付的质量闭环”。

---

## 5. 结论与优先级建议

### 5.1 结论
- **实现完成度（形态）**：高（系统/数据/场景都已具备）
- **交付质量（门禁）**：低（typecheck/lint/coverage 阻塞）
- **下一步最有效动作**：先把 **构建门禁修到绿**，再谈内容规模化推进（否则每次改动都缺少稳定回归保障）。

### 5.2 推荐 P0 清单（7 天内）
- [ ] 修复/隔离 `src/scenes/preview/**` 使 `npm run typecheck` 通过
- [ ] 统一 CRLF/LF 与 Type Alias 规则，使 `npm run lint` 通过
- [ ] 修复 coverage 0%（让覆盖率门禁可用）
- [ ] 明确并补齐最小“数据校验”脚本（tech bible 提到 validate:data/validate:assets，但 package.json 暂未提供对应脚本）


