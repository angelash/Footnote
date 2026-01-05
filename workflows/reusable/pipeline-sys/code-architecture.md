## Pipeline-Sys 代码架构设计文档（v1 / v2 / v3）

本文档基于 `workflows/reusable/pipeline-sys/design.md` 的确定性规格，给出可直接落地的代码组织方案：目录结构、模块职责、关键类型、API 路由、事件流与 UI 组件结构。

---

## 0. 范围与约束

### 0.1 v1 范围（强制）

- 固定流程执行权威：`workflows/reusable/n8n-common/wsl-runner/server.mjs`（`/fixed-flow`）
- 全程落盘根目录：`workflows/project/logs/automation_runs/<run_id>/`
- 将 `execute` 细分为 5 个子节点：`execute.plan`、`execute.edit`、`execute.lint`、`execute.test`、`execute.summary`
- 新增运行工件：`graph.json`、`events.ndjson`、`node_runs.json`、`control.json`、`nodes/*`
- 支持控制：cancel / retry（由 Console 转发到 Runner 控制接口）
- 串行锁升级：`_lock/<run_id>/lock.json` + 心跳 + TTL 防僵尸
- Console 提供只读看板：HTTP API + SSE 事件流，Web UI 行为树展示

### 0.2 v1 非目标

- Web 编辑流程图
- 多仓库并发调度
- 运行数据写入 DB

---

## 1. 顶层目录结构（新增工程）

v1 代码工程固定落在 `workflows/reusable/pipeline-sys/` 下，不与 `game/` 构建链路耦合。

```
workflows/reusable/pipeline-sys/
  design.md
  code-architecture.md

  console/                       # v1：后端 Console（HTTP + SSE）
    package.json
    tsconfig.json
    src/
      main.ts                    # 进程入口（读取 env，启动 server）
      server.ts                  # Fastify 实例、路由注册、错误处理
      config.ts                  # env 解析与默认值
      types/
        graph.ts                 # graph.json 结构
        events.ts                # events.ndjson 结构
        nodeRuns.ts              # node_runs.json 结构
        status.ts                # status.json 结构
      services/
        runsIndex.ts             # 扫描 automation_runs/ 生成 run 列表
        runLoader.ts             # 安全读取某个 run 的工件文件
        eventsTailer.ts          # tail events.ndjson -> SSE
        pathGuards.ts            # 路径归一化、防穿越
      routes/
        runs.ts                  # /api/runs、/api/runs/:runId
        events.ts                # /api/runs/:runId/events (SSE)
        file.ts                  # /api/runs/:runId/file
        control.ts               # /api/runs/:runId/cancel、/retry
      clients/
        runnerClient.ts          # 转发到 WSL Runner 的 HTTP client

  ui/                            # v1：前端 UI（Vite + React + ReactFlow）
    package.json
    tsconfig.json
    vite.config.ts
    src/
      main.tsx
      app/App.tsx
      api/consoleApi.ts          # 调用 Console API（run 列表/详情/文件）
      api/eventsSse.ts           # SSE 订阅与重连
      state/runStore.ts          # 全局状态（run 列表/当前 run/节点状态）
      pages/
        RunsPage.tsx             # 运行列表
        RunDetailPage.tsx        # 运行详情：行为树 + 面板 + 时间线
      components/
        BehaviorTree/GraphView.tsx
        BehaviorTree/NodeCard.tsx
        Panel/NodeDetailPanel.tsx
        Timeline/EventsTimeline.tsx
        Common/StatusBadge.tsx
      types/
        dto.ts                   # 与后端 DTO 对齐（从 shared 复制生成）

  shared/                        # v1：共享类型（仅 TypeScript 类型与 schema）
    package.json
    src/
      index.ts
      enums.ts                   # NodeStatus、EventType
      graph.ts                   # Graph v1
      events.ts                  # Events v1
      nodeRuns.ts                # NodeRuns v1
      status.ts                  # Status v1
      guards.ts                  # 轻量运行时校验（可选，v1 使用）
```

说明：
- v1 强制拆成 `console/ui/shared`，避免前后端自行定义字段导致漂移。
- `shared` 不含 Node 运行逻辑，只含“结构与枚举”。

---

## 2. v1 Runner（WSL Runner）代码改造边界

Runner 仍然是执行权威与唯一落盘者。Pipeline-Sys v1 不改 n8n，仅扩展 Runner：

### 2.1 Runner 增加的 HTTP endpoints（v1）

- `POST /fixed-flow/cancel`
  - body：`{ run_id: string, project_root?: string }`
  - 行为：写入 `<run_id>/control.json`，杀进程组，落盘事件，更新 status 与 node_runs，写 `07_notify.json`，释放锁

- `POST /fixed-flow/retry`
  - body：`{ run_id: string, node_id: string, project_root?: string }`
  - 行为：写入 `<run_id>/control.json` 的 retry 请求，Runner 在当前 node 结束后按规则重试指定 node

### 2.2 Runner 需要新增的内部模块（建议的文件拆分）

将现有 `server.mjs` 拆成可维护的模块，保持 ESM：

```
workflows/reusable/n8n-common/wsl-runner/
  server.mjs                     # 只保留 http server 与路由分发
  lib/
    paths.mjs                    # safeResolveUnderProject、runDir 计算
    io.mjs                       # writeJson/writeText/atomicWrite（tmp+rename）
    events.mjs                   # appendEvent(seq) + payload 截断策略
    graph.mjs                    # 写 graph.json（固定模板）
    nodeRuns.mjs                 # 维护 node_runs.json（状态快照）
    control.mjs                  # control.json 读写与请求合并
    lock.mjs                     # 防僵尸锁：lock.json、心跳、TTL、pid 检查
    exec.mjs                     # spawn+killpg+timeout 包装，流式写 NODE_LOG
    stages.mjs                   # 固定 stage -> node_id 映射与执行序列
    fixedFlow.mjs                # /fixed-flow 主流程（调用上述模块）
    notify.mjs                   # sendNotify（复用现有）
```

Runner 改造点必须落到 `lib/*`，`server.mjs` 不允许继续膨胀。

---

## 3. v1 数据结构与 TypeScript 类型（shared）

### 3.1 枚举（`shared/src/enums.ts`）

- `NodeStatus`：`PENDING | RUNNING | SUCCESS | FAILED | SKIPPED | CANCELLED | TIMEOUT`
- `EventType`：
  - `RUN_STARTED`
  - `NODE_STARTED`
  - `NODE_LOG`
  - `NODE_FINISHED`
  - `NODE_RETRY_SCHEDULED`
  - `NODE_TIMEOUT`
  - `RUN_CANCEL_REQUESTED`
  - `RUN_CANCELLED`
  - `RUN_FINISHED`
  - `LOCK_ACQUIRED`
  - `LOCK_STALE_CLEARED`
  - `LOCK_RELEASED`

### 3.2 Graph（`shared/src/graph.ts`）

- `IGraphV1`：对应 `<run_id>/graph.json`
- `INodeV1`：包含 `id/title/type/parent_id/outputs[]`
- `IEdgeV1`：包含 `from/to`
- `IOutputRefV1`：`label/rel_path/kind`

### 3.3 Events（`shared/src/events.ts`）

- `IEventV1`：对应 `events.ndjson` 每行 JSON
- `payload` 的结构按 `type` 分支

### 3.4 NodeRuns（`shared/src/nodeRuns.ts`）

- `INodeRunsSnapshotV1`：`{ version, run_id, updated_at, nodes: Record<node_id, INodeRunV1> }`
- `INodeRunV1`：
  - `status`
  - `attempt`
  - `started_at`
  - `ended_at`
  - `elapsed_ms`
  - `last_error`
  - `outputs[]`（与 graph 输出引用对齐）

### 3.5 Status（`shared/src/status.ts`）

`status.json` 继续保留 Runner 现有字段，并新增：
- `current_node_id`
- `ok`、`error` 与 `stage` 同步更新

---

## 4. v1 Console（后端）架构

### 4.1 技术栈与运行方式（固定）

- 运行时：Node.js（TypeScript 编译后运行）
- Web 框架：Fastify
- 实时：SSE（`text/event-stream`）
- 数据来源：文件系统（扫描 `automation_runs/`）

### 4.2 配置（`console/src/config.ts`）

环境变量固定：
- `PIPELINE_SYS_HOST`：默认 `127.0.0.1`
- `PIPELINE_SYS_PORT`：默认 `3230`
- `PROJECT_ROOT`：默认 `/home/shash/work/Footnote`
- `RUNNER_BASE_URL`：默认 `http://127.0.0.1:3210`

`PROJECT_ROOT` 是唯一真实的仓库根目录，Console 全部路径计算必须从此开始。

### 4.3 关键服务模块

#### 4.3.1 `runsIndex.ts`

- 输入：`PROJECT_ROOT`
- 输出：run 列表 DTO（按目录名解析 run_id，按 mtime 倒序）
- 规则：过滤 `_lock` 目录

#### 4.3.2 `runLoader.ts`

- 提供：
  - `loadStatus(runId)`
  - `loadGraph(runId)`
  - `loadNodeRuns(runId)`
  - `readRunFile(runId, relPath)`
- 强制使用 `pathGuards.ts` 限制 `relPath` 只能在 `<run_id>/` 内

#### 4.3.3 `eventsTailer.ts`

- 输入：`<run_id>/events.ndjson`
- 输出：SSE stream
- 行为：
  - 支持断线重连
  - `Last-Event-ID` 对应 `seq`
  - 若文件不存在：返回 SSE 并周期性重试直到出现

#### 4.3.4 `runnerClient.ts`

- `cancelRun(runId)`
- `retryNode(runId, nodeId)`
- 失败时将 Runner 错误原样回传给 UI（不吞错误）

### 4.4 路由（固定）

- `GET /api/runs`
- `GET /api/runs/:runId`
  - 返回：`status + graph + node_runs + outputs index`
- `GET /api/runs/:runId/events`（SSE）
- `GET /api/runs/:runId/file?path=<rel_path>`
- `POST /api/runs/:runId/cancel`
- `POST /api/runs/:runId/retry`（body：`{ node_id }`）

---

## 5. v1 UI（前端）架构

### 5.1 技术栈（固定）

- Vite + React + TypeScript
- React Flow：行为树渲染
- 状态管理：Zustand（`runStore.ts`）

### 5.2 页面与组件

#### 5.2.1 RunsPage

- 调用 `GET /api/runs`
- 列表项展示：run_id、task_id、ok、stage、updated_at

#### 5.2.2 RunDetailPage

页面结构固定：
- 左：`GraphView`（React Flow）
- 右：`NodeDetailPanel`
- 底：`EventsTimeline`

数据流：
- 首次加载：`GET /api/runs/:runId`
- 增量更新：SSE 订阅 `/events`，每条事件更新 `runStore` 中的 node 状态与时间线

### 5.3 行为树状态驱动（固定）

- `GraphView` 只负责渲染，节点状态全部来自 `runStore.nodeRunsSnapshot`
- 节点点击事件设置 `runStore.selectedNodeId`
- 右侧面板根据 `selectedNodeId` 拉取对应 outputs 文件并显示

### 5.4 控制操作（固定）

- Cancel：调用 `POST /api/runs/:runId/cancel`，按钮置灰直到收到 `RUN_CANCELLED` 或 `RUN_FINISHED`
- Retry：只在 `FAILED`、`TIMEOUT`、`CANCELLED` 状态时显示，调用 `POST /api/runs/:runId/retry`

---

## 6. v1 端到端数据流（固定）

1. 触发执行：n8n → Runner `/fixed-flow`
2. Runner 创建 `<run_id>/`，写入 `graph.json`、`status.json`、`node_runs.json`，并追加 `events.ndjson`
3. Console 扫描 run 列表，UI 可见该 run
4. UI 打开详情页，Console 返回工件快照
5. UI 订阅 SSE，实时渲染节点状态与时间线
6. UI 发 cancel/retry，Console 转发到 Runner，Runner 执行控制并落盘事件与快照

---

## 7. v2 / v3 代码演进策略（固定）

### 7.1 v2

- `shared` 扩展 FlowSpec 类型：`flowspec.ts`
- Console 新增 FlowSpec 详情页与 Run 图谱来源切换（graph 从 flowspec 编译生成）
- Runner 变成 Executor：保留 `/execute` 类接口，取消 `/fixed-flow` 编排逻辑

### 7.2 v3

- `console` 增加 executor registry 与队列服务
- run 工件目录保持兼容，新增 `metrics.json`、`alerts.json`


