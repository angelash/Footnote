# Pipeline-Sys 完整实现分析报告

> 生成时间：2026-01-07
> 分析版本：v1.0.0 / v2.2.0

---

## 📋 总体状态

| 版本 | 状态 | 说明 |
|------|------|------|
| **v1** | ✅ **已完成** | 固定流程执行与可视化系统 |
| **v2** | ✅ **核心完成** | FlowSpec 配置化流程引擎 |
| **v2.1** | ✅ **已完成** | WSL Runner v2 API 集成 |
| **v2.2** | ✅ **已完成** | /fixed-flow 硬编码迁移到配置化 |

**测试统计**：197 个单元测试全部通过 ✅

### v2.2 变更说明 (2026-01-07)

**重大变更**：`/fixed-flow` 端点已从硬编码迁移到配置化流程

- 删除 `handleFixedFlow` 中约 400 行硬编码逻辑
- 新增 `fixed-flow.flowspec.json` 配置文件（14 个节点）
- `/fixed-flow` 现在内部调用 v2 引擎 + FlowSpec 文件
- 保持 API 接口向后兼容

---

## 🏗️ 系统架构

### 整体架构图

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          Pipeline-Sys 架构总览                              │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────┐                                                           │
│  │    n8n      │  Webhook 入口                                             │
│  │  (8080)     │  /fixed-flow → 转发到 Runner                              │
│  └──────┬──────┘                                                           │
│         │ HTTP POST                                                        │
│         ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      WSL Runner (port 3210)                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  v1 端点:                     v2 端点:                               │   │
│  │  • POST /fixed-flow           • POST /v2/run                        │   │
│  │  • GET  /fixed-flow/status    • GET  /v2/run/status                 │   │
│  │  • POST /fixed-flow/cancel    • POST /v2/run/cancel                 │   │
│  │  • POST /fixed-flow/retry                                           │   │
│  │                                                                      │   │
│  │  lib/ v1 模块:                lib/v2/ v2 引擎:                        │   │
│  │  ├── stages.mjs               ├── parser.mjs                        │   │
│  │  ├── graph.mjs                ├── expression.mjs                    │   │
│  │  ├── events.mjs               ├── context.mjs                       │   │
│  │  ├── nodeRuns.mjs             ├── executor-base.mjs                 │   │
│  │  ├── control.mjs              ├── flow-runner.mjs                   │   │
│  │  └── lock.mjs                 └── executors/                        │   │
│  └──────────────────────┬──────────────────────────────────────────────┘   │
│                         │ 写入                                             │
│                         ▼                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              File System (Run Artifacts)                             │   │
│  │              automation_runs/<run_id>/                               │   │
│  │                                                                      │   │
│  │  ├── status.json      运行状态 (RUNNING/SUCCESS/FAILED)             │   │
│  │  ├── graph.json       流程图结构 (节点、边、状态)                    │   │
│  │  ├── events.ndjson    事件流 (NDJSON 格式)                          │   │
│  │  ├── node_runs.json   节点执行快照                                   │   │
│  │  ├── control.json     控制请求 (取消/重试)                          │   │
│  │  └── 00_intake.json   阶段输出文件...                               │   │
│  └──────────────────────┬──────────────────────────────────────────────┘   │
│                         │ 读取                                             │
│                         ▼                                                  │
│  ┌──────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │     Console (port 3230)      │     │       UI (port 3231)            │  │
│  │                              │     │                                 │  │
│  │  HTTP API:                   │     │  React SPA:                     │  │
│  │  • GET /runs                 │ SSE │  • 运行列表页                   │  │
│  │  • GET /runs/:id             │◀────│  • 运行详情页                   │  │
│  │  • GET /runs/:id/graph       │     │  • 行为树可视化                 │  │
│  │  • GET /runs/:id/events (SSE)│     │  • 节点详情面板                 │  │
│  │  • GET /runs/:id/file/:name  │     │  • 事件时间线                   │  │
│  │  • POST /runs/:id/control    │     │                                 │  │
│  └──────────────────────────────┘     └─────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 端口分配

| 服务 | 端口 | 用途 |
|------|------|------|
| n8n | 8080 | Webhook 入口 |
| WSL Runner | 3210 | 命令执行 + 流程引擎 |
| Console | 3230 | HTTP API + SSE |
| UI | 3231 | Web 界面 |

---

## 📁 代码模块清单

### v1 模块 (WSL Runner lib/)

| 文件 | 职责 | 状态 |
|------|------|------|
| `stages.mjs` | 定义 EXECUTION_SEQUENCE 和节点元数据 | ✅ |
| `graph.mjs` | 生成 graph.json (行为树结构) | ✅ |
| `events.mjs` | 追加事件到 events.ndjson | ✅ |
| `nodeRuns.mjs` | 管理 node_runs.json 快照 | ✅ |
| `control.mjs` | 处理 control.json (取消/重试) | ✅ |
| `lock.mjs` | 串行锁 (防止并发执行) | ✅ |
| `paths.mjs` | 路径工具函数 | ✅ |
| `io.mjs` | 文件 I/O 工具 | ✅ |
| `exec.mjs` | 命令执行封装 | ✅ |
| `notify.mjs` | 通知发送 | ✅ |
| `index.mjs` | 统一导出 | ✅ |

### v2 模块 (WSL Runner lib/v2/)

| 文件 | 职责 | 代码量 | 状态 |
|------|------|--------|------|
| `parser.mjs` | FlowSpec JSON 解析与校验 | ~200 行 | ✅ |
| `expression.mjs` | `${...}` 模板引擎 + 表达式求值 | ~300 行 | ✅ |
| `context.mjs` | 执行上下文 (变量/节点状态) | ~350 行 | ✅ |
| `executor-base.mjs` | 执行器基类 (重试/超时/取消) | ~250 行 | ✅ |
| `flow-runner.mjs` | 流程调度器核心 | ~550 行 | ✅ |
| `executors/shell.mjs` | Shell 命令执行器 | ~150 行 | ✅ |
| `executors/transform.mjs` | 数据转换执行器 | ~120 行 | ✅ |
| `executors/file.mjs` | 文件操作执行器 | ~200 行 | ✅ |
| `executors/http.mjs` | HTTP 请求执行器 | ~180 行 | ✅ |
| `executors/notify.mjs` | 通知执行器 | ~100 行 | ✅ |
| `executors/condition.mjs` | 条件分支执行器 | ~100 行 | ✅ |
| `executors/parallel.mjs` | 并行执行器 | ~150 行 | ✅ |
| `executors/loop.mjs` | 循环执行器 | ~200 行 | ✅ |
| `executors/subflow.mjs` | 子流程执行器 | ~150 行 | ✅ |
| `executors/index.mjs` | 执行器注册中心 | ~50 行 | ✅ |
| `index.mjs` | v2 统一导出 | ~60 行 | ✅ |
| `README.md` | v2 用法文档 | ~200 行 | ✅ |

**v2 代码量估计**: ~3,000+ 行 (不含测试)

### Console 模块 (pipeline-sys/console/src/)

| 文件 | 职责 | 状态 |
|------|------|------|
| `main.ts` | 服务入口 | ✅ |
| `server.ts` | Fastify 服务器配置 | ✅ |
| `config.ts` | 配置加载 | ✅ |
| `routes/runs.ts` | 运行列表 API | ✅ |
| `routes/events.ts` | SSE 事件流 API | ✅ |
| `routes/file.ts` | 文件读取 API | ✅ |
| `routes/control.ts` | 控制 API (取消/重试) | ✅ |
| `services/runsIndex.ts` | 扫描 automation_runs/ | ✅ |
| `services/runLoader.ts` | 加载单个运行 | ✅ |
| `services/eventsTailer.ts` | 事件文件追踪 | ✅ |
| `services/pathGuards.ts` | 路径安全检查 | ✅ |
| `clients/runnerClient.ts` | Runner HTTP 客户端 | ✅ |
| `types/dto.ts` | DTO 类型定义 | ✅ |

### UI 模块 (pipeline-sys/ui/src/)

| 文件 | 职责 | 状态 |
|------|------|------|
| `main.tsx` | React 入口 | ✅ |
| `app/App.tsx` | 路由配置 | ✅ |
| `pages/RunsPage.tsx` | 运行列表页 | ✅ |
| `pages/RunDetailPage.tsx` | 运行详情页 | ✅ |
| `components/BehaviorTree/GraphView.tsx` | 行为树可视化 | ✅ |
| `components/BehaviorTree/NodeCard.tsx` | 节点卡片 | ✅ |
| `components/Panel/NodeDetailPanel.tsx` | 节点详情面板 | ✅ |
| `components/Timeline/EventsTimeline.tsx` | 事件时间线 | ✅ |
| `components/Common/StatusBadge.tsx` | 状态徽章 | ✅ |
| `state/runStore.ts` | Zustand 状态管理 | ✅ |
| `api/consoleApi.ts` | Console API 客户端 | ✅ |
| `api/eventsSse.ts` | SSE 订阅封装 | ✅ |

### Shared 模块 (pipeline-sys/shared/src/)

| 文件 | 职责 | 状态 |
|------|------|------|
| `enums.ts` | 枚举类型 (NodeStatus, EventType) | ✅ |
| `status.ts` | 运行状态类型 | ✅ |
| `graph.ts` | 图谱类型 (GraphNode, GraphEdge) | ✅ |
| `events.ts` | 事件类型 | ✅ |
| `nodeRuns.ts` | 节点运行类型 | ✅ |
| `guards.ts` | 类型守卫函数 | ✅ |
| `index.ts` | 统一导出 | ✅ |

---

## 📈 测试覆盖

### v2 单元测试详情

| 测试文件 | 测试数 | 覆盖范围 |
|----------|--------|----------|
| `parser.test.mjs` | 22 | 解析、校验、错误处理 |
| `expression.test.mjs` | 37 | 模板插值、表达式求值、安全限制 |
| `context.test.mjs` | 32 | 变量作用域、节点状态、快照 |
| `executor-base.test.mjs` | 22 | 重试、超时、取消、事件 |
| `executors.test.mjs` | 28 | Shell/Transform/File/HTTP/Notify |
| `control-flow.test.mjs` | 26 | Condition/Parallel/Loop/Subflow |
| `flow-runner.test.mjs` | 20 | 调度、分支、并行、取消、工件 |
| `e2e-runner.test.mjs` | 10 | WSL Runner /v2/run 端点 |
| **总计** | **197** | **全部通过 ✅** |

### 测试命令

```bash
# 运行 v2 单元测试
cd workflows/reusable/n8n-common/wsl-runner/lib/v2/tests
npx vitest run --config vitest.config.mjs

# 运行 shared 单元测试
cd workflows/reusable/pipeline-sys/shared
npm test
```

---

## 🔌 API 端点清单

### WSL Runner (port 3210)

#### v1 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/execute-task` | 执行单个任务 |
| POST | `/compose-taskpack` | 生成任务包 |
| POST | `/fixed-flow` | 执行固定流程 |
| GET | `/fixed-flow/status` | 查询固定流程状态 |
| POST | `/fixed-flow/cancel` | 取消固定流程 |
| POST | `/fixed-flow/retry` | 重试固定流程节点 |

#### v2 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/v2/run` | 执行配置化流程 |
| GET | `/v2/run/status` | 查询 v2 流程状态 |
| POST | `/v2/run/cancel` | 取消 v2 流程 |

### Console (port 3230)

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/runs` | 获取运行列表 |
| GET | `/runs/:id` | 获取运行详情 |
| GET | `/runs/:id/graph` | 获取行为树图谱 |
| GET | `/runs/:id/events` | SSE 事件流 |
| GET | `/runs/:id/file/:name` | 读取运行工件文件 |
| POST | `/runs/:id/control` | 发送控制请求 |

---

## 📦 运行工件结构

每次流程执行生成以下文件：

```
automation_runs/<run_id>/
├── status.json         运行状态
├── graph.json          行为树结构
├── events.ndjson       事件流 (NDJSON)
├── node_runs.json      节点状态快照
├── control.json        控制请求
├── 00_intake.json      阶段 0 输出
├── 01_preflight.json   阶段 1 输出
├── 02_plan.json        阶段 2 输出
├── 03_edit.json        阶段 3 输出
├── 04_execute.json     阶段 4 输出
├── 05_validate.json    阶段 5 输出
├── 06_git.json         阶段 6 输出
└── 07_notify.json      阶段 7 输出
```

### status.json 结构

```json
{
  "run_id": "20260107_143052_abc123",
  "status": "SUCCESS",
  "started_at": "2026-01-07T14:30:52.000Z",
  "finished_at": "2026-01-07T14:35:12.000Z",
  "current_node": null,
  "error": null
}
```

### graph.json 结构

```json
{
  "nodes": [
    {
      "id": "stage.intake",
      "label": "任务接收",
      "type": "intake",
      "status": "SUCCESS",
      "outputs": ["00_intake.json"]
    }
  ],
  "edges": [
    { "from": "stage.intake", "to": "stage.preflight" }
  ]
}
```

---

## 🎯 v2 FlowSpec DSL

### 节点类型支持

| 类型 | 用途 | 主要配置 |
|------|------|----------|
| `shell` | 执行 Shell 命令 | `command`, `cwd`, `env`, `timeout_ms` |
| `transform` | 数据转换 | `expression`, `engine` |
| `file` | 文件操作 | `operation`, `path`, `content` |
| `http` | HTTP 请求 | `method`, `url`, `body`, `headers` |
| `notify` | 发送通知 | `channel`, `message`, `level` |
| `condition` | 条件分支 | `expression`, `onTrue`, `onFalse` |
| `parallel` | 并行执行 | `branches`, `waitForAll` |
| `loop` | 循环 | `type`, `items`, `body` |
| `subflow` | 子流程 | `flowId`, `inputs`, `outputs` |

### FlowSpec 示例

```json
{
  "id": "build-and-deploy",
  "name": "Build and Deploy",
  "version": "2.0.0",
  "inputs": {
    "projectRoot": { "type": "string", "required": true },
    "branch": { "type": "string", "default": "main" }
  },
  "nodes": [
    {
      "id": "checkout",
      "type": "shell",
      "command": "git checkout ${inputs.branch}",
      "cwd": "${inputs.projectRoot}",
      "on_success": "build"
    },
    {
      "id": "build",
      "type": "shell",
      "command": "npm run build",
      "cwd": "${inputs.projectRoot}",
      "timeout_ms": 600000,
      "retry": { "max_attempts": 2, "delay_ms": 5000 },
      "on_success": "deploy",
      "on_failure": "notify_error"
    },
    {
      "id": "deploy",
      "type": "shell",
      "command": "npm run deploy",
      "cwd": "${inputs.projectRoot}",
      "on_success": "notify_success"
    },
    {
      "id": "notify_success",
      "type": "notify",
      "channel": "webhook",
      "webhookUrl": "https://api.example.com/notify",
      "message": "Deploy completed for branch ${inputs.branch}"
    },
    {
      "id": "notify_error",
      "type": "notify",
      "channel": "log",
      "level": "error",
      "message": "Build failed for branch ${inputs.branch}"
    }
  ]
}
```

---

## 🔒 执行语义

### 串行锁 (Serial Lock)

- **目的**: 防止同一项目同时运行多个流程
- **实现**: 文件锁 + 心跳 + TTL
- **超时**: 默认 30 分钟，心跳间隔 30 秒
- **清理**: 僵尸锁自动清除

### 重试机制 (Retry)

- **配置**: `retry.max_attempts`, `retry.delay_ms`
- **策略**: 指数退避 (默认)
- **可重试节点**: 由 FlowSpec 配置

### 超时机制 (Timeout)

- **配置**: `timeout_ms` (节点级别)
- **默认**: 30 分钟 (v1), 无超时 (v2 需显式配置)
- **处理**: 超时后节点状态变为 `TIMEOUT`

### 取消机制 (Cancel)

- **入口**: `/fixed-flow/cancel` 或 `/v2/run/cancel`
- **传播**: AbortController 信号传播到子进程
- **状态**: 取消后状态变为 `CANCELLED`

---

## 📊 实现统计

| 指标 | 数量 |
|------|------|
| v1 模块文件 | 11 个 |
| v2 模块文件 | 16 个 |
| Console 源文件 | 15 个 |
| UI 源文件 | 15 个 |
| Shared 源文件 | 7 个 |
| FlowSpec Schema | 632 行 JSON |
| 单元测试 | 197 个 |
| API 端点 | 16 个 |
| 节点类型 | 9 种 |

---

## 🗺️ 路线图

### ✅ 已完成

- **v1**: 固定流程执行与可视化
- **v2**: FlowSpec 配置化流程引擎
- **v2.1**: WSL Runner API 集成

### 🔜 待完成

- **v2.2**: 流程文件热加载、版本管理
- **v2.3**: UI 增强（控制流节点可视化）

### 📋 计划中

- **v3**: 分布式执行、多执行器、流程治理

---

## ⚠️ 已知限制

1. **UI 暂不支持 v2 控制流可视化**: 并行/循环节点在 UI 中显示为单个节点
2. **无图形化编辑器**: FlowSpec 需手写 JSON
3. **单节点执行**: 不支持分布式跨机器执行
4. **无版本管理**: FlowSpec 文件无历史版本跟踪

---

## 📚 文档索引

| 文档 | 路径 | 说明 |
|------|------|------|
| 设计文档 | `pipeline-sys/design.md` | 详细架构设计 |
| 代码架构 | `pipeline-sys/code-architecture.md` | 模块结构说明 |
| README | `pipeline-sys/README.md` | 快速入门 |
| v2 用法 | `wsl-runner/lib/v2/README.md` | v2 引擎使用指南 |
| FlowSpec Schema | `v2-design/flowspec-schema.json` | DSL JSON Schema |
| 开发计划 | `v2-design/DEVELOPMENT-PLAN.md` | v2 开发路线 |
| 实现状态 | `IMPLEMENTATION-STATUS.md` | 进度追踪 |

---

*报告生成：2026-01-07*
*Pipeline-Sys 版本：v1.0.0 / v2.1.0*

