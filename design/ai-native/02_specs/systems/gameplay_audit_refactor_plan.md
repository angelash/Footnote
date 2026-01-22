# Gameplay Audit & Refactoring Plan v1.0
> **层级**: L2 规格层（Gameplay Lead）  
> **目标**: 修复逻辑缺口（Logical Completeness）、进度敏感性（State Sensitivity）与价值回路（Value Loop）中的“空值/断链”。  
> **范围**: `game/src/systems/` + `game/src/scenes/` + `game/src/data/`（尤其是 `data/scenes/*.yaml`, `data/dialogues/*.yaml`, `data/cards/*.yaml`）

---

## 0. 现状速写（基于代码审计）

### 0.1 当前交互链路（真实执行路径）
- **场景内容**：`game/src/data/scenes/*.yaml`（Zone 物件 + `interactive.action`）
- **组装**：`game/src/systems/scene/SceneAssembler.ts`
  - 把 `interactive.action` 存入 `GameObject.setData('action', ...)`
  - **仅对 `action.type === 'card'` 做一次性预检查**：`worldState.getFlag('ITEM_TAKEN_${cardId}')`
- **交互触发**：`game/src/scenes/GameScene.ts`
  - `InteractionPrompt` 选择最近可交互对象 → `_tryInteract()` → `_handleSceneAction(action, sourceObject)`
  - `card`：`narrativeEngine.obtainCard(cardId)` + `worldState.setFlag('ITEM_TAKEN_${cardId}', true)` + 淡出并销毁场景物件
  - `dialogue`：进入 `narrativeEngine` 对话（对话内部可能发卡、种伏笔、设 flag、改 R/P）
- **背包（Inventory）**：当前几乎等同于“已获得卡片列表”
  - UI：`game/src/systems/ui/InventoryUI.ts` 读取 `narrativeEngine.getObtainedCards()`
  - **WorldState 里存在 `zoneStates[*].collectedItems` 但未被拾取逻辑使用**
- **持久化**：`game/src/systems/save/SaveManager.ts`
  - 保存 `worldState.serialize()` + `narrativeEngine.serialize()`
  - **交互/拾取后无统一的“标脏 + 自动存档”策略**

### 0.2 高风险漂移点（已发现）
- **C0 对话旧格式 `trigger.flags` 目前不会生效**：`NarrativeDataLoader.normalizeOldFormatDialogue()` 不支持 flags  
  - 例：`game/src/data/dialogues/c0_z1.yaml` 中 `NOTICE_BOARD_EXAMINE.trigger.flags`  
  - 直接后果：`data/scenes/c0_z1.yaml` 依赖的 `FLAG_C0Z1_NOTICE_EXAMINED` 可能永远不被置位 → 进度/显示错乱
- **卡片 YAML 的 `fx` 字段被当成“视觉特效”解析且类型不匹配**：`c0_cards.yaml` 出现 `type: r_change`，但 loader 只接受 `taint/flash/shake/fade`  
  - 直接后果：设计上希望的“道具/祷词影响 R/P/W”目前是空转（Value void）

---

## 1. Gap Analysis（对照三条标准）

### 1.1 Logical Completeness（Pre-check → State Change → Persistence → Feedback）
- **Pre-check 不完整**：只覆盖 `card`，其它一次性事件/检查物件（dialogue 类）靠内容自律，系统不兜底。
- **State Change 不可审计**：
  - “拾取”用 `FLAG ITEM_TAKEN_*` 记录，但没有写入 `WorldState.zoneStates[*].collectedItems` / `triggeredEvents`
  - `GameScene._createInteractionPoints()`（兜底硬编码）用 `label` 当 objectId，无法稳定回放/持久化审计
- **Persistence 不成体系**：拾取后即销毁场景物件，但不触发 autosave/dirty flush → 崩溃/刷新会丢进度（重进 Zone 又出现）
- **Feedback 不一致**：卡片获得有 toast（事件驱动），但不保证统一的 SFX/UI（比如拾取音效 `sfx_item_pickup` 未成为强约束）

### 1.2 State Sensitivity（“进度”必须落到 Flag/Quest，而非只换皮）
- Scene YAML 普遍用 `flagTrue/flagFalse` 双物件切换表达进度（例如公告板、储物柜），但：
  - 旧格式对话无法 setFlag → 进度不会落盘
  - YAML 结构错误风险高（重复 key、缩进问题）→ 运行时静默失败
- 系统缺少“进度契约”：无法从系统侧校验“某交互完成后必须 setFlag X”

### 1.3 Value Loop（每个 item/action 必须有 Sink 或影响 R/P/W）
- “物品”目前本质是卡片（`data/cards/*.yaml` 的 `type: item`），但缺少：
  - **使用（consume/use）入口**（InventoryUI 仅浏览/查看）
  - **可执行的效果数据结构**（目前只有对话 choice effects 会改 R/P；卡片 `fx` 未联动到数值）
- `WorldState.recordAction()` 存在但未进入大多数交互路径 → R（无收益残差）无法真实反映玩家行为价值

---

## 2. 规划目标（重构后的“真实交互循环”）

### 2.1 统一动作模型（Action Contract）
为所有交互动作引入“可审计、可重放、可幂等”的契约：
- **动作唯一标识**：`interactionId = {zoneId}:{objectId}:{actionType}:{payloadId}`（或 YAML 显式字段）
- **一次性语义**：`once: true|false`（默认：`card` 为 true；`dialogue` 视内容标注）
- **标准四段式执行**：
  1) Pre-check：是否已执行 / 条件是否满足（flag/zoneState/narrative）
  2) State Change：写入（至少）`WorldState` +（必要时）`NarrativeEngine`
  3) Persistence：标脏 + debounce autosave（或 action journal）
  4) Feedback：toast + sfx + UI（统一事件）

### 2.2 数据侧“进度契约”
对 `data/scenes/*.yaml` 与 `data/dialogues/*.yaml` 建立可验证约束：
- 若 Scene 物件依赖 `flagTrue/flagFalse`，则对应交互必须能在系统层证明“会 setFlag”
- 对话旧格式必须支持 setFlag（兼容）或迁移到新格式

### 2.3 价值回路落地方式（二选一，可并行）
- **A. 可消耗/可使用**：在 Inventory 内对 `item/prayer` 提供 “Use” → 产生 R/P/W 影响，必要时消耗
- **B. 获得即触发**：部分卡片在 obtain 时立即产生效果（谨慎：避免玩家无意触发）

---

## 3. 分阶段实施计划

## Phase 1：Foundation（实现“真实交互循环”）
**目标**：让所有交互至少满足四段式；并把“拾取/一次性事件”从 GameScene 的 ad-hoc 逻辑中抽离。

### 3.1 需要改/增的核心文件（P0）
- **动作与数据结构**
  - `game/src/types/scene.ts`：扩展 `ISceneAction`（新增 `id/once/effects` 等）
  - `game/src/systems/scene/SceneAssembler.ts`：把 `objectId`/`zoneId` 写入对象 data；一次性交互统一预检查（不只 card）
- **交互执行器（新增系统）**
  - `game/src/systems/interaction/InteractionSystem.ts`（新增）
  - `game/src/systems/interaction/index.ts`（新增）
  - `game/src/scenes/GameScene.ts`：`_handleSceneAction` 变为调用 `interactionSystem.execute({...})`
- **状态与审计**
  - `game/src/systems/world/WorldState.ts`：新增/补齐接口
    - `hasInteraction(interactionId)`
    - `markInteractionDone(interactionId, meta)`
    - 复用/落地 `zoneStates[*].collectedItems/triggeredEvents`
  - `game/src/systems/save/SaveManager.ts`：新增 `markDirty(reason)` + debounce `autoSave()` 策略（或单独 journal）
- **反馈统一**
  - `game/src/systems/EventBus.ts`：新增事件 `ITEM_COLLECT` / `INTERACTION_COMMIT`（或复用 UI_TOAST + SFX_PLAY）
  - `game/src/scenes/GameScene.ts`：在交互 commit 时统一触发 `PLAY_SFX(sfx_item_pickup)` + toast

### 3.2 交互执行“契约”建议（P0）
- `execute(action, context)` 返回 `{ ok, changed, feedback[] }`
- **幂等**：若 `once` 且已执行 → 返回 `{ ok:true, changed:false }` 并给轻提示（避免重复触发）
- **错误兜底**：若 state change 成功但反馈失败，不回滚 state；若 state change 失败，不销毁物件

### 3.3 Phase 1 验收标准
- [ ] 任意 `card` 拾取：必然写入 “一次性记录”（flag + interaction ledger/zoneState）
- [ ] 任意一次性动作：Pre-check 生效（重进 Zone 不会重复执行）
- [ ] 任意交互导致的 state change：触发 dirty + 自动存档（debounce）
- [ ] 任意拾取：至少有 toast + `sfx_item_pickup`

---

## Phase 2：Content Retrofit（全 Zone 扫描与改造）
**目标**：把所有 Zone 内容对齐到“交互契约”，消灭 ad-hoc 与静默失败。

### 2.1 全量扫描（P0）
- 扫描 `game/src/data/scenes/*.yaml`
  - 列出所有 `interactive.action`，生成清单：`zoneId, objectId, action.type, payloadId, once?, requiredFlags?`
  - 对 `flagTrue/flagFalse` 的物件：建立“flag 来源”追踪（哪个 dialogue/onComplete 会 setFlag）
- 扫描 `game/src/data/dialogues/*.yaml`
  - 识别旧格式对话里使用了 `trigger.flags` 的条目（需要 loader 兼容或迁移）
  - 识别 YAML 结构问题（重复 key、缩进导致字段无效）

### 2.2 内容改造策略（P1）
- **优先迁移 C0 对话到新格式**（推荐）：把关键进度点改为 `onComplete: [{type:'flag'...}]`
- 或 **在 loader 中补齐旧格式 flags 支持**（短期救火）：扩展 `IRawDialogueOld.trigger` 支持 `flags`

### 2.3 Phase 2 验收标准
- [ ] 每个依赖 `flagTrue/flagFalse` 的 Scene 物件，都能追溯到明确的 setFlag 来源
- [ ] 不再依赖 `GameScene._createInteractionPoints()`（或仅保留开发兜底，不在正式 Zone 使用）

---

## Phase 3：Value Injection（道具用途与经济闭环）
**目标**：让 “item/prayer/verdict” 不再是纯收藏；每张卡要么可使用（Sink），要么影响 R/P/W（Influence）。

### 3.1 统一“卡片效果”数据结构（P0）
当前 `data/cards/c0_cards.yaml` 的 `fx: r_change` 与代码不匹配；建议拆分：
- `uiFx`: 纯视觉（flash/shake/taint/fade）
- `gameplayFx`: 数值/标记/奖励（`counterDelta`, `setFlag`, `giveCard`, `unlockAbility`…）

涉及文件：
- `game/src/types/index.ts`（或卡片类型定义所在文件）：新增 `gameplayFx` 类型
- `game/src/data/NarrativeDataLoader.ts`：解析并注册 `gameplayFx`
- `game/src/systems/narrative/NarrativeEngine.ts`：提供 `applyCardGameplayFx(trigger: 'obtain'|'use'|'view')`

### 3.2 提供“使用入口”（P1）
- `game/src/systems/ui/InventoryUI.ts`：对 `CardCategory.ITEM/PRAYER` 增加 “Use/Recite” 按钮
- `game/src/systems/ui/CardUI.ts`：展示可使用状态、冷却/消耗提示
- `game/src/systems/world/WorldState.ts`：记录消耗（避免重复刷）

### 3.3 建议的价值规则（落地口径）
- **物品（item）**：一次性消耗 → 改 counters 或设 flag（用于解锁分支/降低 R/W 处罚等）
- **祷词（prayer）**：可重复但有成本（例如 P 增加/或每天一次）→ 形成 R/P/W 交易
- **判决（verdict）**：强影响、强后果（直接设定关键 flag，牵引结局路径）

---

## Phase 4：Verification（自动化门禁：逻辑完整性与价值闭环）
**目标**：把“逻辑完整性”变成可自动验收的门禁，而不是靠人工回归。

### 4.1 单元测试（P0）
- `game/tests/unit/systems/InteractionSystem.test.ts`（新增）
  - once 动作幂等
  - 执行后写入 worldState ledger + dirty 标记
- `game/tests/unit/systems/SceneAssembler.test.ts`（扩展）
  - 预检查：已完成交互的对象不再生成
- `game/tests/unit/systems/SaveManager.test.ts`（扩展）
  - dirty debounce → autoSave 触发（可通过 mock safeStorage / eventBus 断言）

### 4.2 E2E（P1）
- `game/tests/e2e/prologue.spec.ts` 或新增 `pickup-persistence.spec.ts`
  - 在 C0-Z1 拾取 `CARD_C0_IDENTITY` → 刷新/重载 → 物件不出现且卡片仍在 inventory

### 4.3 数据一致性检查（P1）
- 新增脚本（建议）：`game/scripts/audit_interactions.ts`
  - 解析 `data/scenes/*.yaml` 与 `data/dialogues/*.yaml`
  - 输出：缺失 once/缺失 setFlag 来源/引用不存在 dialogueId/cardId 的清单

---

## 4. 建议的“改动热点清单”（用于拆 Task Pack）

### 4.1 系统层（Foundation）
- `game/src/scenes/GameScene.ts`
- `game/src/systems/scene/SceneAssembler.ts`
- `game/src/types/scene.ts`
- `game/src/systems/world/WorldState.ts`
- `game/src/systems/save/SaveManager.ts`
- `game/src/systems/EventBus.ts`
- `game/src/systems/ui/ToastManager.ts` / `game/src/systems/ui/InteractionPrompt.ts`（反馈统一）

### 4.2 内容层（Retrofit）
- `game/src/data/scenes/*.yaml`
- `game/src/data/dialogues/*.yaml`（尤其 C0 旧格式）

### 4.3 价值层（Value）
- `game/src/data/cards/*.yaml`
- `game/src/data/NarrativeDataLoader.ts`
- `game/src/systems/narrative/NarrativeEngine.ts`
- `game/src/systems/ui/InventoryUI.ts` / `game/src/systems/ui/CardUI.ts`

### 4.4 测试层（Verification）
- `game/tests/unit/systems/*.test.ts`
- `game/tests/e2e/*.spec.ts`
- （可选）`game/tests/interactive/` 的章节脚本加入拾取/回读断言

---

## 5. 风险评估

| 风险项 | 可能性 | 影响 | 缓解措施 |
|---|---|---|---|
| C0 对话旧格式迁移量大 | 中 | 高 | 先补 loader 对 flags 的兼容，再逐步迁移 |
| autosave 频繁导致性能问题 | 中 | 中 | debounce（例如 3-5s）+ 仅 state change 才触发 |
| 数据 YAML 静默错误难定位 | 高 | 高 | 引入 audit_interactions 脚本 + CI 门禁 |
| 价值回路设计需要策划裁决 | 中 | 高 | Phase 3 先做“机制入口 + 最小可用效果”，细化由后续内容迭代补齐 |

