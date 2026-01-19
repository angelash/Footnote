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

### 2.1 七种卡片类型

> **注意**: 代码实现中支持 7 种卡片类型，详见 `game/src/config/game.config.ts CONSTANTS.CARD_TYPE`

| 类型 | 英文标识 | 获取方式 | 预计数量 | 作用 |
|------|----------|----------|----------|------|
| **档案卡** | archive | Zone探索/长按 | ~30 | 世界观补充 |
| **物品卡** | item | 关键道具获取 | ~20 | 剧情线索 |
| **地图卡** | map | 特定区域获取 | ~5 | 区域导航 |
| **祷文卡** | prayer | 礼堂街支线 | 5 | 首字链/F15 |
| **回执卡** | receipt | 系统操作后 | ~8 | 操作记录 |
| **判定卡** | verdict | 系统生成 | ~10 | 记录关键选择 |
| **日记卡** | diary | 角色相关 | ~7 | 角色内心 |

### 2.2 类型特征

**档案卡 (archive)**:
- 提供背景信息和世界观细节
- 通常无直接游戏影响
- 长按可查看详细内容

**物品卡 (item)**:
- 代表获取的关键道具
- 可能用于后续解谜/触发
- 示例：旧灯芯、身份卡

**地图卡 (map)**:
- 区域地图或路线图
- 提供空间导航信息
- 部分区域解锁后获得

**祷文卡 (prayer)**:
- 礼堂街牧平支线获取
- 首字组成隐链
- 通关后解锁拼读功能

**回执卡 (receipt)**:
- 系统操作后自动生成
- 记录差异提交、纠偏等操作
- 包含系统回执信息

**判定卡 (verdict)**:
- 系统自动生成
- 记录关键决策后果
- 包含判定句/字段信息

**日记卡 (diary)**:
- 角色个人日记片段
- 提供角色内心视角
- 可能包含碎片化信息

---

## 3. 卡片数据结构

### 3.1 基础卡片结构

```typescript
/**
 * 卡片数据（与 game/src/types/index.ts 保持一致）
 * @see game/src/types/index.ts ICard
 */
interface ICard {
  // 标识
  id: string;           // 如 'CARD_C0_01'
  name: string;         // 卡片名称
  type: CardType;       // 卡片类型
  
  // 内容
  front: string[];      // 正面文本（数组形式，每项一行）
  detail: string[];     // 长按详情文本（数组形式）
  
  // 视觉
  fx?: ICardFX[];       // 特效列表
  
  // 元数据
  chapter: ChapterID;   // 所属章节（'C0' | 'C1' | ... | 'CF'）
  zone: string;         // 获取Zone
  
  // 状态变体
  states?: Record<string, ICardStateOverride>;  // 状态覆盖配置
  currentState?: string;  // 当前状态键
}

/**
 * 卡片状态覆盖（与 game/src/types/index.ts 保持一致）
 */
interface ICardStateOverride {
  trigger: string;  // 触发条件
  override?: Partial<Pick<ICard, 'front' | 'detail'>>;  // 覆盖内容
  append?: Partial<Pick<ICard, 'front' | 'detail'>>;    // 追加内容
}

/**
 * 卡片类型（与 game/src/config/game.config.ts 保持一致）
 * @see game/src/config/game.config.ts CONSTANTS.CARD_TYPE
 */
type CardType = 'archive' | 'item' | 'map' | 'prayer' | 'receipt' | 'verdict' | 'diary';
```

### 3.2 卡片特效结构

```typescript
/**
 * 卡片特效（与 game/src/types/index.ts 保持一致）
 * @see game/src/types/index.ts ICardFX
 */
interface ICardFX {
  type: 'taint' | 'flash' | 'shake' | 'fade';  // 特效类型
  target: string;      // 作用目标（文字/区域）
  effect?: string;     // 可选的效果参数
  duration?: number;   // 可选的持续时间（毫秒）
}

// 特效类型说明：
// - 'taint': 污染/涂改效果
// - 'flash': 闪现效果
// - 'shake': 抖动效果
// - 'fade': 淡入淡出效果
```

### 3.3 卡片状态覆盖结构

> **注意**: 代码实现中使用 `states: Record<string, ICardStateOverride>` 而非数组形式的 `variants`。

```typescript
/**
 * 卡片状态覆盖（与 game/src/types/index.ts 保持一致）
 * 使用 Record 形式，键为状态名称
 * @see game/src/types/index.ts ICardStateOverride
 */
interface ICardStateOverride {
  trigger: string;  // 触发条件（如 flag 名称）
  override?: Partial<Pick<ICard, 'front' | 'detail'>>;  // 覆盖内容
  append?: Partial<Pick<ICard, 'front' | 'detail'>>;    // 追加内容
}

// 使用示例:
// states: {
//   'alignment_therapy': {
//     trigger: 'accepted_therapy',
//     override: { front: ['纪念墙抄录', '状态：已对齐'] }
//   }
// }
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
// 使用 ICardStateOverride 格式（与代码实现一致）
const cardWithAlignmentState: ICard = {
  id: 'CARD_C5_02',
  name: '纪念墙抄录',
  type: 'archive',
  chapter: 'C5',
  zone: 'C5-Z3',
  front: ['纪念墙抄录', '...原始内容...'],
  detail: ['...原始详情...'],
  states: {
    'alignment_therapy': {
      trigger: 'accepted_therapy',
      override: {
        front: ['纪念墙抄录', '状态：已对齐'],
        detail: ['（条目内容被覆盖为空白）', '', '（极淡小字）', '解释成本：下降']
      }
    }
  },
  fx: [
    { type: 'fade', target: 'original_content', duration: 1000 }
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
// 使用 ICardStateOverride 格式（与代码实现一致）
const cardWithFieldAcceptedState: Partial<ICard> = {
  states: {
    'field_accepted': {
      trigger: 'field_accepted',
      append: {
        detail: ['字段：◦◦◦（已占位）']
      }
    }
  },
  fx: [
    { type: 'flash', target: 'append_text', duration: 600 }
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

> **注意**: 以下示例使用代码中的实际数据结构

```yaml
# 与 game/src/types/index.ts ICard 接口一致
id: CARD_C0_01
name: "身份识别卡：岑回"
type: archive
chapter: C0
zone: C0-Z1

front:
  - "岑回  /  外勤巡检"
  - "通行级别：灰"
  - "所属：维修局外勤"
  - "签发日期：20██-██-██（已更正）"

detail:
  - "备注：例外权限待评估"
  - "提示：按流程执行 / 避免越界"
  - ""
  - "校验行："
  - "— 人像比对：通过"
  - "— 指纹比对：通过"
  - "— 叙述一致性：通过（已对齐）"
  - ""
  - "（极淡小字，加载时闪 0.2s）"
  - "字段：——"

fx:
  - type: taint
    target: "已更正"
    effect: "correction"
    duration: 300
  - type: flash
    target: "字段：——"
    duration: 200
```

### 9.2 祷文卡示例

```yaml
# 与 game/src/types/index.ts ICard 接口一致
id: CARD_C1_06
name: "祷文抄本-01"
type: prayer
chapter: C1
zone: C1-Z5

front:
  - "祷文抄本-01"
  - "看见是风"
  - "写入是墨"
  - "墨多纸裂"
  - "折痕不灭"

detail:
  - "（首字隐链，通关后可高亮）"
  - "看 / 写 / 墨 / 折"
  - ""
  - "注："
  - "折痕不是惩罚，是记号。"

# 状态覆盖使用 Record 形式
states:
  post_completion:
    trigger: "game_completed"
    append:
      detail:
        - "【首字链已解锁】"
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

*版本: v1.1 | 创建: 2026-01-19 | 更新: 2026-01-20 | 状态: 已同步代码*
