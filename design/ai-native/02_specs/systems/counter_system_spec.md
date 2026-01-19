# Counter System Spec v1.0

> **层级**: L2 规格层  
> **文档编号**: P1-02  
> **上游依赖**: design_bible.md, tech_bible.md  
> **下游交付**: L3 执行岗任务包  
> **最后更新**: 2026-01-19  

---

## 1. 系统概述

### 1.1 职责
计数器系统负责追踪三个隐藏计数器（R/P/W），根据玩家行为计算数值变化，触发阈值效果，并与叙事/UI系统联动产生反馈。

### 1.2 核心目标
- 追踪玩家的"无收益行为"（R值）
- 追踪"观察者压力"（P值）
- 计算"世界可读性"（W值）
- 根据阈值触发系统反馈和结局走向

### 1.3 设计理念
> 计数器对玩家隐藏，但效果通过叙事/视觉间接感知，创造"世界在注视你"的体验。

---

## 2. 三个计数器定义

### 2.1 R值（Residual - 无收益残差）

**定义**: 玩家进行"无收益行为"的累积值。系统模型无法解释这些行为，产生残差。

| 属性 | 值 |
|------|-----|
| 初始值 | 0 |
| 最小值 | 0 |
| 最大值 | 无上限 |
| 衰减 | 无衰减 |
| 可见性 | 完全隐藏 |

**增长规则**:

| 行为类型 | R值增加 | 示例 |
|----------|---------|------|
| 无奖励选择 | +1 | 点"没人点的菜" |
| 帮助无关NPC | +1~2 | 扶正无人走的路标 |
| 保留无意义物品 | +1 | 为不在的人保留椅子 |
| 选择低效路线 | +1 | 绕路陪伴NPC |
| 坚持被否定行为 | +2 | 反复做被系统"无效"的事 |
| 抄录无奖励内容 | +1 | 纪念墙抄录 |
| 占位/修补动作 | +1~2 | 空椅占位 |

### 2.2 P值（Pressure - 观察者压力）

**定义**: 玩家使用高维能力造成的"观察者压力"。压力越大，系统纠偏越强。

| 属性 | 值 |
|------|-----|
| 初始值 | 0 |
| 最小值 | 0 |
| 最大值 | 无上限 |
| 衰减 | 无衰减 |
| 可见性 | 完全隐藏 |

**增长规则**:

| 行为 | P值增加 |
|------|---------|
| 深度感知（<5s） | +0 |
| 深度感知（5-15s） | +0.1 |
| 深度感知（15-30s） | +0.2 |
| 深度感知（>30s） | +0.3 |
| 深度介入（小型） | +0.5 |
| 深度介入（中型） | +1.0 |
| 深度介入（大型） | +2.0 |
| 时间干预（<5分钟） | +1.0 |
| 时间干预（5-15分钟） | +2.0 |
| 时间干预（15-30分钟） | +3.0 |
| 时间干预（>30分钟） | +5.0 |

### 2.3 W值（World Readability - 世界可读性）

**定义**: 世界的综合稳定度，由R和P的组合影响计算得出。

| 属性 | 值 |
|------|-----|
| 初始值 | 100 |
| 最小值 | 0 |
| 最大值 | 100 |
| 计算方式 | 实时派生 |
| 可见性 | 通过视觉效果间接感知 |

**计算公式**:

```typescript
W = max(0, 100 - (R × 3 + P × 2) - anomalyModifier)

// 异常事件修正 (anomalyModifier)
const anomalyModifiers = {
  largeIntervention: -5,    // 每次大型介入
  longTimeJump: -8,         // 每次长距回溯（>15分钟）
  structuralDecision: -3,   // 结构性决策（最小）
  majorStructuralDecision: -10, // 重大结构性决策
};
```

---

## 3. 阈值效果

### 3.1 R值阈值

| R值 | 系统表现 | 叙事效果 |
|-----|----------|----------|
| 0-2 | 正常 | 无 |
| 3-5 | 语气停顿 | 系统提示偶尔出现微小延迟（0.2s） |
| 6-9 | 判定句出现 | "此行为无可用收益" 开始出现 |
| 10+ | 模型改写 | 终局C路线开启、F21完整触发 |

**R≥3 效果实现**:
```typescript
// 系统语气停顿
if (R >= 3) {
  addDialogueDelay(200); // 毫秒
  enableSubtleHesitation();
}
```

**R≥6 效果实现**:
```typescript
// 首次判定句
if (R >= 6 && !hasShownFirstJudgment) {
  triggerEvent('FIRST_JUDGMENT_SENTENCE');
  showSystemMessage('此行为在当前模型中无意义。');
  hasShownFirstJudgment = true;
}
```

**R≥10 效果实现**:
```typescript
// 模型改写路径
if (R >= 10) {
  unlockEndingC();
  enableFullF21();
  enableFieldAcceptance();
}
```

### 3.2 P值阈值

| P值 | 系统表现 | 游戏影响 |
|-----|----------|----------|
| 0-3 | 正常 | 无 |
| 4-6 | 轻微纠偏 | NPC对话略显机械 |
| 7-10 | 中度纠偏 | 环境出现补丁痕迹、选项减少 |
| 11-15 | 强烈纠偏 | 系统语气变"对账"风格 |
| 16+ | 极端压力 | 可能触发系统主动"修复"玩家行为 |

**P值效果实现**:
```typescript
function getPValueEffect(P: number): PressureEffect {
  if (P <= 3) return PressureEffect.Normal;
  if (P <= 6) return PressureEffect.LightCorrection;
  if (P <= 10) return PressureEffect.ModerateCorrection;
  if (P <= 15) return PressureEffect.StrongCorrection;
  return PressureEffect.ExtremeCorrection;
}
```

### 3.3 W值阈值

| W值 | 世界状态 | 视觉表现 |
|-----|----------|----------|
| 80-100 | 稳定 | 正常画面 |
| 60-79 | 轻微不稳 | 偶尔画面抖动（shake: 1px, duration: 100ms） |
| 40-59 | 中度不稳 | 色彩偏移、UI元素异常 |
| 20-39 | 严重不稳 | 明显失真、系统提示频繁 |
| 0-19 | 临界状态 | 终局第三层显影 |

**W值视觉效果配置**:
```typescript
const wValueEffects: Record<WStabilityLevel, VisualEffect> = {
  stable: { shake: 0, colorShift: 0, glitch: 0 },
  slightlyUnstable: { shake: 1, colorShift: 0.05, glitch: 0.02 },
  moderatelyUnstable: { shake: 2, colorShift: 0.15, glitch: 0.08 },
  severelyUnstable: { shake: 4, colorShift: 0.3, glitch: 0.2 },
  critical: { shake: 6, colorShift: 0.5, glitch: 0.4 },
};
```

---

## 4. 结局判定规则

### 4.1 结局触发条件

| 结局 | R值条件 | W值条件 | 其他条件 |
|------|---------|---------|----------|
| A: 平面稳定 | R < 6 | W > 60 | 配合收敛 |
| B: 真实释放 | R ≥ 6 | W 40-60 | 特定关键选择 |
| C: 成为系统 | R ≥ 10 | W < 40 | 最终对话选择C |

### 4.2 结局判定逻辑

```typescript
function determineEnding(
  R: number,
  W: number,
  finalChoice: 'A' | 'B' | 'C' | null
): Ending {
  // 优先判定C结局（需要R≥10且选择C）
  if (R >= 10 && finalChoice === 'C') {
    return Ending.BecomeSystem;
  }
  
  // B结局判定（需要R≥6且选择B）
  if (R >= 6 && finalChoice === 'B') {
    return Ending.TruthRelease;
  }
  
  // 默认A结局
  return Ending.PlaneStability;
}
```

---

## 5. 接口定义

### 5.1 输入接口

```typescript
interface ICounterInput {
  // R值操作
  addR(amount: number, reason: string): void;
  
  // P值操作
  addP(amount: number, source: AbilityType): void;
  
  // 异常事件修正
  applyAnomalyModifier(type: AnomalyType): void;
  
  // 重置（仅限新游戏）
  reset(): void;
}
```

### 5.2 输出接口

```typescript
interface ICounterOutput {
  // 事件监听
  on(event: CounterEvent, handler: Function): void;
  off(event: CounterEvent, handler: Function): void;
  
  // 数值查询
  getR(): number;
  getP(): number;
  getW(): number;
  
  // 阈值状态查询
  getRThreshold(): RThreshold;
  getPThreshold(): PThreshold;
  getWStability(): WStability;
  
  // 结局相关
  isEndingCAvailable(): boolean;
  isEndingBAvailable(): boolean;
}

type CounterEvent =
  | 'counter:r_change'
  | 'counter:p_change'
  | 'counter:w_change'
  | 'threshold:r_reached'
  | 'threshold:p_reached'
  | 'threshold:w_reached'
  | 'ending:c_unlocked'
  | 'ending:b_unlocked';
```

### 5.3 类型定义

```typescript
enum RThreshold {
  Normal = 'NORMAL',           // 0-2
  Hesitation = 'HESITATION',   // 3-5
  Judgment = 'JUDGMENT',       // 6-9
  ModelRewrite = 'MODEL_REWRITE', // 10+
}

enum PThreshold {
  Normal = 'NORMAL',           // 0-3
  LightCorrection = 'LIGHT',   // 4-6
  ModerateCorrection = 'MODERATE', // 7-10
  StrongCorrection = 'STRONG', // 11-15
  ExtremeCorrection = 'EXTREME', // 16+
}

enum WStability {
  Stable = 'STABLE',           // 80-100
  SlightlyUnstable = 'SLIGHT', // 60-79
  ModeratelyUnstable = 'MODERATE', // 40-59
  SeverelyUnstable = 'SEVERE', // 20-39
  Critical = 'CRITICAL',       // 0-19
}

enum AnomalyType {
  LargeIntervention = 'LARGE_INTERVENTION',
  LongTimeJump = 'LONG_TIME_JUMP',
  StructuralDecision = 'STRUCTURAL_DECISION',
  MajorStructuralDecision = 'MAJOR_STRUCTURAL_DECISION',
}

interface ICounterState {
  R: number;
  P: number;
  W: number;
  anomalyModifier: number;
  rHistory: ICounterChange[];
  pHistory: ICounterChange[];
}

interface ICounterChange {
  timestamp: number;
  oldValue: number;
  newValue: number;
  reason: string;
  source?: string;
}
```

---

## 6. 与其他系统联动

### 6.1 叙事联动

| 计数器状态 | 叙事反馈 |
|------------|----------|
| R≥3 | 对话出现微停顿 |
| R≥6 | 判定句插入对话流 |
| R≥10 | 解锁特殊对话分支 |
| P≥7 | NPC对话变机械 |
| W<60 | 系统提示增多 |
| W<40 | 叙事语气变"对账"风格 |

### 6.2 UI联动

| 计数器状态 | UI效果 |
|------------|--------|
| R≥6 | 判定句Toast |
| P≥7 | 选项可能减少 |
| W<80 | 画面轻微抖动 |
| W<60 | 色彩偏移滤镜 |
| W<40 | Glitch效果 |
| W<20 | L3层显影UI |

### 6.3 存档联动

计数器值在以下时机保存：
- Zone切换时
- 能力使用后
- 关键对话完成
- 手动存档

**时间干预对计数器的影响**:
```typescript
// 回溯时计数器的处理
function handleTimeJump(targetNode: ITimeNode): void {
  // R值：部分回滚（保留50%增量）
  const rDelta = currentR - targetNode.counterSnapshot.R;
  this.R = targetNode.counterSnapshot.R + Math.floor(rDelta * 0.5);
  
  // P值：增加回溯代价后，不回滚
  this.addP(calculateTimeJumpPCost(targetNode), 'TIME_INTERVENTION');
  
  // W值：重新计算
  this.recalculateW();
}
```

---

## 7. 边界约束

### 7.1 粒度限制
- R值单次最大增量: ≤3
- P值单次最大增量: ≤5
- 计数器变更日志保留: ≤100条

### 7.2 禁区
- 禁止直接设置计数器值（只能通过add方法）
- 禁止跳过阈值检测
- 禁止在UI上显示原始计数器值
- 禁止修改历史记录

---

## 8. 验收标准

- [ ] 三个计数器初始化正确
- [ ] R/P值增长逻辑符合规格表
- [ ] W值计算公式正确实现
- [ ] 阈值效果正确触发
- [ ] 结局判定逻辑正确
- [ ] 与叙事/UI系统联动正常
- [ ] 存档/读档时计数器状态正确恢复
- [ ] 单元测试覆盖核心流程

---

## 9. 相关文档

- 设计总纲: `design/ai-native/01_bibles/design_bible.md`
- 技术总纲: `design/ai-native/01_bibles/tech_bible.md`
- 能力系统: `design/ai-native/02_specs/systems/ability_system_spec.md`
- 叙事系统: `design/ai-native/02_specs/systems/narrative_system_spec.md`
- 核心玩法设计: `design/game/02-system/核心玩法系统设计_v1.md`

---

*版本: v1.0 | 创建: 2026-01-19 | 状态: 草案*
