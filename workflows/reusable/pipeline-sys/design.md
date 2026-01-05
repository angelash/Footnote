## Pipeline-Sys：自建流程系统（v1 / v2 / v3 规格书）

本文件把“自建 Orchestrator + 行为树可视化”落成可执行规格，所有关键点给出确定方案，不留分叉。

---

## 0. 背景与目标

### 0.1 背景
当前仓库已经落地：
- `workflows/reusable/n8n-common/wsl-runner/server.mjs`：WSL 内 HTTP Runner（端口 `3210`），负责固定流程 `/fixed-flow` 执行与落盘审计
- `workflows/project/n8n/fixed-flow-pipeline.json`：n8n 只做 Webhook 入口，转发到 `http://localhost:3210/fixed-flow`
- 固定流程落盘根目录：`workflows/project/logs/automation_runs/<run_id>/`

Pipeline-Sys 的 v1 目标是：在不推翻现有链路的前提下，把运行态变成“像 UE 行为树一样可观测”，并补齐取消、超时、重试、锁防僵尸等执行语义。

### 0.2 目标（必须达成）
- **BS 架构**：浏览器访问 Web UI，UI 只展示与操作控制按钮，不提供图编辑
- **行为树可视化**：节点状态、边流转高亮、时间线事件、节点日志与产物可点开
- **执行语义完整**：取消、超时、重试、串行锁防僵尸、幂等与可恢复语义明确且落盘可审计
- **颗粒度提升**：把 `execute` 细分为 `plan / edit / lint / test / summary` 子节点
- **单仓库单任务串行**：同一 `project_root` 同时只允许一个 run 处于 running
- **全程落盘根目录固定**：`workflows/project/logs/automation_runs/`

### 0.3 非目标（v1 不做）
- Web 端流程编辑
- 多仓库并发队列
- 分布式执行器集群
- 运行数据写入数据库

---

## 1. 版本规划

### 1.1 v1（固定流程可观测 + 可控）
v1 只针对固定流程 `/fixed-flow`，以“可观测 + 执行语义补齐”为核心。

**v1 交付物**：
- 运行工件：在 `workflows/project/logs/automation_runs/<run_id>/` 增加事件流与节点快照
- Runner 行为：在 `wsl-runner` 中实现取消、超时、重试、锁防僵尸、execute 子节点事件化
- Console 服务：新增一个只读看板服务 `pipeline-sys`（HTTP + SSE），读取 run 目录并渲染行为树 UI

### 1.2 v2（FlowSpec 进入系统，Runner 变成 Executor）
v2 引入 FlowSpec DSL，Pipeline-Sys 后端负责编排，Runner 仅做 Executor。

### 1.3 v3（多执行器与规模化治理）
v3 支持多执行域、资源隔离、指标告警与权限治理。

---

## 2. v1 架构与边界

### 2.1 组件职责
- **n8n（入口）**：只负责触发 Webhook，不承载编排状态
- **WSL Runner（执行与落盘）**：唯一执行权威，负责写 run 工件目录，提供控制接口
- **Pipeline-Sys Console（观测与控制面）**：读取 run 工件并展示，向 Runner 发起控制命令

### 2.2 运行域与路径
- **代码仓库工作副本**：`/home/shash/work/Footnote`（WSL 路径）
- **全程落盘根目录**：`workflows/project/logs/automation_runs/`（相对 repo root）
- **审计附加日志**：`workflows/project/logs/decisions_log.md`、`rollback_log.md`、`task_log.md`

---

## 3. v1 运行工件目录结构（强制）

每次 run 的目录固定为：

```
workflows/project/logs/automation_runs/<run_id>/
  status.json                # run 总状态快照（含当前节点、错误摘要）
  graph.json                 # 行为树图谱（nodes/edges，含层级与布局 hint）
  events.ndjson              # 事件流（追加写，NDJSON）
  node_runs.json             # 节点状态快照（便于 UI 免回放 events）
  control.json               # 控制面请求（cancel/retry）持久化

  00_intake.json             # 入口参数快照
  01_preflight.json          # preflight 结果
  02_plan.json               # plan 产物（固定格式）
  03_taskpack.md             # task pack 快照
  04_execute.json            # cursor-agent 执行结果（含回执文本）
  05_validate.json           # validate 汇总（lint/test 分段）
  06_git.json                # git 汇总（写在 commit 前）
  07_notify.json             # 通知结果

  nodes/                     # v1 新增：子节点细分产物（命名稳定）
    execute.plan.json
    execute.edit.json
    execute.lint.json
    execute.test.json
    execute.summary.md

  artifacts/                 # 可选：截图、导出、临时文件（只存引用，不进 events payload）
```

说明：
- `events.ndjson` 是唯一的“流转事实源”，`status.json` 与 `node_runs.json` 是便于读取的快照
- `nodes/*` 是对子节点的稳定输出接口，UI 与后续 v2 编排均以此为准

---

## 4. v1 行为树图谱（graph.json）

### 4.1 节点列表（固定）
v1 图谱节点 ID 固定，禁止随意改名：

- `stage.intake`
- `stage.preflight`
- `execute`（group）
  - `execute.plan`
  - `execute.edit`
  - `execute.lint`
  - `execute.test`
  - `execute.summary`
- `stage.notify`
- `stage.done`
- `stage.git`

### 4.2 边关系（固定）
依赖边固定为：

```
stage.intake -> stage.preflight -> execute.plan -> execute.edit -> execute.lint -> execute.test -> execute.summary -> stage.notify -> stage.done -> stage.git
```

### 4.3 状态枚举（固定）
所有节点状态取值固定为：
- `PENDING`
- `RUNNING`
- `SUCCESS`
- `FAILED`
- `SKIPPED`
- `CANCELLED`
- `TIMEOUT`

### 4.4 graph.json 格式（固定字段）
`graph.json` 必须包含：
- `version`: `"v1"`
- `run_id`
- `nodes[]`: `{ id, type, title, parent_id, outputs[] }`
- `edges[]`: `{ from, to }`
- `layout`: `{ direction: "TB", group_padding: number }`

`outputs[]` 为 UI 的“产物入口”，每个元素格式：
- `{ label, rel_path, kind }`
其中 `kind` 取值固定为：`json`、`markdown`、`text`、`file`

---

## 5. v1 事件流（events.ndjson）

### 5.1 事件写入规则（强制）
- `events.ndjson` 只追加写
- 每行是一个 JSON 对象，不允许多行
- 单条事件 payload 必须小于 64KB
- 大输出只写入 `artifacts/`，events 只存 `artifact_ref`

### 5.2 事件类型（固定）
v1 支持的事件类型固定为：
- `RUN_STARTED`
- `NODE_STARTED`
- `NODE_LOG`（可多次）
- `NODE_FINISHED`
- `NODE_RETRY_SCHEDULED`
- `NODE_TIMEOUT`
- `RUN_CANCEL_REQUESTED`
- `RUN_CANCELLED`
- `RUN_FINISHED`
- `LOCK_ACQUIRED`
- `LOCK_STALE_CLEARED`
- `LOCK_RELEASED`

### 5.3 事件结构（固定字段）
每条事件必须包含：
- `ts`：ISO8601
- `run_id`
- `type`
- `node_id`：非 node 事件写空字符串
- `seq`：从 1 开始递增
- `payload`：对象

`NODE_LOG.payload` 固定字段：
- `stream`: `"stdout"`、`"stderr"`、`"system"`
- `text`: 日志片段（截断到 4000 字符）
- `artifact_ref`: 可选，指向 `artifacts/...`

---

## 6. v1 执行语义（取消 / 超时 / 重试）

本节定义 Runner 必须实现的确定行为，Pipeline-Sys 只负责发控制请求与展示。

### 6.1 取消语义（强制）
- UI 点击 Cancel 时，Console 调用 Runner：`POST /fixed-flow/cancel`，body：`{ run_id, project_root }`
- Runner 在 `<run_id>/control.json` 写入：`{ cancel: { requested_at, requested_by } }`
- Runner 追加事件：`RUN_CANCEL_REQUESTED`
- Runner 终止当前正在运行的命令进程组（kill process group）
- Runner 将当前 `node_id` 标记为 `CANCELLED`，后续节点统一标记为 `SKIPPED`
- Runner 更新 `status.json.ok=false`，`status.json.error="cancelled"`，并追加事件 `RUN_CANCELLED`
- Runner 写入 `07_notify.json`（ok=false，stage=当前节点对应 stage）
- Runner 释放串行锁

### 6.2 超时语义（强制）
- 每个 node 都有固定 timeout：
  - `execute.edit`: 60 分钟
  - `execute.lint`: 20 分钟
  - `execute.test`: 30 分钟
  - 其余节点: 5 分钟
- 超时触发时 Runner 必须：
  - 追加事件 `NODE_TIMEOUT`
  - 终止命令进程组
  - 将节点状态置为 `TIMEOUT`
  - 进入重试判定

### 6.3 重试语义（强制）
- 重试只发生在：`execute.edit`、`execute.lint`、`execute.test`
- 最大尝试次数固定：2 次（attempt=1 首次，attempt=2 重试）
- 重试退避时间固定：10 秒
- 触发条件固定：节点 exit code 非 0，节点 TIMEOUT
- 重试行为：
  - 追加事件 `NODE_RETRY_SCHEDULED`
  - 等待 10 秒
  - attempt+1 重新执行节点
- attempt=2 仍失败时：节点状态 `FAILED`，run 状态 `FAILED`

### 6.4 幂等与恢复（v1 定义）
- `run_id` 唯一目录不可覆盖
- Runner 在启动 run 时若发现目录已存在：直接返回错误 `run_id_exists`
- `resume_from_stage` 在 v1 保留，语义固定为：从指定 node_id 重新开始执行，其前序节点标记为 `SKIPPED`，不重写旧产物文件

---

## 7. v1 串行锁（防僵尸版本）

### 7.1 目录与元信息
- 锁根目录固定：`workflows/project/logs/automation_runs/_lock/`
- 锁实例目录固定：`_lock/<run_id>/`
- 元信息文件固定：`_lock/<run_id>/lock.json`

`lock.json` 固定字段：
- `run_id`
- `project_root`
- `pid`
- `host`
- `started_at`
- `updated_at`
- `ttl_ms`（固定：7200000）

### 7.2 心跳规则（强制）
Runner 在 run 执行期间每 10 秒刷新 `updated_at`。

### 7.3 防僵尸清理规则（强制）
当 Runner 尝试获取锁且发现 `_lock/` 内已有目录时，必须按顺序处理：
1. 读取每个 `lock.json`
2. 若 `updated_at` 距当前超过 `ttl_ms`：判定为 stale，删除该锁目录，并追加事件 `LOCK_STALE_CLEARED`
3. 若 `pid` 在系统进程表中不存在：判定为 stale，删除该锁目录，并追加事件 `LOCK_STALE_CLEARED`
4. 清理完成后仍存在锁目录：返回错误 `lock_busy`，并把占用锁的 `run_id` 列入错误 payload

### 7.4 锁事件（强制）
- 成功获取锁追加事件：`LOCK_ACQUIRED`
- 正常结束释放锁追加事件：`LOCK_RELEASED`
- 异常结束也必须释放锁并追加 `LOCK_RELEASED`

---

## 8. v1 API（Pipeline-Sys Console）

### 8.1 运行列表
- `GET /api/runs`
  - 返回：按目录扫描 `automation_runs/` 的 run 列表（按时间倒序）

### 8.2 运行详情
- `GET /api/runs/:runId`
  - 返回：`status.json`、`graph.json`、`node_runs.json`、关键产物路径

### 8.3 事件流（SSE）
- `GET /api/runs/:runId/events`
  - 返回：SSE，按 `events.ndjson` 增量推送

### 8.4 节点产物读取
- `GET /api/runs/:runId/file?path=<rel_path>`
  - 限制：只允许读取该 run 目录内的相对路径

### 8.5 控制接口
- `POST /api/runs/:runId/cancel`
  - Console 转发到 Runner：`POST /fixed-flow/cancel`
- `POST /api/runs/:runId/retry`
  - body：`{ node_id }`
  - Console 转发到 Runner：`POST /fixed-flow/retry`

---

## 9. v1 UI（行为树看板）

### 9.1 页面结构（固定）
- Run 列表页：按状态过滤（running、success、failed、cancelled），点击进入详情
- Run 详情页：左侧行为树图，右侧节点详情面板，底部事件时间线

### 9.2 行为树渲染规则（固定）
- 使用 React Flow 渲染
- 布局方向：自上向下
- `execute` 为 group 节点，子节点缩进显示
- 节点颜色规则固定：
  - PENDING 灰
  - RUNNING 蓝
  - SUCCESS 绿
  - FAILED 红
  - SKIPPED 浅灰
  - CANCELLED 橙
  - TIMEOUT 紫
- 最近一次状态变更的边高亮 3 秒

### 9.3 节点详情面板（固定）
显示内容：
- 基本信息：node_id、status、attempt、start/end、elapsed
- 日志：按 `NODE_LOG` 渲染，支持 tail 与分页
- 产物：来自 `graph.json.nodes[].outputs[]`，点击打开文件

---

## 10. v2 规格摘要（FlowSpec 编排）

v2 引入 `flowspec.json`，Pipeline-Sys 后端编译 DAG 并驱动 Executor：
- FlowSpec 存放：`workflows/project/flowspecs/<flow_id>.json`
- Run 目录新增：`flowspec.snapshot.json`
- Executor 接口固定：`execute(command, cwd, env, timeout_ms)`，返回 `{ exit_code, stdout_ref, stderr_ref }`

---

## 11. v3 规格摘要（多执行器与治理）

v3 目标：多执行域、资源隔离与治理能力：
- 多 Executor 注册表
- 并发队列与限流
- 指标与告警
- 权限与审计策略