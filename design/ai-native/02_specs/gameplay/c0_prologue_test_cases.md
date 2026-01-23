# C0 序章完整测试用例

**创建日期**: 2026-01-23  
**测试方法**: 端到端行为验证（预期 vs 实际对比）

---

## 测试原则

> **测试不是"看系统能不能跑"，是"验证系统行为是否符合预期"**

每个测试用例必须包含：
1. 前置状态（flags, cards, objects 可见性）
2. 操作步骤
3. 预期结果（状态变更 + UI 变化）
4. 实际结果（填写）
5. 通过/失败判定

---

## C0-Z1 宿舍走廊

### TC-Z1-01: 身份卡拾取与状态切换

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_C0Z1_GOT_IDENTITY = false, identity_card 可见, identity_card_done 不可见 |
| **操作** | 点击 identity_card，完成对话 |
| **预期结果** | |
| - 卡片获得 | CARD_C0_IDENTITY ✓ |
| - Flag 设置 | FLAG_C0Z1_GOT_IDENTITY = true |
| - 对象切换 | identity_card 不可见, identity_card_done 可见 |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

### TC-Z1-02: 储物柜多卡片获取

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_C0Z1_GOT_TOOLS = false, storage_cabinet 可见 |
| **操作** | 点击 storage_cabinet，完成对话 |
| **预期结果** | |
| - 卡片获得 | CARD_C0_MEAL_TICKET ✓, CARD_C0_WORK_ORDER ✓ |
| - Flag 设置 | FLAG_C0Z1_GOT_TOOLS = true |
| - 对象切换 | storage_cabinet 不可见, storage_cabinet_done 可见 |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

### TC-Z1-03: 祷词台选择效果

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_C0Z1_GOT_PRAYER = false, prayer_board 可见 |
| **操作** | 点击 prayer_board，选择"取下祷词" |
| **预期结果** | |
| - 卡片获得 | CARD_C0_MORNING_PRAYER ✓ |
| - Flag 设置 | FLAG_C0Z1_GOT_PRAYER = true |
| - 对象切换 | prayer_board 不可见, prayer_board_done 可见 |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

### TC-Z1-04: 公告板选择效果（R值增加）

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_C0Z1_NOTICE_EXAMINED = false, R = 0, notice_board 可见 |
| **操作** | 点击 notice_board，选择"仔细查看" |
| **预期结果** | |
| - Flag 设置 | FLAG_C0Z1_NOTICE_EXAMINED = true |
| - R 值变化 | R +1 |
| - 对象切换 | notice_board 不可见, notice_board_done 可见 |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

### TC-Z1-05: 重复交互显示已完成状态

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_C0Z1_GOT_IDENTITY = true |
| **操作** | 点击 identity_card_done |
| **预期结果** | |
| - 对话内容 | "身份卡已经在手上了。" |
| - 无重复获得卡片 | |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

---

## C0-Z2 早餐小店

### TC-Z2-01: 固定套餐选择

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_C0Z2_EATEN = false, menu_board 可见 |
| **操作** | 点击 menu_board，选择"固定套餐" |
| **预期结果** | |
| - 卡片获得 | CARD_C0_RECEIPT_STANDARD ✓ |
| - Flag 设置 | FLAG_C0Z2_EATEN = true, FLAG_C0Z2_ORDER_STANDARD = true |
| - 对象切换 | menu_board 不可见, menu_board_done 可见 |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

### TC-Z2-02: 今日特别选择（R值增加）

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_C0Z2_EATEN = false, R = 0 |
| **操作** | 点击 menu_board，选择"今日特别" |
| **预期结果** | |
| - 卡片获得 | CARD_C0_RECEIPT_SPECIAL ✓ |
| - Flag 设置 | FLAG_C0Z2_EATEN = true, FLAG_C0Z2_SPECIAL = true |
| - R 值变化 | R +1 |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

---

## C0-Z3 薄墙巷口

### TC-Z3-01: 钉子拾取与状态切换

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_HAS_NAIL = false, wall_nail 可见 |
| **操作** | 点击 wall_nail，选择"收起来" |
| **预期结果** | |
| - 卡片获得 | CARD_C0_NAIL ✓ |
| - Flag 设置 | FLAG_HAS_NAIL = true |
| - 对象消失 | wall_nail 不可见 |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

### TC-Z3-02: 薄墙回声（长按触发）

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_HEARD_WALL_ECHO = false |
| **操作** | 长按 thin_wall（1秒） |
| **预期结果** | |
| - 卡片获得 | CARD_C0_ALLEY_RECORD ✓ |
| - Flag 设置 | FLAG_HEARD_WALL_ECHO = true |
| - 伏笔触发 | F01 planted |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

---

## C0-Z4 维修局前台

### TC-Z4-01: 前台报到解锁任务板

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_C0Z4_CHECKED_IN = false, task_board_locked 可见, task_board 不可见 |
| **操作** | 点击 reception_window，完成对话 |
| **预期结果** | |
| - Flag 设置 | FLAG_C0Z4_CHECKED_IN = true |
| - 对象切换 | task_board_locked 不可见, task_board 可见 |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

### TC-Z4-02: 任务板领取任务单

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_C0Z4_CHECKED_IN = true, task_board 可见 |
| **操作** | 点击 task_board |
| **预期结果** | |
| - 卡片获得 | CARD_C0_TASK_SHEET ✓ |
| - 伏笔触发 | F03 deepened |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

### TC-Z4-03: 顾临对话（顺从路线）

| 项目 | 内容 |
|------|------|
| **前置状态** | 无特殊前置 |
| **操作** | 点击 gulin_door，选择"明白。" |
| **预期结果** | |
| - 卡片获得 | CARD_C0_WARNING ✓ |
| - Flag 设置 | FLAG_C0_TASK_RECEIVED = true, FLAG_C0_END = true |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

### TC-Z4-04: 顾临对话（日期质疑路线）

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_C0Z1_NOTICE_EXAMINED = true（需要先查看公告板） |
| **操作** | 点击 gulin_door，选择"昨晚公告板日期不对。" |
| **预期结果** | |
| - 选项可见 | 只有 FLAG_C0Z1_NOTICE_EXAMINED = true 时可见 |
| - 卡片获得 | CARD_C0_WARNING ✓ |
| - Flag 设置 | FLAG_QUESTIONED_DATE = true |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

### TC-Z4-05: 顾临对话（墙壁质疑路线）

| 项目 | 内容 |
|------|------|
| **前置状态** | FLAG_HEARD_WALL_ECHO = true（需要先长按薄墙） |
| **操作** | 点击 gulin_door，选择"我听到墙里是空的。" |
| **预期结果** | |
| - 选项可见 | 只有 FLAG_HEARD_WALL_ECHO = true 时可见 |
| - 卡片获得 | CARD_C0_WARNING ✓ |
| - Flag 设置 | FLAG_QUESTIONED_WALL = true |
| **实际结果** | 待测试 |
| **判定** | 待测试 |

---

## 跨场景流程测试

### TC-FLOW-01: 完整序章流程

| 步骤 | 操作 | 验证点 |
|------|------|--------|
| 1 | 进入 C0-Z1 | 开场独白自动触发 |
| 2 | 拾取身份卡 | 获得卡片，对象消失 |
| 3 | 打开储物柜 | 获得早餐券+工单 |
| 4 | 查看公告板 | R +1 |
| 5 | 取下祷词 | 获得祷词卡 |
| 6 | 前往 C0-Z2 | 场景切换正常 |
| 7 | 选择今日特别 | R +1，获得小票 |
| 8 | 前往 C0-Z3 | 场景切换正常 |
| 9 | 长按薄墙 | 获得巷口记录 |
| 10 | 拾取钉子 | 获得钉子卡 |
| 11 | 前往 C0-Z4 | 场景切换正常 |
| 12 | 前台报到 | 任务板解锁 |
| 13 | 查看任务板 | 获得任务单 |
| 14 | 与顾临对话 | 序章完成 |

---

## 测试执行记录

### 执行日期: 2026-01-23 (更新)

| 用例 | 结果 | 问题描述 | 修复状态 |
|------|------|----------|----------|
| TC-Z1-01 | ✅ PASS | 身份卡拾取后正确消失，状态切换正常 | - |
| TC-Z1-02 | ✅ PASS | 储物柜给两张卡片（早餐券+工单） | ✅ 已修复 |
| TC-Z1-03 | ✅ PASS | 祷词台选择效果正常（获得晨间祷词，状态切换） | ✅ 已修复 |
| TC-Z1-04 | ✅ PASS | 公告板选择效果正常（状态切换） | ✅ 已修复 |
| TC-Z1-05 | 待执行 | | |
| TC-Z2-01 | ✅ PASS | 固定套餐选择正常（获得早餐小票） | - |
| TC-Z2-02 | 待执行 | | |
| TC-Z3-01 | ✅ PASS | 钉子拾取正常（获得旧钉子，对象消失） | - |
| TC-Z3-02 | 待执行 | 长按触发需要特殊测试方式 | |
| TC-Z4-01 | ✅ PASS | 前台报到正确解锁任务板 | - |
| TC-Z4-02 | 待执行 | | |
| TC-Z4-03 | 待执行 | | |
| TC-Z4-04 | 待执行 | | |
| TC-Z4-05 | 待执行 | | |

---

## 修复记录

### 修复1: 选择效果属性名不一致 (2026-01-23)
**文件**: `NarrativeEngine.ts`
**问题**: `selectChoice` 检查 `effects` 属性，但数据使用 `effect`
**修复**: 兼容两种属性名
```typescript
const effectData = (choice as { effect?: IChoiceEffect; effects?: IChoiceEffect }).effect || choice.effects;
```

### 修复2: onComplete 多卡片支持 (2026-01-23)
**文件**: `NarrativeDataLoader.ts`
**问题**: onComplete 只能存一张卡片（循环覆盖）
**修复**: 使用 `cards` 数组存储多张卡片
```typescript
const cardIds: string[] = [];
for (const action of triggers) {
  if (action.type === 'card' && action.cardId) {
    cardIds.push(action.cardId);
  }
}
trigger.cards = cardIds;
```

### 修复3: registerDataToNarrativeEngine 多卡片处理 (2026-01-23)
**文件**: `NarrativeDataLoader.ts`
**问题**: `registerDataToNarrativeEngine` 只处理 `trigger.card`
**修复**: 同时处理 `trigger.cards` 数组
```typescript
...((lastDialogue.trigger as { cards?: string[] }).cards || []).map((cardId) => ({
  type: 'card' as const,
  cardId,
})),
```

### 修复4: 身份卡状态切换 (2026-01-23)
**文件**: `c0_z1.yaml`, `c0_z1_dialogues.yaml`
**问题**: 身份卡没有 condition 控制显示/隐藏
**修复**: 添加 `identity_card` 和 `identity_card_done` 两个状态版本

### 修复5: 旧格式对话链合并 (2026-01-23)
**文件**: `NarrativeDataLoader.ts`
**问题**: 旧格式对话使用 `next` 字段链接多个对话，但 `registerDataToNarrativeEngine` 没有合并它们，导致对话无法正确链接到选择界面
**修复**: 在 `registerDataToNarrativeEngine` 中追踪 `next` 链接，将旧格式对话链合并成多行对话
```typescript
// 追踪整个链
const chain: IDialogue[] = [dialogue];
let current = dialogue;
while (current.next && dialogueMap.has(current.next)) {
  const nextDialogue = dialogueMap.get(current.next)!;
  chain.push(nextDialogue);
  current = nextDialogue;
}
```

### 修复6: 对话链 trigger 合并 (2026-01-23)
**文件**: `NarrativeDataLoader.ts`
**问题**: 对话链中间的对话有 trigger（如设置 flag），但只从最后一个对话获取 trigger，导致中间对话的效果丢失
**修复**: 合并整个对话链中所有对话的 trigger 效果
```typescript
const mergedTrigger = { cards: [], flags: [] };
for (const d of chain) {
  if (d.trigger) {
    // 合并卡片、伏笔、flags、能力
  }
}
```

---

*文档版本: v1.2*
*更新日期: 2026-01-23*
