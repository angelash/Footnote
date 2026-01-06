# Pipeline-Sys v2 开发计划

> 版本: v2.0.0
> 目标: 配置化流程（FlowSpec DSL）
> 状态: **✅ Phase 1-4 完成，Phase 5 文档完成**

---

## 📋 版本目标

### v2 核心特性
1. ✅ **流程配置化** - 从固定流程升级为 JSON 配置定义
2. ✅ **节点类型丰富化** - 支持 shell、http、condition、parallel、loop 等
3. ✅ **变量系统** - 输入/输出/变量的定义和引用
4. ✅ **控制流** - 条件分支、并行执行、循环
5. ✅ **错误处理** - 重试、超时、错误策略
6. ✅ **子流程** - 流程复用和嵌套调用

### 不在 v2 范围
- 图形化流程编辑器（v3）
- 多执行器分布式调度（v3）
- 流程版本管理和回滚（v3）
- 审计和权限控制（v3）

---

## 📁 文件结构

```
v2-design/
├── DEVELOPMENT-PLAN.md        # 本文档
├── flowspec-schema.json       # FlowSpec JSON Schema ✅
└── examples/
    └── fixed-flow.flowspec.json   # v1 固定流程迁移示例 ✅

wsl-runner/lib/v2/
├── index.mjs           # 统一导出 ✅
├── parser.mjs          # 流程解析器 ✅
├── expression.mjs      # 表达式引擎 ✅
├── context.mjs         # 变量上下文 ✅
├── executor-base.mjs   # 执行器基类 ✅
├── flow-runner.mjs     # 流程调度器 ✅
├── executors/
│   ├── index.mjs       # 执行器注册 ✅
│   ├── shell.mjs       # Shell 执行器 ✅
│   ├── transform.mjs   # Transform 执行器 ✅
│   ├── file.mjs        # File 执行器 ✅
│   ├── http.mjs        # HTTP 执行器 ✅
│   ├── notify.mjs      # Notify 执行器 ✅
│   ├── condition.mjs   # 条件分支 ✅
│   ├── parallel.mjs    # 并行执行 ✅
│   ├── loop.mjs        # 循环 ✅
│   └── subflow.mjs     # 子流程 ✅
├── tests/
│   ├── vitest.config.mjs ✅
│   ├── parser.test.mjs       # 22 tests ✅
│   ├── expression.test.mjs   # 37 tests ✅
│   ├── context.test.mjs      # 32 tests ✅
│   ├── executor-base.test.mjs # 22 tests ✅
│   ├── executors.test.mjs    # 28 tests ✅
│   ├── control-flow.test.mjs # 26 tests ✅
│   └── flow-runner.test.mjs  # 20 tests ✅
└── README.md           # 用法文档 ✅
```

---

## 🗓️ 开发阶段

### Phase 1: 基础框架 ✅ 完成

#### 任务清单
- [x] **P1-1**: FlowSpec 解析器
  - 输入: flowspec.json 文件路径
  - 输出: 解析后的流程对象
  - 校验: JSON Schema 验证
  - 错误: 详细的解析错误信息

- [x] **P1-2**: 表达式引擎
  - 支持变量引用: `${inputs.task_id}`
  - 支持条件表达式: `nodes['xxx'].status === 'SUCCESS'`
  - 支持简单运算: 字符串拼接、数学运算
  - 安全: 禁止任意代码执行

- [x] **P1-3**: 变量上下文管理
  - 作用域: inputs → variables → nodes[].output
  - 生命周期: 运行期间持久化
  - 类型检查: 运行时类型验证

- [x] **P1-4**: 节点执行器基类
  - 接口: `execute(config, context): Promise<NodeResult>`
  - 生命周期: onStart → execute → onComplete
  - 事件: 发送 NODE_STARTED/NODE_LOG/NODE_FINISHED

#### 交付物
- ✅ `lib/v2/parser.mjs` - 流程解析器
- ✅ `lib/v2/expression.mjs` - 表达式引擎
- ✅ `lib/v2/context.mjs` - 变量上下文
- ✅ `lib/v2/executor-base.mjs` - 执行器基类
- ✅ 113 个单元测试通过

---

### Phase 2: 基础节点 ✅ 完成

#### 任务清单
- [x] **P2-1**: Shell 节点执行器
  - 支持: bash/sh/cmd/powershell
  - 特性: 环境变量、工作目录、超时、参数
  - 输出: stdout/stderr/exitCode

- [x] **P2-2**: Transform 节点执行器
  - JavaScript 表达式支持
  - 上下文变量访问
  - 内置工具函数 (JSON/Array)

- [x] **P2-3**: File 节点执行器
  - 操作: read/write/append/delete/copy/move/exists/list/mkdir/stat
  - 路径: 支持变量替换
  - 编码: utf-8/base64

- [x] **P2-4**: HTTP 节点执行器
  - 方法: GET/POST/PUT/PATCH/DELETE
  - 认证: basic/bearer/apikey
  - 超时和重试

- [x] **P2-5**: Notify 节点执行器
  - 渠道: console/webhook/log
  - 级别: info/success/warning/error
  - 模板: 消息变量替换

#### 交付物
- ✅ `lib/v2/executors/shell.mjs`
- ✅ `lib/v2/executors/transform.mjs`
- ✅ `lib/v2/executors/file.mjs`
- ✅ `lib/v2/executors/http.mjs`
- ✅ `lib/v2/executors/notify.mjs`
- ✅ 28 个单元测试通过

---

### Phase 3: 控制流 ✅ 完成

#### 任务清单
- [x] **P3-1**: Condition 节点
  - 语法: expression + onTrue/onFalse
  - 表达式: 条件判断
  - 分支: 多目标支持

- [x] **P3-2**: Parallel 节点
  - 分支: 多个并行执行的节点组
  - 策略: waitForAll / failFast
  - 并发限制: maxConcurrency

- [x] **P3-3**: Loop 节点
  - 模式: forEach / times / while / doWhile
  - 变量: item / index
  - 安全: maxIterations 防止死循环

- [x] **P3-4**: Subflow 节点
  - 加载: flowId 引用
  - 映射: 输入/输出参数映射
  - 执行: async/sync 模式

#### 交付物
- ✅ `lib/v2/executors/condition.mjs`
- ✅ `lib/v2/executors/parallel.mjs`
- ✅ `lib/v2/executors/loop.mjs`
- ✅ `lib/v2/executors/subflow.mjs`
- ✅ 26 个单元测试通过

---

### Phase 4: 流程运行器 ✅ 完成

#### 任务清单
- [x] **P4-1**: FlowRunner 核心
  - FlowSpec 解析和执行
  - 自动入口节点检测
  - 事件发射 (EventEmitter)

- [x] **P4-2**: 节点调度
  - 按 on_success/on_failure 链路执行
  - 条件分支路由
  - 并行节点执行

- [x] **P4-3**: 工件生成
  - status.json - 运行状态
  - graph.json - 流程图结构
  - events.ndjson - 事件日志
  - node_runs.json - 节点状态快照

- [x] **P4-4**: 运行控制
  - 取消支持 (AbortController)
  - 超时处理
  - 错误传播

#### 交付物
- ✅ `lib/v2/flow-runner.mjs` (~550 行)
- ✅ 20 个单元测试通过
- ✅ **总计 187 个测试全部通过**

---

### Phase 5: 集成和文档 📝 文档完成

#### 任务清单
- [ ] **P5-1**: server.mjs 集成
  - 新增 `/v2/run` 端点
  - 支持 flowspec 路径参数
  - 向下兼容 v1 `/fixed-flow`

- [ ] **P5-2**: Console 更新
  - 显示 v2 流程运行
  - 支持新的节点类型展示
  - 支持嵌套节点可视化

- [ ] **P5-3**: UI 更新
  - 行为树支持控制流节点
  - 并行分支可视化
  - 循环展开/折叠

- [x] **P5-4**: 文档编写
  - ✅ `lib/v2/README.md` 用法文档
  - ✅ `IMPLEMENTATION-STATUS.md` 状态报告
  - ✅ `DEVELOPMENT-PLAN.md` 更新

- [ ] **P5-5**: 示例流程
  - CI/CD 流程示例
  - 数据处理流程示例
  - AI 任务流程示例

---

## 📊 测试统计

| 模块 | 测试文件 | 测试数 | 状态 |
|------|----------|--------|------|
| parser | parser.test.mjs | 22 | ✅ |
| expression | expression.test.mjs | 37 | ✅ |
| context | context.test.mjs | 32 | ✅ |
| executor-base | executor-base.test.mjs | 22 | ✅ |
| executors | executors.test.mjs | 28 | ✅ |
| control-flow | control-flow.test.mjs | 26 | ✅ |
| flow-runner | flow-runner.test.mjs | 20 | ✅ |
| **总计** | **7 文件** | **187** | **✅ 全部通过** |

运行测试:
```bash
cd workflows/reusable/n8n-common/wsl-runner/lib/v2/tests
npx vitest run --config vitest.config.mjs
```

---

## 📊 里程碑

| 里程碑 | 目标日期 | 状态 | 交付物 |
|--------|----------|------|--------|
| M1: 基础框架 | +2周 | ✅ 完成 | 解析器、表达式引擎、执行器基类 |
| M2: 基础节点 | +4周 | ✅ 完成 | Shell/Transform/File/HTTP/Notify 节点 |
| M3: 控制流 | +6周 | ✅ 完成 | Condition/Parallel/Loop/Subflow 节点 |
| M4: 运行时 | +8周 | ✅ 完成 | FlowRunner 流程调度器 |
| M5: 发布 | +10周 | 📝 文档完成 | 集成、文档、示例 |

---

## 🔧 技术决策

### 表达式语言选择
- **决策**: 使用 JavaScript 子集 + 模板语法 `${...}`
- **实现**: `expression.mjs` 使用安全的 Function 构造器
- **安全**: 限制全局变量访问，只暴露 inputs/variables/nodes/env

### 变量作用域
- **决策**: 层级作用域（inputs → variables → nodes）
- **实现**: `context.mjs` ExecutionContext 类
- **特性**: 支持快照、序列化、节点状态追踪

### 图谱生成
- **决策**: 运行时动态生成
- **实现**: `flow-runner.mjs` _buildGraph() 方法
- **格式**: 与 v1 graph.json 格式兼容

---

## ⚠️ 风险和缓解

| 风险 | 影响 | 状态 | 缓解措施 |
|------|------|------|----------|
| 表达式注入 | 高 | ✅ 已处理 | 沙箱执行、受限上下文 |
| 无限循环 | 中 | ✅ 已处理 | maxIterations 强制限制 |
| 内存泄漏 | 中 | ✅ 已处理 | 子流程完成后清理上下文 |
| 向下兼容 | 低 | ✅ 已处理 | v1 API 保持不变 |

---

## 🚀 下一步

### v2.1 计划
- [ ] WSL Runner server.mjs 集成 v2 引擎
- [ ] 新增 `/v2/run` 端点
- [ ] 流程文件热加载
- [ ] 更多示例流程

### v3 计划
- [ ] 图形化流程编辑器
- [ ] 分布式执行
- [ ] 流程版本管理
- [ ] 审计和权限

---

*文档版本: 2.0*
*最后更新: 2026-01-06*
*状态: v2 核心完成*
