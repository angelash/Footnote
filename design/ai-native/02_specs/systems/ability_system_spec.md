# Ability System Spec v1.0

> **层级**: L2 规格层  
> **文档编号**: P1-01  
> **上游依赖**: design_bible.md, tech_bible.md  
> **下游交付**: L3 执行岗任务包  
> **最后更新**: 2026-01-19  

---

## 1. 系统概述

### 1.1 职责
能力系统负责管理玩家的三种高维能力（深度感知、深度介入、时间干预），处理能力的解锁、激活、执行和后果计算。

### 1.2 核心目标
- 提供清晰的能力状态机
- 实现"代价感"的核心体验
- 与计数器系统联动，影响世界可读性
- 管理能力使用的视觉/音效反馈

### 1.3 设计理念
> 每次能力使用都有不可逆的代价，让玩家在"能做"和"该做"之间抉择。

---

## 2. 状态定义

| 状态 | 说明 | 允许转换 |
|------|------|----------|
| `LOCKED` | 能力未解锁 | → READY（解锁事件触发） |
| `READY` | 可用，等待激活 | → CHARGING, DISABLED |
| `CHARGING` | 蓄力中（仅深度感知） | → ACTIVE, READY |
| `ACTIVE` | 能力执行中 | → READY, COOLDOWN |
| `COOLDOWN` | 冷却中 | → READY |
| `DISABLED` | 临时禁用（剧情/UI阻断） | → READY |

---

## 3. 三种能力规格

### 3.1 深度感知（Depth Perception）

| 属性 | 值 | 说明 |
|------|-----|------|
| 解锁章节 | C2-Z1 | 校准事件完成后 |
| 触发方式 | 长按屏幕 | ≥0.5秒进入激活 |
| 持续条件 | 保持长按 | 松开即退出 |
| 退出条件 | 松开/受干扰事件 | 如对话触发 |
| 冷却时间 | 0秒 | 无冷却 |
| P值成本 | 见下表 | 按时长计算 |

**P值计算规则**:

| 使用时长 | P值增加 |
|----------|---------|
| < 5秒 | +0 |
| 5-15秒 | +0.1 |
| 15-30秒 | +0.2 |
| > 30秒 | +0.3 |

**视觉效果**:

| 阶段 | 时间 | 效果 |
|------|------|------|
| 蓄力 | 0-0.5s | 画面边缘变暗 |
| 激活 | 0.5s | 透视效果渐入 + sfx_depth_activate |
| 持续 | 0.5s+ | 线框叠加 + 隐藏信息显现 |
| 退出 | 松开 | 效果渐出（0.3s） |

**可见内容类型**:

| 类型 | 描述 | 示例 |
|------|------|------|
| 结构真相 | 墙内空腔、折叠空间 | F01薄墙回声 |
| 隐藏物品 | 被覆盖的物体 | 旧地图、密室入口 |
| NPC状态 | 内心状态可视化 | 阿棠的"漂移程度" |
| 系统痕迹 | 纠偏/修补痕迹 | 更正版本号 |

### 3.2 深度介入（Depth Intervention）

| 属性 | 值 | 说明 |
|------|-----|------|
| 解锁章节 | C3-Z1 | 签署例外许可后 |
| 前置条件 | 可介入目标存在 | 深度感知下发光标记 |
| 触发方式 | 选中目标 → 拖拽 | 完成手势执行 |
| 冷却时间 | 3秒 | 介入后冷却 |
| 永久后果 | 伤痕（Scar） | 不可通过回溯消除 |

**P值计算规则**:

| 介入类型 | P值增加 | 伤痕等级 |
|----------|---------|----------|
| 小型调整 | +0.5 | 轻微（视觉可见但不影响功能） |
| 中型改变 | +1.0 | 中等（永久影响局部状态） |
| 大型重构 | +2.0 | 严重（永久影响区域状态） |

**可介入目标类型**:

| 目标类型 | 介入效果 | 伤痕表现 |
|----------|----------|----------|
| 折叠空间 | 展开/压缩 | 裂缝纹理 |
| 隐藏通道 | 打开/关闭 | 边缘毛刺 |
| 结构异常 | 稳定/释放 | 扭曲感 |
| NPC状态 | 微调对齐程度 | 记忆碎片化 |

**操作流程**:
1. 深度感知中发现可介入目标（发光标记）
2. 点击选中目标
3. 出现介入UI（方向提示）
4. 拖拽到目标位置
5. 释放 → 触发介入
6. 播放伤痕动画 + sfx_intervene
7. 世界状态更新

### 3.3 时间干预（Time Intervention）

| 属性 | 值 | 说明 |
|------|-----|------|
| 解锁章节 | C4-Z2 | 演示回溯完成后 |
| 界面 | 时间卡片UI | 竖版适配 |
| 操作方式 | 选择节点 → 确认 | 二次确认 |
| 冷却时间 | 0秒 | 但有高P值代价 |
| 永久后果 | 污染（Contamination） | 伤痕保留 |

**节点生成规则**:

| 条件 | 生成节点 |
|------|----------|
| Zone切换 | 自动创建 |
| 关键对话完成 | 自动创建 |
| 能力使用后 | 自动创建 |
| 手动存档 | 创建标记节点 |

**P值计算规则**:

| 回溯距离 | P值增加 | 污染效果 |
|----------|---------|----------|
| < 5分钟 | +1.0 | 轻微（NPC语言重复） |
| 5-15分钟 | +2.0 | 中等（环境出现补丁痕迹） |
| 15-30分钟 | +3.0 | 严重（系统开始纠偏） |
| > 30分钟 | +5.0 | 极严重（大面积记忆漂移） |

**回溯后果表**:

| 项目 | 回滚 | 保留 |
|------|------|------|
| 玩家位置 | ✅ | |
| 对话进度 | ✅ | |
| 物品获取 | ✅ | |
| 深度伤痕 | | ✅ |
| R/P/W值 | 部分 | 部分 |
| 伏笔触发 | | ✅ |

---

## 4. 接口定义

### 4.1 输入接口

```typescript
interface IAbilityInput {
  // 解锁能力
  unlockAbility(type: AbilityType): void;
  
  // 开始蓄力（深度感知）
  startCharging(): void;
  
  // 取消蓄力
  cancelCharging(): void;
  
  // 激活能力
  activateAbility(type: AbilityType, target?: IInteractable): void;
  
  // 执行介入（深度介入）
  executeIntervention(targetId: string, direction: IVector2): void;
  
  // 执行回溯（时间干预）
  executeTimeJump(nodeId: string): void;
  
  // 禁用/启用能力
  setAbilityEnabled(type: AbilityType, enabled: boolean): void;
}
```

### 4.2 输出接口

```typescript
interface IAbilityOutput {
  // 事件监听
  on(event: AbilityEvent, handler: Function): void;
  off(event: AbilityEvent, handler: Function): void;
  
  // 状态查询
  getAbilityState(type: AbilityType): AbilityState;
  isAbilityUnlocked(type: AbilityType): boolean;
  isAbilityReady(type: AbilityType): boolean;
  getCooldownRemaining(type: AbilityType): number;
  
  // 数据查询
  getUnlockedAbilities(): AbilityType[];
  getIntervenableTargets(): IInteractable[];
  getAvailableTimeNodes(): ITimeNode[];
}

type AbilityEvent =
  | 'ability:unlock'
  | 'ability:charging'
  | 'ability:activate'
  | 'ability:execute'
  | 'ability:deactivate'
  | 'ability:cooldown'
  | 'scar:create'
  | 'contamination:create';
```

### 4.3 类型定义

```typescript
enum AbilityType {
  DepthPerception = 'DEPTH_PERCEPTION',
  DepthIntervention = 'DEPTH_INTERVENTION',
  TimeIntervention = 'TIME_INTERVENTION',
}

enum AbilityState {
  Locked = 'LOCKED',
  Ready = 'READY',
  Charging = 'CHARGING',
  Active = 'ACTIVE',
  Cooldown = 'COOLDOWN',
  Disabled = 'DISABLED',
}

interface IScar {
  id: string;
  type: 'minor' | 'moderate' | 'severe';
  zoneId: string;
  targetId: string;
  createdAt: number;
  description: string;
}

interface IContamination {
  id: string;
  severity: 'light' | 'medium' | 'heavy' | 'extreme';
  fromNodeId: string;
  toNodeId: string;
  createdAt: number;
  effects: string[];
}

interface ITimeNode {
  id: string;
  zoneId: string;
  timestamp: number;
  type: 'auto' | 'manual' | 'event';
  label: string;
  canJumpTo: boolean;
}
```

---

## 5. 与计数器联动

### 5.1 P值影响汇总

| 能力 | 行为 | P值增加 |
|------|------|---------|
| 深度感知 | 短时使用（<5s） | +0 |
| 深度感知 | 中时使用（5-30s） | +0.1~0.2 |
| 深度感知 | 长时使用（>30s） | +0.3 |
| 深度介入 | 小型调整 | +0.5 |
| 深度介入 | 大型重构 | +2.0 |
| 时间干预 | 短距回溯 | +1.0 |
| 时间干预 | 长距回溯 | +5.0 |

### 5.2 W值影响

```
W = max(0, 100 - (R × 3 + P × 2) - 异常事件修正)

异常事件修正:
- 每次大型介入: -5
- 每次长距回溯: -8
- 结构性决策: -3~-10
```

---

## 6. 边界约束

### 6.1 粒度限制
- 单次介入影响范围: ≤1个Zone
- 时间节点保留数量: ≤20个
- 回溯最大距离: 60分钟

### 6.2 禁区
- 禁止在对话/过场中使用能力
- 禁止同时激活多个能力
- 禁止跳过能力解锁事件
- 禁止修改已创建的伤痕/污染

---

## 7. 验收标准

- [ ] 三种能力状态机正确实现
- [ ] 解锁事件正确触发（C2-Z1/C3-Z1/C4-Z2）
- [ ] P值计算符合规格表
- [ ] 伤痕/污染数据正确持久化
- [ ] 与计数器系统联动正确
- [ ] 视觉反馈符合规格
- [ ] 单元测试覆盖核心流程

---

## 8. 相关文档

- 设计总纲: `design/ai-native/01_bibles/design_bible.md`
- 技术总纲: `design/ai-native/01_bibles/tech_bible.md`
- 计数器系统: `design/ai-native/02_specs/systems/counter_system_spec.md`
- 核心玩法设计: `design/game/02-system/核心玩法系统设计_v1.md`

---

*版本: v1.0 | 创建: 2026-01-19 | 状态: 草案*
