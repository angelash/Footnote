# Pipeline-Sys v2 - FlowSpec 配置化流程引擎

## 概述

v2 引擎支持通过 JSON 配置文件定义工作流，无需修改代码即可创建和修改流程。

## 快速开始

### 1. 定义流程 (FlowSpec JSON)

```json
{
  "id": "my-workflow",
  "name": "My Workflow",
  "version": "1.0.0",
  "inputs": {
    "projectRoot": { "type": "string", "required": true },
    "taskId": { "type": "string", "required": true }
  },
  "nodes": [
    {
      "id": "preflight",
      "type": "shell",
      "name": "Git Preflight",
      "command": "git status --porcelain",
      "cwd": "${inputs.projectRoot}",
      "on_success": "execute"
    },
    {
      "id": "execute",
      "type": "shell",
      "name": "Execute Task",
      "command": "npm run task -- ${inputs.taskId}",
      "cwd": "${inputs.projectRoot}",
      "timeout_ms": 1800000,
      "on_success": "notify",
      "on_failure": "notify_error"
    },
    {
      "id": "notify",
      "type": "notify",
      "channel": "webhook",
      "webhookUrl": "https://api.example.com/notify",
      "message": "Task ${inputs.taskId} completed successfully"
    },
    {
      "id": "notify_error",
      "type": "notify",
      "channel": "log",
      "level": "error",
      "message": "Task ${inputs.taskId} failed"
    }
  ]
}
```

### 2. 执行流程

```javascript
import { runFlow } from './lib/v2/index.mjs';

const result = await runFlow('./workflows/my-workflow.json', {
  projectRoot: '/path/to/project',
  taskId: 'TASK-001',
});

console.log('Success:', result.success);
console.log('Status:', result.status);
console.log('Outputs:', result.output);
```

### 3. 使用 FlowRunner 类（更多控制）

```javascript
import { createFlowRunner, EventType } from './lib/v2/index.mjs';

const runner = createFlowRunner({
  runId: 'custom-run-id',
  artifactWriter: async (name, data) => {
    // 自定义工件写入
    await fs.writeFile(`./runs/${name}`, JSON.stringify(data, null, 2));
  },
});

// 监听事件
runner.on(EventType.NODE_STARTED, (e) => console.log('Started:', e.nodeId));
runner.on(EventType.NODE_FINISHED, (e) => console.log('Finished:', e.nodeId, e.status));

// 执行
const result = await runner.run(flowSpec, inputs);

// 取消（如需要）
// runner.cancel();
```

## 节点类型

### 基础节点

| 类型 | 说明 | 主要配置 |
|------|------|----------|
| `shell` | 执行 Shell 命令 | `command`, `shell`, `cwd`, `env` |
| `transform` | 数据转换 | `expression` |
| `file` | 文件操作 | `operation`, `path`, `content` |
| `http` | HTTP 请求 | `method`, `url`, `body`, `headers` |
| `notify` | 发送通知 | `channel`, `message`, `level` |

### 控制流节点

| 类型 | 说明 | 主要配置 |
|------|------|----------|
| `condition` | 条件分支 | `expression`, `onTrue`, `onFalse` |
| `parallel` | 并行执行 | `branches`, `waitForAll`, `failFast` |
| `loop` | 循环 | `type`, `items`/`times`/`condition`, `body` |
| `subflow` | 子流程 | `flowId`, `inputs`, `outputs` |

## 表达式语法

支持 `${...}` 模板变量：

```json
{
  "command": "echo ${inputs.message}",
  "url": "https://api.example.com/tasks/${variables.taskId}",
  "expression": "nodes.previousNode.output.value * 2"
}
```

可用上下文变量：
- `inputs` - 流程输入参数
- `variables` - 运行时变量
- `nodes` - 节点状态和输出
- `env` - 环境变量

## 运行工件

每次执行生成以下文件：

| 文件 | 说明 |
|------|------|
| `status.json` | 运行状态（进行中/成功/失败） |
| `graph.json` | 流程图结构（节点+边+状态） |
| `events.ndjson` | 事件流（NDJSON 格式） |
| `node_runs.json` | 各节点执行结果快照 |

## 事件类型

| 事件 | 说明 |
|------|------|
| `RUN_STARTED` | 流程开始 |
| `RUN_FINISHED` | 流程结束 |
| `RUN_CANCELLED` | 流程被取消 |
| `NODE_STARTED` | 节点开始执行 |
| `NODE_FINISHED` | 节点执行完成 |
| `NODE_LOG` | 节点日志 |
| `NODE_RETRY` | 节点重试 |
| `NODE_TIMEOUT` | 节点超时 |

## 从 v1 迁移

v1 的固定流程等价于以下 FlowSpec：

```json
{
  "id": "fixed-flow",
  "name": "Fixed Flow Pipeline",
  "nodes": [
    { "id": "stage.intake", "type": "shell", "command": "...", "on_success": "stage.preflight" },
    { "id": "stage.preflight", "type": "shell", "command": "...", "on_success": "execute.plan" },
    { "id": "execute.plan", "type": "shell", "command": "...", "on_success": "execute.edit" },
    ...
  ]
}
```

参考 `v2-design/examples/fixed-flow.flowspec.json` 查看完整示例。

## 模块结构

```
lib/v2/
├── index.mjs           # 统一导出
├── parser.mjs          # FlowSpec 解析
├── expression.mjs      # 表达式引擎
├── context.mjs         # 执行上下文
├── executor-base.mjs   # 执行器基类
├── flow-runner.mjs     # 流程调度器
├── executors/
│   ├── index.mjs       # 执行器注册
│   ├── shell.mjs       # Shell 执行器
│   ├── transform.mjs   # Transform 执行器
│   ├── file.mjs        # File 执行器
│   ├── http.mjs        # HTTP 执行器
│   ├── notify.mjs      # Notify 执行器
│   ├── condition.mjs   # 条件分支
│   ├── parallel.mjs    # 并行执行
│   ├── loop.mjs        # 循环
│   └── subflow.mjs     # 子流程
└── tests/              # 单元测试
```

## 版本

当前版本: **2.0.0**


