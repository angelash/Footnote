# 序章（C0）玩法逻辑审计报告

**审查角色**: L2-gameplay-lead（玩法组长）
**审查日期**: 2026-01-23
**审查范围**: C0-Z1 ~ C0-Z4 场景配置、对话数据、卡片数据、配置文件

---

## 审查标准

基于 L2-gameplay-lead 角色定义，本次审查聚焦以下核心维度：

### 1. 交互逻辑闭环 (Interaction Logic)

检查每个交互是否完成完整闭环：
```
Action (交互) → Process (逻辑处理) → State (状态变更) → Feedback (表现) → UI Update (界面刷新)
```

**排查清单**:
- [ ] 物品被拾取后，是否从场景销毁？是否写入背包？是否触发获得提示？
- [ ] 关键交互后，Flag 是否翻转？Quest 状态是否推进？
- [ ] 场景重入时，是否正确读取持久化状态？

### 2. 价值体系闭环 (Value Loop)

检查每个获取物是否有对应消耗/用途：
- **L1 (功能)**: 直接用于解谜、开启通道
- **L2 (数值)**: 影响 R/P/W 计数器，改变结局走向
- **L3 (叙事)**: 作为叙事碎片，拼凑世界观真相

**原则**: 不设计无用的道具，不设计无后续的伏笔。

### 3. 状态一致性 (State Consistency)

- 配置文件之间的数据一致性
- Flag 名称在定义和引用处的一致性
- 设计文档与实际实现的一致性

---

## 审查范围文件清单

| 类别 | 文件路径 |
|------|---------|
| 场景配置 | `game/src/data/scenes/c0_z1.yaml` |
| 场景配置 | `game/src/data/scenes/c0_z2.yaml` |
| 场景配置 | `game/src/data/scenes/c0_z3.yaml` |
| 场景配置 | `game/src/data/scenes/c0_z4.yaml` |
| 对话数据 | `game/src/data/dialogues/c0_z1.yaml` |
| 对话数据 | `game/src/data/dialogues/c0_z2.yaml` |
| 对话数据 | `game/src/data/dialogues/c0_z3.yaml` |
| 对话数据 | `game/src/data/dialogues/c0_z4.yaml` |
| 卡片数据 | `game/src/data/cards/c0_cards.yaml` |
| Zone配置 | `game/src/config/zones.config.ts` |
| 设计文档 | `design/game/01-narrative/章节×区域叙事布置/Zone脚本包 v1（第1章 C0–C1）.md` |

---

## 问题汇总

### 问题统计

| 严重程度 | 数量 | 说明 |
|---------|------|------|
| 🚨 P0 严重 | 3 | 阻断游戏核心流程 |
| ⚠️ P1 价值虚无 | 5 | 卡片定义但不可获取 |
| ⚠️ P2 逻辑断层 | 4 | 交互链条中断 |
| 🔷 P3 一致性 | 4 | 配置冲突 |

---

## 一、🚨 P0 严重问题（阻断游戏流程）

### P0-1: zones.config.ts 与场景 YAML 数据严重不一致

**问题描述**:

| Zone ID | zones.config.ts 定义 | 实际 YAML 场景 |
|---------|---------------------|---------------|
| C0-Z2 | 岑回房间 | 早餐小店 |
| C0-Z4 | 档案室 | 维修局前台 |

**影响**: 场景加载、背景资源映射、流程理解全部混乱

**修复方案**: 以 YAML 场景为准，更新 zones.config.ts

---

### P0-2: Flag 名称不匹配导致对话分支永远无法触发

**问题描述**:
```yaml
# c0_z1.yaml 设置的 flag
FLAG_C0Z1_NOTICE_EXAMINED  # ✅ 实际设置

# c0_z4.yaml 检查的 flag  
flagTrue: FLAG_SEEN_NOTICE  # ❌ 检查错误的 flag
```

**后果**: 玩家在 C0-Z1 仔细查看公告板日期后，到 C0-Z4 对顾临说"昨晚公告板日期不对"的选项永远不会出现。

**修复方案**: 将 c0_z4.yaml 中的 `FLAG_SEEN_NOTICE` 改为 `FLAG_C0Z1_NOTICE_EXAMINED`

---

### P0-3: 开场独白没有触发入口

**问题描述**:
对话文件定义了完整的开场独白链：
```yaml
CENHUI_MONO_01 → CENHUI_MONO_02 → CENHUI_MONO_03
```
但 c0_z1.yaml 场景配置中没有任何入口触发这个独白。

**后果**: 玩家进入游戏后直接面对场景，缺少角色内心声音的引入。

**修复方案**: 在 c0_z1.yaml 添加 `onEnter` 配置触发 `CENHUI_MONO_01`

---

## 二、⚠️ P1 价值虚无问题（卡片定义但无法获取）

### P1-1: 早餐小票卡片未给予

| 卡片 ID | 名称 | 设计要求 | 当前状态 |
|---------|------|---------|---------|
| `CARD_C0_RECEIPT_STANDARD` | 早餐小票（固定套餐）| 选择固定套餐后给予 | ❌ 无触发 |
| `CARD_C0_RECEIPT_SPECIAL` | 早餐小票（今日特别）| 选择今日特别后给予 | ❌ 无触发 |

**修复方案**: 在 c0_z2.yaml 对应对话的 onComplete 添加 card 给予

---

### P1-2: 其他卡片无获取入口

| 卡片 ID | 名称 | 设计位置 | 状态 |
|---------|------|---------|------|
| `CARD_C0_WORK_ORDER` | 今日工单 | C0-Z2 | ❌ 无触发 |
| `CARD_C0_MORNING_PRAYER` | 晨间祷词 | C0-Z1 | ❌ 无触发 |
| `CARD_C0_WARNING` | 警告通知 | C0-Z4 | ❌ 无触发 |

**修复方案**: 设计合理的获取场景或标记为后续章节解锁

---

## 三、⚠️ P2 逻辑断层问题

### P2-1: 身份卡长按功能未实现

**设计文档要求**:
> "长按身份卡 → 展开'细节页'...生效日下方有一行极淡小字：`更正：03/17 → 03/16`"

**实际配置**: 场景中 identity_card 没有 longPress 配置

**修复方案**: 添加 longPress 配置指向细节对话

---

### P2-2: 公告板对话入口错位

**问题**: 场景配置直接触发 `NOTICE_BOARD_DETAIL`，跳过了 `NOTICE_BOARD_LOOK` 的开场描述

**修复方案**: 改为触发 `NOTICE_BOARD_LOOK`

---

### P2-3: 邻居门存在两套冲突实现

**场景配置**: 门牌号 102/103
**对话文件**: 门牌号 7750

**修复方案**: 统一使用一套实现，删除冲突内容

---

### P2-4: 任务板缺少前置条件

**问题**: 玩家可以在报到前直接查看任务板领取任务

**修复方案**: 添加 `condition: flagTrue: FLAG_C0Z4_CHECKED_IN`

---

## 四、🔷 P3 一致性问题

### P3-1: 背景资源引用不一致

| Zone | YAML texture | config backgroundKey |
|------|--------------|---------------------|
| C0-Z2 | `px_bg_placeholder` | `bg_c0z2_cenhui_room` |
| C0-Z3 | `px_bg_placeholder` | `bg_c0z3_alley` |
| C0-Z4 | `px_bg_placeholder` | `bg_c0z4_archive` |

---

### P3-2: 条件语法不统一

```yaml
# 大多数地方使用
flagTrue: FLAG_XXX
flagFalse: FLAG_YYY

# 但 exit_to_c1 使用
flag: FLAG_C0_TASK_RECEIVED
```

---

## 修复执行计划

| 优先级 | 问题ID | 修复内容 | 涉及文件 |
|-------|--------|---------|---------|
| P0 | P0-1 | 更新 zones.config.ts | zones.config.ts |
| P0 | P0-2 | 修复 FLAG 名称 | c0_z4.yaml |
| P0 | P0-3 | 添加开场独白入口 | c0_z1.yaml |
| P1 | P1-1 | 添加小票卡片给予 | c0_z2.yaml |
| P1 | P1-2 | 设计卡片获取入口 | c0_z1.yaml, c0_z4.yaml |
| P2 | P2-1 | 添加长按功能 | c0_z1.yaml |
| P2 | P2-2 | 修复对话入口 | c0_z1.yaml |
| P2 | P2-3 | 统一邻居门 | c0_z1.yaml, c0_z1.yaml(dialogue) |
| P2 | P2-4 | 添加前置条件 | c0_z4.yaml |

---

## 审计结论

**序章当前状态**: 🔴 **不可发布**

必须完成 P0 级问题修复后才能进行有效的功能测试。

---

*审计完成: 2026-01-23*
*审计人: L2-gameplay-lead (AI)*
