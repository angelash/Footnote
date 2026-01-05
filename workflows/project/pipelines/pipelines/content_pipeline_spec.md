# Content Pipeline Spec v1.0

> **层级**: L2 规格层
> **上游依赖**: tech_bible.md
> **下游交付**: L3 脚本执行岗、L2 工具组长

---

## 1. 概述

定义游戏内容（对白、事件、卡片等）从创作到入库的标准流程。

### 1.1 与 AI-Native 固定流程（n8n）的对齐说明（现状）

- **自动化执行入口（推荐）**：`POST http://localhost:5680/webhook/fixed-flow`（见 `workflows/project/pipelines/n8n_fixed_flow_standard.md`）
- **默认门禁命令（当前实现）**：工作流运行 `npm run validate --if-present`
  - 如果你希望对白/事件/卡片/Zone 有强门禁，需要把对应校验器**接入到** `npm run validate`（或在工作流里扩展 Run Validate 命令）
- **提交策略（v1 PoC）**：fixed-flow 默认会 `commit/push main`；内容变更较大时仍建议走分支/PR（后续演进项）

---

## 2. 内容类型

| 类型 | 格式 | 路径 | 校验器 |
|------|------|------|--------|
| 对白 | YAML | `src/data/dialogues/` | dialogue_validator |
| 事件 | YAML | `src/data/events/` | event_validator |
| 卡片 | YAML | `src/data/cards/` | card_validator |
| Zone | YAML | `src/data/zones/` | zone_validator |
| 音频 | YAML | `src/data/audio/` | audio_validator |

---

## 3. 创作规范

### 3.1 对白创作

```yaml
# 文件: src/data/dialogues/c0_z1.yaml

C0_Z1_INTRO:
  - text_id: CENHUI_MONO_01
    character_id: CENHUI
    text: "又是平凡的一天。"
    tags: [calm, inner]
    
  - text_id: CENHUI_MONO_02
    character_id: CENHUI
    text: "窗外的光线穿过窗帘，落在地板上。"
    tags: [descriptive]
```

**约束**:
- 单句 ≤ 60 字符
- 单场景 ≤ 12 轮
- text_id 全局唯一

### 3.2 事件创作

```yaml
# 文件: src/data/events/c0_z1.yaml

C0_Z1_ENTRY:
  type: dialogue
  actions:
    - type: show_dialogue
      value: C0_Z1_INTRO
  next: C0_Z1_EXPLORE
  
C0_Z1_EXPLORE:
  type: choice
  choices:
    - id: look_window
      text_id: SYS_LOOK_WINDOW
      next_event: C0_Z1_WINDOW
    - id: go_door
      text_id: SYS_GO_DOOR
      next_event: C0_Z1_DOOR
```

**约束**:
- 单文件 ≤ 120 行
- 单任务 3-8 个事件
- 字段数 ≤ 20

---

## 4. 校验流程

### 4.1 校验器清单

| 校验器 | 职责 | 命令 |
|--------|------|------|
| schema_validator | JSON Schema 校验 | `npm run validate:schema` |
| text_validator | 文本ID存在性 | `npm run validate:text` |
| ref_validator | 引用完整性 | `npm run validate:refs` |
| length_validator | 长度限制 | `npm run validate:length` |

### 4.2 校验规则

```typescript
// 对白校验
const dialogueRules = {
  maxLineLength: 60,          // 单句最大字符
  maxLinesPerScene: 12,       // 单场景最大轮数
  requiredFields: ['text_id', 'text'],
  optionalFields: ['character_id', 'tags', 'expression'],
};

// 事件校验
const eventRules = {
  maxFileLines: 120,          // 单文件最大行数
  maxFieldCount: 20,          // 最大字段数
  forbiddenContent: [
    /eval\s*\(/,              // 禁止 eval
    /new\s+Function/,         // 禁止动态函数
  ],
};
```

---

## 5. 入库流程

```
┌────────────┐
│  创作内容   │
└─────┬──────┘
      │
      ▼
┌────────────┐
│  本地校验   │ ← npm run validate
└─────┬──────┘
      │ 通过
      ▼
┌────────────┐
│  提交 PR   │
└─────┬──────┘
      │
      ▼
┌────────────┐
│  CI 校验   │ ← GitHub Actions
└─────┬──────┘
      │ 通过
      ▼
┌────────────┐
│  Code Review│
└─────┬──────┘
      │ 批准
      ▼
┌────────────┐
│   合并入库  │
└────────────┘
```

---

## 6. 命名规范

### 6.1 文件命名
```
{chapter}_{zone}.yaml
示例: c0_z1.yaml, c1_z3.yaml
```

### 6.2 ID命名
```
{CHAPTER}_{ZONE}_{TYPE}_{NAME}
示例: C0_Z1_INTRO, C0_Z1_CHOICE_WINDOW
```

### 6.3 文本ID命名
```
{CHARACTER}_{TYPE}_{NUMBER}
示例: CENHUI_MONO_01, SYS_CHOICE_YES
```

---

## 7. 版本控制

### 7.1 变更规则
- 新增内容：新建文件或追加
- 修改内容：直接编辑 + CR（如影响已发布）
- 删除内容：标记废弃，不立即删除

### 7.2 回滚策略
- Git revert 到上一稳定版本
- 记录到 rollback_log.md

---

## 8. 边界约束

### 8.1 粒度限制
- 单 PR 内容文件: ≤ 5 个
- 单文件大小: ≤ 50KB
- 单批次对白: ≤ 100 条

### 8.2 禁区
- 禁止合并未校验的内容
- 禁止硬编码文本
- 禁止循环引用

---

## 9. 验收标准

- [ ] 所有内容通过 Schema 校验
- [ ] 文本ID无重复无遗漏
- [ ] 引用链完整
- [ ] 命名规范一致
- [ ] CI 校验绿色

---

*版本: v1.0 | 创建: 2025-12-29 | 状态: 草案*

