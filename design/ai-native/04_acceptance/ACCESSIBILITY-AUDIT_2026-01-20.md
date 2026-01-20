# ACCESSIBILITY-AUDIT（可访问性审计）- 2026-01-20

负责人：L2_qa_lead  
审计类型：ACCESSIBILITY-AUDIT（静态审计 + 代码证据核对）  
审计范围：
- 字体大小合规性
- 色彩对比度
- 交互区域大小（最小触控目标）
- 输入方式支持（键盘/触控）

参考与证据来源（只读）：
- UI 规范：`.cursor/rules/08-ui-qa-rules.mdc`
- UI 配置：`game/src/config/ui.config.ts`
- UI 组件：`game/src/systems/ui/*.ts`
- 颜色/文本样式：`game/src/config/game.config.ts`
- 触控系统：`game/src/systems/input/TouchControls.ts`
- 无障碍管理器：`game/src/systems/accessibility/A11yManager.ts`

合规要求（摘录）：
- 绝对最小字体：**14px**（`UI_FONT_SIZE.TINY`）
- 点击/触控区域最小：**44×44px**（`UI.BUTTON.MIN_TOUCH_SIZE = 44`）
- 所有字体大小必须使用 `UI_FONT_SIZE` 常量（禁止 `'12px'` 等硬编码）

---

## 执行摘要（评分）

总评分（0-100）：**60 / 100（中风险：存在明确不合规点，需整改后再对外宣称“无障碍达标”）**

评分拆解（每项 25 分）：
- 字体大小合规性：**20 / 25**
- 色彩对比度：**14 / 25**
- 交互区域大小：**14 / 25**
- 输入方式支持：**12 / 25**

结论摘要：
- **字体**：运行时 UI（`game/src/systems/ui`）整体已迁移到 `UI_FONT_SIZE`；但 **Preview 场景**与**AssetMode 配置**仍存在 `9px-12px` 与 `fontSize: 12`。
- **对比度**：主文字颜色组合对比度充足，但 **“Muted/辅助文字”颜色（#686868）在常用深色背景上不达标**（AA 4.5:1）。
- **触控目标**：多处 UI 控件的实际交互 `setSize(...)` 小于 44×44（关闭按钮/标签页/单选/开关/滑块手柄）。
- **输入支持**：触控与鼠标点击覆盖较完整；键盘仅覆盖少数快捷键（ESC/SPACE），缺少“可聚焦/可导航/可确认”的一致键盘可用性设计；屏幕阅读器具备 Live Region 基础设施但未见与 Canvas UI 的系统性串联。

---

## 字体大小检查结果

### 1) 全局硬编码小字体（<14px）命中

发现（证据）：
- `game/src/scenes/preview/UIPreviewScene.ts`
  - 存在 `fontSize: '10px'/'11px'/'12px'`（多处）
- `game/src/scenes/preview/ScenePreviewScene.ts`
  - 存在 `fontSize: '9px'/'10px'/'11px'/'12px'`（多处）
- `game/src/scenes/preview/CharacterPreviewScene.ts`
  - 存在 `fontSize: '11px'`
- `game/src/config/assetMode.config.ts`
  - `HYBRID_CONFIG.billboard.fontSize = 12`
  - `PRODUCTION_CONFIG.billboard.fontSize = 12`

评估：
- **不合规**：违反“最小 14px + 禁止硬编码字体大小”的 UI 规范要求（即便是 Preview/白盒配置，也建议保持一致性，避免回归遗漏）。

### 2) UI 组件是否使用 `UI_FONT_SIZE` 常量

检查范围：`game/src/systems/ui/*.ts`  
结果：未发现 `fontSize: '12px'` 这类硬编码；当前 `systems/ui` 内字体大小以 `UI_FONT_SIZE.*` 为主（通过）。

---

## 色彩对比度检查结果

### 1) 核心配色对比度（基于 `game/src/config/game.config.ts`）

对比度计算结果（WCAG 对比度比值）：
- `#E8E6E3`（TEXT_PRIMARY） on `#141419`（BG_SECONDARY）：**14.74:1**（通过 AA/AAA）
- `#A8A6A3`（TEXT_SECONDARY） on `#141419`：**7.56:1**（通过 AA/AAA）
- `#00FFAA`（ACCENT） on `#141419`：**13.89:1**（通过 AA/AAA）
- `#4A9EFF`（ACCENT_SYSTEM） on `#141419`：**6.67:1**（通过 AA/AAA）
- `#FF3333`（ERROR） on `#141419`：**5.05:1**（通过 AA）

### 2) 主要不合规点：Muted/辅助文字

发现（证据）：
- `COLORS.TEXT_MUTED = 0x686868`
- `TEXT_STYLES.MUTED.color = '#686868'`
- `UI_TEXT_STYLES.HELPER` 使用 `'#686868'`

对比度（不通过 AA 正文 4.5:1）：
- `#686868` on `#141419`：**3.29:1**（不通过）
- `#686868` on `#1E1E24`：**2.98:1**（不通过）

触控系统附带风险：
- `game/src/systems/input/TouchControls.ts` 中快捷键提示色 `#666666` 在 `#1A1A2E` 上对比度约 **2.97:1**（不通过）

建议（方向）：
- 将 “Muted/辅助文字”颜色提升到 **至少 `#888888`**（在 `#1E1E24` 上约 **4.68:1**，可满足 AA 正文 4.5:1）。
- 对“仅装饰/非关键信息”的文字，仍建议满足 AA；若确需降低层级，建议配套“高对比度模式默认开启”或在高对比度模式下强制提升该类颜色。

---

## 交互区域检查结果（44×44px）

### 1) `systems/ui` 内发现的触控目标不合规点

> 以 `container.setSize(w, h)` 或 `setInteractive(...)` 命中区域作为“实际可点区域”的近似证据。

- `game/src/systems/ui/CardUI.ts`
  - 关闭按钮：`setSize(32, 32)`（**不合规**，<44）
- `game/src/systems/ui/InventoryUI.ts`
  - 关闭按钮：`setSize(36, 36)`（**不合规**，<44）
  - 标签页按钮：`tabHeight = 32` 且 `setSize(90, 32)`（**不合规**，<44）
- `game/src/systems/ui/PauseMenu.ts`
  - 单选按钮：`setSize(60, 24)`（**不合规**，<44）
  - Toggle：`setSize(50, 24)`（**不合规**，<44）
  - 滑块手柄：`rectangle(..., 16, 20).setInteractive(...)`（**不合规**，<44）

### 2) 触控系统（`TouchControls`）的触控目标

`game/src/systems/input/TouchControls.ts`：
- 交互按钮 hit area：圆形半径 40（直径 80）→ **通过**
- 能力按钮 hit area：圆形半径 30（直径 60）→ **通过**
- 虚拟摇杆交互区：半径 `joystickRadius*1.5`（默认 90）→ **通过**

---

## 输入方式支持检查

### 1) 键盘支持（可达性/可操作性）

现状（证据）：
- `game/src/systems/ui/CardUI.ts`：支持 `keydown-ESC` 关闭
- `game/src/systems/ui/DialogueUI.ts`：支持 `keydown-SPACE` 推进
- `game/src/systems/ui/BaseUIComponent.ts`：提供 `_setupEscClose()` 公共能力（ESC 关闭）

缺口（审计结论）：
- 缺少“键盘导航”的通用方案：
  - 未见 `TAB`/方向键 对 UI 元素的聚焦/切换逻辑（Inventory tabs、PauseMenu 选项、Dialogue choices 等）
  - 未见 `ENTER/SPACE` 对“当前聚焦控件”的统一确认逻辑
  - 未见对话选项的键盘直达（如 `1/2/3` 选择选项）

### 2) 触控/鼠标支持

现状：绝大多数交互使用 `pointerdown/pointerover/pointerout`，触控与鼠标路径基本可用。  
主要风险：如上节所列，多处控件 hit area 小于 44×44，移动端可用性不稳定。

### 3) 屏幕阅读器/辅助功能基础设施

现状（证据）：
- `game/src/systems/accessibility/A11yManager.ts`：
  - 创建 `aria-live` live region（可播报）
  - 提供高对比度/减少动画/色盲滤镜（通过 CSS 影响 canvas filter）
  - 提供 focus trap（针对 DOM 可聚焦元素）

缺口（审计结论）：
- 主要 UI 为 **canvas（Phaser）** 渲染，缺少可被 SR 直接解析的语义结构；当前未见 `DialogueUI/Toast/...` 对 `a11yManager.announce*` 的系统性调用链路（即“有能力但未串起来”）。
- “大字体模式”目前通过设置 DOM 的 `--font-scale`，但 Phaser 文本使用固定 px，**对 canvas 文本不一定生效**（需要 UI 系统显式读取该设置并缩放字体常量/布局）。

---

## 问题清单（分级 + 证据 + 影响）

> 分级采用项目缺陷级别：P0 阻断 / P1 严重 / P2 一般 / P3 轻微

| ID | 级别 | 范围 | 问题 | 影响 | 证据（文件/要点） |
|---|---|---|---|---|---|
| A11Y-001 | P2 | 字体 | Preview 场景存在 9–12px 小字体与硬编码 px | 违反规范，易导致回归遗漏；在开发/演示场景可读性差 | `game/src/scenes/preview/*PreviewScene.ts` 多处 `fontSize:'9px'~'12px'` |
| A11Y-002 | P2 | 字体 | AssetMode 配置在 Hybrid/Production 使用 12px | 白盒/标签字体不达最小 14px | `game/src/config/assetMode.config.ts` `fontSize: 12` |
| A11Y-003 | P2 | 对比度 | Muted 文本色 `#686868` 在深色背景上不达 AA | 辅助信息不可读/低视力用户困难 | `game/src/config/game.config.ts`（`TEXT_MUTED` / `TEXT_STYLES.MUTED`）；对比度 2.98~3.29 |
| A11Y-004 | P2 | 触控目标 | 多处 UI 控件 hit area <44×44 | 移动端误触/难点，影响可用性 | `CardUI` close 32×32；`InventoryUI` close 36×36 + tab 32h；`PauseMenu` radio/toggle/slider handle |
| A11Y-005 | P2 | 键盘 | 键盘导航与确认不成体系，仅覆盖 ESC/SPACE | 键盘用户无法完成 UI 操作（选项/菜单/设置） | `systems/ui` 未见 `TAB/ENTER` 导航；未见 focus 管理 |
| A11Y-006 | P3 | 触控提示 | `TouchControls` 提示色 `#666666` 对比度不足 | 快捷键提示难读（非阻断） | `game/src/systems/input/TouchControls.ts`（hint color） |
| A11Y-007 | P3 | SR/大字 | A11yManager 能力未与 Canvas UI 系统性集成；大字对 canvas 不确定生效 | SR 可用性与“可调字体”目标未闭环 | `game/src/systems/accessibility/A11yManager.ts` vs `systems/ui` 未见调用链 |

---

## 建议行动（按优先级）

### A 级（必须，影响“无障碍合规”底线）

1. **触控目标整改：统一以 `UI.BUTTON.MIN_TOUCH_SIZE` 做 hit area 下限**
   - Owner：L2_client_lead / L2_ui_lead
   - 建议做法：视觉可保持小尺寸，但交互区域用 `setSize(44,44)` 或自定义 hit area（invisible rect/circle）
   - 覆盖点：`CardUI` 关闭；`InventoryUI` 关闭与 tabs；`PauseMenu` 单选/开关/滑块手柄

2. **Muted 文本对比度整改：提升灰度或在高对比度模式下强制提升**
   - Owner：L2_ui_lead
   - 建议：将 `#686868` 提升到 **`#888888`**（在 `#1E1E24` 上约 4.68:1，可达 AA 正文）

3. **清理硬编码小字体（9–12px / fontSize:12）**
   - Owner：L2_client_lead
   - 建议：Preview 场景与 AssetMode 配置统一上调到 ≥14，并改用 `UI_FONT_SIZE/UI_FONT_SIZE_NUM`（避免散点回归）

### B 级（建议，显著提升可操作性）

1. **键盘导航最小闭环**
   - Owner：L2_client_lead
   - 建议：为对话选项/菜单/设置面板提供方向键/Tab 聚焦与 Enter/Space 确认；对话选项可加入 `1/2/3` 直选（与 SR 播报一致）

2. **A11yManager 与 UI 事件桥接**
   - Owner：L2_client_lead
   - 建议：在 `DialogueUI/Toast/...` 等关键 UI 输出点调用 `a11yManager.announce*`，至少覆盖：
     - 对话开始/角色名/句子更新（合并节流）
     - 选项列表（含序号）
     - Toast/系统提示（assertive/polite 分级）

### C 级（可选，体验优化）

- **移动端设备判定增强**：`TouchControls` 的移动端判定建议逐步从 UA 迁移到 `navigator.maxTouchPoints` / Pointer coarse 等更稳健策略（已在兼容性审计中提及）。
- **大字体对 Canvas 生效**：把 “大字体” 变为 UI 系统可读的缩放因子（例如统一乘到 `UI_FONT_SIZE_NUM` 与布局间距上）。

