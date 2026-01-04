# Event System Spec v1.0

> **层级**: L2 规格层
> **上游依赖**: tech_bible.md
> **下游交付**: L3 脚本执行岗

---

## 1. 系统概述

### 1.1 职责
事件系统负责定义和执行游戏中的脚本化行为序列，包括条件判断、动作执行和流程控制。

### 1.2 核心原则
- 数据驱动，不在脚本中硬编码逻辑
- 条件与动作分离
- 支持嵌套和分支

---

## 2. Event Schema

### 2.1 事件结构

```yaml
# Event 数据结构
event_id: string          # 唯一标识，如 "C0_Z1_ENTRY"
type: EventType           # 事件类型
conditions: Condition[]   # 触发条件（可选）
actions: Action[]         # 执行动作
next: string | null       # 下一个事件ID
choices: Choice[]         # 选择分支（choice类型专用）
```

### 2.2 事件类型

| 类型 | 说明 | 特殊字段 |
|------|------|----------|
| `dialogue` | 对话事件 | speaker, text_id |
| `choice` | 选择事件 | choices[] |
| `ability_unlock` | 能力解锁 | ability_type |
| `flag_set` | 标记设置 | flag_id, value |
| `zone_change` | 区域切换 | target_zone |
| `card_obtain` | 获得卡片 | card_id |
| `counter_modify` | 修改计数器 | counter, delta |

---

## 3. Condition Schema

### 3.1 条件结构

```yaml
condition:
  type: ConditionType
  target: string        # 检查目标
  operator: Operator    # 比较运算符
  value: any            # 期望值
```

### 3.2 条件类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `flag` | 检查标记 | `flag.tutorial_done == true` |
| `counter` | 检查计数器 | `counter.R >= 6` |
| `ability` | 检查能力 | `ability.depth_perception == true` |
| `card` | 检查卡片 | `card.CARD_C0_01 == obtained` |
| `zone` | 检查区域 | `zone.visited == C0-Z2` |
| `dialogue` | 检查对话 | `dialogue.completed == C0_Z1_INTRO` |

### 3.3 运算符

| 运算符 | 说明 |
|--------|------|
| `eq` | 等于 |
| `ne` | 不等于 |
| `gt` | 大于 |
| `gte` | 大于等于 |
| `lt` | 小于 |
| `lte` | 小于等于 |
| `contains` | 包含 |
| `not_contains` | 不包含 |

---

## 4. Action Schema

### 4.1 动作结构

```yaml
action:
  type: ActionType
  target: string        # 作用目标
  value: any            # 动作参数
  delay: number         # 延迟（ms，可选）
```

### 4.2 动作类型

| 类型 | 说明 | 参数 |
|------|------|------|
| `show_dialogue` | 显示对话 | text_id, speaker |
| `show_choices` | 显示选项 | choices[] |
| `set_flag` | 设置标记 | flag_id, value |
| `modify_counter` | 修改计数器 | counter, delta |
| `unlock_ability` | 解锁能力 | ability_type |
| `obtain_card` | 获得卡片 | card_id |
| `change_zone` | 切换区域 | zone_id |
| `play_sfx` | 播放音效 | sfx_id |
| `play_bgm` | 播放背景乐 | bgm_id |
| `trigger_foreshadow` | 触发伏笔 | foreshadow_id, stage |

---

## 5. Choice Schema

### 5.1 选择结构

```yaml
choice:
  id: string            # 选择ID
  text_id: string       # 显示文本
  conditions: Condition[] # 显示条件（可选）
  next_event: string    # 选择后跳转
  effects: Effect[]     # 选择效果（可选）
```

### 5.2 效果结构

```yaml
effect:
  type: 'counter' | 'flag' | 'foreshadow'
  target: string
  value: any
```

---

## 6. 示例

### 6.1 简单对话事件

```yaml
C0_Z1_ENTRY:
  type: dialogue
  actions:
    - type: show_dialogue
      target: CENHUI
      value: CENHUI_MONO_01
  next: C0_Z1_CHOICE_1
```

### 6.2 条件选择事件

```yaml
C0_Z1_CHOICE_1:
  type: choice
  conditions:
    - type: flag
      target: tutorial_done
      operator: eq
      value: true
  choices:
    - id: choice_flow
      text_id: SYS_CHOICE_FLOW
      next_event: C0_Z1_FLOW
    - id: choice_explore
      text_id: SYS_CHOICE_EXPLORE
      next_event: C0_Z1_EXPLORE
      effects:
        - type: counter
          target: R
          value: 1
```

---

## 7. 边界约束

### 7.1 粒度限制
- 单事件脚本文件: ≤120行
- 单任务事件数: 3-8个
- 字段总数: ≤20

### 7.2 禁区
- 禁止可执行代码字符串
- 禁止直接调用游戏API
- 所有 text_id 必须在文本索引中存在

---

## 8. 校验规则

```typescript
// 事件校验器
interface IEventValidator {
  validateSchema(event: IEvent): ValidationResult;
  validateTextIds(event: IEvent): ValidationResult;
  validateReferences(event: IEvent): ValidationResult;
}
```

---

## 9. 验收标准

- [ ] Schema 定义完整且无歧义
- [ ] 所有 text_id 通过文本校验
- [ ] 条件引用的目标存在
- [ ] 事件链无死循环
- [ ] 校验器可自动执行

---

*版本: v1.0 | 创建: 2025-12-29 | 状态: 草案*

