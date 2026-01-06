# Pipeline-Sys v1 实现状态报告

> 更新时间：2026-01-06
> 状态：**✅ v1 全部完成**

---

## 📊 总体状态

| 模块 | 状态 | 完成度 |
|------|------|--------|
| **Shared Types** | ✅ 完成 | 100% |
| **Console Backend** | ✅ 完成 | 100% |
| **UI Frontend** | ✅ 完成 | 100% |
| **WSL Runner 集成** | ✅ 完成 | 100% |
| **测试 Fixtures** | ✅ 完成 | 100% |

---

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Pipeline-Sys v1 架构                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐     ┌──────────┐     ┌──────────────────────────────┐   │
│   │   n8n    │────▶│  Runner  │────▶│  File System (Run Artifacts)  │   │
│   │ (Webhook)│     │ (3210)   │     │  automation_runs/<run_id>/    │   │
│   └──────────┘     └──────────┘     │    status.json                │   │
│                          │          │    graph.json ✨NEW            │   │
│                          │          │    events.ndjson ✨NEW         │   │
│                          │          │    node_runs.json ✨NEW        │   │
│                          │          │    00_intake.json              │   │
│                          │          │    01_preflight.json           │   │
│                          │          │    ...                         │   │
│                          │          └──────────────────────────────┘   │
│                          │                       │                      │
│                          ▼                       ▼                      │
│                    ┌──────────┐           ┌──────────┐                 │
│                    │ Console  │◀──────────│    UI    │                 │
│                    │  (3230)  │   SSE     │  (3231)  │                 │
│                    │  HTTP    │◀──────────│  React   │                 │
│                    └──────────┘           └──────────┘                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ 已完成功能

### 1. Shared Types 模块 (`shared/`)
- [x] `NodeStatus` 枚举（PENDING/RUNNING/SUCCESS/FAILED/SKIPPED/CANCELLED/TIMEOUT）
- [x] `EventType` 枚举（RUN_STARTED/NODE_STARTED/NODE_LOG/NODE_FINISHED/...）
- [x] `IGraphNode`, `IGraphEdge`, `IGraph` 类型
- [x] `INodeRun`, `INodeRunsSnapshot` 类型
- [x] `IStatus` 类型
- [x] `IEvent` 类型
- [x] 类型守卫函数
- [x] 单元测试

### 2. Console Backend 模块 (`console/`)
- [x] Fastify HTTP 服务器
- [x] CORS 支持
- [x] 健康检查端点 (`GET /health`)
- [x] 运行列表 API (`GET /api/runs`)
- [x] 运行详情 API (`GET /api/runs/:runId`)
- [x] 事件 SSE 流 (`GET /api/events/:runId`)
- [x] 文件获取 API (`GET /api/file/:runId/*`)
- [x] 控制 API (`POST /api/control/:runId/cancel`, `/retry`)
- [x] 运行目录扫描服务
- [x] 路径安全守卫
- [x] 事件流 Tailer
- [x] 单元测试

### 3. UI Frontend 模块 (`ui/`)
- [x] React 18 + TypeScript
- [x] React Router 路由
- [x] Zustand 状态管理
- [x] ReactFlow 行为树可视化
- [x] 运行列表页面 (`/runs`)
- [x] 运行详情页面 (`/runs/:runId`)
- [x] 节点卡片组件（状态颜色、图标、耗时）
- [x] 节点详情面板
- [x] 事件时间线组件
- [x] 状态徽章组件
- [x] SSE 实时更新
- [x] Mini Map 导航
- [x] 缩放控制
- [x] 响应式布局
- [x] 单元测试

### 4. WSL Runner 集成 (`n8n-common/wsl-runner/`)
- [x] `lib/` 模块化重构
  - [x] `paths.mjs` - 路径工具
  - [x] `io.mjs` - 文件 IO
  - [x] `graph.mjs` - 行为树图谱
  - [x] `events.mjs` - 事件流
  - [x] `nodeRuns.mjs` - 节点状态
  - [x] `lock.mjs` - 串行锁
  - [x] `control.mjs` - 控制请求
  - [x] `stages.mjs` - Stage 映射
  - [x] `exec.mjs` - 命令执行
  - [x] `notify.mjs` - 通知
- [x] `server.mjs` 集成 lib/ 模块 ✨刚完成
  - [x] 运行开始时初始化 graph.json
  - [x] 运行开始时初始化 node_runs.json
  - [x] 每个阶段发送 NODE_STARTED 事件
  - [x] 每个阶段发送 NODE_FINISHED 事件
  - [x] 每个阶段更新 node_runs.json
  - [x] 记录 NODE_LOG 事件
  - [x] 发送 RUN_STARTED/RUN_FINISHED 事件
  - [x] 新的锁机制（acquireLock/releaseLock）
  - [x] Cancel 接口 (`POST /fixed-flow/cancel`)
  - [x] Retry 接口 (`POST /fixed-flow/retry`)

### 5. 测试 Fixtures (`tests/fixtures/`)
- [x] 成功运行 fixture (`RUN-20260105-100000-done`)
- [x] 失败运行 fixture (`RUN-20260105-120000-test`)

---

## 📝 v1 新增 API 端点

### WSL Runner (port 3210)

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/execute-task` | POST | 执行任务 |
| `/compose-taskpack` | POST | 生成 TaskPack |
| `/fixed-flow` | POST | 启动固定流程 |
| `/fixed-flow/status` | GET | 查询运行状态 |
| `/fixed-flow/cancel` | POST | 取消运行 ✨NEW |
| `/fixed-flow/retry` | POST | 重试节点 ✨NEW |

### Console (port 3230)

| 端点 | 方法 | 描述 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/runs` | GET | 获取运行列表 |
| `/api/runs/:runId` | GET | 获取运行详情（含 graph/nodeRuns）|
| `/api/events/:runId` | GET | SSE 事件流 |
| `/api/file/:runId/*` | GET | 获取运行工件文件 |
| `/api/control/:runId/cancel` | POST | 代理取消请求 |
| `/api/control/:runId/retry` | POST | 代理重试请求 |

---

## 📁 v1 运行工件结构

```
automation_runs/<run_id>/
├── status.json          # 运行状态快照
├── graph.json           # 行为树结构 ✨NEW
├── events.ndjson        # 事件日志流 ✨NEW
├── node_runs.json       # 节点状态快照 ✨NEW
├── control.json         # 控制请求 ✨NEW
├── 00_intake.json       # 入参
├── 01_preflight.json    # Git 检查
├── 02_plan.json         # 计划
├── 03_taskpack.md       # TaskPack 副本
├── 04_execute.json      # 执行结果
├── 05_validate.json     # 验证结果
├── 06_git.json          # Git 提交结果
├── 07_notify.json       # 通知结果
└── _prompt.md           # Cursor 提示词
```

---

## 🚀 快速启动

### 1. 启动 Console 服务
```bash
cd workflows/reusable/pipeline-sys/console
npm run dev
# 监听 http://127.0.0.1:3230
```

### 2. 启动 UI 服务
```bash
cd workflows/reusable/pipeline-sys/ui
npm run dev
# 监听 http://127.0.0.1:3231
```

### 3. 启动 WSL Runner（WSL 环境）
```bash
cd workflows/reusable/n8n-common/wsl-runner
node server.mjs
# 监听 http://127.0.0.1:3210
```

### 4. 打开浏览器
访问 http://localhost:3231 查看行为树可视化界面

---

## 🔄 v2 规划预览

### 目标
从固定流程升级为 **配置化流程（FlowSpec DSL）**

### 核心特性
- [ ] FlowSpec JSON Schema 设计
- [ ] 流程配置解析器
- [ ] 动态节点类型支持
- [ ] 条件分支（if/else）
- [ ] 并行执行（parallel）
- [ ] 循环支持（for/while）
- [ ] 外部工具调用
- [ ] 流程版本管理

### 预计完成时间
2026 Q2

---

## 📈 测试覆盖率

| 模块 | 单元测试 | E2E 测试 |
|------|----------|----------|
| shared | ✅ 通过 | - |
| console | ✅ 通过 | 待完善 |
| ui | ✅ 通过 | 待完善 |

---

*报告生成：Pipeline-Sys v1 收尾验证*
