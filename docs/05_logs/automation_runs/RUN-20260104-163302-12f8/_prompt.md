# Task Execution Instructions

## Current Role: L3_engineer

## Task Pack:
---
task_id: T-REVIEW-20260103_project_quality
title: "项目审查：完成度与质量评估 + 后续开发计划"
task_type: doc
complexity: high
model_override: auto
execution_runtime: wsl
requires_mcp: false
---

# TASK-PACK: T-REVIEW-20260103_project_quality

## 基本信息

| 字段 | 值 |
|------|---|
| **Task ID** | T-REVIEW-20260103_project_quality |
| **Level** | L2 |
| **Owner** | L0_producer |
| **Executor** | L2_tools_lead |
| **Reviewer** | L0_producer |
| **状态** | Ready |

## 1. Outcome（可观察结果）

产出一份可审计的项目质检文档与一份后续开发计划文档，明确：
- 当前实现完成度（按系统/数据/测试/资产）
- 当前质量门禁状态（typecheck/lint/unit/coverage/e2e）
- 问题分级（Blocker/Critical/Major/Minor）与修复建议
- 后续 4~6 周里程碑计划与验收标准

## 2. Allowed Inputs（允许引用的输入）

- `package.json`
- `src/`
- `tests/`
- `docs/01_bibles/tech_bible.md`
- `docs/01_bibles/qa_bible.md`
- `docs/01_bibles/production_plan.md`
- `docs/02_specs/pipelines/n8n_cursor_cli_pipeline_spec.md`

## 3. Deliverables（必须交付物）

- `docs/04_acceptance/PROJECT-QUALITY-REVIEW_2026-01-03.md`
- `docs/02_specs/DEV-PLAN_2026Q1.md`

## 4. Constraints（硬约束 / 禁止事项）

- 禁止修改冻结目录：`docs/00_charter/**`、`docs/01_bibles/**`
- 文档必须可读、结构化（含表格/清单），且能直接被执行
- 结论必须能从“输入证据”推出（不要凭空断言）

## 5. Acceptance Checklist（验收清单）

- [ ] 质检文档包含：门禁命令、结果、分级问题清单、影响、建议修复策略
- [ ] 开发计划包含：P0/P1 任务、里程碑、验收标准、你需要参与的决策点
- [ ] 所有输出文件路径与 Deliverables 一致

## 6. Self-Check（执行者自检回执格式）

```
【完成内容】
- ...

【输出文件】
- ...

【自检】
- [ ] ...

【风险与未完成】
- (如有)
```




## Execution Rules:
1. Only read files listed in Allowed Inputs
2. Only write to paths listed in Deliverables
3. Follow all constraints strictly
4. Output a receipt in this format:

```
【完成内容】
- ...

【输出文件】
- ...

【自检】
- [ ] ...

【风险与未完成】
- (如有)
```
