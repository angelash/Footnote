# UI Flow Spec v1.0

> **层级**: L2 规格层
> **上游依赖**: design_bible.md, art_bible.md
> **下游交付**: L3 UI程序执行岗

---

## 1. 概述

定义游戏中所有 UI 界面的流转逻辑和导航规则。

---

## 2. 界面清单

| 界面 | 标识 | 说明 |
|------|------|------|
| 启动画面 | `SplashScreen` | Logo展示 |
| 主菜单 | `MainMenu` | 游戏入口 |
| 游戏场景 | `GameScene` | 主游戏界面 |
| 对话界面 | `DialogueUI` | 对话交互 |
| 选择界面 | `ChoiceUI` | 分支选择 |
| 暂停菜单 | `PauseMenu` | 暂停功能 |
| 设置界面 | `SettingsUI` | 游戏设置 |
| 存档界面 | `SaveUI` | 存档管理 |
| 卡片详情 | `CardUI` | 卡片展示 |
| 背包界面 | `InventoryUI` | 收集总览 |

---

## 3. 流程图

```
┌─────────────┐
│ SplashScreen│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MainMenu   │ ◄──────────────────┐
└──────┬──────┘                    │
       │                           │
       ├── [新游戏] ──────────────►│
       │                           │
       ├── [继续] ─────► SaveUI ──►│
       │                           │
       └── [设置] ─────► SettingsUI│
                                   │
┌─────────────┐                    │
│  GameScene  │ ◄──────────────────┘
└──────┬──────┘
       │
       ├── [对话触发] ──► DialogueUI
       │                      │
       │                      └── [选择] ──► ChoiceUI
       │
       ├── [查看卡片] ──► InventoryUI ──► CardUI
       │
       ├── [暂停] ──────► PauseMenu
       │                      │
       │                      ├── [继续]
       │                      ├── [设置] ──► SettingsUI
       │                      ├── [存档] ──► SaveUI
       │                      └── [退出] ──► MainMenu
       │
       └── [区域切换] ──► [过渡动画] ──► GameScene
```

---

## 4. 界面转场

### 4.1 转场类型

| 类型 | 时长 | 使用场景 |
|------|------|----------|
| `fade` | 500ms | 主菜单→游戏 |
| `slide` | 400ms | 弹窗进出 |
| `instant` | 0ms | 紧急操作 |
| `custom` | 变化 | 特殊剧情 |

### 4.2 转场规则

```typescript
interface ITransition {
  from: ScreenId;
  to: ScreenId;
  type: TransitionType;
  duration: number;
  canInterrupt: boolean;
}

const transitions: ITransition[] = [
  { from: 'SplashScreen', to: 'MainMenu', type: 'fade', duration: 500, canInterrupt: false },
  { from: 'MainMenu', to: 'GameScene', type: 'fade', duration: 800, canInterrupt: false },
  { from: 'GameScene', to: 'PauseMenu', type: 'slide', duration: 300, canInterrupt: true },
  // ...
];
```

---

## 5. 导航栈

### 5.1 栈管理

```typescript
interface INavigationStack {
  push(screen: ScreenId): void;
  pop(): ScreenId | null;
  peek(): ScreenId | null;
  clear(): void;
  canGoBack(): boolean;
}
```

### 5.2 返回规则
- 弹窗类（PauseMenu, SettingsUI）：返回上一界面
- 全屏类（MainMenu, GameScene）：清空栈

---

## 6. 输入处理

### 6.1 快捷键

| 按键 | 界面 | 功能 |
|------|------|------|
| `ESC` | GameScene | 打开/关闭暂停 |
| `I` | GameScene | 打开/关闭背包 |
| `Space` | DialogueUI | 继续/跳过 |
| `1-3` | ChoiceUI | 快速选择 |

### 6.2 触控手势

| 手势 | 界面 | 功能 |
|------|------|------|
| 点击 | DialogueUI | 继续 |
| 左滑 | CardUI | 翻转卡片 |
| 下拉 | InventoryUI | 关闭 |

---

## 7. 状态保持

### 7.1 保持状态的界面
- `GameScene`: 切换到暂停/设置时保持
- `InventoryUI`: 查看卡片详情时保持

### 7.2 重置状态的界面
- `MainMenu`: 每次进入重置
- `DialogueUI`: 每次显示重置

---

## 8. 边界约束

### 8.1 粒度限制
- 导航深度: ≤5 层
- 同时显示弹窗: ≤2 个
- 转场队列: ≤3 个

### 8.2 禁区
- 禁止无限循环导航
- 禁止转场期间操作
- 禁止跳过必要确认

---

## 9. 验收标准

- [ ] 所有界面可达
- [ ] 返回逻辑正确
- [ ] 转场动画流畅
- [ ] 快捷键响应
- [ ] 无死循环

---

*版本: v1.0 | 创建: 2025-12-29 | 状态: 草案*

