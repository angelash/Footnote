# Factory Pipeline Spec v1.0（全岗位“工厂流水线”）

> 目标：不管你提的事情粒度大小如何，都能沿“流水线”把产物生产出来，并可追溯、可审计、可回滚。
>
> 本 Spec 不引入新 Schema，只把已有的 Task Pack 契约 + n8n 主从执行器组织成“工厂”。

---

## 1. 工厂的核心概念

### 1.0 当前运行形态（已选 C）

- **执行入口（推荐）**：使用 `WSL n8n-secondary (5680)` 承载固定流程（Fixed Flow）
  - `POST http://localhost:5680/webhook/fixed-flow`（主入口：落盘审计 → execute → validate → git → notify）
  - `GET  http://localhost:5680/webhook/status?run_id=RUN-...`（状态查询：读取 `status.json`）
- **兼容入口（旧链路）**：仍保留（部分工厂入口仍在使用，后续迁移）
  - `POST http://localhost:5680/webhook/compose-taskpack`（Runner 版本）
  - `POST http://localhost:5680/webhook/execute-task`（Runner 版本）
- **Windows 5678（可选）**：用于“入口路由/浏览器任务”（例如 `/webhook/intake`、`/webhook/run-role`、`/webhook/browser-test`）

### 1.1 四类工件（Artifacts）

1. **Intake Request（需求单）**
   - 输入：你用自然语言描述“要做什么”
   - 输出：要么直接指向某个 Task Pack，要么生成一组 Task Pack
2. **Task Pack（工单契约）**
   - 位置：`docs/03_taskpacks/*.md`
   - 内容：Allowed Inputs / Deliverables / Constraints / Acceptance / 回执格式
3. **Execution Receipt（执行回执）**
   - 输出：执行者必须按模板回执（完成内容、输出文件、自检、风险）
4. **Audit Log（审计记录）**
   - 至少要记录：触发时间、task_pack_path、执行器、执行结果（成功/失败）、产物路径

### 1.2 三段式流水线（Stage）

1. **制作人入口（PM Intake）**：把“愿望”变成“可执行工单”
2. **组长拆解（Lead Decompose）**：把工单分配到正确岗位（可并行）
3. **执行岗交付（L3 Execute）**：严格按工单契约产出文件并通过校验

> 说明：小任务可以跳过“拆解阶段”，直接从某个岗位入口启动；大任务从制作人入口启动并自动生成多个 Task Pack。

---

## 2. 组织方式（覆盖所有岗位/工种）

### 2.1 “覆盖所有岗位”不是“每岗位一套执行工作流”

执行链路本质是通用的：
- 读取 Task Pack → 生成最小提示 → 调用执行器（WSL cursor-agent / Windows MCP Runner）→ 校验 → 输出回执

岗位差异由 **role + task_type + execution_runtime/requires_mcp** 驱动：
- role：决定执行者身份与回执语气/边界（如 L3_writer/L3_engineer/L3_tester/…）
- task_type：决定模型策略（doc/code/multimodal/browser-test）
- execution_runtime/requires_mcp：决定跑在 WSL 还是 Windows

### 2.2 推荐的入口 API（n8n Webhook）

- **制作人入口（统一入口）**：`POST /webhook/intake`
  - 若带 `task_pack_path`：直接执行该工单
  - 若不带：生成一个“工单”（或一组工单）再执行
- **岗位入口（可选）**：`POST /webhook/run-role`
  - 传 `role/task_type/complexity`，把任务直接路由给对应执行器

> 你仍然可以保留“便捷入口”：如 `/webhook/run-writer`、`/webhook/run-engineer`，本质是预填 role 的 Launcher。
>
> 对齐最新落地：上述“工厂入口”通常导入在 **Windows 5678**，并转发到 WSL 5680 的执行入口。

---

## 3. 运行时路由（WSL / Windows）

### 3.1 路由规则（建议）

- **默认执行器**：WSL（`n8n-secondary:5680`）→ `cursor-agent`
- 满足任一条件则走 **Windows Runner**：
  - `execution_runtime == windows`
  - `requires_mcp == browser`
  - `task_type == browser-test`

### 3.2 对应工作流

- 主→从分发（通用）：`tools/n8n/dispatch-to-secondary-workflow.json`
- 固定流程执行器（推荐）：`tools/n8n/fixed-flow-pipeline.json`
- 状态查询（配套）：`tools/n8n/status-query-workflow.json`
- 从实例执行器（旧：Runner）：`tools/n8n/cursor-cli-task-workflow.json`
- Windows 浏览器测试：`tools/n8n/windows-mcp-runner-browser-test-workflow.json`

---

## 4. 可追溯性（必须）

最小闭环要求：
- 每次执行都能定位到 `task_pack_path`
- 回执必须列出输出文件路径
- 禁止修改冻结目录：`docs/00_charter/**`、`docs/01_bibles/**`

---

## 5. 落地产物（本次仓库交付）

- 规格文档：本文件
- n8n 可导入工作流：
  - `tools/n8n/fixed-flow-pipeline.json`（WSL 5680：/fixed-flow，推荐）
  - `tools/n8n/status-query-workflow.json`（WSL 5680：/status，配套）
  - `tools/n8n/factory-intake-workflow.json`（主实例 /intake）
  - `tools/n8n/factory-run-role-workflow.json`（主实例 /run-role）
  - `tools/n8n/taskpack-factory-workflow.json`（从实例 /compose-taskpack，旧：Runner 版本）
  - `tools/n8n/launcher-l3-writer-to-wsl.json`（可选：/run-writer）
  - `tools/n8n/launcher-l3-engineer-to-wsl.json`（可选：/run-engineer）

- 可视化看板（可选）：`tools/n8n/dashboard/index.html`（查询 `/webhook/status` 展示进度）


