# Task Pack 标准规范 v1.1

> **本文档定义派单层文档的统一标准，所有任务包必须遵循此规范**

---

## 必需章节（9章）

| # | 章节 | 必需 | 说明 |
|---|------|------|------|
| 1 | Outcome（可观察结果） | ✅ | 一句话描述完成后的变化 |
| 2 | Allowed Inputs（允许输入） | ✅ | 执行者只能读取的文件列表 |
| 3 | Deliverables（必须交付物） | ✅ | 输出路径和格式要求 |
| 4 | Constraints（硬约束） | ✅ | 违反即失败的规则 |
| 5 | Acceptance Checklist（验收清单） | ✅ | 逐项检查的清单 |
| 6 | Self-Check（自检回执格式） | ✅ | 执行者提交的回执模板 |
| 7 | Rollback Triggers（回滚条件） | ✅ | 判定失败的条件 |
| 8 | Dependencies（依赖任务） | ⚪ | 前置任务（无则省略） |
| 9 | Notes（备注） | ⚪ | 补充说明（无则省略） |

---

## 必需元数据（YAML Frontmatter）

```yaml
---
task_id: T-YYYYMMDDTHHMMSS_<TYPE>_task  # 或 T-XXXX
title: 任务标题
role: L1_*/L2_*/L3_*  # 执行者角色
status: Draft|Ready|InProgress|Review|Done|Rollback
upstream: 上游文档/任务
downstream: 下游任务
priority: low|normal|high|critical
estimated_hours: 预估工时（小时）
# 可选
task_type: doc|code|multimodal
complexity: normal|high|max
model_override: 模型覆盖
execution_runtime: wsl|windows
requires_mcp: browser|...
---
```

---

## 命名规范

### 文件名格式
```
T-<ID>_<简短描述>.md

示例：
- T-0001_c0_z1_dialogue.md          # 手动编号
- T-20260115T143705_REQ-1768_task.md # 自动时间戳
```

### Task ID 格式
- 手动编号：`T-0001` ~ `T-9999`
- 自动时间戳：`T-YYYYMMDDTHHMMSS_<TYPE>`

---

## 质量检查清单

### 结构检查
- [ ] 包含所有 7 个必需章节
- [ ] YAML Frontmatter 格式正确
- [ ] 文件命名符合规范

### 内容检查
- [ ] Outcome 为一句话描述
- [ ] Allowed Inputs 列出所有允许读取的文件
- [ ] Deliverables 包含具体路径和格式示例
- [ ] Constraints 包含禁止修改冻结目录
- [ ] Acceptance Checklist 可逐项勾选
- [ ] Self-Check 包含标准回执模板
- [ ] Rollback Triggers 包含粒度超限条件

### 一致性检查
- [ ] role 与实际执行者匹配
- [ ] status 与实际状态一致
- [ ] 路径引用均存在且正确

---

## 标准约束（所有任务包必须包含）

```markdown
## 4. Constraints（硬约束）

- [ ] 禁止修改冻结目录（`/design/ai-native/00_charter/`, `/design/ai-native/01_bibles/`）
- [ ] 禁止引入新系统/新Schema（除非Task Pack明确授权）
- [ ] 禁止跨模块修改
- [ ] 禁止超过粒度上限（PR≤400行、文件≤6个）
```

---

## 标准回滚条件（所有任务包必须包含）

```markdown
## 7. Rollback Triggers（回滚条件）

- 修改了冻结目录（00_charter, 01_bibles）
- 引入了未经CR审批的新系统/Schema
- 输出未落到指定路径
- 超过粒度上限（PR>400行、文件>6个）
```

---

## 模板引用

- 完整模板：`design/ai-native/03_taskpacks/_template.md`
- 示例任务包：`design/ai-native/03_taskpacks/T-0001_c0_z1_dialogue.md`

---

*规范版本: v1.1*  
*更新日期: 2026-01-19*  
*维护者: L1_pmo*
