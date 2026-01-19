# Card System Spec v1.0

> **层级**: L2 规格层  
> **文档编号**: P1-03  
> **上游依赖**: design_bible.md, tech_bible.md  
> **下游交付**: L3 执行岗任务包  
> **最后更新**: 2026-01-19  

---

## 1. 系统概述

### 1.1 职责
卡片系统负责管理游戏中的收集品卡片，包括卡片的获取、展示、收藏和状态变化，以及与伏笔系统的联动。

### 1.2 核心目标
- 提供丰富的世界观补充
- 作为伏笔投放和回收的载体
- 记录玩家的关键选择
- 支持卡片状态覆盖（疗程/字段接受）

### 1.3 设计理念
> 卡片不只是收集品，而是玩家行为在世界中留下的"痕迹"和"证据"。

---

## 2. 卡片类型定义

### 2.1 四种卡片类型

| 类型 | 英文标识 | 获取方式 | 预计数量 | 作用 |
|------|----------|----------|----------|------|
| **档案卡** | archive | Zone探索/长按 | ~30 | 世界观补充 |
| **物品卡** | item | 关键道具获取 | ~20 | 剧情线索 |
| **祷文卡** | prayer | 礼堂街支线 | 5 | 首字链/F15 |
| **判定卡** | verdict | 系统生成 | ~10 | 记录关键选择 |

### 2.2 类型特征

**档案卡 (archive)**:
- 提供背景信息和世界观细节
- 通常无直接游戏影响
- 长按可查看详细内容

**物品卡 (item)**:
- 代表获取的关键道具
- 可能用于后续解谜/触发
- 示例：旧灯芯、身份卡

**祷文卡 (prayer)**:
- 礼堂街牧平支线获取
- 首字组成隐链
- 通关后解锁拼读功能

**判定卡 (verdict)**:
- 系统自动生成
- 记录关键决策后果
- 包含判定句/字段信息

---

## 3. 卡片数据结构

### 3.1 基础卡片结构

```typescript
interface ICard {
  // 标识
  id: string;           // 如 'CARD_C0_01'
  type: CardType;       // 'archive' | 'item' | 'prayer' | 'verdict'
  
  // 显示信息
  title: string;        // 卡片标题
  subtitle?: string;    // 副标题
  
  // 内容
  frontText: string;    // 正面文本（2-6行）
  detailText: string;   // 长按详情文本
  
  // 视觉
  image?: string;       // 卡面图片资源ID
  fx?: ICardFX[];       // 特效列表
  
  // 元数据
  chapter: string;      // 所属章节（C0-CF）
  obtainZone: string;   // 获取Zone
  obtainCondition: string; // 获取条件描述
  
  // 关联
  relatedForeshadow?: string;  // 关联伏笔ID
  relatedCards?: string[];     // 关联卡片ID
  
  // 状态
  variants?: ICardVariant[];   // 状态变体
}

type CardType = 'archive' | 'item' | 'prayer' | 'verdict';
```

### 3.2 卡片特效结构

```typescript
interface ICardFX {
  type: CardFXType;
  target: string;      // 作用目标（文字/区域）
  params: Record<string, unknown>;
}

type CardFXType =
  | 'strikethrough'    // 划线
  | 'correction'       // 涂改痕迹
  | 'flash'           // 闪现
  | 'fadeOut'         // 淡出
  | 'shake'           // 抖动
  | 'glitch'          // 故障效果
  | 'overlay'         // 覆盖
  | 'highlight';      // 高亮
```

### 3.3 卡片变体结构

```typescript
interface ICardVariant {
  id: string;
  triggerCondition: ICondition;  // 触发条件
  frontText?: string;            // 覆盖正面文本
  detailText?: string;           // 覆盖详情文本
  appendText?: string;           // 追加文本
  fx?: ICardFX[];               // 追加特效
}
```

---

## 4. 卡片状态机

### 4.1 卡片获取状态

| 状态 | 说明 | 转换 |
|------|------|------|
| `HIDDEN` | 未发现 | → DISCOVERED |
| `DISCOVERED` | 已发现未获取 | → OBTAINED |
| `OBTAINED` | 已获取 | → VIEWED |
| `VIEWED` | 已查看 | → MODIFIED |
| `MODIFIED` | 已被状态覆盖 | 终态 |

### 4.2 状态转换触发

```typescript
// 状态转换事件
enum CardStateTransition {
  Discover = 'DISCOVER',    // 触发条件满足
  Obtain = 'OBTAIN',        // 玩家交互获取
  View = 'VIEW',            // 玩家打开卡片
  Modify = 'MODIFY',        // 状态覆盖触发
}
```

---

## 5. 三种状态覆盖机制

### 5.1 对齐覆盖（疗程）

**触发条件**: 玩家在 C5-Z3 接受疗程

**影响卡片**:
1. 优先: `CARD_C5_02` (纪念墙抄录)
2. 备选: `CARD_C4_07` (碎片日记-02)

**覆盖效果**:
```typescript
const alignmentOverlay: ICardVariant = {
  id: 'alignment_therapy',
  triggerCondition: { flag: 'accepted_therapy', value: true },
  frontText: '纪念墙抄录\n状态：已对齐',
  detailText: '（条目内容被覆盖为空白）\n\n（极淡小字）\n解释成本：下降',
  fx: [
    { type: 'fadeOut', target: 'original_content', params: { duration: 1000 } }
  ]
};
```

### 5.2 字段接受追加（终章）

**触发条件**: CF-Z3 字段接受成功

**影响卡片**: 所有含 "字段：＿/——" 的卡片
- `CARD_C3_03` (救援记录-01B)
- `CARD_C3_06` (差异提交回执)
- `CARD_C5_03` (纠偏回执)
- `CARD_C5_09` (审计快照-01)

**追加效果**:
```typescript
const fieldAcceptedAppend: ICardVariant = {
  id: 'field_accepted',
  triggerCondition: { flag: 'field_accepted', value: true },
  appendText: '\n字段：◦◦◦（已占位）',
  fx: [
    { type: 'flash', target: 'append_text', params: { duration: 600 } }
  ]
};
```

### 5.3 结局后注（A/B/C）

**触发条件**: CF-Z5 选择结局

**影响卡片**: `CARD_CF_06` (非最优保留证明)

**追加内容**:
| 结局 | 追加文本 |
|------|----------|
| A | "被限制在边缘" |
| B | "互斥版本将更多同时出现" |
| C | "解释成本由承载者承担" |

---

## 6. 接口定义

### 6.1 输入接口

```typescript
interface ICardInput {
  // 获取卡片
  discoverCard(cardId: string): void;
  obtainCard(cardId: string): void;
  
  // 查看卡片
  viewCard(cardId: string): void;
  
  // 状态覆盖
  applyVariant(cardId: string, variantId: string): void;
  
  // 批量操作
  applyGlobalOverlay(overlayType: OverlayType): void;
}

type OverlayType = 'alignment' | 'field_accepted' | 'ending_a' | 'ending_b' | 'ending_c';
```

### 6.2 输出接口

```typescript
interface ICardOutput {
  // 事件监听
  on(event: CardEvent, handler: Function): void;
  off(event: CardEvent, handler: Function): void;
  
  // 查询
  getCard(cardId: string): ICard | null;
  getCardState(cardId: string): CardState;
  getObtainedCards(): ICard[];
  getCardsByType(type: CardType): ICard[];
  getCardsByChapter(chapter: string): ICard[];
  
  // 统计
  getCollectionProgress(): ICollectionProgress;
  isCardObtained(cardId: string): boolean;
  isCardViewed(cardId: string): boolean;
}

type CardEvent =
  | 'card:discover'
  | 'card:obtain'
  | 'card:view'
  | 'card:modify'
  | 'collection:progress';

interface ICollectionProgress {
  total: number;
  obtained: number;
  byType: Record<CardType, { total: number; obtained: number }>;
  byChapter: Record<string, { total: number; obtained: number }>;
}
```

---

## 7. 卡片UI规格

### 7.1 卡片尺寸

| 视图 | 尺寸 | 说明 |
|------|------|------|
| 缩略图 | 80×120px | 收藏列表 |
| 标准卡 | 240×360px | 获取展示 |
| 详情卡 | 320×480px | 长按查看 |

### 7.2 卡片布局

```
┌────────────────────────────┐
│      卡片标题              │ ← 标题区（24px字体）
├────────────────────────────┤
│                            │
│      卡面图片/图标         │ ← 图片区（可选）
│                            │
├────────────────────────────┤
│                            │
│      正面文本              │ ← 正文区（2-6行，18px）
│      （2-6行）             │
│                            │
├────────────────────────────┤
│      类型标签  章节标记    │ ← 底部信息
└────────────────────────────┘
```

### 7.3 收藏界面

```
┌────────────────────────────┐
│      卡片收藏 (25/50)      │
├────────────────────────────┤
│  [档案] [物品] [祷文] [判定]│ ← 类型筛选
├────────────────────────────┤
│  ┌────┐ ┌────┐ ┌────┐     │
│  │ ✓  │ │ ✓  │ │ ?  │     │ ← 已获取/未获取
│  │身份│ │地图│ │???│     │
│  └────┘ └────┘ └────┘     │
│  ┌────┐ ┌────┐ ┌────┐     │
│  │ ✓  │ │ ?  │ │ ?  │     │
│  │病例│ │???│ │???│     │
│  └────┘ └────┘ └────┘     │
│                            │
│  [按章节] [按类型] [按时间]│ ← 排序选项
└────────────────────────────┘
```

---

## 8. 与伏笔系统联动

### 8.1 卡片作为伏笔载体

| 伏笔 | 关联卡片 | 联动方式 |
|------|----------|----------|
| F01 薄墙现象 | CARD_C0_04, CARD_C2_02 | 投放/加深 |
| F11 字段缺失 | CARD_C3_03, CARD_CF_05 | 首次显现/回收 |
| F12 自相似 | CARD_C1_02, CARD_C2_03 | 多处植入 |
| F13 补丁一致性 | CARD_C4_03 | 关键触发 |
| F14 编号体系 | CARD_C3_08, CARD_C4_06 | 加深链 |
| F15 祷文首字链 | CARD_C1_06 - CARD_CF_10 | 全链回收 |
| F21 判定句 | CARD_C5_10 | 回收 |
| F23 空椅意义 | CARD_C3_07, CARD_CF_06 | 投放/回收 |

### 8.2 伏笔触发逻辑

```typescript
// 卡片获取时检查伏笔
function onCardObtain(cardId: string): void {
  const card = getCard(cardId);
  if (card.relatedForeshadow) {
    foreshadowSystem.progressForeshadow(
      card.relatedForeshadow,
      ForeshadowAction.Deepen
    );
  }
}
```

---

## 9. 卡片数据示例

### 9.1 档案卡示例

```yaml
id: CARD_C0_01
type: archive
title: "身份识别卡：岑回"
subtitle: "外勤巡检"
chapter: C0
obtainZone: C0-Z1
obtainCondition: "长按身份卡"

frontText: |
  岑回  /  外勤巡检
  通行级别：灰
  所属：维修局外勤
  签发日期：20██-██-██（已更正）

detailText: |
  备注：例外权限待评估
  提示：按流程执行 / 避免越界
  
  校验行：
  — 人像比对：通过
  — 指纹比对：通过
  — 叙述一致性：通过（已对齐）
  
  （极淡小字，加载时闪 0.2s）
  字段：——

fx:
  - type: correction
    target: "已更正"
    params: { intensity: 0.3 }
  - type: flash
    target: "字段：——"
    params: { duration: 200, delay: 1000 }

relatedForeshadow: F11
```

### 9.2 祷文卡示例

```yaml
id: CARD_C1_06
type: prayer
title: "祷文抄本-01"
chapter: C1
obtainZone: C1-Z5
obtainCondition: "礼堂街听完获得"

frontText: |
  祷文抄本-01
  看见是风
  写入是墨
  墨多纸裂
  折痕不灭

detailText: |
  （首字隐链，通关后可高亮）
  看 / 写 / 墨 / 折
  
  注：
  "折痕不是惩罚，是记号。"

variants:
  - id: post_completion
    triggerCondition: { flag: 'game_completed', value: true }
    fx:
      - type: highlight
        target: "首字"
        params: { chars: ['看', '写', '墨', '折'] }

relatedForeshadow: F15
```

---

## 10. 边界约束

### 10.1 粒度限制
- 正面文本: ≤6行，每行≤20字
- 详情文本: ≤15行
- 单章节卡片数: ≤12张
- 总卡片数: ≤65张

### 10.2 禁区
- 禁止在卡片文本中硬编码（使用 text_id）
- 禁止跳过伏笔关联检查
- 禁止直接修改已获取卡片的原始数据
- 禁止在非授权时机触发状态覆盖

---

## 11. 验收标准

- [ ] 四种卡片类型正确实现
- [ ] 卡片状态机流转正确
- [ ] 三种状态覆盖机制正确触发
- [ ] 卡片UI符合尺寸规格
- [ ] 收藏进度统计正确
- [ ] 与伏笔系统联动正确
- [ ] 卡片数据通过 Schema 校验
- [ ] 单元测试覆盖核心流程

---

## 12. 相关文档

- 设计总纲: `design/ai-native/01_bibles/design_bible.md`
- 技术总纲: `design/ai-native/01_bibles/tech_bible.md`
- 叙事系统: `design/ai-native/02_specs/systems/narrative_system_spec.md`
- 卡片文本全集: `design/game/01-narrative/卡片文本全集 v1.md`
- 伏笔索引: `design/game/01-narrative/伏笔索引 v2.md`

---

*版本: v1.0 | 创建: 2026-01-19 | 状态: 草案*
