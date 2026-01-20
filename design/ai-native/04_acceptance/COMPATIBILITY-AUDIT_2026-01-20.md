# COMPATIBILITY-AUDIT（兼容性审计）- 2026-01-20

负责人：L2_qa_lead  
审计类型：COMPATIBILITY-AUDIT（静态审计 + 配置/代码证据核对）  
审计范围：
- 多端兼容性设计
- 响应式布局实现
- 浏览器 API 兼容性

参考与证据来源（只读）：
- Tech Bible：`design/ai-native/01_bibles/tech_bible.md`
- QA Bible：`design/ai-native/01_bibles/qa_bible.md`
- Phaser 配置：`game/src/main.ts`、`game/src/config/game.config.ts`
- 触控支持：`game/src/systems/input/TouchControls.ts`
- 构建/目标浏览器：`game/package.json`、`game/vite.config.ts`、`game/tsconfig.json`
- 存储：`game/src/scenes/BootScene.ts`、`game/src/systems/save/SaveManager.ts`、`game/src/systems/cloud/CloudSaveManager.ts`
- 资源格式：`game/src/data/webpAssets.ts`、`game/src/scenes/PreloadScene.ts`
- 音频：`game/src/systems/audio/AudioManager.ts`、`game/src/scenes/GameScene.ts`

目标平台（QA Bible 兼容性要求）：
- iOS Safari：必须通过
- Android Chrome：必须通过
- 微信小游戏：必须通过
- PC Chrome：必须通过

---

## 执行摘要（评分）

总评分（0-100）：**62 / 100（风险偏高，需整改后再宣称“全端通过”）**

评分拆解：
- 多端兼容性设计：**18 / 30**
- 响应式布局实现：**22 / 30**
- 浏览器 API 兼容性：**22 / 40**

结论摘要：
- **PC Chrome / Android Chrome（现代版本）**：基础可跑的概率高（输入/缩放/存储均有覆盖）。
- **iOS Safari**：当前存在**硬风险**（WebP 资产、构建 target 与 browserslist 的一致性问题、音频解锁策略不显式）。
- **微信小游戏**：当前工程形态更接近“浏览器 H5”，缺少小游戏适配层/构建产物形态，**通过概率低**。

---

## 兼容性设计检查（多端 + 响应式）

### 1) Phaser 缩放模式（FIT/RESIZE）

现状（证据）：
- `game/src/main.ts` 使用：
  - `scale.mode = Phaser.Scale.FIT`
  - `autoCenter = Phaser.Scale.CENTER_BOTH`
  - 固定设计尺寸 `width=750`、`height=1334`，并配置 `min/max`

评价：
- **优点**：`FIT + autoCenter` 对竖屏 H5 的“等比缩放 + 居中”稳定；`min/max` 提供了基本约束。
- **风险**：
  - 极端宽高比（超长屏/折叠屏外屏）会出现 letterbox，UI 若未考虑安全区（safe area），可能出现“按钮靠边被刘海/圆角遮挡”的体验问题。
  - 当前未见针对 `resize/orientationchange` 的显式 UI 重布局策略（尤其是触控虚拟按键位置）。

建议：
- 为 UI 与 TouchControls 增加“安全区 inset + 响应式重新布局”的机制（至少监听 `scene.scale.on('resize', ...)` 或统一的 `UILayoutManager`）。

### 2) 触控/键盘输入支持

现状（证据）：
- 键盘：`game/src/scenes/GameScene.ts` 使用 `createCursorKeys()` + `addKeys('W,A,S,D')`，并有 ESC/I 等功能键。
- 触控：`game/src/systems/input/TouchControls.ts` 提供虚拟摇杆 + 交互/能力按钮；`GameScene` 在 `_setupInput()` 初始化 TouchControls。
- `main.ts` 输入配置：`activePointers: 3`，`touch.capture: true`

评价：
- **覆盖完整**：PC 键鼠与移动触控均可用。
- **风险**：
  - `TouchControls._checkMobile()` 依赖 UA 正则 + `'ontouchstart' in window`，在 iPadOS（桌面级 UA）与部分混合设备上可能误判。
  - 触控按钮大小固定（如 40/30 半径），在小屏/高 DPI 设备上可用性差异可能较大（但总体仍可用）。

建议：
- 将“是否启用触控 UI”的判定升级为更稳健策略：结合 `navigator.maxTouchPoints`、`pointer: coarse`（CSS media）或 Phaser 的 `game.device.input.touch`。

### 3) HTML/CSS 响应式与移动端限制

现状（证据）：
- `game/index.html`：
  - `viewport-fit=cover`，`user-scalable=no`（更接近游戏态）
  - `#game-container` flex 居中；canvas `max-width/max-height:100%`
  - 禁止选择/长按、去除 tap highlight
- `game/src/main.ts`：对 `document.body touchmove` 做 `preventDefault`（`passive:false`）

评价：
- **符合“全屏游戏”常见做法**：避免页面滚动、缩放干扰。
- **风险**：
  - iOS Safari 对 `user-scalable=no`、滚动阻止在部分版本/策略下存在限制（非致命，但需真机验证）。
  - 微信小游戏环境不一定存在 DOM/CSS 概念（见下文“微信小游戏”风险）。

---

## API 兼容性分析（存储 / 音频 / Polyfill / 目标浏览器）

### 1) IndexedDB / LocalStorage 兼容处理

现状（证据）：
- `BootScene` 会检测 `window.indexedDB`，并尝试写入/删除 `localStorage` 做可用性探测。
- `SaveManager`：
  - `initialize()` 打开 IndexedDB 失败会 `fallbackToLocalStorage()`
  - 本地读写 localStorage 有 try/catch 包裹（`_writeToLocalStorage/_readFromLocalStorage`）
  - 但在 fallback 情况下 `deleteSave()` 的 `localStorage.removeItem(...)` 未 try/catch（潜在异常点）
- `CloudSaveManager`：
  - 直接 `indexedDB.open(...)` 获取本地存档（在 `try/catch` 里调用），并用 `localStorage` 存队列（try/catch 包裹）

风险点：
- iOS Safari（尤其隐私模式/受限环境）可能出现 IndexedDB 不可用或不稳定；目前 SaveManager 有回退，但 CloudSaveManager 的本地读取依赖 IndexedDB，云存档同步可能失效。
- localStorage 在某些环境（隐私/容量/策略）会抛异常；虽然多数写入点有保护，但仍有零散未保护点。

建议：
- 统一封装 `SafeStorage`（IndexedDB + localStorage + memory）并强制所有调用点使用，减少“零散直接访问 localStorage/indexedDB”。

### 2) 音频自动播放策略（iOS/Android/内嵌 WebView）

现状（证据）：
- 音频播放主要由 `AudioManager` 通过 Phaser Sound 系统触发。
- `GameScene` 会在进入 Zone 时调用 `audioManager.playBgm(...)`（只要对应音频在 cache 中存在）。
- 未发现显式的 “AudioContext unlock / sound.unlock” 逻辑（未检索到相关实现）。
- `main.ts` 在 `blur/focus` 时 `pauseAll()/resumeAll()`。

风险点：
- iOS Safari / 微信内嵌 WebView 通常要求“用户手势后才允许播放音频”。当前“开始游戏/按钮点击”属于用户手势，可能间接满足，但：
  - 若存在“自动进入场景”或“恢复存档后自动播放”的路径，仍可能触发播放失败。
  - `focus` 事件触发的 `resumeAll()` 不一定算用户手势，可能被策略拒绝（通常表现为音频不恢复）。

建议：
- 增加明确的音频解锁流程：在首次 `pointerdown`/`touchend` 时调用 Phaser 声音解锁/恢复逻辑，并在 UI 上给出“点按解锁声音”的兜底提示（仅当检测到未解锁时）。

### 3) Polyfill 配置

现状（证据）：
- 未发现显式 polyfill（未见 `core-js` / `regenerator-runtime` / legacy 插件等）。
- Vite 构建目标：`game/vite.config.ts` 中 `build.target = 'es2020'`；TS 目标：`game/tsconfig.json` `target=ES2020`

风险点（与目标平台冲突）：
- `game/package.json` 中 browserslist 为：`iOS >= 12`, `Android >= 8`, `Chrome >= 80`, `Safari >= 12`。
- **ES2020 语法/特性** 对 Safari 12（尤其 iOS 12）并不稳妥；这导致“声明支持 iOS 12”与“实际产物”不一致。

建议：
- 二选一（需要产品/技术决策并走 CR）：
  - **方案 A（收紧支持面）**：将 browserslist 最低版本提高到与 ES2020/WebP 能力一致的版本（更现实）。
  - **方案 B（扩大兼容面）**：引入 legacy 构建与必要 polyfill（如 `@vitejs/plugin-legacy`），并将 `build.target` 调整为更保守目标。

### 4) 目标浏览器配置（browserslist）

现状（证据）：
- `game/package.json` 明确配置了 browserslist。

评价：
- **有配置是加分项**，但需要确保：
  - 构建工具链实际使用该配置（当前 Vite `build.target` 直接写死 `es2020`，可能绕开 browserslist 的预期）。

### 5) 资源格式兼容（WebP）

现状（证据）：
- `game/src/data/webpAssets.ts` 大量使用 `.webp` 资源，并在 `PreloadScene` 中通过 `this.load.image(...)` 批量加载。

硬风险：
- iOS Safari 对 WebP 的支持与 iOS 版本强相关；若按 browserslist “iOS >= 12” 口径，则 **iOS 12/13 可能无法加载 WebP**，直接导致资源加载失败、无法进入游戏。

建议：
- 明确支持基线：
  - 如果必须“iOS Safari 通过”，建议把最低 iOS 版本与 WebP 支持对齐（或提供 PNG/JPG 回退机制）。
- 若走回退：在资源注册层做格式分流（WebP 优先 + PNG fallback），并在启动时基于能力检测选择资源表。

### 6) 微信小游戏（WeChat Mini Game）适配性

现状（证据）：
- 未发现 `wx.*`、小游戏适配层、小游戏构建产物配置。
- 代码依赖 DOM API：`document.getElementById(...)`、`window.addEventListener(...)`、`navigator.serviceWorker` 等。

结论：
- 当前更像“浏览器 H5（含微信内嵌浏览器）”，**不是微信小游戏形态**。

建议：
- 若 QA Bible 的“微信小游戏通过”是强约束，需要补齐：
  - 构建目标/运行时适配（无 DOM、资源加载/存储/音频策略差异）
  - 输入/生命周期适配（小游戏前后台、音频、网络）
  - 资源加载路径与缓存策略（小游戏包体/分包/远程资源）

---

## 问题清单（分级 + 证据 + 影响）

> 分级映射：P0=Blocker，P1=Critical，P2=Major，P3=Minor（对应 QA Bible 的严重等级语义）

### P0（阻断）

1. **iOS Safari 低版本与 WebP 资源不兼容风险**
   - **证据**：`game/src/data/webpAssets.ts`、`game/src/scenes/PreloadScene.ts` 全量加载 WebP。
   - **影响**：iOS Safari 若不支持 WebP，将出现资源加载失败 → 启动阻断。
   - **关联要求**：QA Bible “iOS Safari 通过”。

### P1（严重）

1. **browserslist 与构建 target 不一致（声明 iOS>=12，但产物 ES2020）**
   - **证据**：`game/package.json` browserslist；`game/vite.config.ts build.target='es2020'`；`game/tsconfig.json target=ES2020`。
   - **影响**：在 Safari 12/旧 WebView 上可能直接语法错误或关键 API 缺失。

2. **微信小游戏缺少适配层/构建形态**
   - **证据**：未发现 `wx.*` 与小游戏适配；同时广泛使用 DOM/serviceWorker。
   - **影响**：在小游戏环境无法运行（或需要大规模改造）。

### P2（一般）

1. **音频解锁策略不显式，依赖“用户点击路径”间接满足**
   - **证据**：未检索到显式 unlock；`GameScene` 会播放 BGM；`main.ts` 在 focus 时 resumeAll。
   - **影响**：iOS/微信内嵌环境可能出现“无声/无法恢复声音”的概率问题。

2. **localStorage/indexedDB 访问点零散，未全部统一 try/catch 与能力探测**
   - **证据**：`SaveManager.deleteSave()` 在 fallback 下直接 `localStorage.removeItem(...)`；其他系统中亦存在直接访问。
   - **影响**：隐私模式/受限存储环境下可能出现异常或功能降级不一致。

### P3（轻微）

1. **TouchControls 的移动端判定可能在混合设备上误判**
   - **证据**：UA 正则 + `'ontouchstart' in window`。
   - **影响**：少数设备上触控 UI 显示/隐藏不符合预期。

2. **安全区（刘海/圆角）未显式处理**
   - **证据**：未见 safe-area inset 计算与 UI 偏移；依赖 FIT 居中与留白。
   - **影响**：个别机型边缘 UI 可读性/可点性下降。

---

## 建议行动（按优先级）

### A 级（必须，影响“是否能宣称全端通过”）

1. **决策并对齐“最低支持版本/平台”**
   - Owner：L1_tech_director + L1_qa_director
   - 输出：更新“兼容性基线”决策（至少对齐 iOS 版本、微信小游戏是否必选）

2. **解决 WebP 与 iOS Safari 兼容矛盾**
   - Owner：L2_client_lead + L2_tools_lead
   - 路径：
     - 提高最低 iOS 版本（最省成本），或
     - 引入 PNG/JPG fallback（成本高但兼容面大）

3. **对齐 browserslist 与构建产物**
   - Owner：L2_client_lead
   - 路径：
     - 调整 `build.target` 与语法输出，或
     - 调整 browserslist 与发布声明

4. **微信小游戏：明确“是否必须支持”**
   - 若必须：需要单独的“小游戏适配 Spec + TaskPack”，并按小游戏环境重构（不建议在同一 PR 中硬改）。

### B 级（建议，显著降低线上概率问题）

1. **补齐音频解锁兜底**
   - Owner：L2_client_lead
   - 建议：首次用户手势后统一解锁音频，并对失败提示。

2. **统一封装 SafeStorage**
   - Owner：L2_client_lead
   - 建议：把 IndexedDB/localStorage 访问收敛到单一模块，避免散点失控。

### C 级（可选，体验优化）

1. **安全区适配（safe-area inset）**
2. **TouchControls 移动端判定升级**

---

## 附：平台通过性预估（当前代码基线）

| 平台 | 预估结论 | 主要阻塞/风险 |
|---|---|---|
| PC Chrome | 预计可通过 | 需回归存储与音频 |
| Android Chrome | 预计可通过 | 需关注音频策略与机型适配 |
| iOS Safari | **高风险** | WebP 资源 + ES2020 target + 音频解锁不显式 |
| 微信小游戏 | **高风险/大概率不通过** | 缺少小游戏适配层与构建形态，依赖 DOM/ServiceWorker |

