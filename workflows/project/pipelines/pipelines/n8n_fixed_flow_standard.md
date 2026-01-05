# n8n 固定流程驱动标准（v1）

> 目标：把“AI 执行任务”变成**可自动流转、全程可追溯、可从任意阶段续跑**的工厂流水线；团队不需要在每步人工确认，只需要在任意时刻查看落盘结果并在需要时介入 review/合并。

**适用范围**：WSL 单入口 `n8n-secondary:5680`（当前形态）。  
**实现基线**：以可导入工作流 `workflows/project/n8n/fixed-flow-pipeline.json`（`versionId: fixedflow-v1-001`）与 `workflows/project/n8n/status-query-workflow.json` 为准。  
**非目标**：多人并发、多仓/多分支矩阵、多机队列（后续 v2）。

---

## 1. 核心原则（强制）

- **固定流程驱动**：n8n 工作流定义流程步骤；模型只负责“某一步的决策/生成”，不承担流程记忆。
- **全程落盘**：每一步必须把输入/输出/结果写入“阶段工件目录”，做到“可审计、可复跑、可定位”。
- **可续跑**：允许从任意 Stage 重新开始（指定 `resume_from_stage`），前面阶段工件不丢失。
- **幂等优先**：重复触发同一阶段不会产生不可控副作用（例如重复 push）；必要时通过 `run_id` 与 stage status 防重。
- **单任务串行**：当前只跑一个任务，避免 repo 并发写导致的冲突与状态污染。
- **强边界**：冻结目录 `design/ai-native/00_charter/**` 与 `design/ai-native/01_bibles/**` 禁止修改（任何阶段发现即 fail 并落盘原因）。

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
workflows/project/logs/automation_runs/<run_id>/
  status.json                    # 当前 run 的总状态（stage、时间、结果）
  00_intake.json                 # 入口参数快照（webhook body + 推导字段）
  01_preflight.json              # 环境检查结果（git status + git pull --ff-only）
  _prompt.md                     # 本次执行使用的最小提示（由 Task Pack 拼接生成）
  04_execute.json                # cursor-agent 执行结果（stdout/stderr/退出码）
  05_validate.json               # 门禁结果（当前实现：npm run validate --if-present）
  06_git.json                    # git 结果（是否有变更、commit/push 输出）
  07_notify.json                 # 通知结果（ok/stage/message）
  artifacts/                     # 可选：截图、导出、辅助文件等
```

> 约定：失败也必须落 `07_notify.json` + 更新 `status.json`（stage=失败阶段，ok=false，error=原因）。
>
> 说明（当前实现）：`02_plan.json`、`03_taskpack.md` **未单独落盘**（信息分别体现在 `00_intake.json`、`task_pack_path` 与 `_prompt.md` 中）。如需完整“每阶段一个文件”，需要后续补齐工作流节点。

---

## 4. 固定流程阶段（Stage Map）

阶段编号固定，便于观察与续跑（但注意：当前实现的 `resume_from_stage` 仅用于跳过 preflight，详见第 5 节）。

| Stage | 名称 | 产出（落盘） | 备注 |
|---:|---|---|---|
| 0 | intake | `00_intake.json`, `status.json(stage=0)` | webhook 入参快照、生成 `run_id` |
| 1 | preflight | `01_preflight.json`, `status.json(stage=1)` | git clean 检查 + `git pull --ff-only` |
| 4 | execute | `04_execute.json`, `status.json(stage=4)` | 调用 `workflows/project/n8n/run-cursor-task.sh` 执行 `cursor-agent` |
| 5 | validate | `05_validate.json`, `status.json(stage=5)` | 当前实现：`npm run validate --if-present` |
| 6 | git | `06_git.json`, `status.json(stage=6)` | `git add -A` →（有变更则）commit/push main |
| 99 | done | `07_notify.json`, `status.json(stage=99)` | 成功通知后写最终状态；失败时 `status.stage=失败阶段` |

> 预留：Stage=2(plan)、Stage=3(taskpack)、Stage=7(notify) 在“编号体系”中保留，但当前落地版本未把它们写入 `status.json`（不会出现 2/3/7）。

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

### 5.2 resume_from_stage（当前实现能力边界）

- `resume_from_stage` 在 `fixedflow-v1-001` 中**仅用于跳过 preflight**：当 `resume_from_stage > 1` 时，工作流直接进入“TaskPack 读取/生成”分支。
- 当前工作流**未实现**“从 execute/validate/git 任意阶段续跑”的分支路由（续跑语义属于后续增强项）。

建议策略（v1 实用）：
- **需要重跑**：优先生成新 `run_id`（更清晰）；旧 run 保留审计。

### 5.3 异步执行（已落地：避免 webhook 超时）

固定流程 v1（n8n 原生）采用“异步启动 + 外部观察”的方式：
- `POST /webhook/fixed-flow` **立即返回** `{ run_id, logs_dir, started_async:true }`
- 后台继续跑完整链路（preflight → execute → validate → git → notify → done）
- 观察方式：
  - 直接查看 `workflows/project/logs/automation_runs/<run_id>/status.json`
  - 或调用 `GET /webhook/status?run_id=<run_id>`（由 `workflows/project/n8n/status-query-workflow.json` 提供）

---

## 6. Preflight 标准（强制项）

`01_preflight.json` 必须包含：
- **repo 状态**：`git status --porcelain` 必须为空（否则 FAIL，提示先 reset/clean 或新 workspace）
  - 当前实现会**排除**：`.cursor/current_task_prompt.md` 与 `workflows/project/logs/automation_runs/**`，避免“审计落盘/提示文件”导致永远 dirty
- **分支策略（v1）**：允许直接 `main`（你已确认），但必须 `git pull --ff-only` 成功
- **远端**：必须是 `origin`，且有 push 权限可用
- **git identity**：必须配置 `user.name` / `user.email`（否则 git commit 会失败）
 - **串行锁**：当前 n8n 原生 fixed-flow **尚未落地锁**（见第 7 节“现状”）

---

## 7. 串行锁（单任务串行）

v1 推荐使用“文件锁目录”：

```
workflows/project/logs/automation_runs/_lock/
```

规则：
- 流程开始创建 `_lock/<run_id>`，失败即说明已有任务在跑 → 直接 FAIL 并落盘
- 流程结束（成功/失败）必须释放锁（删除目录）

现状（对齐最新落地）：
- **WSL Runner 服务**（`workflows/project/n8n/wsl-runner/server.mjs`，端口默认 `3210`）已实现上述锁逻辑。
- **n8n 原生** `fixed-flow-pipeline.json (fixedflow-v1-001)` **尚未加入锁节点**：请人工避免并发触发；后续可在工作流头部补齐“创建锁/释放锁”两步。

---

## 8. Git 阶段标准（v1：直接 main）

### 8.1 git 阶段动作（当前落地：stage=6 内提交）

顺序（`fixedflow-v1-001` 实现）：

1. `git add -A`
2. `git diff --cached --name-only` → 判定 `has_changes`
3. 若 `has_changes=false`：跳过 commit/push，仍写 `06_git.json`（stdout=no_changes）
4. 若 `has_changes=true`：
   - `git commit -m "<task_id>: <title> [run:<run_id>]"`（title 会截断到 60 字符）
   - `git push origin main`
5. 写 `06_git.json` + 更新 `status.json(stage=6)`

### 8.2 防重复 push（幂等）

- 若 `git diff --cached` 为空：不 commit、不 push，记为 `no_changes`，但仍进入 notify（告诉团队“无变更”）。
- 若 push 失败：不重试无限次，最多重试 1~2 次；超过则 FAIL，等待人工处理。

---

## 9. 通知阶段标准

无论成功/失败都通知：
- `task_id / run_id / stage / ok`
- `commit hash`（若有）
- `产物路径列表`（Deliverables）
- `关键日志路径`：`workflows/project/logs/automation_runs/<run_id>/`

---

## 10. n8n 工作流输入参数（对齐 fixedflow-v1-001）

入口（Webhook）body（JSON）：
- `run_id`（可选，不传则自动生成：`RUN-YYYYMMDD-HHMMSS-xxxx`）
- `task_id`（与 `task_pack_path` 二选一）
- `task_pack_path`（与 `task_id` 二选一；相对仓库根目录，如 `design/ai-native/03_taskpacks/T-0001_c0_z1_dialogue.md`）
- `title`（可选，用于 commit message）
- `role`（默认 `L3_engineer`）
- `task_type`（`doc|code|multimodal`，默认 `code`）
- `complexity`（`normal|high|max`，默认 `normal`）
- `model_override`（默认 `auto`）
- `project_root`（默认 `/home/shash/work/Footnote`）
- `resume_from_stage`（可选；当前仅用于跳过 preflight）

---

## 11. 与“未来多人多仓多分支”的关系（不做但要留口）

v2 扩展点：
- `project_root` 从单一路径扩展为 “workspace pool”（多个 clone/worktree）
- git 阶段从 `push main` 扩展为 `push branch + PR`（review 流程节点）
- preflight 引入“冲突检测”与“合并队列”


