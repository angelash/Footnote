# n8n 固定流程驱动标准（v1）

> 目标：把“AI 执行任务”变成**可自动流转、全程可追溯、可从任意阶段续跑**的工厂流水线；团队不需要在每步人工确认，只需要在任意时刻查看落盘结果并在需要时介入 review/合并。

**适用范围**：WSL 单入口 `n8n-secondary:5680`（当前形态），单任务串行。  
**非目标**：多人并发、多仓/多分支矩阵、多机队列（后续 v2）。

---

## 1. 核心原则（强制）

- **固定流程驱动**：n8n 工作流定义流程步骤；模型只负责“某一步的决策/生成”，不承担流程记忆。
- **全程落盘**：每一步必须把输入/输出/结果写入“阶段工件目录”，做到“可审计、可复跑、可定位”。
- **可续跑**：允许从任意 Stage 重新开始（指定 `resume_from_stage`），前面阶段工件不丢失。
- **幂等优先**：重复触发同一阶段不会产生不可控副作用（例如重复 push）；必要时通过 `run_id` 与 stage status 防重。
- **单任务串行**：当前只跑一个任务，避免 repo 并发写导致的冲突与状态污染。
- **强边界**：冻结目录 `docs/00_charter/**` 与 `docs/01_bibles/**` 禁止修改（任何阶段发现即 fail 并落盘原因）。

---

## 2. 名词与标识

- **task_id**：任务唯一标识（业务 id）。
- **run_id**：一次流水线运行标识（等同“执行批次”）；建议 `RUN-YYYYMMDD-HHMMSS-<short>`。
- **stage**：固定流程阶段（见第 4 节）。
- **attempt**：阶段重试次数（从 1 递增）。

---

## 3. 落盘目录结构（强制）

所有执行工件统一落到：

```
docs/05_logs/automation_runs/<run_id>/
  status.json                    # 当前 run 的总状态（stage 指针、时间、结果）
  00_intake.json                 # 入口参数快照（webhook body + 推导字段）
  01_preflight.json              # 环境检查结果（repo clean? branch? remote? 版本?）
  02_plan.json                   # 计划/路由结果（role、task_type、模型、runner）
  03_taskpack.md                 # 固定流程输入契约（Task Pack 文本）
  04_execute.json                # cursor-cli 执行结果（stdout/stderr/退出码/回执）
  05_validate.json               # 门禁结果（typecheck/lint/test/coverage）
  06_git.json                    # git 结果（diff 摘要、commit hash、push 结果）
  07_notify.json                 # 通知结果（status code / payload 摘要）
  artifacts/                     # 可选：截图、导出、辅助文件等
```

> 约定：任何阶段失败也必须写对应的 `stage.json`，并把失败原因写入 `status.json`。

---

## 4. 固定流程阶段（Stage Map）

阶段编号固定，便于 resume。

| Stage | 名称 | 产出（落盘） | 失败策略 |
|---:|---|---|---|
| 00 | intake | `00_intake.json` | 直接 FAIL |
| 01 | preflight | `01_preflight.json` | 直接 FAIL |
| 02 | plan | `02_plan.json` | 直接 FAIL |
| 03 | taskpack | `03_taskpack.md` | 直接 FAIL |
| 04 | execute | `04_execute.json` | FAIL，可重试（attempt++） |
| 05 | validate | `05_validate.json` | FAIL，可重试（一般回到 stage04） |
| 06 | git | `06_git.json` | FAIL：不 push；可重试/人工介入 |
| 07 | notify | `07_notify.json` | FAIL：可重试，不影响代码结果 |
| 99 | done | `status.json` | - |

---

## 5. 状态机与可续跑语义

### 5.1 status.json（最小字段）

```json
{
  "run_id": "RUN-20260104-120000-ab12",
  "task_id": "T-XXXX",
  "stage": 4,
  "attempt": 1,
  "ok": false,
  "started_at": "2026-01-04T12:00:00Z",
  "updated_at": "2026-01-04T12:02:30Z",
  "error": "validate failed: typecheck",
  "repo": {
    "root": "/home/shash/work/Footnote",
    "branch": "main",
    "head": "e8121b8"
  }
}
```

### 5.2 resume_from_stage

- `resume_from_stage = N` 表示从第 N 阶段重新执行；
- 小于 N 的阶段工件 **保留不删**（用于追溯）；
- 当 `resume_from_stage` 小于当前 `status.stage` 时，允许“回退重跑”，但必须生成新的 `attempt` 或新的 `run_id`（二选一）。

建议策略（v1 简化）：
- **重跑产生新 run_id**（更简单、审计更清晰）；旧 run 保留。

---

## 6. Preflight 标准（强制项）

`01_preflight.json` 必须包含：
- **repo 状态**：`git status --porcelain` 必须为空（否则 FAIL，提示先 reset/clean 或新 workspace）
- **分支策略（v1）**：允许直接 `main`（你已确认），但必须 `git pull --ff-only` 成功
- **远端**：必须是 `origin`，且有 push 权限可用
- **串行锁**：获取锁成功（见第 7 节）

---

## 7. 串行锁（单任务串行）

v1 推荐使用“文件锁目录”：

```
docs/05_logs/automation_runs/_lock/
```

规则：
- 流程开始创建 `_lock/`（或 `_lock/<run_id>`），失败即说明已有任务在跑 → 直接 FAIL 并落盘
- 流程结束（成功/失败）必须释放锁（删除目录）

---

## 8. Git 阶段标准（v1：直接 main）

### 8.1 git 阶段动作

1. `git add -A`
2. `git diff --cached --name-only` 写入 `06_git.json`
3. `git commit -m "<task_id>: <title> [run:<run_id>]"`  
4. `git push origin main`

### 8.2 防重复 push（幂等）

- 若 `git diff --cached` 为空：不 commit、不 push，记为 `no_changes`，但仍进入 notify（告诉团队“无变更”）。
- 若 push 失败：不重试无限次，最多重试 1~2 次；超过则 FAIL，等待人工处理。

---

## 9. 通知阶段标准

无论成功/失败都通知：
- `task_id / run_id / stage / ok`
- `commit hash`（若有）
- `产物路径列表`（Deliverables）
- `关键日志路径`：`docs/05_logs/automation_runs/<run_id>/`

---

## 10. n8n 工作流输入参数（建议 schema）

入口（Webhook）建议 body：
- `task_id`（必填）
- `title`（可选）
- `role`（默认 `L3_engineer`）
- `task_type`（`doc|code|multimodal`，默认 `code`）
- `complexity`（`normal|high|max`，默认 `normal`）
- `model_override`（默认 `auto`）
- `project_root`（默认 `/home/shash/work/Footnote`）
- `auto`（默认 `true`：不需要人工确认，自动跑到结束）
- `resume_from_stage`（可选）

---

## 11. 与“未来多人多仓多分支”的关系（不做但要留口）

v2 扩展点：
- `project_root` 从单一路径扩展为 “workspace pool”（多个 clone/worktree）
- git 阶段从 `push main` 扩展为 `push branch + PR`（review 流程节点）
- preflight 引入“冲突检测”与“合并队列”


