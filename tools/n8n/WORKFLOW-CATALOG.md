# n8n 工作流目录（按岗位/工种）

> 目标：回答“每个岗位/工种有没有对应工作流、文档在哪里、能不能导入 n8n”。

---

## 1) 现有“完整流程设计文档”（Spec）

- **主从 + Cursor CLI 执行架构**：`docs/02_specs/pipelines/n8n_cursor_cli_pipeline_spec.md`
- **落地推进计划（含角色/执行策略）**：`docs/02_specs/pipelines/n8n_cursor_cli_rollout_plan.md`
- **内容生产管线（对白/事件/卡片等）**：`docs/02_specs/pipelines/content_pipeline_spec.md`
- **美术资产管线（命名/尺寸/校验/AI生图）**：`docs/02_specs/pipelines/asset_pipeline_spec.md`
- **AI-Native 流程改造总文档（含角色列表）**：`docs/AI-Native流程改造落地计划.md`
- **AI-Native 工作流规范（Cursor 规则）**：`.cursor/rules/09-ai-native-workflow.mdc`

> 说明：这些 Spec 是“岗位/工种的流程怎么做”的完整设计，但它们不等于“n8n 里已经有一套一一对应的工作流”。

---

## 2) 现有可导入 n8n 的工作流（Import JSON）

### 2.1 WSL 执行器（通用：代码/文档/多模态）

- **从实例执行（WSL 5680）**：`tools/n8n/cursor-cli-task-workflow.json`
  - Webhook：`POST http://localhost:5680/webhook/execute-task`
- **Windows 主实例直连 WSL 的版本（可选）**：`tools/n8n/cursor-cli-task-workflow-windows.json`

### 2.2 主从分发（通用入口 → 从实例执行）

- **主实例分发到从实例（5678 → 5680）**：`tools/n8n/dispatch-to-secondary-workflow.json`
  - Webhook：`POST http://localhost:5678/webhook/dispatch-task`

### 2.3 Windows 浏览器/MCP（ChromeMCP/Browser MCP）

- **Windows MCP Runner（浏览器测试）**：`tools/n8n/windows-mcp-runner-browser-test-workflow.json`
  - Webhook：`POST http://127.0.0.1:5678/webhook/browser-test`

---

## 3) “岗位/工种工作流”如何落地到 n8n（推荐做法）

### 核心结论

- **不需要为每个岗位写一套“完整执行工作流”**：执行链路是通用的（读取 Task Pack → 组 prompt → 执行 → 校验）。
- **岗位差异应由 Task Pack + role 参数驱动**：例如 `role: L3_writer / L3_engineer / L3_tester`。
- 若你希望“在 n8n 里有明确入口”，可以用 **Launcher 工作流**：
  - 只负责：固定 role / task_type 默认值 → 转发到 5680 的 `execute-task`（或 5678 的 `dispatch-task`）。

---

## 4) 本次补充：岗位 Launcher（可导入）

> 这些 Launcher 不是新执行器，只是把 role 固定下来，减少手填错误。

- `tools/n8n/launcher-l3-writer-to-wsl.json`
- `tools/n8n/launcher-l3-engineer-to-wsl.json`


