---
task_id: T-0001
title: 序章 Zone1 对白创作
role: L3_writer
status: READY
upstream: C0 章节大纲
downstream: T-0002 事件脚本
priority: high
estimated_hours: 2
---

# Task Pack: T-0001 序章 Zone1 对白创作

## 1. 任务目标

为序章 Zone1（C0-Z1）创作对白内容，包括：
- 岑回的独白
- 与顾临的初次对话
- 环境描述文本

## 2. Allowed Inputs

- design/ai-native/01_bibles/design_bible.md（角色设定部分）
- design/01-narrative/角色人生线档案 v2.md（岑回、顾临档案）
- design/03-level/章节×区域叙事布置/C0-Z1.md（Zone 结构）
- content/text/style_guide.md（文本风格指南）

## 3. Deliverables

- src/data/dialogues/c0_z1.yaml

## 4. Constraints

- 单句 ≤ 60 字符
- 单场景 ≤ 12 轮对白
- text_id 命名规范: `{CHARACTER}_{TYPE}_{NUMBER}`
  - CHARACTER: CENHUI, GULIN, SYSTEM
  - TYPE: MONO（独白）, DIA（对话）, DESC（描述）
  - NUMBER: 三位数字 001-999
- 必须符合角色语气设定
- 不得引入新设定或角色

## 5. Output Schema

```yaml
# src/data/dialogues/c0_z1.yaml
dialogues:
  - id: CENHUI_MONO_001
    speaker: cenhui
    type: monologue
    text: "对白内容"
    emotion: neutral  # neutral, happy, sad, angry, confused
    
  - id: CENHUI_DIA_001
    speaker: cenhui
    target: gulin
    type: dialogue
    text: "对白内容"
    emotion: neutral
    
  - id: SYSTEM_DESC_001
    speaker: system
    type: description
    text: "环境描述"
```

## 6. Acceptance Checklist

- [ ] 所有 text_id 唯一且符合命名规范
- [ ] 单句长度 ≤ 60 字符
- [ ] 单场景对白轮数 ≤ 12
- [ ] 岑回语气符合设定（克制、观察者视角）
- [ ] 顾临语气符合设定（理性、收敛主义）
- [ ] 无新增设定或角色
- [ ] YAML 格式正确，可被解析

## 7. 回执格式

```markdown
【完成内容】
- 交付对白场景: C0_Z1_INTRO
- 对白总轮数: X轮
- 涉及角色: 岑回、顾临

【输出文件】
- src/data/dialogues/c0_z1.yaml

【输入映射】
- design_bible.md → 角色设定
- 角色人生线档案 v2.md → 岑回/顾临性格
- C0-Z1.md → 场景结构

【自检】
- [x] text_id 唯一且命名规范
- [x] 单句 ≤ 60 字符
- [x] 单场景 ≤ 12 轮
- [x] 角色语气符合设定
- [x] 无新增设定
- [x] YAML 格式正确

【风险与未完成】
- 无
```

## 8. Rollback Triggers

以下情况判定任务失败，需要返工：

- text_id 不唯一或命名不规范
- 单句超过 60 字符
- 单场景超过 12 轮对白
- 角色语气明显不符合设定
- 引入了新的设定或角色
- YAML 格式错误无法解析
- 修改了 Allowed Inputs 以外的文件

---

*创建时间: 2025-12-29*
*创建者: L2_writing_lead*



