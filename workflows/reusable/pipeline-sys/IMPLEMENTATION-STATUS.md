# Pipeline-Sys 实现状态报告

> 更新时间：2026-01-07
> 状态：**✅ v1 已完成 | ✅ v2 多角色流程完成**

---

## 📊 总体状态

### v1 - 固定流程可视化

| 模块 | 状态 | 完成度 |
|------|------|--------|
| **Shared Types** | ✅ 完成 | 100% |
| **Console Backend** | ✅ 完成 | 100% |
| **UI Frontend** | ✅ 完成 | 100% |
| **WSL Runner 集成** | ✅ 完成 | 100% |
| **测试 Fixtures** | ✅ 完成 | 100% |

### v2 - 配置化流程引擎

| Phase | 模块 | 状态 | 测试 |
|-------|------|------|------|
| **Phase 1** | 解析器 + 表达式 + 上下文 + 执行器基类 | ✅ 完成 | 113 通过 |
| **Phase 2** | Shell/Transform/File/HTTP/Notify 执行器 | ✅ 完成 | 28 通过 |
| **Phase 3** | Condition/Parallel/Loop/Subflow 控制流 | ✅ 完成 | 26 通过 |
| **Phase 4** | FlowRunner 流程调度器 | ✅ 完成 | 20 通过 |
| **Phase 5** | 文档 | ✅ 完成 | - |
| **v2.1** | WSL Runner 集成 | ✅ 完成 | 10 通过 |
| **v2.2** | /fixed-flow 硬编码迁移 | ✅ 完成 | - |
| **v2.3** | 多角色流程 + 便捷入口 | ✅ 完成 | - |

**v2 总测试：197 个单元测试全部通过 ✅**

### v2.3 变更记录 (2026-01-07)

**新增功能**：多角色流程支持 + 便捷入口端点

| 新增流程 | 文件 | 用途 |
|----------|------|------|
| **L3 执行岗通用** | `l3-execute.flowspec.json` | 通用程序员任务执行 |
| **L3 写手** | `l3-writer.flowspec.json` | 文案/对白/剧情写作 |
| **L3 测试员** | `l3-tester.flowspec.json` | 单元/E2E/浏览器测试 |
| **制作人入口** | `pm-intake.flowspec.json` | 需求接收与自动路由 |
| **组长拆解** | `lead-decompose.flowspec.json` | 大任务拆分为子任务 |

| 新增端点 | 调用流程 | 说明 |
|----------|----------|------|
| `POST /intake` | pm-intake | 制作人统一入口 |
| `POST /run-role` | 自动选择 | 根据 role 参数路由 |
| `POST /run-engineer` | l3-execute | 程序员便捷入口 |
| `POST /run-writer` | l3-writer | 写手便捷入口 |
| `POST /run-tester` | l3-tester | 测试员便捷入口 |
| `POST /decompose` | lead-decompose | 组长拆解入口 |
| `GET /flows` | - | 列出所有可用流程 |

### v2.2 变更记录 (2026-01-07)

**重大变更**：`/fixed-flow` 端点已从硬编码迁移到配置化流程

| 变更项 | 说明 |
|--------|------|
| **删除硬编码** | `handleFixedFlow` 中约 400 行硬编码逻辑已删除 |
| **新增配置** | `fixed-flow.flowspec.json` 定义了 14 个节点的完整流程 |
| **调用方式** | `/fixed-flow` 现在内部调用 v2 引擎 + FlowSpec 文件 |
| **向后兼容** | API 接口保持不变，返回格式兼容 |

**配置文件位置**：`v2-design/examples/fixed-flow.flowspec.json`

---

## 🏗️ v1 架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Pipeline-Sys v1 架构                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐     ┌──────────┐     ┌──────────────────────────────┐   │
│   │   n8n    │────▶│  Runner  │────▶│  File System (Run Artifacts)  │   │
│   │ (Webhook)│     │ (3210)   │     │  automation_runs/<run_id>/    │   │
│   └──────────┘     └──────────┘     │    status.json                │   │
│                          │          │    graph.json                  │   │
│                          │          │    events.ndjson               │   │
│                          │          │    node_runs.json              │   │
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

## 🆕 v2 模块结构

```
wsl-runner/lib/v2/
├── index.mjs           # 统一导出（VERSION 2.0.0）
├── parser.mjs          # FlowSpec 解析器
├── expression.mjs      # 表达式引擎 (${...} 模板)
├── context.mjs         # 执行上下文管理
├── executor-base.mjs   # 执行器基类（重试/超时/取消）
├── flow-runner.mjs     # 流程调度器核心
├── executors/
│   ├── index.mjs       # 执行器注册中心
│   ├── shell.mjs       # Shell 命令执行
│   ├── transform.mjs   # 数据转换
│   ├── file.mjs        # 文件操作
│   ├── http.mjs        # HTTP 请求
│   ├── notify.mjs      # 通知发送
│   ├── condition.mjs   # 条件分支
│   ├── parallel.mjs    # 并行执行
│   ├── loop.mjs        # 循环（forEach/times/while）
│   └── subflow.mjs     # 子流程调用
├── tests/
│   ├── vitest.config.mjs
│   ├── parser.test.mjs       # 22 tests
│   ├── expression.test.mjs   # 37 tests
│   ├── context.test.mjs      # 32 tests
│   ├── executor-base.test.mjs # 22 tests
│   ├── executors.test.mjs    # 28 tests
│   ├── control-flow.test.mjs # 26 tests
│   └── flow-runner.test.mjs  # 20 tests
└── README.md           # v2 用法文档
```

---

## ✅ v2 功能清单

### 解析器 (parser.mjs)
- [x] FlowSpec JSON 加载和验证
- [x] 节点类型枚举
- [x] 图遍历工具（前驱/后继/入口/出口）
- [x] 错误处理和详细报错

### 表达式引擎 (expression.mjs)
- [x] `${...}` 模板变量插值
- [x] 深度对象插值
- [x] 安全表达式求值
- [x] 条件表达式
- [x] 输出映射解析
- [x] 变量引用提取

### 执行上下文 (context.mjs)
- [x] 变量作用域管理
- [x] 输入参数绑定
- [x] 节点状态追踪
- [x] 上下文快照
- [x] 序列化/反序列化

### 执行器基类 (executor-base.mjs)
- [x] 重试机制（指数退避）
- [x] 超时控制
- [x] 取消信号传播
- [x] 事件发射
- [x] 执行器注册表

### 基础执行器
| 类型 | 功能 |
|------|------|
| `shell` | 执行 Shell 命令，支持 cwd/env/args |
| `transform` | JavaScript 表达式数据转换 |
| `file` | 读/写/删/复制/移动/列目录/创建目录/stat |
| `http` | GET/POST/PUT/PATCH/DELETE，支持认证/重试 |
| `notify` | console/webhook/log 通道通知 |

### 控制流执行器
| 类型 | 功能 |
|------|------|
| `condition` | if/else 条件分支，支持多目标 |
| `parallel` | 并行执行分支，waitForAll/failFast 策略 |
| `loop` | forEach/times/while/doWhile 循环 |
| `subflow` | 子流程调用，输入/输出映射 |

### 流程调度器 (flow-runner.mjs)
- [x] FlowSpec 解析和执行
- [x] 自动入口节点检测
- [x] 按 on_success/on_failure 链路调度
- [x] 条件分支路由
- [x] 并行节点执行
- [x] 运行取消
- [x] 工件生成（status/graph/events/node_runs）
- [x] 事件发射（RUN_*/NODE_*）

---

## 🔧 v2 使用示例

### 基本用法

```javascript
import { runFlow } from './lib/v2/index.mjs';

const result = await runFlow({
  id: 'my-flow',
  name: 'My Flow',
  nodes: [
    { id: 'echo', type: 'shell', command: 'echo hello' },
  ],
});

console.log(result.success);  // true
console.log(result.output);   // { echo: { stdout: 'hello\n', ... } }
```

### FlowSpec JSON

```json
{
  "id": "example",
  "name": "Example Flow",
  "inputs": {
    "projectRoot": { "type": "string", "required": true }
  },
  "nodes": [
    {
      "id": "preflight",
      "type": "shell",
      "command": "git status",
      "cwd": "${inputs.projectRoot}",
      "on_success": "build"
    },
    {
      "id": "build",
      "type": "shell",
      "command": "npm run build",
      "cwd": "${inputs.projectRoot}"
    }
  ]
}
```

详见 `wsl-runner/lib/v2/README.md`

---

## 🔌 v2.1 API 端点

### WSL Runner (port 3210)

| 端点 | 方法 | 描述 |
|------|------|------|
| `/v2/run` | POST | 执行配置化流程 |
| `/v2/run/status` | GET | 查询运行状态 |
| `/v2/run/cancel` | POST | 取消运行 |

### `/v2/run` 请求示例

```json
{
  "flowspec": {
    "id": "my-flow",
    "name": "My Flow",
    "nodes": [
      { "id": "step1", "type": "transform", "expression": "42" }
    ]
  },
  "inputs": {},
  "async": false
}
```

或从文件加载：

```json
{
  "flowspec": "workflows/flows/my-flow.flowspec.json",
  "inputs": { "projectRoot": "/path/to/project" },
  "async": true
}
```

---

## 📈 测试覆盖

| 模块 | 测试数 | 状态 |
|------|--------|------|
| parser | 22 | ✅ |
| expression | 37 | ✅ |
| context | 32 | ✅ |
| executor-base | 22 | ✅ |
| executors | 28 | ✅ |
| control-flow | 26 | ✅ |
| flow-runner | 20 | ✅ |
| e2e-runner | 10 | ✅ |
| **总计** | **197** | **✅ 全部通过** |

运行测试：
```bash
cd workflows/reusable/n8n-common/wsl-runner/lib/v2/tests
npx vitest run --config vitest.config.mjs
```

---

## 🗺️ 路线图

### v1 ✅ 已完成
- 固定流程执行和可视化
- 行为树 UI
- 实时事件流
- 取消/重试控制

### v2 ✅ 核心完成
- FlowSpec DSL 设计
- 配置化流程解析
- 9 种节点类型
- 流程调度器
- 187 个单元测试

### v2.1 ✅ 已完成
- [x] WSL Runner 集成 v2 引擎
- [x] `/v2/run` API 端点
- [x] E2E 测试

### v2.2 待完成
- [ ] 流程文件热加载
- [ ] 流程版本管理
- [ ] 流程编辑器 UI

### v3 计划
- [ ] 分布式执行
- [ ] 多执行器集群
- [ ] 流程治理和审计

---

*报告生成：2026-01-07*
*版本：v1.0.0 / v2.1.0*
