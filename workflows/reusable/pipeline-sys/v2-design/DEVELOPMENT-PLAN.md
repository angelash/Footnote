# Pipeline-Sys v2 开发计划

> 版本: v2.0.0
> 目标: 配置化流程（FlowSpec DSL）
> 预计周期: 8-10 周

---

## 📋 版本目标

### v2 核心特性
1. **流程配置化** - 从固定流程升级为 JSON 配置定义
2. **节点类型丰富化** - 支持 shell、http、condition、parallel、loop 等
3. **变量系统** - 输入/输出/变量的定义和引用
4. **控制流** - 条件分支、并行执行、循环
5. **错误处理** - 重试、超时、错误策略
6. **子流程** - 流程复用和嵌套调用

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
├── examples/
│   ├── fixed-flow.flowspec.json   # v1 固定流程迁移示例 ✅
│   ├── simple-shell.flowspec.json # 简单 Shell 流程
│   ├── condition-flow.flowspec.json # 条件分支示例
│   └── parallel-flow.flowspec.json  # 并行执行示例
└── specs/
    ├── expression-syntax.md    # 表达式语法规范
    ├── variable-resolution.md  # 变量解析规范
    └── node-types.md           # 节点类型详细规范
```

---

## 🗓️ 开发阶段

### Phase 1: 基础框架（2周）

#### 任务清单
- [ ] **P1-1**: FlowSpec 解析器
  - 输入: flowspec.json 文件路径
  - 输出: 解析后的流程对象
  - 校验: JSON Schema 验证
  - 错误: 详细的解析错误信息

- [ ] **P1-2**: 表达式引擎
  - 支持变量引用: `${inputs.task_id}`
  - 支持条件表达式: `nodes['xxx'].status === 'SUCCESS'`
  - 支持简单运算: 字符串拼接、数学运算
  - 安全: 禁止任意代码执行

- [ ] **P1-3**: 变量上下文管理
  - 作用域: inputs → variables → nodes[].output
  - 生命周期: 运行期间持久化
  - 类型检查: 运行时类型验证

- [ ] **P1-4**: 节点执行器基类
  - 接口: `execute(config, context): Promise<NodeResult>`
  - 生命周期: onStart → execute → onComplete
  - 事件: 发送 NODE_STARTED/NODE_LOG/NODE_FINISHED

#### 交付物
- `lib/v2/parser.mjs` - 流程解析器
- `lib/v2/expression.mjs` - 表达式引擎
- `lib/v2/context.mjs` - 变量上下文
- `lib/v2/executor-base.mjs` - 执行器基类
- 单元测试覆盖 > 80%

---

### Phase 2: 基础节点（2周）

#### 任务清单
- [ ] **P2-1**: Shell 节点执行器
  - 支持: bash/sh/zsh/powershell/cmd
  - 特性: 环境变量、工作目录、超时
  - 输出: stdout/stderr/exitCode

- [ ] **P2-2**: Transform 节点执行器
  - JavaScript 表达式支持
  - JSONata 支持（可选）
  - 安全沙箱执行

- [ ] **P2-3**: File 节点执行器
  - 操作: read/write/append/delete/copy/move/exists/list
  - 路径: 支持变量替换
  - 安全: 路径边界检查

- [ ] **P2-4**: HTTP 节点执行器
  - 方法: GET/POST/PUT/PATCH/DELETE
  - 认证: basic/bearer/apikey
  - 超时和重试

- [ ] **P2-5**: Notify 节点执行器
  - 渠道: console/http/webhook
  - 模板: 消息变量替换

#### 交付物
- `lib/v2/executors/shell.mjs`
- `lib/v2/executors/transform.mjs`
- `lib/v2/executors/file.mjs`
- `lib/v2/executors/http.mjs`
- `lib/v2/executors/notify.mjs`
- 各节点类型的集成测试

---

### Phase 3: 控制流（2周）

#### 任务清单
- [ ] **P3-1**: Condition 节点
  - 语法: if/then/else
  - 表达式: 条件判断
  - 分支: 嵌套节点列表

- [ ] **P3-2**: Parallel 节点
  - 分支: 多个并行执行的节点组
  - 等待: waitAll / failFast
  - 合并: 结果聚合

- [ ] **P3-3**: Loop 节点
  - 模式: for / forEach / while
  - 变量: item / index
  - 安全: maxIterations 防止死循环

- [ ] **P3-4**: Subflow 节点
  - 加载: 子流程文件解析
  - 映射: 输入/输出参数映射
  - 作用域: 子流程变量隔离

#### 交付物
- `lib/v2/executors/condition.mjs`
- `lib/v2/executors/parallel.mjs`
- `lib/v2/executors/loop.mjs`
- `lib/v2/executors/subflow.mjs`
- 控制流集成测试

---

### Phase 4: 运行时增强（2周）

#### 任务清单
- [ ] **P4-1**: 流程运行器重构
  - 从固定流程切换为配置驱动
  - 保持 v1 工件格式兼容
  - 动态生成 graph.json

- [ ] **P4-2**: 重试机制增强
  - 配置: maxAttempts/delay/backoff
  - 策略: fixed/linear/exponential
  - 事件: NODE_RETRY_SCHEDULED

- [ ] **P4-3**: 超时机制增强
  - 节点级超时
  - 流程级超时
  - 事件: NODE_TIMEOUT

- [ ] **P4-4**: 错误处理
  - 策略: fail/skip/continue
  - 传播: 错误信息向上传递
  - 恢复: 从断点继续执行

- [ ] **P4-5**: 取消机制
  - 信号: control.json 监听
  - 传播: 取消信号传递到子节点
  - 清理: 资源释放

#### 交付物
- `lib/v2/runner.mjs` - v2 流程运行器
- `lib/v2/retry.mjs` - 重试逻辑
- `lib/v2/timeout.mjs` - 超时逻辑
- `lib/v2/cancel.mjs` - 取消逻辑
- 运行时集成测试

---

### Phase 5: 集成和文档（2周）

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

- [ ] **P5-4**: 文档编写
  - FlowSpec 语法文档
  - 节点类型参考
  - 迁移指南（v1 → v2）
  - 最佳实践

- [ ] **P5-5**: 示例流程
  - CI/CD 流程示例
  - 数据处理流程示例
  - AI 任务流程示例

#### 交付物
- v2 API 集成到 server.mjs
- Console/UI v2 支持
- 完整文档
- 示例流程库

---

## 📊 里程碑

| 里程碑 | 目标日期 | 交付物 |
|--------|----------|--------|
| M1: 基础框架 | +2周 | 解析器、表达式引擎、执行器基类 |
| M2: 基础节点 | +4周 | Shell/Transform/File/HTTP/Notify 节点 |
| M3: 控制流 | +6周 | Condition/Parallel/Loop/Subflow 节点 |
| M4: 运行时 | +8周 | v2 运行器、重试/超时/取消 |
| M5: 发布 | +10周 | 集成、文档、示例 |

---

## 🔧 技术决策

### 表达式语言选择
- **决策**: 使用 JavaScript 子集 + 模板语法
- **理由**: 
  - 团队熟悉 JavaScript
  - 无需额外学习成本
  - 可控制安全边界

### 变量作用域
- **决策**: 层级作用域（inputs → variables → nodes）
- **理由**:
  - 直观易理解
  - 避免命名冲突
  - 支持覆盖

### 图谱生成
- **决策**: 运行时动态生成
- **理由**:
  - 控制流节点结构运行时才确定
  - 循环次数可能不固定
  - 条件分支路径运行时才知道

---

## ⚠️ 风险和缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 表达式注入 | 高 | 沙箱执行、禁止 eval/Function |
| 无限循环 | 中 | maxIterations 强制限制 |
| 内存泄漏 | 中 | 子流程完成后清理上下文 |
| 向下兼容 | 低 | v1 API 保持不变 |

---

## 📝 开发规范

### 代码规范
- 使用 ESM 模块
- 函数必须有 JSDoc 注释
- 错误必须包含上下文信息
- 单元测试覆盖 > 80%

### 提交规范
```
feat(v2): add shell executor
fix(v2/parser): handle empty nodes array
docs(v2): add expression syntax guide
test(v2/loop): add forEach test cases
```

### 分支策略
- `main`: 稳定版本
- `develop`: 开发分支
- `feature/v2-*`: v2 功能分支

---

## 📚 参考资料

- [JSON Schema](https://json-schema.org/)
- [n8n Workflow Format](https://docs.n8n.io/)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Apache Airflow DAGs](https://airflow.apache.org/docs/apache-airflow/stable/concepts/dags.html)

---

*文档版本: 1.0*
*创建日期: 2026-01-06*

