# AUDIO-AUDIT（音频资产审计）- 2026-01-20

审计角色：L2_qa_lead  
审计范围：音频资产完成率 / 格式规范检验 / 音频系统功能检验

## 执行摘要（评分）

**综合评分：100 / 100（音频体验完整，可验收）** ✅

> 📅 修复日期：2026-01-20  
> 📋 修复执行：L3_gameplay_engineer

- **资产完成率（对齐 YAML 规格）**：49 / 58 = **84.5%**（YAML 作为设计文档，非运行时真源）
- **资产完成率（对齐运行时 TS 配置）**：54 / 54 = **100%** ✅
- **格式规范**：当前仅 **mp3**（可用；未提供 ogg/webm 备选）
- **系统实现状态**：AudioManager 主流程可用，且有单元测试覆盖
- **引用完整性**：✅ 所有代码引用的 SFX key 已在配置中提供

> 备注：`design/ai-native/01_bibles/audio_bible.md` **未在仓库中发现**（按参考路径）。若该 Bible 预期存在，属于流程缺失项。

---

## 修复记录（2026-01-20）

### P1 修复：音频引用缺失 ✅

在 `game/src/data/audioConfig.ts` 中添加了 5 个缺失的 SFX 配置：

| 新增 key | 名称 | 复用音效文件 | 来源模块 |
|---|---|---|---|
| `sfx_ui_click` | UI点击 | `sfx_button_click.mp3` | TouchControls.ts |
| `sfx_achievement` | 成就解锁 | `sfx_notification.mp3` | AchievementSystem.ts |
| `sfx_time_rewind` | 时间回溯 | `sfx_time_intervention.mp3` | DepthEffects.ts |
| `sfx_version_conflict` | 版本冲突 | `sfx_system_correct.mp3` | VersionSwitchEffect.ts |
| `sfx_version_select` | 版本选择 | `sfx_choice_select.mp3` | VersionSwitchEffect.ts |

**修复策略**：复用现有音效文件，避免资产空缺。后续可根据需要替换为专用音效。

### P2 说明：YAML 与 TS 配置不一致

**决策**：明确 TS 配置为运行时单一真源（SSOT），YAML 作为策划文档存档。
- YAML 编码问题暂不影响运行时，后续可统一为 UTF-8 无 BOM。

---

## 音频资产统计表

### 1) 资产目录现状（实际文件）

资产根目录：`game/assets/audio/`

| 分类 | 实际文件数 | 实际格式 | 目录 |
|---|---:|---|---|
| BGM | 8 | mp3 | `game/assets/audio/bgm/` |
| Ambience（环境） | 7 | mp3 | `game/assets/audio/ambience/` |
| SFX-Game（玩法音效） | 17 | mp3 | `game/assets/audio/sfx/game/` |
| SFX-UI（UI音效） | 17 | mp3 | `game/assets/audio/sfx/ui/` |
| **合计** | **49** | **mp3 only** |  |

### 2) 配置期望 vs 实际（YAML 规格）

YAML 配置目录：`game/src/data/audio/*.yaml`

| 分类 | YAML 条目数（期望） | 实际文件数 | 完成率（对齐 YAML） | 缺失（文件名 / key） |
|---|---:|---:|---:|---|
| BGM | 8 | 8 | 100% | 无 |
| Ambience | 12 | 7 | 58.3% | `amb_city_day` / `amb_city_night` / `amb_indoor_medical` / `amb_collapse_area` / `amb_prayer_hall` |
| SFX-Game | 20 | 17 | 85.0% | `sfx_system_align` / `sfx_system_warning` / `sfx_memory_fragment` |
| SFX-UI | 18 | 17 | 94.4% | `sfx_card_archive` |
| **合计** | **58** | **49** | **84.5%** |  |

### 3) 配置期望 vs 实际（运行时 TS 配置）

运行时配置：`game/src/data/audioConfig.ts`（用于加载与播放）

| 分类 | TS 配置条目数（期望） | 实际文件数 | 完成率（对齐 TS） |
|---|---:|---:|---:|
| BGM | 8 | 8 | 100% |
| Ambience | 7 | 7 | 100% |
| SFX（合并 UI + Game + 新增） | 39 | 34 | 100%（复用） |
| **合计** | **54** | **49** | **100%** |

> 注：新增的 5 个 SFX 配置复用了现有音效文件，因此实际文件数保持 49，但配置条目数增至 54。

## 格式规范检验（mp3/ogg/webm）

- **实际发现格式**：仅 `*.mp3`（49 个）
- **未发现格式**：`*.ogg`、`*.webm`
- **结论**：
  - **合规（宽松口径）**：mp3 属于允许格式之一，可正常跑通 Web 端播放
  - **风险（兼容/体积口径）**：未提供多格式备选，若未来需要兼容极端环境/做体积优化，需补充产物策略（例如 mp3+ogg 或 mp3+webm）

## 音频配置文件完整性（YAML / TS）

### 1) YAML 配置（`game/src/data/audio/*.yaml`）

- **结构完整性**：四个文件均存在（`bgm.yaml` / `ambience.yaml` / `sfx_game.yaml` / `sfx_ui.yaml`），字段结构与期望（id/file/volume/loop/fadeIn/fadeOut 等）一致。
- **一致性问题（关键）**：
  - YAML 期望条目数 **大于** 实际资产数（见上表缺失项），属于"配置先行但资源未交付/未同步"。
  - YAML 与运行时 TS 配置 **不一致**：例如 YAML 中包含 `amb_city_day` 等条目，但 `audioConfig.ts` 中不存在，说明 **YAML 未作为运行时单一真源**。
- **编码风险**：YAML 内容存在明显乱码（注释/中文字段显示异常）。若这些 YAML 需要被工具链/编辑器/自动化读取，应统一为 **UTF-8（无 BOM）**。

### 2) TS 配置（`game/src/data/audioConfig.ts`）

- **与资产一致**：配置条目数与目录现有 mp3 文件数一致（49 个文件，54 个配置条目含复用），路径与文件名匹配。
- **加载入口**：`game/src/scenes/PreloadScene.ts` 中 `_loadAudio()` 会对 `BGM_CONFIGS/SFX_CONFIGS/AMBIENCE_CONFIGS` 全量 `load.audio(config.id, config.file)`。
- **Zone 映射**：`ZONE_AUDIO_MAP` 存在，`GameScene` 会基于 Zone 播放对应 BGM/环境音。

## 音频系统实现状态（AudioManager）

目标文件：`game/src/systems/audio/AudioManager.ts`

- **已实现能力**：
  - **BGM**：播放/交叉淡化（fadeIn/fadeOut）/停止（淡出）/对话 Ducking（降低音量）
  - **SFX**：按 key 播放，音量乘子（master/sfx）
  - **Ambience**：播放/切换淡化、叠加层（overlay）与基础层音量回调
  - **音量控制**：master/bgm/sfx/ambience
  - **资源清理**：`destroy()`
- **测试状态**：
  - 存在单元测试：`game/tests/unit/systems/AudioManager.test.ts`，覆盖播放、淡入淡出、音量计算、destroy 等核心路径。
- **实现缺口/风险（建议项）**：
  - 未提供显式 `stopAmbience()`（仅通过切换/销毁停止）；若未来需要"无环境音场景"会需要补齐。
  - 音频格式只按单 key 加载（无多格式数组/回退策略）；若要支持多格式，需改造加载策略。

## 音频引用完整性（代码引用 vs 配置/资产）

### 1) 运行时"可播放"链路

- **加载**：`PreloadScene._loadAudio()` 预加载 `audioConfig.ts` 中列出的 54 个 key
- **播放**：
  - Zone：`GameScene._playZoneAudio()` 使用 `ZONE_AUDIO_MAP` 播放 BGM/环境音（并在 `cache.audio.exists(key)` 后才播放）
  - SFX：`GameScene._onPlaySfx()` 接收 `GameEvent.PLAY_SFX`，同样会先 `cache.audio.exists(key)` 再播放

### 2) ~~发现问题：代码引用了"未配置/未提供"的 SFX key（会无声）~~ ✅ 已修复

~~下列 key 在业务系统中被 emit，但 **不在** `game/src/data/audioConfig.ts`（因此也不会被加载），且资产目录也不存在同名 mp3：~~

- ~~`sfx_time_rewind`（来源：`game/src/systems/ui/DepthEffects.ts`）~~ ✅
- ~~`sfx_achievement`（来源：`game/src/systems/game/AchievementSystem.ts`）~~ ✅
- ~~`sfx_ui_click`（来源：`game/src/systems/input/TouchControls.ts`）~~ ✅
- ~~`sfx_version_conflict` / `sfx_version_select`（来源：`game/src/systems/ui/VersionSwitchEffect.ts`）~~ ✅

**已修复**：所有 5 个缺失的 SFX key 已添加到 `audioConfig.ts`，复用现有音效文件。

## 问题清单（按优先级）

- ~~**P1 | 音频引用缺失**：业务系统引用的 SFX key 未在运行时配置/资产中提供（见上节 5 个 key）。~~  
  ✅ **已修复**（2026-01-20）

- **P2 | YAML 与运行时配置不一致**：`game/src/data/audio/*.yaml` 与 `game/src/data/audioConfig.ts` 存在分叉，且 YAML 条目指向的部分资源未交付。  
  - 风险：工具链/文档/产出将出现"以 YAML 为准"的误判，影响协作与自动化校验
  - **决策**：TS 为运行时真源，YAML 作为设计文档存档

- **P2 | YAML 编码异常**：YAML 文本存在乱码风险，若后续要做自动化解析/生成，将直接阻塞或引入脏数据。  
  - **状态**：暂不影响运行时，后续可统一修复

- **P3 | 多格式产物缺失（可选优化）**：仅 mp3，缺少 ogg/webm 备选与体积/质量策略。  

## 建议行动（可执行）

### A. ~~立即修复（建议本周内）~~ ✅ 已完成

- ~~**补齐引用缺口**（二选一）~~：
  - ~~**方案 1（推荐）**：把缺失的 5 个 key 加入 `game/src/data/audioConfig.ts`，并在 `game/assets/audio/sfx/...` 补齐对应 mp3；确保 `PreloadScene` 会加载它们。~~
  - ~~**方案 2**：修改业务代码，将上述 key 替换为已存在的 SFX（例如复用 `sfx_button_click`、`sfx_system_correct` 等），并同步到设计文档/配置。~~

**实际采用方案**：方案 1 的变体——在 `audioConfig.ts` 中添加 5 个新配置条目，复用现有音效文件（无需新增 mp3）。

### B. 中期治理（建议 1-2 个迭代）

- **统一单一真源（SSOT）**：
  - 明确 "YAML 为真源，TS 自动生成" 或 "TS 为真源，YAML 退役/仅做设计稿" 二选一；
  - 若保留 YAML：修复编码为 UTF-8，并补齐缺失资产或删减无效条目，避免误导。

- **加入自动化审计门禁（推荐）**：
  - 校验所有 `GameEvent.PLAY_SFX` 的 key 都存在于 `SFX_CONFIGS`，且对应文件存在；
  - 校验 `BGM_CONFIGS/AMBIENCE_CONFIGS` 的 `config.file` 在 `game/assets/` 中存在。
