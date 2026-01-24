# Types 设计对比分析报告

> 生成时间: 2026-01-24
> 目的: 对比 types/index.ts 中的类型定义与实际使用情况

---

## 一、重复定义对比

### 1.1 ICounters（计数器）

| 字段 | types/index.ts | WorldState.ts | 说明 |
|------|----------------|---------------|------|
| R值 | `r: number` | `R: number` | 大小写不同 |
| P值 | `p: number` | `P: number` | 大小写不同 |
| W值 | `w: number` | `W: number` + `baseW` | WorldState有基础值分离 |

**结论**: types版本未使用，全部代码用 WorldState.ts 版本（大写）
**操作**: ❌ 删除 types 版本

---

### 1.2 IAbilityState（能力状态）

| 字段 | types/index.ts | AbilitySystem.ts |
|------|----------------|------------------|
| 用途 | 记录能力是否解锁 | 记录能力运行时状态 |
| depthPerception | `boolean` | - |
| depthIntervention | `boolean` | - |
| timeIntervention | `boolean` | - |
| isActive | - | `boolean` |
| cooldownRemaining | - | `number` |
| lastUsedTime | - | `number` |

**实际实现**: WorldState.ts 用 `Set<AbilityType>` 记录解锁状态

**结论**: 两者用途完全不同，types版实际未使用
**操作**: ❌ 删除 types 版本

---

### 1.3 ITimeNode（时间节点）⭐ 需要合并

| 字段 | types/index.ts | AbilitySystem.ts | 说明 |
|------|----------------|------------------|------|
| id | ✅ `string` | ✅ `string` | 相同 |
| zoneId | ✅ `string` | ✅ `string` | 相同 |
| timestamp | ✅ `number` | ✅ `number` | 相同 |
| label | ✅ `string` | ❌ | UI显示用 |
| canRewind | ✅ `boolean` | ❌ | 是否可回溯 |
| saveSlot | ❌ | ✅ `number` | 存档槽位 |
| index | ❌ | ✅ `number` | 节点索引 |

**结论**: 两者是同一概念，字段互补
**操作**: ✅ 合并为完整接口，放到 types/index.ts

---

### 1.4 IWorldState vs IWorldStateData

| 字段 | types/index.ts (IWorldState) | WorldState.ts (IWorldStateData) |
|------|------------------------------|--------------------------------|
| counters | `ICounters` (小写) | `{ R, P, baseW }` |
| abilities | `IAbilityState` | `AbilityType[]` |
| zones | `Record<string, ZoneState>` | `Record<string, IZoneStateData>` |
| dialoguesCompleted | `Set<string>` | ❌ (在 NarrativeState) |
| choices | `IChoiceRecord[]` | ❌ |
| collectedCards | `Set<string>` | ❌ (在 NarrativeState) |
| depthScars | `IDepthScar[]` | `IScar[]` (不同结构) |
| timeNodes | `ITimeNode[]` | ❌ (在 AbilitySystem) |
| timeContamination | `number` | ❌ |
| playTime | `number` | ❌ (在 SaveData) |
| flags | ❌ | `Record<string, boolean>` |
| scars | ❌ | `IScar[]` |
| contaminations | ❌ | `IContamination[]` |

**结论**: 完全不同的结构，types版本是早期设计，IWorldStateData是实际实现
**操作**: ❌ 删除 types 版本的 IWorldState

---

### 1.5 ISaveData

| 字段 | types/index.ts | SaveManager.ts |
|------|----------------|----------------|
| version | `string` | `number` |
| slot | `number` | `number` |
| timestamp | `number` | `number` |
| worldState | `IWorldState` | `IWorldStateData` |
| foreshadowStates | ✅ | ❌ (在 narrativeState) |
| currentZone | ✅ | ✅ |
| settings | `IGameSettings` | ❌ |
| name | ❌ | ✅ |
| playTime | ❌ | ✅ |
| chapter | ❌ | ✅ |
| narrativeState | ❌ | ✅ |
| screenshot | ❌ | ✅ |

**结论**: 结构差异大，SaveManager.ts 版本是实际使用的
**操作**: ❌ 删除 types 版本

---

### 1.6 ICharacter vs ICharacterInfo

| 字段 | types/index.ts (ICharacter) | characters.config.ts (ICharacterInfo) |
|------|----------------------------|---------------------------------------|
| id | ✅ | ✅ |
| name | ✅ | ✅ |
| title | ✅ | ✅ |
| description | ✅ | ✅ |
| portrait | `string?` | `string` |
| sprite | `string?` | ❌ |
| dialoguePrefix | ✅ | ❌ |
| expressions | ❌ | ✅ `string[]` |
| dialogues | ❌ | ✅ `string[]` |

**结论**: ICharacterInfo 有更完整的表情和对话配置
**操作**: ❌ 删除 types 版本的 ICharacter

---

## 二、未使用但有设计价值（保留）

### 2.1 IZone 系列 ✅ 保留

```typescript
// 设计文档级别的完整 Zone 结构
IZone {
  id, name, chapter, type, focus,
  characters, entry, interactions, exits,
  rOpportunities, pCost, background
}
IZoneInteraction { id, type, position, label, trigger, condition }
IZoneExit { to, position, condition, label }
IROpportunity { id, description, rValue, completed }
```

**现状**: 实际用简化版 zones.config.ts
**保留原因**: 完整 Zone 交互系统的设计蓝图

---

### 2.2 ICardEffect / ICardFX ✅ 保留（美术预留）

```typescript
ICardEffect { type: 'taint'|'flash'|'glitch'|'redact', target?, intensity? }
ICardFX { type: 'taint'|'flash'|'shake'|'fade', target, effect?, duration? }
```

**现状**: CardUI 未读取这些字段
**保留原因**: 卡片视觉特效系统预留

---

### 2.3 IEndingResult ✅ 保留

```typescript
IEndingResult {
  type: EndingType,
  title: string,
  description: string,
  foreshadowsResolved: string[],
  totalPlayTime: number,
  finalCounters: ICounters
}
```

**现状**: EndingEffects.ts 硬编码展示
**保留原因**: 结局系统完善时使用

---

### 2.4 IForeshadowMisleadConfig ✅ 保留

```typescript
IForeshadowMisleadConfig {
  expected?: string,  // 玩家预期
  truth?: string,     // 真实情况
  zone?: string,
  description?: string
}
```

**保留原因**: 伏笔误读阶段配置，设计需要

---

## 三、确定删除的类型

| 类型 | 原因 |
|------|------|
| `IWorldState` | 被 `IWorldStateData` 替代 |
| `ISaveData` (types版) | 被 SaveManager 版替代 |
| `ICounters` (小写版) | 被大写版替代 |
| `ICharacter` | 被 `ICharacterInfo` 替代 |
| `IChoiceRecord` | 无实际使用，功能在 NarrativeEngine |
| `IDepthScar` | 被 `IScar` 替代 |
| `IAbilityState` (types版) | 未使用，WorldState用Set |
| `IGameEvent` | 被 EventBus 枚举替代 |
| `GameEventType` | 被 EventBus 枚举替代 |

---

## 四、操作计划

### 4.1 合并 ITimeNode

将 types 版本和 AbilitySystem 版本合并：

```typescript
export interface ITimeNode {
  id: string;
  zoneId: string;
  timestamp: number;
  // 来自 types 版本
  label?: string;
  canRewind?: boolean;
  // 来自 AbilitySystem 版本
  saveSlot?: number;
  index?: number;
}
```

### 4.2 删除冗余类型

从 types/index.ts 删除：
- IWorldState 及其依赖的 IChoiceRecord、IDepthScar
- ISaveData（types版）、IGameSettings
- ICounters（小写版）
- ICharacter
- IAbilityState
- IGameEvent、GameEventType

### 4.3 标记美术预留

为 ICardEffect、ICardFX 添加 `@reserved` 注释

---

## 五、统计

| 分类 | 数量 |
|------|------|
| 需要合并 | 1 (ITimeNode) |
| 确定删除 | 9 |
| 保留（设计预留） | 4 (IZone系列) |
| 保留（美术预留） | 2 (ICardEffect/FX) |
| 保留（后续完善） | 2 (IEndingResult, IForeshadowMisleadConfig) |
