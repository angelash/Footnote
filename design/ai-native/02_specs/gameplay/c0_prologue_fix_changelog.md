# 序章（C0）修复变更日志

**修复日期**: 2026-01-23
**执行角色**: L2-gameplay-lead
**关联审计报告**: `c0_prologue_audit_report.md`

---

## 修复汇总

| 优先级 | 问题数 | 已修复 | 状态 |
|-------|-------|-------|------|
| P0 严重 | 3 | 3 | ✅ 全部完成 |
| P1 价值虚无 | 5 | 5 | ✅ 全部完成 |
| P2 逻辑断层 | 4 | 4 | ✅ 全部完成 |

---

## P0 级修复详情

### P0-1: zones.config.ts 与 YAML 不一致

**文件**: `game/src/config/zones.config.ts`

**变更**:
```typescript
// C0-Z2: 岑回房间 → 早餐小店
name: '早餐小店',
description: '巷口食堂，维修局员工的早餐去处。',
backgroundKey: 'bg_c0z2_breakfast_shop',

// C0-Z4: 档案室 → 维修局前台
name: '维修局前台',
description: '维修局行政办事前台，秩序井然。',
backgroundKey: 'bg_c0z4_bureau_reception',
```

---

### P0-2: Flag 名称不匹配

**文件**: `game/src/data/dialogues/c0_z4.yaml`

**变更**:
```yaml
# 修复前
flagTrue: FLAG_SEEN_NOTICE

# 修复后
flagTrue: FLAG_C0Z1_NOTICE_EXAMINED
```

---

### P0-3: 开场独白无触发入口

**文件**: `game/src/data/scenes/c0_z1.yaml`

**变更**:
```yaml
id: C0-Z1
title: 宿舍走廊
# 新增：进入场景时自动触发开场独白
onEnter:
  dialogue: CENHUI_MONO_01
```

---

## P1 级修复详情

### P1-1: 早餐小票卡片未给予

**文件**: `game/src/data/dialogues/c0_z2.yaml`

**变更**: 在 `C0Z2_ORDER_STANDARD` 和 `C0Z2_ORDER_SPECIAL` 的 `onComplete` 添加:
```yaml
- type: card
  cardId: CARD_C0_RECEIPT_STANDARD  # 或 CARD_C0_RECEIPT_SPECIAL
```

---

### P1-2: 工单/祷词/警告卡获取入口

**今日工单** (`CARD_C0_WORK_ORDER`):
- **文件**: `game/src/data/dialogues/c0_z1.yaml`
- **触发点**: 储物柜交互 `C0Z1_STORAGE`
- **变更**: 添加工单卡片给予

**晨间祷词** (`CARD_C0_MORNING_PRAYER`):
- **文件**: `game/src/data/scenes/c0_z1.yaml`, `c0_z1.yaml`(dialogue)
- **新增对象**: `prayer_board` 祷词台
- **新增对话**: `C0Z1_PRAYER_BOARD`, `C0Z1_PRAYER_TAKEN`, `C0Z1_PRAYER_BOARD_DONE`
- **变更**: 玩家可选择取下祷词获得卡片

**警告通知** (`CARD_C0_WARNING`):
- **文件**: `game/src/data/dialogues/c0_z4.yaml`
- **触发点**: 所有顾临对话分支结束时
- **变更**: 顾临在对话末尾提到"这个月的警告通知"并给予卡片

---

## P2 级修复详情

### P2-1: 身份卡长按功能

**文件**: `game/src/data/scenes/c0_z1.yaml`, `c0_z1.yaml`(dialogue)

**场景变更**:
```yaml
longPress:
  duration: 800
  action:
    type: dialogue
    dialogueId: C0Z1_IDENTITY_DETAIL
```

**新增对话** `C0Z1_IDENTITY_DETAIL`:
- 显示身份卡背面细节
- 揭示「更正：03/17 → 03/16」
- 植入 F06 伏笔
- 设置 `FLAG_SEEN_IDENTITY_CORRECTION`

---

### P2-2: 公告板对话入口修复

**文件**: `game/src/data/scenes/c0_z1.yaml`

**变更**:
```yaml
# 修复前
dialogueId: NOTICE_BOARD_DETAIL

# 修复后
dialogueId: NOTICE_BOARD_LOOK
```

---

### P2-3: 邻居门内容统一

**文件**: `game/src/data/scenes/c0_z1.yaml`, `c0_z1.yaml`(dialogue)

**变更**:
- 场景改为调用对话 `NEIGHBOR_DOOR_KNOCK`
- 对话文本统一使用 102/103 号门牌
- 删除内联对话，保持一致性

---

### P2-4: 任务板前置条件

**文件**: `game/src/data/scenes/c0_z4.yaml`, `c0_z4.yaml`(dialogue)

**场景变更**:
- 拆分为两个对象: `task_board`（已报到可用）和 `task_board_locked`（未报到）
- 添加条件 `flagTrue: FLAG_C0Z4_CHECKED_IN`

**新增对话** `C0Z4_TASKBOARD_LOCKED`:
```yaml
- speaker: 岑回
  text: 应该先去前台报到。
```

---

## 新增内容汇总

### 新增场景对象

| Zone | 对象 ID | 类型 | 说明 |
|------|---------|------|------|
| C0-Z1 | `prayer_board` | 交互物 | 祷词台（可取祷词卡片）|
| C0-Z1 | `prayer_board_done` | 交互物 | 祷词台（已取过状态）|
| C0-Z4 | `task_board_locked` | 交互物 | 任务板（未报到状态）|

### 新增对话

| Zone | 对话 ID | 说明 |
|------|---------|------|
| C0-Z1 | `C0Z1_IDENTITY_DETAIL` | 身份卡长按细节 |
| C0-Z1 | `C0Z1_PRAYER_BOARD` | 祷词台交互 |
| C0-Z1 | `C0Z1_PRAYER_TAKEN` | 取下祷词后 |
| C0-Z1 | `C0Z1_PRAYER_BOARD_DONE` | 祷词台已空 |
| C0-Z4 | `C0Z4_TASKBOARD_LOCKED` | 任务板锁定提示 |

### 新增 Flag

| Flag 名称 | 说明 |
|----------|------|
| `FLAG_SEEN_IDENTITY_CORRECTION` | 已查看身份卡日期更正 |
| `FLAG_C0Z1_GOT_PRAYER` | 已取得晨间祷词 |

---

## 验证清单

修复完成后需要验证:

- [ ] C0-Z1 进入时自动播放开场独白
- [ ] C0-Z1 身份卡长按显示日期更正细节
- [ ] C0-Z1 公告板对话从 NOTICE_BOARD_LOOK 开始
- [ ] C0-Z1 储物柜给予早餐券和今日工单两张卡
- [ ] C0-Z1 祷词台可取得晨间祷词
- [ ] C0-Z1 邻居门显示 102/103 号门牌
- [ ] C0-Z2 选择固定套餐后获得对应小票卡
- [ ] C0-Z2 选择今日特别后获得对应小票卡
- [ ] C0-Z4 未报到时任务板不可交互
- [ ] C0-Z4 报到后任务板可用
- [ ] C0-Z4 查看公告板日期后，对顾临可选"日期不对"选项
- [ ] C0-Z4 顾临对话结束后获得警告通知卡

---

*修复完成: 2026-01-23*
*执行人: L2-gameplay-lead (AI)*
