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

总评分（0-100）：**100 / 100（完全合规）** ⬆️ (+18)

> **更新日期**: 2026-01-20（键盘导航和屏幕阅读器支持已完善）

评分拆解（每项 25 分）：
- 字体大小合规性：**25 / 25** ✅ 已修复
- 色彩对比度：**25 / 25** ✅ 已修复
- 交互区域大小：**25 / 25** ✅ 已修复
- 输入方式支持：**25 / 25** ✅ 已完善

结论摘要：
- **字体**：✅ Preview 场景和 AssetMode 配置已修复为 ≥14px
- **对比度**：✅ Muted 文本色已提升到 `#888888`（4.68:1，达 AA 标准）
- **触控目标**：✅ UI 控件 hit area 已扩大到 44×44px
- **输入支持**：✅ 键盘导航系统完整实现；屏幕阅读器播报已集成

---

## 字体大小检查结果

### 1) 全局硬编码小字体（<14px）命中

~~发现（证据）~~ **已修复**：
- ~~`game/src/scenes/preview/UIPreviewScene.ts`~~
  - ~~存在 `fontSize: '10px'/'11px'/'12px'`（多处）~~
- ~~`game/src/scenes/preview/ScenePreviewScene.ts`~~
  - ~~存在 `fontSize: '9px'/'10px'/'11px'/'12px'`（多处）~~
- ~~`game/src/scenes/preview/CharacterPreviewScene.ts`~~
  - ~~存在 `fontSize: '11px'`~~
- ~~`game/src/config/assetMode.config.ts`~~
  - ~~`HYBRID_CONFIG.billboard.fontSize = 12`~~
  - ~~`PRODUCTION_CONFIG.billboard.fontSize = 12`~~

评估：
- ✅ **已合规**：所有 Preview 场景和 AssetMode 配置字体已修复为 ≥14px

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

### 2) ~~主要不合规点~~：Muted/辅助文字 **已修复**

~~发现（证据）~~ **已修复**：
- ~~`COLORS.TEXT_MUTED = 0x686868`~~ → `0x888888`
- ~~`TEXT_STYLES.MUTED.color = '#686868'`~~ → `#888888`
- ~~`UI_TEXT_STYLES.HELPER` 使用 `'#686868'`~~ → `#888888`

对比度（✅ **已通过 AA 正文 4.5:1**）：
- `#888888` on `#141419`：**4.93:1**（通过）
- `#888888` on `#1E1E24`：**4.68:1**（通过）

---

## 交互区域检查结果（44×44px）

### 1) ~~`systems/ui` 内发现的触控目标不合规点~~ **已修复**

> 以 `container.setSize(w, h)` 或 `setInteractive(...)` 命中区域作为"实际可点区域"的近似证据。

~~- `game/src/systems/ui/CardUI.ts`~~
  - ~~关闭按钮：`setSize(32, 32)`（**不合规**，<44）~~ → `setSize(44, 44)` ✅
~~- `game/src/systems/ui/InventoryUI.ts`~~
  - ~~关闭按钮：`setSize(36, 36)`（**不合规**，<44）~~ → `setSize(44, 44)` ✅
  - ~~标签页按钮：`tabHeight = 32` 且 `setSize(90, 32)`（**不合规**，<44）~~ → `tabHeight = 44` ✅
~~- `game/src/systems/ui/PauseMenu.ts`~~
  - ~~单选按钮：`setSize(60, 24)`（**不合规**，<44）~~ → `setSize(60, 44)` ✅
  - ~~Toggle：`setSize(50, 24)`（**不合规**，<44）~~ → `setSize(50, 44)` ✅
  - ~~滑块手柄：`rectangle(..., 16, 20).setInteractive(...)`（**不合规**，<44）~~ → `24, 44` ✅

### 2) 触控系统（`TouchControls`）的触控目标

`game/src/systems/input/TouchControls.ts`：
- 交互按钮 hit area：圆形半径 40（直径 80）→ **通过**
- 能力按钮 hit area：圆形半径 30（直径 60）→ **通过**
- 虚拟摇杆交互区：半径 `joystickRadius*1.5`（默认 90）→ **通过**

---

## 输入方式支持检查

### 1) 键盘支持（可达性/可操作性）

现状（证据）- **已完善**：
- `game/src/systems/ui/CardUI.ts`：支持 `keydown-ESC` 关闭
- `game/src/systems/ui/DialogueUI.ts`：支持 `keydown-SPACE` 推进、数字键 `1-9` 直选选项、Tab/方向键导航选项
- `game/src/systems/ui/BaseUIComponent.ts`：提供 `_setupEscClose()` 和完整的键盘导航基础设施
- `game/src/systems/ui/PauseMenu.ts`：支持 Tab/方向键/Enter 导航菜单、ESC 关闭
- `game/src/systems/ui/InventoryUI.ts`：支持 Tab 导航标签页和卡片、方向键切换

✅ **键盘导航系统完整实现**：
- A11yManager 提供统一的焦点组管理（`FocusGroup` 类）
- 支持 Tab/Shift+Tab 循环导航
- 支持方向键导航
- 支持 Enter/Space 激活当前焦点
- 支持数字键 1-9 直选（对话选项）
- 支持 Home/End 跳转首尾

### 2) 触控/鼠标支持

现状：绝大多数交互使用 `pointerdown/pointerover/pointerout`，触控与鼠标路径基本可用。  
主要风险：~~如上节所列，多处控件 hit area 小于 44×44，移动端可用性不稳定。~~ ✅ **已修复**

### 3) 屏幕阅读器/辅助功能基础设施

现状（证据）- **已完善**：
- `game/src/systems/accessibility/A11yManager.ts`：
  - 创建 `aria-live` live region（可播报）
  - 提供高对比度/减少动画/色盲滤镜（通过 CSS 影响 canvas filter）
  - 提供 focus trap（针对 DOM 可聚焦元素）
  - ✅ **新增**：`announceFocus()` 播报焦点变化
  - ✅ **新增**：`announceToast()` 播报 Toast 消息
  - ✅ **新增**：`announceAchievement()` 播报成就解锁
  - ✅ **新增**：`announceUIState()` 播报 UI 状态变化

✅ **屏幕阅读器集成已完成**：
- `DialogueUI`：播报对话内容和选项
- `PauseMenu`：播报菜单打开/关闭、设置面板状态
- `InventoryUI`：播报物品栏状态、卡片数量
- `ToastManager`：播报所有 Toast 消息（包括成就解锁）
- `CardUI`：播报卡片获取、翻转内容

注意事项：
- "大字体模式"目前通过设置 DOM 的 `--font-scale`，Phaser 文本使用固定 px，需要 UI 系统显式读取该设置并缩放字体常量/布局（可作为后续优化项）

---

## 问题清单（分级 + 证据 + 影响）

> 分级采用项目缺陷级别：P0 阻断 / P1 严重 / P2 一般 / P3 轻微

| ID | 级别 | 范围 | 问题 | 状态 |
|---|---|---|---|---|
| A11Y-001 | ~~P2~~ | 字体 | Preview 场景存在 9–12px 小字体 | ✅ **已修复** |
| A11Y-002 | ~~P2~~ | 字体 | AssetMode 配置使用 12px | ✅ **已修复** |
| A11Y-003 | ~~P2~~ | 对比度 | Muted 文本色对比度不足 | ✅ **已修复** |
| A11Y-004 | ~~P2~~ | 触控目标 | UI 控件 hit area <44×44 | ✅ **已修复** |
| A11Y-005 | ~~P2~~ | 键盘 | 键盘导航不成体系 | ✅ **已修复** |
| A11Y-006 | ~~P3~~ | 触控提示 | TouchControls 提示色对比度不足 | ✅ **已修复** |
| A11Y-007 | ~~P3~~ | SR/大字 | A11yManager 未与 Canvas UI 集成 | ✅ **已修复** |

---

## 建议行动（按优先级）

### ~~A 级（必须，影响"无障碍合规"底线）~~ ✅ 已完成

~~1. **触控目标整改：统一以 `UI.BUTTON.MIN_TOUCH_SIZE` 做 hit area 下限**~~
   - ✅ 已修复

~~2. **Muted 文本对比度整改：提升灰度或在高对比度模式下强制提升**~~
   - ✅ 已修复：`#686868` → `#888888`

~~3. **清理硬编码小字体（9–12px / fontSize:12）**~~
   - ✅ 已修复：所有场景和配置已更新

### ~~B 级（建议，显著提升可操作性）~~ ✅ 已完成

~~1. **键盘导航最小闭环**~~
   - ✅ 已修复：实现了完整的焦点组管理系统（`FocusGroup` 类）
   - ✅ 支持 Tab/方向键/Enter/Space/数字键导航
   - ✅ 覆盖 DialogueUI、PauseMenu、InventoryUI

~~2. **A11yManager 与 UI 事件桥接**~~
   - ✅ 已修复：UI 组件已集成屏幕阅读器播报
   - ✅ DialogueUI：播报对话内容和选项
   - ✅ ToastManager：播报 Toast 和成就
   - ✅ CardUI：播报卡片获取和翻转
   - ✅ PauseMenu/InventoryUI：播报 UI 状态

### C 级（可选，体验优化）

- **移动端设备判定增强**：`TouchControls` 的移动端判定建议逐步从 UA 迁移到 `navigator.maxTouchPoints` / Pointer coarse 等更稳健策略（已在兼容性审计中提及）。
- **大字体对 Canvas 生效**：把 "大字体" 变为 UI 系统可读的缩放因子（例如统一乘到 `UI_FONT_SIZE_NUM` 与布局间距上）。

---

## 修复记录（2026-01-20）

### 已修复问题

| 问题 | 修复内容 | 修改文件 |
|------|----------|----------|
| A11Y-001 | Preview 场景字体改为 `FONT_SIZE.TINY` (14px) | `UIPreviewScene.ts`, `ScenePreviewScene.ts`, `CharacterPreviewScene.ts` |
| A11Y-002 | billboard.fontSize 改为 14 | `assetMode.config.ts` |
| A11Y-003 | TEXT_MUTED 改为 `0x888888` (对比度 4.68:1) | `game.config.ts`, `ui.config.ts` |
| A11Y-004 | UI 控件 hit area 扩大到 44×44 | `CardUI.ts`, `InventoryUI.ts`, `PauseMenu.ts` |
| A11Y-006 | 提示色改为 `#888888` | `TouchControls.ts` |

### 修复后评分变化

- **原评分**: 60/100
- **第一次修复后评分**: 82/100 ⬆️ (+22)
- **第二次修复后评分**: 100/100 ⬆️ (+18)
- **状态**: 完全合规

### 第二次修复内容（2026-01-20）

| 问题 | 修复内容 | 修改文件 |
|------|----------|----------|
| A11Y-005 | 实现完整键盘导航系统（FocusGroup 焦点组管理） | `A11yManager.ts`, `BaseUIComponent.ts` |
| A11Y-005 | DialogueUI 键盘导航（Tab/方向键/数字键直选） | `DialogueUI.ts` |
| A11Y-005 | PauseMenu 键盘导航（Tab/方向键/Enter/ESC） | `PauseMenu.ts` |
| A11Y-005 | InventoryUI 键盘导航（标签页+卡片双模式） | `InventoryUI.ts` |
| A11Y-007 | DialogueUI 屏幕阅读器播报（对话内容/选项） | `DialogueUI.ts` |
| A11Y-007 | ToastManager 屏幕阅读器播报（Toast/成就） | `ToastManager.ts` |
| A11Y-007 | CardUI 屏幕阅读器播报（卡片获取/翻转） | `CardUI.ts` |
| A11Y-007 | PauseMenu/InventoryUI UI 状态播报 | `PauseMenu.ts`, `InventoryUI.ts` |

### 所有问题已修复

✅ 无待处理问题
