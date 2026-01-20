# ART-ASSET-AUDIT（美术资产审计）2026-01-20

## 审计信息

- **角色**：L2_qa_lead（美术资产审计 / ART-ASSET-AUDIT）
- **审计日期**：2026-01-20
- **审计范围**：
  - 资产完成率统计
  - 规范一致性检验（尺寸、格式、命名）
  - 引用完整性检验（`src/data/scenes/*.yaml` 与资产注册表/磁盘文件）
- **参考规范/输入**：
  - `design/ai-native/01_bibles/art_bible.md`
  - `design/game/03-art/资产生产总清单_v2.md`
  - `design/game/03-art/美术风格指南_v1.md`
  - `.cursor/rules/08-ui-qa-rules.mdc`
- **自动化工具**：
  - QC 脚本：`game/scripts/qa/asset-qc.mjs`（已执行）

---

## 执行摘要（评分）

**综合评分：35 / 100（FAIL，未达到进入 HYBRID/PRODUCTION 的资产门槛）**

- **亮点**
  - **音频资产可用**：`game/assets/audio/**` 共 49 个 MP3，QC 全部通过。
  - **QC 脚本可用**：`asset-qc.mjs` 可运行、可出报告、退出码符合约定。
- **阻断项**
  - **运行时图片资产为“空仓”**：`game/assets/images/` 为空，但代码侧（`webpAssets.ts`、`pixelAssets.ts`）存在大量 `../../assets/images/...` 的硬引用，属于 **P0 级阻断**（构建/加载链路极易失败，且无法切换到 HYBRID/PRODUCTION）。
  - **场景 YAML 背景纹理 key 与系统映射不一致**：例如 `c0_z1.yaml` 使用 `bg_c0_z1_corridor`，而 Zone 映射与资源注册使用 `bg_c0z1_corridor`（见“引用完整性”）。

---

## 1) 资产完成率统计（仓库实况）

### 1.1 `game/assets/` 目录资产数量（按大类）

| 类别 | 目录 | 数量（当前仓库） | 备注 |
|---|---|---:|---|
| **images** | `game/assets/images/` | **0** | 目录存在但为空 |
| **audio** | `game/assets/audio/` | **49** | 仅 MP3；包含 BGM/SFX/AMB |
| **fonts** | `game/assets/fonts/` | **0** | 目录存在但为空（当前字体走 CSS/其他路径的可能性需另行确认） |
| **references** | `game/assets/references/anchors/` | **4** | 参考锚点 WebP（非运行时资源） |
| **bak（不纳入运行时统计）** | `game/assets/bak/` | **778（子树统计）** | 包含 `~754 *.webp, 14 *.svg, 8 *.png, ...`；QC 脚本默认跳过 |

> 注：`asset-qc.mjs` 默认跳过 `bak/` 与 `backup/`，因此上述 778 文件未进入“规范一致性”统计，只作为“潜在产出但未集成”的库存线索记录。

### 1.2 与《资产生产总清单 v2.0》的对照（完成率表格）

清单（`design/game/03-art/资产生产总清单_v2.md`）给出的“规划规模/文档自评完成率”如下：

| 类别 | 规划总量（清单） | 文档自评完成率 | 仓库已集成（运行时） | 结论 |
|---|---:|---:|---:|---|
| **场景Kit** | ~200 | 15% | **0（images 为空）** | 未集成，无法验证 |
| **角色资产** | ~100 | 25% | **0（images 为空）** | 未集成，无法验证 |
| **UI资产** | ~80 | 40% | **0（images 为空）** | 未集成，无法验证 |
| **VFX资产** | ~40 | 30% | **0（images 为空）** | 未集成，无法验证 |
| **音频资产** | ~85 | 70% | **49** | 已集成一部分（约 58% vs 规划量） |

---

## 2) 规范一致性检验（尺寸、格式、命名）

### 2.1 尺寸规格一致性（规范冲突点）

本次任务检查要点给出：
- **角色立绘：400×800**
- **角色精灵：128×192**
- **场景背景：适配竖屏**
- **格式：webp/svg/png**

但 Art Bible（`design/ai-native/01_bibles/art_bible.md`）与 QC 脚本（`game/scripts/qa/asset-qc.mjs`）采用的关键尺寸为：
- **背景**：750×1334（容差 10%）
- **角色立绘**：512×512（容差 20%）
- **角色精灵**：128×192（容差 20%）
- **头像**：128×128（容差 20%）

**结论**：存在**规格冲突**（角色立绘 400×800 vs 512×512）。当前仓库以 Art Bible/QC 脚本为准执行；若要改为 400×800，需要走 CR 同步更新 Art Bible + QC 脚本 + 相关加载/布局逻辑。

### 2.2 格式检查（运行时资产）

- **允许运行时格式（任务要求）**：`webp/svg/png`
- **实际运行时资产**
  - **audio**：全部为 `mp3`
  - **images**：`game/assets/images/` 为空（无可核验对象）
  - **references/anchors**：`webp`（4 个）

> 注：Art Bible 音频规范允许 `MP3 / OGG / WAV`（按类别不同），当前仓库以 MP3 为主，符合“可用”但可能需要后续做兼容（例如 iOS/Safari 的解码策略）。

### 2.3 命名规范检查（kebab-case vs snake_case 的冲突）

- **本任务检查要点**：kebab-case、无中文/空格
- **Art Bible + 工程脚本实际约束**：
  - `asset-qc.mjs` 与 `scripts/validate-assets.ts` 均要求 **snake_case（小写 + 下划线）**，并要求前缀（`bg_ / char_ / sprite_ / portrait_ / obj_ / icon_ / card_ / fx_ / bgm_ / sfx_ / amb_`）。

**QC 实测结果**（`node game/scripts/qa/asset-qc.mjs`）：
- `audio`（49）：**命名 100% 通过**（snake_case + 前缀）
- `images`（仅 `references/anchors` 4 个）：**4 个命名警告**（缺少前缀）

**结论**：
- 当前仓库“命名规范”实际上是 **snake_case（下划线）**，与本任务“kebab-case”存在规则冲突；需要在规范层做一次统一裁决（否则 QC/CI 与需求会互相打架）。

---

## 3) 引用完整性检验（Scene YAML → 资源 key → 磁盘文件）

### 3.1 Scene YAML 的纹理 key 机制（现状）

- `game/src/data/scenes/*.yaml` 里使用 `texture: <key>`（不带扩展名）引用纹理。
- 纹理 key 由预加载阶段注册（`game/src/scenes/PreloadScene.ts`），来源包括：
  - `game/src/data/webpAssets.ts`（WebP/SVG 背景、头像、物件、特效、可动物件帧）
  - `game/src/data/pixelAssets.ts`（像素 PNG 图标/序列/精灵表）

### 3.2 关键发现 A：代码侧存在大量“磁盘不存在”的图片引用（P0）

- `webpAssets.ts` 中对 `../../assets/images/...` 的引用计数：**164** 处
  - 其中 key 大致分布：portrait（54）、bg（47）、obj（29）、fx（10）+ animated 等
- `pixelAssets.ts` 中对 `../../assets/images/...` 的引用计数：**35** 处

而当前仓库：`game/assets/images/` **为空**。

**结论**：图片资源“注册表 → 磁盘文件”的链路为 **大面积断链**，属于 **P0 阻断**（需要先恢复 `game/assets/images/**` 资产供 Vite/Phaser 加载）。

### 3.3 关键发现 B：Scene YAML 背景 texture key 与 Zone/注册表不一致（P1）

示例（`game/src/data/scenes/c0_z1.yaml`）：
- Scene YAML：`background.texture: bg_c0_z1_corridor`
- Zone 映射：`game/src/config/zones.config.ts` 中 `C0-Z1.backgroundKey = bg_c0z1_corridor`
- 资源注册：`webpAssets.ts` 中存在 `bg_c0z1_corridor`

**影响**：
- `SceneAssembler` 在开启 `backgrounds` 正式资源时，会用 `config.background.texture` 去查纹理缓存；key 不一致会导致**无法使用正式背景**并回退到白盒背景。
- 目前 `CURRENT_ASSET_MODE = WHITEBOX_CONFIG`（默认白盒），短期不阻断开发，但会阻断后续切 HYBRID/PRODUCTION 的验收。

**建议**：
- 统一背景来源（建议二选一）：
  - **A**：Scene YAML 背景纹理 key 与 `zones.config.ts` 对齐（推荐）；
  - **B**：Scene YAML 不再承载背景纹理 key（由 `zones.config.ts` 单一来源驱动），并在解析时忽略/移除该字段。

### 3.4 Scene YAML `texture:` 引用分布（统计）

基于 `game/src/data/scenes/*.yaml` 的 `texture:` 字段统计（匹配行数，不去重）：

| texture key 前缀/模式 | 命中次数 | 覆盖文件数 | 说明 |
|---|---:|---:|---|
| `px_*` | 178 | 55 | 像素 PNG 资源（来自 `pixelAssets.ts`，依赖 `game/assets/images/pixel/**`） |
| `obj_*` | 104 | 44 | WebP 物件（来自 `webpAssets.ts`，依赖 `game/assets/images/objects/**`） |
| `anim_*` | 2 | 2 | WebP 可动物件帧（由 `PreloadScene` 注册 `anim_*_frame_<n>`） |
| `bg_c[0-9]_z*` | 1 | 1 | 发现 1 处“带 `_z`”的背景 key（`c0_z1.yaml`） |
| `bg_c[0-9]z*` | 6 | 6 | 发现 6 处“c0z1”风格背景 key（多为 RV/特定场景） |

**结论**：
- Scene YAML 对纹理的引用主要落在 `px_*` 与 `obj_*`；而当前 `game/assets/images/` 为空，导致这两类引用在“磁盘文件层”无法闭环。
- 少量 `bg_*` key 的命名存在多种风格（`bg_c0_z1_*` vs `bg_c0z1_*`），需要统一以避免“能加载但用不到”的情况。

### 3.5 音频引用完整性（配置 → 文件）

`game/src/data/audioConfig.ts` 中所有音频文件路径均以 `assets/audio/...` 引用；与仓库 `game/assets/audio/**` 结构一致（本次未发现缺失引用）。

---

## 4) QC 脚本可用性检验（`game/scripts/qa/asset-qc.mjs`）

### 4.1 可用性结论

- **可用**：可执行、可输出统计与问题详情、退出码符合约定（无 error 时为 0）。
- **覆盖边界**：
  - 仅检查“磁盘上存在的文件”
  - 默认跳过 `bak/backup`
  - 不校验“代码侧注册表（`webpAssets.ts` / `pixelAssets.ts`）指向的文件是否存在”

### 4.2 本次执行结果摘要（证据）

| 运行方式 | 总文件数 | 通过 | 警告 | 错误 | 主要问题 |
|---|---:|---:|---:|---:|---|
| `qc:assets`（all） | 53 | 49 | 4 | 0 | `references/anchors/*.webp` 缺少前缀 |
| `qc:audio` | 49 | 49 | 0 | 0 | 无 |
| `qc:images` | 4 | 0 | 4 | 0 | 同上（且无尺寸规格匹配 → size 检查全部 skipped） |

---

## 5) 问题清单（分级）

> 分级依据：P0 阻断 / P1 严重 / P2 一般 / P3 轻微（见 QA 分级规范）。

| ID | 级别 | 模块 | 问题描述 | 证据/定位 | 建议 |
|---|---|---|---|---|---|
| ART-001 | **P0** | 运行时图片资产 | `game/assets/images/` 为空，但 `webpAssets.ts`（164 处）与 `pixelAssets.ts`（35 处）引用 `../../assets/images/**`，图片链路断裂 | `game/assets/images/` 空；`webpAssets.ts`/`pixelAssets.ts` 大量 `new URL('../../assets/images/...')` | 先恢复/生成并入库 `game/assets/images/**`（或改造为运行时生成/远端拉取，但需 CR） |
| ART-002 | **P1** | Scene YAML 背景引用 | `c0_z1.yaml` 背景 key 为 `bg_c0_z1_corridor`，与 `zones.config.ts` / `webpAssets.ts` 的 `bg_c0z1_corridor` 不一致 | `game/src/data/scenes/c0_z1.yaml` vs `game/src/config/zones.config.ts` vs `game/src/data/webpAssets.ts` | 统一 key 命名与来源，避免切到 HYBRID/PRODUCTION 时背景回退白盒 |
| ART-003 | **P2** | 命名规范 | 本任务要求 kebab-case，但 Art Bible/QC/validate-assets 实际要求 snake_case（下划线） | `asset-qc.mjs`、`validate-assets.ts`、Art Bible 命名规则章节 | 规范裁决：统一为 snake_case 或 kebab-case；并同步文档与脚本（需 CR） |
| ART-004 | **P2** | QC 规则覆盖 | `references/anchors/*.webp` 缺少前缀触发 4 条警告（可能属于“参考素材”，不应按运行时规范） | `asset-qc.mjs` 输出 4 条 warning | 若 `references` 不参与运行时：QC 增加白名单或目录豁免；若参与运行时：补齐前缀并挂到规格表 |
| ART-005 | **P3** | Fonts | `game/assets/fonts/` 为空；字体是否由 CSS/外部引入未在本次审计范围内闭环 | 目录存在但为空 | 明确字体资产来源与打包策略（如走 `game/public` 或 CSS import），并补充到资产规范与验证脚本 |
| ART-006 | **P2** | 规格冲突 | 角色立绘尺寸：任务要求 400×800，但 Art Bible/QC 采用 512×512 | Art Bible 3.1 + `asset-qc.mjs` `IMAGE_SIZE_SPECS.char` | 规格层统一：确定最终立绘尺寸并同步到文档与 QC（需 CR） |

---

## 6) 建议行动（行动清单）

### 6.1 24 小时内（阻断解除）

- **恢复 `game/assets/images/**`**：
  - 若资源应由生成脚本产出：执行并把产物纳入版本管理（或明确为构建产物并补充 CI 缺失检查）。
  - 若资源应由美术入库：按 Art Bible 的目录树补齐最小集（至少 C0/C1 关键背景、物件、像素占位 PNG）。
- **补齐/统一背景 key**：以 `zones.config.ts` 的 `backgroundKey` 与 `webpAssets.ts` 的 key 为主线，清理 Scene YAML 中不一致的背景 key（或移除冗余字段）。

### 6.2 72 小时内（规范收敛）

- **命名规则裁决**：snake_case vs kebab-case（建议以现有脚本/文档为准，除非明确要迁移）。
- **QC 脚本策略**：
  - 明确 `references/` 是否为运行时资产；若否，加入豁免避免噪音；若是，补齐前缀并纳入尺寸规格。
- **补充自动化验收**：
  - 新增一个“注册表引用存在性”检查：扫描 `webpAssets.ts`/`pixelAssets.ts` 中的 `assets/images/...` 路径，校验磁盘文件存在（避免再次出现空仓）。
  - 新增一个“Scene texture key 可解析性”检查：Scene YAML 的 `texture` 必须可在（`pixelAssets.ts`/`webpAssets.ts`/占位纹理）中解析。

### 6.3 下版本（体验与兼容性）

- **音频格式兼容策略**：评估是否需要补充 `ogg` 或其他格式以适配目标浏览器（尤其移动端）。
- **字体资产闭环**：明确字体来源（CSS/本地文件/外链），并补充验证与审计项。

---

## 附录：审计执行证据（命令摘要）

- `node game/scripts/qa/asset-qc.mjs`
  - 总文件数 53；通过 49；警告 4；错误 0（警告均来自 `references/anchors/*.webp` 缺少前缀）
- `node game/scripts/qa/asset-qc.mjs --type audio`
  - 总文件数 49；通过 49；警告 0；错误 0
- `node game/scripts/qa/asset-qc.mjs --type image`
  - 总文件数 4；通过 0；警告 4；错误 0

