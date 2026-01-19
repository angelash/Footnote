# TASK-PACK: T-____

> **模板说明**：复制此模板创建新任务包，命名格式为 `T-XXXX_<简短描述>.md`

> **可选前置字段（建议写在 YAML frontmatter 里，供自动化选模型/选执行器）**：
>
> - `task_type`: `doc` | `code` | `multimodal`
> - `complexity`: `normal` | `high` | `max`
> - `model_override`: (可选) 直接指定 cursor-agent `--model`，例如 `gpt-5.2-high`
> - `execution_runtime`: `wsl` | `windows`（默认 `wsl`）
> - `requires_mcp`: (可选) 例如 `browser`（需要 ChromeMCP/Browser MCP；Windows 无 cursor-agent 时由独立 MCP Runner 执行）

---

## 基本信息

| 字段 | 值 |
|------|---|
| **Task ID** | T-____ |
| **Level** | L1 / L2 / L3 |
| **Owner** | (上游负责人角色) |
| **Executor** | (执行者角色) |
| **Reviewer** | (验收人角色) |
| **对话预算** | 1~2 / 3~7 |
| **创建日期** | YYYY-MM-DD |
| **状态** | Draft / Ready / InProgress / Review / Done / Rollback |

---

## 1. Outcome（可观察结果）

> 完成后，玩家/系统能看到什么变化？用一句话描述。

- 

---

## 2. Allowed Inputs（允许引用的输入）

> 执行者**只能**读取以下文件，不得引用其他来源。

| 输入 | 路径 | 说明 |
|------|------|------|
| | | |
| | | |

---

## 3. Deliverables（必须交付物）

> 执行者**必须**输出到以下路径，格式必须符合示例。

| 输出 | 路径 | 格式要求 |
|------|------|---------|
| | | |
| | | |

### 输出格式示例

```
(提供一个最小示例)
```

---

## 4. Constraints（硬约束 / 禁止事项）

> 违反任何一条即判定任务失败。

- [ ] 禁止修改冻结目录（/design/ai-native/00_charter/, /design/ai-native/01_bibles/）
- [ ] 禁止引入新系统/新Schema（除非Task Pack明确授权）
- [ ] 禁止跨模块修改
- [ ] 禁止超过粒度上限
- [ ] (补充其他约束)

---

## 5. Acceptance Checklist（验收清单）

> 验收人按此清单逐项检查，全部通过才算完成。

- [ ] 输出文件存在且路径正确
- [ ] 输出格式符合示例
- [ ] 未修改冻结目录
- [ ] 粒度符合要求
- [ ] (补充具体验收点)

---

## 6. Self-Check（执行者自检回执格式）

> 执行者完成后**必须**按此格式提交回执。

```
【完成内容】
- ...

【输出文件】
- ...

【输入映射】
- (Spec条目) -> (输出位置)
- ...

【自检】
- [ ] 已对照验收清单逐项检查
- [ ] 未修改冻结目录
- [ ] 粒度符合要求
- [ ] ...

【风险与未完成】
- (如有)
```

---

## 7. Rollback Triggers（回滚条件）

> 出现以下情况直接判定失败，需回滚并要求上游重写Task Pack。

- 修改了冻结目录（00_charter, 01_bibles）
- 引入了未经CR审批的新系统/Schema
- 输出未落到指定路径
- 超过粒度上限（PR>400行、文件>6个）
- (补充其他回滚条件)

---

## 8. Dependencies（依赖任务）

> 本任务开始前必须完成的任务。

| 依赖任务 | 状态 |
|---------|------|
| T-____ | ⏳/✅ |

---

## 9. Notes（备注）

> 补充说明、风险提示、特殊情况处理等。

- 

---

*模板版本: v1.0*

