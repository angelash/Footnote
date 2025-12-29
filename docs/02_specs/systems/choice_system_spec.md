# Choice System Spec v1.0

> **层级**: L2 规格层
> **上游依赖**: design_bible.md, narrative_system_spec.md
> **下游交付**: L3 执行岗

---

## 1. 系统概述

### 1.1 职责
选择系统负责管理玩家在对话中的分支选择，包括选项显示、条件过滤和效果执行。

### 1.2 核心原则
- 每次选择最多 3 个选项
- 选择结果影响 R/P/W 计数器
- 支持条件隐藏/禁用选项

---

## 2. 选项约束

### 2.1 数量限制
| 场景 | 最大选项数 |
|------|-----------|
| 普通对话 | 3 |
| 关键决策 | 3 |
| 快速反应 | 2 |

### 2.2 显示规则
- 选项按定义顺序显示
- 条件不满足的选项：隐藏或灰显（可配置）
- 至少保留 1 个可选选项

---

## 3. 选项类型

| 类型 | 说明 | R值影响 |
|------|------|---------|
| `standard` | 标准流程选项 | 0 |
| `no_reward` | 无奖励选项 | +1~3 |
| `risky` | 高风险选项 | +P |
| `hidden` | 隐藏选项（需条件） | 变化 |

---

## 4. 接口定义

### 4.1 选项数据

```typescript
interface IChoice {
  id: string;              // 唯一标识
  text_id: string;         // 显示文本键
  type: ChoiceType;        // 选项类型
  conditions?: ICondition[]; // 显示条件
  disabled_conditions?: ICondition[]; // 禁用条件
  effects?: IEffect[];     // 选择效果
  next_event: string;      // 后续事件
}

type ChoiceType = 'standard' | 'no_reward' | 'risky' | 'hidden';
```

### 4.2 选择效果

```typescript
interface IEffect {
  type: 'counter' | 'flag' | 'card' | 'ability' | 'foreshadow';
  target: string;
  value: number | boolean | string;
}
```

---

## 5. R值选择规则

### 5.1 无奖励选项判定
满足以下条件的选项被标记为 `no_reward`：
- 不推进主线剧情
- 不获得物品/卡片
- 不解锁能力
- 不增加进度

### 5.2 R值累积
```typescript
// R值计算
function calculateRFromChoice(choice: IChoice): number {
  if (choice.type === 'no_reward') {
    return choice.effects?.find(e => e.target === 'R')?.value ?? 1;
  }
  return 0;
}
```

---

## 6. UI规格

### 6.1 选项按钮
- 尺寸: 600×60px（可配置）
- 间距: 16px
- 最大文字: 30字符

### 6.2 状态样式
| 状态 | 样式 |
|------|------|
| `normal` | 默认背景 |
| `hover` | 高亮边框 |
| `pressed` | 按下效果 |
| `disabled` | 灰色，不可点击 |

---

## 7. 选择记录

### 7.1 记录结构

```typescript
interface IChoiceRecord {
  event_id: string;      // 所属事件
  choice_id: string;     // 选择的选项
  timestamp: number;     // 选择时间
  r_delta: number;       // R值变化
  p_delta: number;       // P值变化
}
```

### 7.2 存档集成
- 选择记录保存到 `WorldState.choices`
- 用于结局判定和回顾功能

---

## 8. 边界约束

### 8.1 粒度限制
- 单次选择: ≤3 个选项
- 选项文本: ≤30 字符
- 效果数量: ≤3 个/选项

### 8.2 禁区
- 禁止超过 3 个选项
- 禁止无后续事件的选项
- 禁止选项文本硬编码

---

## 9. 验收标准

- [ ] 选项数量 ≤ 3
- [ ] 所有 text_id 存在
- [ ] 条件逻辑可测试
- [ ] R值变化有记录
- [ ] UI状态完整

---

*版本: v1.0 | 创建: 2025-12-29 | 状态: 草案*

