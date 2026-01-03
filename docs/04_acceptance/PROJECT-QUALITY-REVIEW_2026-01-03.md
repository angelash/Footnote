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


