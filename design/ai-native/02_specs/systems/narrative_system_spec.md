# Narrative System Spec v1.0

> **层级**: L2 规格层
> **上游依赖**: design_bible.md, tech_bible.md
> **下游交付**: L3 执行岗任务包

---

## 1. 系统概述

### 1.1 职责
叙事引擎负责驱动游戏的叙事流程，包括对话、事件、卡片、伏笔的触发和管理。

### 1.2 核心目标
- 提供可预测的叙事状态机
- 支持分支叙事和条件触发
- 管理 R/P/W 计数器的叙事反馈

---

## 2. 状态定义（≤6个）

| 状态 | 说明 | 允许转换 |
|------|------|----------|
| `IDLE` | 空闲，等待触发 | → DIALOGUE, EVENT |
| `DIALOGUE` | 对话进行中 | → IDLE, CHOICE |
| `CHOICE` | 等待玩家选择 | → DIALOGUE, EVENT |
| `EVENT` | 事件处理中 | → IDLE, DIALOGUE |
| `ABILITY` | 能力使用中 | → IDLE, EVENT |
| `CUTSCENE` | 过场动画 | → IDLE |

---

## 3. 接口定义

### 3.1 输入接口

```typescript
interface INarrativeInput {
  // 触发对话
  startDialogue(dialogueId: string): void;
  
  // 触发事件
  triggerEvent(eventId: string): void;
  
  // 玩家选择
  makeChoice(choiceIndex: number): void;
  
  // 跳过当前
  skip(): void;
}
```

### 3.2 输出接口

```typescript
interface INarrativeOutput {
  // 事件总线
  on(event: NarrativeEvent, handler: Function): void;
  off(event: NarrativeEvent, handler: Function): void;
  
  // 状态查询
  getCurrentState(): NarrativeState;
  getCurrentDialogue(): IDialogue | null;
  getPendingChoices(): IChoice[];
}

type NarrativeEvent = 
  | 'dialogue:start'
  | 'dialogue:line'
  | 'dialogue:end'
  | 'choice:show'
  | 'choice:made'
  | 'event:trigger'
  | 'card:obtain'
  | 'ability:unlock'
  | 'counter:change';
```

---

## 4. 数据依赖

### 4.1 对话数据
- 路径: `src/data/dialogues/*.yaml`
- Schema: 参考 tech_bible.md §4.2

### 4.2 事件数据
- 路径: `src/data/events/*.yaml`
- Schema: 参考 event_system_spec.md

### 4.3 卡片数据
- 路径: `src/data/cards/*.yaml`
- Schema: 参考 design_bible.md §4

---

## 5. 计数器交互

### 5.1 R值触发点
| 触发条件 | R变化 | 叙事反馈 |
|----------|-------|----------|
| 无奖励选择 | +1~3 | 无直接反馈 |
| R ≥ 3 | - | 系统语气微变 |
| R ≥ 6 | - | 首次判定句 |
| R ≥ 10 | - | 模型改写路径 |

### 5.2 P值触发点
| 能力使用 | P变化 |
|----------|-------|
| 深度感知 | +0 |
| 深度介入 | +2 |
| 时间干预 | +3 |

---

## 6. 边界约束

### 6.1 粒度限制
- 单对话场景: ≤12轮
- 单对话句: ≤60字
- 单事件脚本: ≤120行

### 6.2 禁区
- 禁止在对话中直接修改 WorldState（通过事件触发）
- 禁止硬编码文本（必须使用 text_id）
- 禁止跳过伏笔校验

---

## 7. 验收标准

- [ ] 状态机状态数 ≤ 6
- [ ] 所有接口有 TypeScript 类型定义
- [ ] 对话数据通过 Schema 校验
- [ ] R/P/W 变化有日志记录
- [ ] 单元测试覆盖核心流程

---

## 8. 相关文档

- 设计总纲: `design/ai-native/01_bibles/design_bible.md`
- 技术总纲: `design/ai-native/01_bibles/tech_bible.md`
- 事件系统: `design/ai-native/02_specs/systems/event_system_spec.md`
- 选择系统: `design/ai-native/02_specs/systems/choice_system_spec.md`

---

*版本: v1.0 | 创建: 2025-12-29 | 状态: 草案*

