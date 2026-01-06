# Pipeline-Sys 实现状态报告

> 报告生成时间：2026-01-05

---

## 1. 项目概述

Pipeline-Sys 是一个自建的流程执行可视化系统，提供行为树展示和执行控制能力。

### 1.1 版本规划

| 版本 | 目标 | 状态 |
|------|------|------|
| **v1** | 固定流程可观测 + 可控 | 🟡 代码完成，待集成 |
| v2 | FlowSpec DSL 支持 | ⏳ 规划中 |
| v3 | 多执行器与治理能力 | ⏳ 规划中 |

### 1.2 架构概览

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    n8n      │────▶│  WSL Runner │────▶│   Console   │
│  (Webhook)  │     │  (执行器)   │     │  (看板)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  File System│     │     UI      │
                    │  (工件落盘)  │     │ (React Flow)│
                    └─────────────┘     └─────────────┘
```

---

## 2. 模块实现状态

### 2.1 Shared（共享类型层）- ✅ 100% 完成

| 文件 | 状态 | 说明 |
|------|------|------|
| `enums.ts` | ✅ | NodeStatus、EventType、LogStream、OutputKind、NodeType |
| `graph.ts` | ✅ | graph.json 类型 + `createFixedFlowGraph()` + 固定节点 ID |
| `events.ts` | ✅ | events.ndjson 类型定义、所有事件 payload |
| `nodeRuns.ts` | ✅ | node_runs.json 类型、`createEmptyNodeRun()` |
| `status.ts` | ✅ | status.json 类型、锁常量 |
| `guards.ts` | ✅ | 运行时校验、NDJSON 解析 |
| `index.ts` | ✅ | 统一导出 |

**测试文件**：
- `tests/enums.test.ts` ✅
- `tests/graph.test.ts` ✅
- `tests/guards.test.ts` ✅
- `tests/nodeRuns.test.ts` ✅

**编译产物**：`dist/` 目录已生成

### 2.2 Console（后端服务）- ✅ 100% 完成

| 组件 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 入口 | `main.ts` | ✅ | 进程入口、优雅关闭 |
| 服务器 | `server.ts` | ✅ | Fastify 实例、CORS、路由注册、错误处理 |
| 配置 | `config.ts` | ✅ | 环境变量解析（端口/路径/Runner URL） |
| **服务层** | | | |
| 索引 | `services/runsIndex.ts` | ✅ | 扫描 automation_runs/ 生成列表 |
| 加载 | `services/runLoader.ts` | ✅ | 读取 run 工件文件 |
| 事件 | `services/eventsTailer.ts` | ✅ | SSE 事件流推送 |
| 安全 | `services/pathGuards.ts` | ✅ | 路径安全检查 |
| **路由** | | | |
| 列表 | `routes/runs.ts` | ✅ | GET /api/runs、/api/runs/:runId |
| 事件 | `routes/events.ts` | ✅ | GET /api/runs/:runId/events (SSE) |
| 文件 | `routes/file.ts` | ✅ | GET /api/runs/:runId/file |
| 控制 | `routes/control.ts` | ✅ | POST cancel/retry |
| **客户端** | | | |
| Runner | `clients/runnerClient.ts` | ✅ | Runner HTTP 客户端 |

**测试文件**：
- `tests/pathGuards.test.ts` ✅
- `tests/runsIndex.test.ts` ✅

### 2.3 UI（前端应用）- ✅ 100% 完成

| 组件 | 文件 | 状态 | 说明 |
|------|------|------|------|
| 入口 | `main.tsx` | ✅ | React 入口 |
| 应用 | `app/App.tsx` | ✅ | 路由配置 (/, /runs, /runs/:runId) |
| **页面** | | | |
| 列表 | `pages/RunsPage.tsx` | ✅ | 运行列表页 |
| 详情 | `pages/RunDetailPage.tsx` | ✅ | 运行详情页（图 + 面板 + 时间线） |
| **组件** | | | |
| 图视图 | `components/BehaviorTree/GraphView.tsx` | ✅ | ReactFlow 行为树渲染、自动布局 |
| 节点卡片 | `components/BehaviorTree/NodeCard.tsx` | ✅ | 节点卡片组件 |
| 详情面板 | `components/Panel/NodeDetailPanel.tsx` | ✅ | 节点详情面板 |
| 时间线 | `components/Timeline/EventsTimeline.tsx` | ✅ | 事件时间线 |
| 状态徽章 | `components/Common/StatusBadge.tsx` | ✅ | 状态徽章 |
| **状态管理** | | | |
| Store | `state/runStore.ts` | ✅ | Zustand 全局状态 |
| **API** | | | |
| Console | `api/consoleApi.ts` | ✅ | Console API 调用 |
| SSE | `api/eventsSse.ts` | ✅ | SSE 订阅与重连 |

**样式文件**：全部 CSS 已实现

### 2.4 测试夹具 - ✅ 完成

| 目录 | 说明 |
|------|------|
| `tests/fixtures/sample-run/` | 带完整工件的示例运行 |
| `tests/fixtures/completed-run/` | 已完成运行的测试数据 |

---

## 3. 当前运行环境

### 3.1 服务端口配置

| 服务 | 端口 | 环境 | 状态 |
|------|------|------|------|
| Pipeline-Sys Console | `3230` | Windows | ✅ 运行中 |
| Pipeline-Sys UI | `3231` | Windows | ⏳ 待启动 |
| WSL Runner | `3210` | WSL | ⚠️ 需确认 |
| n8n | `5680` | WSL | ⚠️ 需确认 |
| MCP Runner | `3211` | Windows | 可选 |

### 3.2 环境变量

```bash
# Console 配置
PIPELINE_SYS_HOST=127.0.0.1
PIPELINE_SYS_PORT=3230
PROJECT_ROOT=F:\workspace\github\Footnote  # Windows 路径
RUNNER_BASE_URL=http://127.0.0.1:3210

# WSL 环境
PROJECT_ROOT=/home/shash/work/Footnote  # WSL 路径
```

### 3.3 启动命令

```bash
# 1. 安装依赖
cd workflows/reusable/pipeline-sys/shared && npm install && npm run build
cd ../console && npm install
cd ../ui && npm install

# 2. 启动 Console（后端）
cd console
$env:PROJECT_ROOT="F:\workspace\github\Footnote"  # Windows PowerShell
npx tsx src/main.ts

# 3. 启动 UI（前端）
cd ui
npm run dev
```

---

## 4. 数据流与工件格式

### 4.1 运行工件目录结构

```
workflows/project/logs/automation_runs/<run_id>/
  status.json                # run 总状态快照
  graph.json                 # 行为树图谱（v1 新增）
  events.ndjson              # 事件流（v1 新增）
  node_runs.json             # 节点状态快照（v1 新增）
  control.json               # 控制请求

  00_intake.json             # 入口参数
  01_preflight.json          # preflight 结果
  02_plan.json               # plan 产物
  03_taskpack.md             # task pack 快照
  04_execute.json            # 执行结果
  05_validate.json           # validate 汇总
  06_git.json                # git 汇总
  07_notify.json             # 通知结果

  nodes/                     # v1 新增：子节点产物
    execute.plan.json
    execute.edit.json
    execute.lint.json
    execute.test.json
    execute.summary.md
```

### 4.2 固定流程节点

```
stage.intake → stage.preflight → execute.plan → execute.edit → execute.lint → execute.test → execute.summary → stage.notify → stage.done → stage.git
```

### 4.3 节点状态枚举

- `PENDING` - 等待执行
- `RUNNING` - 执行中
- `SUCCESS` - 成功
- `FAILED` - 失败
- `SKIPPED` - 跳过
- `CANCELLED` - 已取消
- `TIMEOUT` - 超时

### 4.4 事件类型

- `RUN_STARTED` / `RUN_FINISHED` - 运行生命周期
- `NODE_STARTED` / `NODE_FINISHED` - 节点生命周期
- `NODE_LOG` - 节点日志
- `NODE_TIMEOUT` - 节点超时
- `NODE_RETRY_SCHEDULED` - 节点重试调度
- `RUN_CANCEL_REQUESTED` / `RUN_CANCELLED` - 取消
- `LOCK_ACQUIRED` / `LOCK_STALE_CLEARED` / `LOCK_RELEASED` - 锁事件

---

## 5. 现有运行记录

截至 2026-01-05，`automation_runs/` 目录下有以下运行：

| Run ID | 格式 | 说明 |
|--------|------|------|
| `RUN-20260104-144240-8a30` | 旧格式 | 只有 stage JSON |
| `RUN-20260104-145104-77b0` | 旧格式 | 完整旧流程产物 |
| `RUN-20260104-151429-3010` | 旧格式 | 完整旧流程产物 |
| `RUN-20260104-163302-12f8` | 旧格式 | 完整旧流程产物 |
| `RUN-20260105-100000-done` | **新格式** ✅ | 有 graph/events/nodeRuns |
| `RUN-20260105-120000-test` | **新格式** ✅ | 有 graph/events/nodeRuns/nodes |

---

## 6. WSL Runner 改造状态

### 6.1 模块化改造 - ✅ 已完成

WSL Runner 已完成模块化拆分，`server.mjs` 保留路由分发，逻辑拆到 `lib/`：

```
workflows/reusable/n8n-common/wsl-runner/
  server.mjs           # HTTP server + 路由分发
  start-server.sh      # 启动脚本
  README.md            # 说明文档
  lib/
    graph.mjs          # ✅ graph.json 生成
    events.mjs         # ✅ events.ndjson 追加（12种事件类型）
    nodeRuns.mjs       # ✅ node_runs.json 维护
    control.mjs        # ✅ 取消/重试请求处理
    lock.mjs           # ✅ 防僵尸锁 + 心跳 + TTL + PID检查
    io.mjs             # ✅ 文件读写工具
    paths.mjs          # ✅ 路径计算
    exec.mjs           # ✅ 命令执行包装
    stages.mjs         # ✅ Stage -> Node 映射
    notify.mjs         # ✅ 通知
    index.mjs          # ✅ 统一导出
```

### 6.2 v1 新格式功能清单

| 功能 | 模块 | 状态 |
|------|------|------|
| 生成 `graph.json` | `graph.mjs` | ✅ `writeGraph()` |
| 追加 `events.ndjson` | `events.mjs` | ✅ `appendEvent()` + 12种 emit 函数 |
| 维护 `node_runs.json` | `nodeRuns.mjs` | ✅ `updateNodeRun()` + 状态辅助函数 |
| 创建 `nodes/` 子目录 | `graph.mjs` | ✅ 输出路径已定义 |
| `POST /fixed-flow/cancel` | `control.mjs` | ✅ `writeCancelRequest()` |
| `POST /fixed-flow/retry` | `control.mjs` | ✅ `writeRetryRequest()` |
| 串行锁心跳 | `lock.mjs` | ✅ 10秒心跳 |
| TTL 防僵尸 | `lock.mjs` | ✅ 2小时 TTL + PID 检查 |

### 6.3 待验证项

- [ ] `server.mjs` 是否已集成调用 `lib/` 模块
- [ ] 实际运行时是否产出新格式工件

---

## 7. 待完成项

### 7.1 端到端测试

- [ ] Console ↔ Runner 通信测试
- [ ] UI ↔ Console SSE 订阅测试
- [ ] 完整流程 E2E 测试

### 7.2 服务配置

- [ ] PM2 配置自启动
- [ ] 服务健康监控

### 7.3 集成验证

- [ ] 验证 `server.mjs` 调用 `lib/` 模块
- [ ] 验证新运行产出新格式工件
- [ ] 验证 UI 能正确展示新格式数据

---

## 8. API 接口参考

### 8.1 运行列表

```
GET /api/runs
Response: { runs: IRunListItem[] }
```

### 8.2 运行详情

```
GET /api/runs/:runId
Response: { status, graph, nodeRuns, outputs }
```

### 8.3 事件流（SSE）

```
GET /api/runs/:runId/events
Response: text/event-stream
```

### 8.4 文件读取

```
GET /api/runs/:runId/file?path=<rel_path>
Response: 文件内容
```

### 8.5 取消运行

```
POST /api/runs/:runId/cancel
Response: { ok, message }
```

### 8.6 重试节点

```
POST /api/runs/:runId/retry
Body: { "node_id": "execute.edit" }
Response: { ok, message }
```

---

## 9. 相关文档

| 文档 | 路径 | 说明 |
|------|------|------|
| 设计规格 | `design.md` | v1/v2/v3 完整规格 |
| 代码架构 | `code-architecture.md` | 目录结构、模块职责、数据流 |
| 项目说明 | `README.md` | 快速开始指南 |
| n8n 说明 | `workflows/project/n8n/README.md` | 主链路和目录说明 |
| 服务配置 | `workflows/project/n8n/SERVICE-SETUP.md` | 服务配置指南 |
| PM2 指南 | `workflows/project/n8n/PM2-AUTO-START-GUIDE.md` | 自启动配置 |

---

*报告版本: v1.0*
*生成日期: 2026-01-05*

