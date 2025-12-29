# UI Components Spec v1.0

> **层级**: L2 规格层
> **上游依赖**: art_bible.md, ui.config.ts
> **下游交付**: L3 UI程序执行岗

---

## 1. 概述

定义可复用的 UI 组件规格，包括样式、变体和交互。

---

## 2. 组件清单

| 组件 | 标识 | 变体数 |
|------|------|--------|
| 按钮 | `Button` | 3 |
| 文本 | `Text` | 3 |
| 面板 | `Panel` | 2 |
| 图标 | `Icon` | 2 |
| 对话框 | `Dialog` | 2 |
| 提示 | `Toast` | 3 |
| 进度条 | `ProgressBar` | 2 |
| 卡片 | `Card` | 2 |

---

## 3. Button 组件

### 3.1 变体（≤3）

| 变体 | 用途 | 样式 |
|------|------|------|
| `primary` | 主操作 | 填充色背景 |
| `secondary` | 次要操作 | 边框无填充 |
| `text` | 文字链接 | 无边框 |

### 3.2 状态

| 状态 | 样式变化 |
|------|----------|
| `normal` | 默认 |
| `hover` | 亮度+10% |
| `pressed` | 缩放95% |
| `disabled` | 透明度50% |

### 3.3 尺寸

```typescript
// 使用 UI.BUTTON 常量
const buttonSizes = {
  SM: { width: 100, height: 36 },
  MD: { width: 150, height: 44 },
  LG: { width: 200, height: 52 },
};
```

---

## 4. Text 组件

### 4.1 变体（≤3）

| 变体 | 用途 | 字号 |
|------|------|------|
| `heading` | 标题 | UI_FONT_SIZE.TITLE |
| `body` | 正文 | UI_FONT_SIZE.NORMAL |
| `caption` | 说明 | UI_FONT_SIZE.SMALL |

### 4.2 属性

```typescript
interface ITextProps {
  variant: 'heading' | 'body' | 'caption';
  color?: string;          // 默认 COLORS.TEXT
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;       // 自动换行
  lineSpacing?: number;    // 行间距
}
```

---

## 5. Panel 组件

### 5.1 变体（≤2）

| 变体 | 用途 | 样式 |
|------|------|------|
| `solid` | 实底面板 | 纯色背景+圆角 |
| `glass` | 毛玻璃 | 半透明+模糊 |

### 5.2 尺寸

```typescript
// 使用 UI.PANEL 常量
const panelSizes = {
  SM: { width: 300, height: 200 },
  MD: { width: 450, height: 350 },
  LG: { width: 600, height: 500 },
  FULL: { width: '100%', height: '100%' },
};
```

---

## 6. Dialog 组件

### 6.1 变体（≤2）

| 变体 | 用途 |
|------|------|
| `confirm` | 确认对话框（确定/取消） |
| `alert` | 提示对话框（仅确定） |

### 6.2 结构

```
┌──────────────────────────────────┐
│ [关闭]                    标题   │
├──────────────────────────────────┤
│                                  │
│            内容区域               │
│                                  │
├──────────────────────────────────┤
│         [取消]    [确定]         │
└──────────────────────────────────┘
```

---

## 7. Toast 组件

### 7.1 变体（≤3）

| 变体 | 用途 | 图标 |
|------|------|------|
| `info` | 普通提示 | ℹ️ |
| `success` | 成功提示 | ✓ |
| `error` | 错误提示 | ✗ |

### 7.2 行为

```typescript
interface IToastProps {
  type: 'info' | 'success' | 'error';
  message: string;
  duration?: number;  // 默认 3000ms
  position?: 'top' | 'bottom';
}
```

---

## 8. Card 组件

### 8.1 变体（≤2）

| 变体 | 用途 | 尺寸 |
|------|------|------|
| `thumbnail` | 列表展示 | UI.CARD.THUMB |
| `detail` | 详情展示 | UI.CARD.NORMAL |

### 8.2 交互

| 操作 | 效果 |
|------|------|
| 点击 | 显示详情 |
| 长按/右键 | 翻转卡片 |
| 滑动 | 切换上/下一张 |

---

## 9. 通用规范

### 9.1 间距系统

```typescript
// 使用 UI.SPACING 常量
const spacing = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
};
```

### 9.2 圆角系统

```typescript
// 使用 UI.RADIUS 常量
const radius = {
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
};
```

### 9.3 阴影

```typescript
const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0,0,0,0.1)',
  md: '0 4px 6px rgba(0,0,0,0.1)',
  lg: '0 10px 15px rgba(0,0,0,0.1)',
};
```

---

## 10. 边界约束

### 10.1 粒度限制
- 单组件变体: ≤3
- 组件状态: ≤6
- 嵌套层级: ≤3

### 10.2 禁区
- 禁止硬编码样式值
- 禁止组件内直接修改全局状态
- 禁止组件间直接通信（用事件）

---

## 11. 验收标准

- [ ] 变体数 ≤ 3
- [ ] 使用 ui.config.ts 常量
- [ ] 状态切换流畅
- [ ] 触控/键盘可用
- [ ] 无样式冲突

---

*版本: v1.0 | 创建: 2025-12-29 | 状态: 草案*

