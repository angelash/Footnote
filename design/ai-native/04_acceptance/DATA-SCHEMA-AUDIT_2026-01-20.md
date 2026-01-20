# DATA-SCHEMA-AUDIT 数据 Schema 审计报告

> **审计日期**: 2026-01-20  
> **审计角色**: L2_qa_lead  
> **审计范围**: 数据校验机制实现 / Schema 定义完整性 / 数据一致性检查  
> **参考文件**:  
> - Tech Bible: `design/ai-native/01_bibles/tech_bible.md`  
> - 数据目录: `game/src/data/`（dialogues/scenes/cards/foreshadows/audio）  
> - 数据加载器: `game/src/data/NarrativeDataLoader.ts`  
> - 场景加载: `game/src/data/scenes/index.ts` / `game/src/systems/scene/SceneAssembler.ts`  
> - 类型定义: `game/src/types/`  

---

## 执行摘要（评分）

| 维度 | 评分 | 说明 |
|---|---:|---|
| 门禁脚本可用性（validate:data） | 3/5 | `npm run validate:data` 已存在并可运行，但覆盖不完整且存在“误通过”风险 |
| Schema 单一来源（SSOT） | 1/5 | 同一类数据（尤其 foreshadow/scene/audio）存在多套不一致定义与加载路径 |
| 运行时校验强度 | 2/5 | 主要依赖 YAML 解析成功 + 少量必填字段；缺少结构/枚举/引用完整性强校验 |
| 数据一致性（格式/命名/章节覆盖） | 3/5 | dialogues/scenes/cards 章节覆盖基本齐全；但 Scene/YAML 结构与 TS 类型契约不一致 |
| 引用完整性（跨文件引用） | 3/5 | cards/foreshadows 引用整体一致；发现 3 个 scene->dialogue 缺失引用 |

**综合评分**: **2.4/5**  
**结论**: **FAIL（不建议作为 CI 强门禁放行）** —— 需要补齐校验覆盖与修正关键 Schema 不一致问题后再提升门禁严格度。

---

## 1. 数据校验机制状态

### 1.1 Tech Bible 门禁对照

Tech Bible 要求：`npm run validate:data` 且对白/事件/卡片/Zone 数据需做 Schema 校验（见 `tech_bible.md` 4.x 与 6.1）。

**当前实现现状（实际仓库）**

- **存在脚本**: `game/package.json` 已定义 `validate:data`  
  - 命令：`tsx scripts/validate-data.ts`
- **校验脚本位置**: `game/scripts/validate-data.ts`
- **校验覆盖**:
  - dialogues：✅ 解析 + 必填字段（id / lines 或 text/choices）  
  - scenes（脚本命名 validateZones 实际检查 `src/data/scenes/*.yaml`）：⚠️ 仅检查 `id` 与 `name/title`  
  - cards：⚠️ 逻辑上“有校验函数”，但当前数据结构为 Map，脚本只对 Array 生效，导致 **实际被跳过**  
  - foreshadows：❌ 未纳入 `validate-data.ts`  
  - audio：❌ 未纳入 `validate-data.ts`，且 YAML 本身存在语法错误（见问题清单）

### 1.2 是否使用 JSON Schema / Zod / Yup / Ajv

- **未发现** JSON Schema / Zod / Yup / Ajv 等通用 Schema 校验库在 `game/` 中被使用（`game/package.json` 依赖也未包含）。  
- 当前主要是 **自定义脚本 + TypeScript 类型（编译期）+ 运行时强制类型断言（as）** 的组合。

---

## 2. 数据统计表（文件数量与章节覆盖）

### 2.1 `game/src/data/` YAML 文件总量

| 子目录 | 文件数 | 说明 |
|---|---:|---|
| `dialogues/` | 47 | C0-C5/CF 主线 + `rv_dialogues` + `ngplus_dialogues` |
| `scenes/` | 57 | C0-C5/CF 主线 45 + RV 12（合计 57） |
| `cards/` | 8 | C0-C5/CF + RV（每章 1 文件） |
| `foreshadows/` | 1 | `foreshadows.yaml`（共 26 条定义，含 TBD 预留位） |
| `audio/` | 4 | `bgm.yaml`/`sfx_game.yaml`/`sfx_ui.yaml`/`ambience.yaml`（其中 3 个 YAML 存在语法错误） |
| `locales/` | 12 | 4 语言（en/ja/zh-CN/zh-TW）× 3 文件（cards/ui/dialogues/c0） |
| **总计** | **129** | `game/src/data/**/*.yaml` |

> 注：本审计“目标范围”为 dialogues/scenes/cards/foreshadows/audio；`locales/` 不在本次门禁要求内，但其 YAML 质量会影响未来本地化流程。

### 2.2 章节覆盖（按文件命名推断）

**dialogues（47）**

| 章节 | 文件数 |
|---|---:|
| C0 | 4 |
| C1 | 6 |
| C2 | 7 |
| C3 | 7 |
| C4 | 8 |
| C5 | 7 |
| CF | 6 |
| RV 特殊 | 1（`rv_dialogues.yaml`） |
| NG+ 特殊 | 1（`ngplus_dialogues.yaml`） |

**scenes（57）**

| 章节 | 文件数 |
|---|---:|
| C0 | 4 |
| C1 | 6 |
| C2 | 7 |
| C3 | 7 |
| C4 | 8 |
| C5 | 7 |
| CF | 6 |
| RV | 12（`rv_01` ~ `rv_12`） |

**cards（8）**

| 章节 | 文件数 |
|---|---:|
| C0/C1/C2/C3/C4/C5/CF/RV | 各 1 |

### 2.3 数据实体数量（解析后统计）

基于只读脚本解析（2026-01-20）：

| 数据类型 | 实体数量 | 备注 |
|---|---:|---|
| Dialogues（对白条目） | 441 | 跨 47 文件汇总（以 YAML 内每个 dialogue 节点的 `id` 计） |
| Cards（卡片） | 75 | 跨 8 文件汇总 |
| Foreshadows（伏笔） | 26 | `F01` ~ `F26`（含 `TBD` 预留位） |
| Zones/Scenes（Zone 配置） | 57 | 与 scenes 文件数一致 |

---

## 3. Schema 定义检查（Tech Bible vs 实现）

### 3.1 Dialogues（对白）

**Tech Bible 契约（摘要）**
- 路径示例：`src/data/dialogues/{zone_id}.yaml`
- 结构示例：`dialogues: [ { id, lines, choices... } ]`（Array）

**当前实现与数据**
- 路径：`game/src/data/dialogues/*.yaml`
- 结构：`dialogues:` 下为 **Map（key->对象）**，对象含 `id/lines/choices/onComplete`（见 `c1_z1.yaml`）
- 加载路径：
  - 预加载：`game/src/scenes/PreloadScene.ts` 通过 `this.load.text('dialogue_xxx', ...)`
  - 解析/兼容：`game/src/data/NarrativeDataLoader.ts`（兼容旧/新格式，映射到 `IDialogue` 并注册到 `NarrativeEngine`）
  - 动态加载：`game/src/systems/narrative/NarrativeEngine.ts` 可按 dialogueId 推断文件并 fetch

**校验现状**
- `validate:data`：支持 Array/Map 两种结构（✅）但只做轻量必填检查（⚠️）
- **缺失项**：对白长度、单轮句数等 Tech Bible 约束未实现；引用完整性未纳入门禁（本次审计脚本发现 3 个缺失引用，见问题清单 DS-001）。

### 3.2 Scenes / Zones（事件脚本/Zone 配置）

**Tech Bible 契约（摘要）**
- 路径示例：`src/data/zones/{zone_id}.yaml`
- 必填字段：`id/name/chapter` 等（并含 events/conditions）

**当前实现与数据**
- 实际路径：`game/src/data/scenes/*.yaml`（非 `zones/`）
- 实际字段：`id/title/background/objects[]`，objects 内含 `interactive.action`（如 `dialogueId/zoneId`）
- 加载路径：
  - `game/src/data/scenes/index.ts`：`import .yaml?raw` + `yaml.parse` + `as ISceneConfig`（最小校验）
  - `game/src/systems/scene/SceneAssembler.ts`：将 `ISceneConfig.objects` 组装为可交互对象

**关键不一致（高风险）**
- `game/src/types/scene.ts` 的类型契约与 YAML **明显不一致**：
  - `SceneObjectType` 仅允许 `'image' | 'sprite'`，但 YAML 大量使用 `type: zone`
  - `ISceneObjectConfig` 要求 `texture: string`，但 `type: zone` 对象普遍 **无 texture**
  - `ISceneAction` 未定义 `dialogueId` 字段，但 YAML action 使用 `dialogueId`
- `SceneAssembler` 内部直接使用 `obj.texture.toLowerCase()` 推断 subtype：在 `type: zone` 且无 texture 的情况下存在 **潜在运行时崩溃风险**（应由 Schema 校验在 CI 阶段拦截）。

**校验现状**
- `validate:data` 仅检查 scene 文件顶层 `id` 和 `name/title`（不足以覆盖 objects 结构/引用）。

### 3.3 Cards（卡片）

**Tech Bible 契约（摘要）**
- 必填：`id/title/content` 等；title 长度限制

**当前实现与数据**
- 路径：`game/src/data/cards/*.yaml`
- 结构：`cards:` 下为 **Map（key->对象）**，对象含 `id/title/type/content/flavorText/rarity/foreshadowId...`
- 加载/兼容：`game/src/data/NarrativeDataLoader.ts` 支持两种格式并统一映射到 `game/src/types` 的 `ICard`

**校验现状**
- `validate:data` 的 cards 校验仅对 `data.cards` 为 Array 时执行；当前数据为 Map，导致 **cards 基本未被实际校验**（误通过风险）。

### 3.4 Foreshadows（伏笔）

**当前实现存在“多套 Schema 并存”的问题**

- 数据文件：`game/src/data/foreshadows/foreshadows.yaml`  
  - 结构偏向：`stages: plant/deepen/mislead/reveal`，每阶段含 `zone/description`，并含 `TBD` 预留位
- UI 管理器：`game/src/systems/ui/ForeshadowManager.ts`  
  - 期望 schema：与 YAML 一致（plant/deepen/mislead/reveal），并对 `TBD` 做跳过处理
- Narrative Engine：`game/src/systems/narrative/NarrativeEngine.ts`  
  - 支持阶段别名映射（misread->mislead, collect/resolve->reveal），但其 `IForeshadow` 类型结构与 `game/src/types/index.ts` 仍存在差异
- NarrativeDataLoader：`game/src/data/NarrativeDataLoader.ts`  
  - 内部 `IRawForeshadow` 期望字段为 `stages.plant/deepen/misread?/resolve`，且 stage 字段为 `zoneId/dialogueId/condition`  
  - 与现有 YAML 不一致（但 loader 仍会返回一个“看似符合 IForeshadow 的对象”，内容可能为空/不完整）

**校验现状**
- `validate:data` 未覆盖 foreshadows。

### 3.5 Audio（音频数据）

**现状**
- 运行时实际使用的是 `game/src/data/audioConfig.ts`（TypeScript 常量，且 `PreloadScene` 直接 import 使用）
- `game/src/data/audio/*.yaml` 目前更像“内容策划稿/配置草案”，且存在质量问题：
  - `bgm.yaml`: 可解析（OK）
  - `sfx_game.yaml`: YAML 语法错误（缺失 closing quote）
  - `sfx_ui.yaml`: YAML 语法错误（缺失 closing quote）
  - `ambience.yaml`: YAML 语法错误（缺失 closing quote）

**校验现状**
- `validate:data` 未覆盖 audio YAML；也未检查 `audioConfig.ts` 与 YAML/资源文件的同步一致性。

---

## 4. 数据一致性与引用完整性检查（结果）

### 4.1 跨文件引用完整性（脚本解析结果）

| 引用类型 | 结果 |
|---|---|
| scene -> gotoZone（zoneId） | ✅ 未发现缺失引用 |
| dialogue -> cardId | ✅ 未发现缺失引用 |
| dialogue -> foreshadowId | ✅ 未发现缺失引用 |
| scene -> dialogueId | ❌ 发现缺失引用（3 个，见 DS-001） |

### 4.2 音频映射引用

`bgm.yaml.scene_mapping` 中的 key 包含 `MenuScene`/`EndingA/B/C`，这些不属于 `scenes/` 的 Zone ID（脚本按 Zone ID 集合比对会标为“缺失”）。  
**建议**：将此类 key 明确纳入 allowlist 或单独 schema（见建议行动）。

---

## 5. 问题清单（分级）

> 分级标准：P0 阻断 / P1 严重 / P2 一般 / P3 轻微（见项目 QA 规范）

| ID | 级别 | 模块 | 问题描述 | 证据/影响 |
|---|---|---|---|---|
| DS-001 | P0 | scenes/dialogues | `CF-Z5` 场景引用的对白不存在：`CFZ5_CONFIRM_ENDING_A/B/C` | `game/src/data/scenes/cf_z5.yaml` 引用；对白目录中无对应 `id`，会导致结局选择交互无法正常推进 |
| DS-002 | P0 | scenes/types | Scene YAML 与 `game/src/types/scene.ts`/`SceneAssembler` 契约不一致（`type: zone` 无 texture / action 使用 dialogueId 等） | 存在潜在运行时崩溃风险；且 `validate:data` 未覆盖 objects 级别校验 |
| DS-003 | P1 | validate:data | `validate:data` 对 cards 的校验“几乎未生效”（仅支持 Array；当前数据为 Map） | 形成 CI “误通过”，无法拦截 cards 缺字段/重复ID/字段越界 |
| DS-004 | P1 | audio | `sfx_game.yaml` / `sfx_ui.yaml` / `ambience.yaml` 存在 YAML 语法错误（缺 closing quote），且内容编码出现乱码 | 任何尝试解析这些 YAML 的工具/校验都会失败；也影响后续策划/自动化管线接入 |
| DS-005 | P1 | foreshadows | 伏笔数据存在多套 Schema 并存：`ForeshadowManager`/`NarrativeDataLoader`/`types/index.ts`/`NarrativeEngine` 期望不完全一致 | 长期会导致数据可维护性下降，且难以建立单一门禁 |
| DS-006 | P2 | preload | `PreloadScene` 预加载对白列表未包含 `ngplus_dialogues.yaml`（但 loader 列表包含） | NG+ 相关对白可能在某些路径下缺失预加载（当前未发现引用缺失，但属于一致性风险） |
| DS-007 | P2 | spec vs impl | Tech Bible 的数据路径/字段（`zones/`、`name/chapter`、dialogues Array）与实际实现（`scenes/`、`title`、Map）不一致 | 造成“文档门禁难落地”，并增加新成员上手成本 |

---

## 6. 建议行动（可执行）

### 6.1 立即行动（建议本迭代完成）

- **修复 DS-001（P0）**：补齐 `CFZ5_CONFIRM_ENDING_A/B/C` 对话定义（或修正 `cf_z5.yaml` 引用到真实存在的对白 ID）。  
- **修复 DS-002（P0）**：统一 Scene schema（建议以 YAML 为准），更新 `game/src/types/scene.ts` 与 `SceneAssembler`：
  - 支持 `type: zone`（rect hit area），允许 `texture` 可选
  - `ISceneAction` 增加 `dialogueId` 字段并在运行时调用 `GameScene.showDialogueById()`（而非仅 speaker/text）
  - 将 objects 级别的必填字段/枚举约束写入 `validate:data`
- **修复 DS-003（P1）**：更新 `scripts/validate-data.ts` 的 cards 校验以支持 Map 结构，并加入：
  - key 与 `id` 一致性
  - `type` 枚举校验
  - `title/content` 长度约束（对齐 Tech Bible 4.4）
- **修复 DS-004（P1）**：将 `sfx_game.yaml` / `sfx_ui.yaml` / `ambience.yaml` 修复为可解析 YAML（同时统一 UTF-8 编码）。  

### 6.2 短期增强（建议下个迭代）

- 将本次“引用完整性检查”纳入 `validate:data`：
  - scene.action.dialogueId 必须存在于 dialogues 集合
  - dialogue 的 cardId/foreshadowId 必须存在于 cards/foreshadows 集合
  - scene.gotoZone 必须指向存在的 Zone（或明确允许跨章/特殊 key）
- 明确 audio 数据的 SSOT：
  - 若运行时以 `audioConfig.ts` 为准，则 YAML 仅作为策划文档，建议迁移到 `design/` 或加上 “non-runtime” 标识并从门禁范围移除
  - 若希望 YAML 成为运行时配置，则补齐 loader 并移除 TS 重复配置

### 6.3 中长期（门禁成熟化）

- 引入统一 Schema 校验层（Zod/Ajv/JSON Schema 均可），并在 CI 中严格执行：
  - 结构校验（required/enum/range）
  - 引用校验（跨文件 referential integrity）
  - 章节覆盖校验（与设计表/章节配置对齐）

---

## 附录：本次审计使用的命令与证据点

### A. 质量门禁命令（仓库现状）

```bash
cd game
npm run validate:data
```

### B. 关键证据文件索引

- `game/scripts/validate-data.ts`（validate:data 的实际实现）
- `game/src/data/scenes/cf_z5.yaml`（引用缺失对白：CFZ5_CONFIRM_ENDING_*）
- `game/src/types/scene.ts` / `game/src/systems/scene/SceneAssembler.ts`（Scene schema 与 YAML 不一致）
- `game/src/data/audio/sfx_game.yaml` / `sfx_ui.yaml` / `ambience.yaml`（YAML 语法错误）

---

*报告版本: v1.0*  
*审计人: L2_qa_lead（AI）*  
*生成时间: 2026-01-20*

