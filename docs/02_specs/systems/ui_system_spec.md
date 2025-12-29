# UI System Spec v1.0

> **层级**: L2 规格层
> **上游依赖**: design_bible.md, art_bible.md
> **下游交付**: L3 UI程序执行岗

---

## 1. 系统概述

### 1.1 职责
UI系统负责管理所有用户界面组件的显示、交互和动画。

### 1.2 核心原则
- 状态驱动渲染
- 组件化设计
- 统一的动画系统

---

## 2. UI层级结构

```
UIManager
├── DialogueUI        # 对话界面
├── ChoiceUI          # 选择界面
├── CardUI            # 卡片展示
├── InventoryUI       # 背包/收集
├── PauseMenuUI       # 暂停菜单
├── ToastUI           # 提示消息
├── AbilityUI         # 能力界面
└── HUD               # 游戏内HUD
```

---

## 3. 状态定义（每组件 ≤6）

### 3.1 DialogueUI 状态

| 状态 | 说明 |
|------|------|
| `hidden` | 隐藏 |
| `showing` | 显示动画中 |
| `typing` | 打字机效果中 |
| `waiting` | 等待点击继续 |
| `hiding` | 隐藏动画中 |

### 3.2 CardUI 状态

| 状态 | 说明 |
|------|------|
| `hidden` | 隐藏 |
| `entering` | 进入动画 |
| `front` | 显示正面 |
| `flipping` | 翻转中 |
| `back` | 显示背面 |
| `exiting` | 退出动画 |

---

## 4. 接口定义

### 4.1 UIManager

```typescript
interface IUIManager {
  // 对话
  showDialogue(data: IDialogueData): void;
  hideDialogue(): void;
  
  // 选择
  showChoices(choices: IChoice[]): void;
  hideChoices(): void;
  
  // 卡片
  showCard(card: ICard): void;
  hideCard(): void;
  
  // 提示
  showToast(message: string, type?: ToastType): void;
  
  // 事件
  on(event: UIEvent, handler: Function): void;
}
```

### 4.2 组件基类

```typescript
abstract class UIComponent {
  protected scene: Phaser.Scene;
  protected container: Phaser.GameObjects.Container;
  protected state: ComponentState;
  
  abstract show(data?: any): Promise<void>;
  abstract hide(): Promise<void>;
  abstract update(data: any): void;
}
```

---

## 5. 动画规格

### 5.1 时长标准

| 动画类型 | 时长 | 缓动 |
|----------|------|------|
| 淡入/淡出 | 300ms | ease-out |
| 滑入/滑出 | 400ms | ease-in-out |
| 弹出 | 250ms | back-out |
| 翻转 | 500ms | linear |

### 5.2 打字机效果
- 字符间隔: 30ms
- 标点停顿: 150ms
- 可跳过: 是

---

## 6. 布局规格

### 6.1 屏幕区域

```
┌─────────────────────────────┐
│           HUD               │  ← 顶部状态栏
├─────────────────────────────┤
│                             │
│         游戏区域             │
│                             │
├─────────────────────────────┤
│       对话/选择区域          │  ← 底部交互区
└─────────────────────────────┘
```

### 6.2 对话框布局
- 位置: 底部
- 宽度: 屏幕宽度 - 32px
- 高度: 200px
- 头像: 左侧 100×100px

---

## 7. 响应式规则

### 7.1 断点
| 断点 | 宽度 | 适配 |
|------|------|------|
| mobile | ≤750px | 竖屏标准 |
| tablet | 751-1024px | 适度放大 |
| desktop | ≥1025px | 居中限宽 |

### 7.2 字体缩放
- 使用 `UI_FONT_SIZE` 常量
- 最小字体: 14px

---

## 8. 边界约束

### 8.1 粒度限制
- 单界面状态: ≤6
- 单组件变体: ≤3
- 动画队列深度: ≤5

### 8.2 禁区
- 禁止直接操作 DOM
- 禁止硬编码尺寸/颜色
- 禁止阻塞主线程的动画

---

## 9. 验收标准

- [ ] 每组件状态数 ≤ 6
- [ ] 使用 `ui.config.ts` 常量
- [ ] 动画可打断
- [ ] 响应式适配
- [ ] 无内存泄漏

---

*版本: v1.0 | 创建: 2025-12-29 | 状态: 草案*

