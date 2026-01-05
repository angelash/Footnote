# tools/ 目录索引（运维/自动化工具箱）

> 目标：让团队成员在不读大量上下文的情况下，一眼知道 **每个脚本/服务/工作流文件用来做什么**、当前主链路依赖哪些、哪些是可选/可清理的。

---

## 当前主链路（你现在“提需求→自动流转”的最短闭环）

1. **n8n（WSL 5680）**：接收 webhook / 触发工作流（入口代理）
2. **WSL Runner（HTTP 3210）**：编排固定流程 `/fixed-flow`（落盘/锁/git/通知）
3. **Cursor Agent（WSL）**：由脚本封装调用，完成实际任务并受 Deliverables 护栏约束

关键文件：
- `workflows/project/n8n/wsl-runner/server.mjs`：WSL Runner（/fixed-flow、/execute-task、/compose-taskpack、/fixed-flow/status）
- `workflows/project/n8n/run-cursor-task.sh`：调用 `cursor-agent` + 选模型策略 + Deliverables guardrail
- `workflows/project/n8n/cli-import/secondary-fixed-flow.export.json`：n8n 导入的 fixed-flow 入口工作流（HTTP 转发到 3210）

---

## 目录与文件说明（按用途）

### A) `workflows/project/n8n/`（核心：n8n 部署与工作流资产）

| 路径 | 用途 | 谁用 | 是否必需 |
|---|---|---|---|
| `workflows/project/n8n/run-cursor-task.sh` | 统一封装 `cursor-agent` 调用；按 `task_type/complexity` 选模型；Deliverables 白名单护栏 | WSL Runner | **必需** |
| `workflows/project/n8n/wsl-runner/server.mjs` | WSL HTTP Runner：`/fixed-flow` 编排、落盘、锁、git、通知；提供 `/fixed-flow/status` 查询 | n8n / 你 | **必需** |
| `workflows/project/n8n/wsl-runner/start-server.sh` | 启动 WSL Runner 的脚本 | 运维 | **必需**（如果你用脚本启动） |
| `workflows/project/n8n/cli-import/*.export.json` | n8n 工作流“权威导入包”（建议只保留这套） | 你（导入） | **建议** |
| `workflows/project/n8n/*-workflow.json` | n8n 工作流源码/入口（launcher/factory/dispatch 等） | 你（导入/迭代） | **建议** |
| `workflows/project/n8n/start-n8n-secondary.sh` | WSL n8n 启动脚本（含关键 env） | 运维 | **建议** |
| `workflows/project/n8n/ecosystem.config.wsl.cjs` | PM2：WSL n8n 的启动配置示例 | 运维 | 可选 |
| `workflows/project/n8n/ecosystem.config.cjs` | PM2：Windows MCP Runner/服务等端口配置（如 3211） | 运维 | 可选 |
| `workflows/project/n8n/smoke-secondary.ps1` | 5680 入口冒烟（compose/execute） | 你/CI | **建议** |
| `workflows/project/n8n/CLUSTER-SETUP.md` | 集群/PM2 配置说明（已更新为 `.cjs` 示例） | 你/运维 | 参考 |
| `workflows/project/n8n/README.md` / `QUICK-START.md` / `DEPLOYMENT-GUIDE.md` | 使用说明/启动指南 | 你/团队 | 参考 |

**端口约定（当前）**
- WSL Runner：`http://127.0.0.1:3210`
- n8n（WSL）：`http://localhost:5680`

---

### B) `tools/mcp-runner/`（Windows：Browser MCP / ChromeMCP 任务执行）

> 适用：Windows 无 `cursor-agent` 时，用 `CUSTOM_API_*` 驱动 MCP（浏览器测试/截图/交互）。

| 路径 | 用途 | 谁用 | 是否必需 |
|---|---|---|---|
| `tools/mcp-runner/mcp-runner.mjs` | MCP Runner CLI（list-tools/call-tool/agent） | Windows 侧 | 需要 browser-test 时必需 |
| `tools/mcp-runner/server.mjs` | MCP Runner HTTP 服务：`POST /agent`（供 n8n HTTP Request 调用；默认 3211） | n8n / Windows | 需要 browser-test 时必需 |
| `tools/mcp-runner/run-agent.ps1` | PowerShell 包装：避免 prompt 引号/换行坑（Base64 传参） | Windows 侧 | 建议 |
| `tools/mcp-runner/README.md` | 使用说明（强调不替换 WSL cursor-agent） | 团队 | 参考 |
| `tools/mcp-runner/env.example` | 环境变量示例（CUSTOM_API_*） | 你 | 参考 |

**端口约定（当前）**
- MCP Runner：`http://127.0.0.1:3211`

---

### C) `tools/` 根目录（自检/冒烟脚本）

| 路径 | 用途 | 是否必需 |
|---|---|---|
| `tools/wsl-env-check.sh` | WSL 环境自检（cursor-agent/路径/PATH 等） | 建议 |
| `tools/test-wsl-cursor-agent.sh` | cursor-agent 可用性自检（不真正跑任务） | 建议 |
| `tools/test-full-wsl-workflow.sh` | 较完整的 WSL 流程自检（偏手工验证） | 可选 |
| `tools/CLEANUP-REPORT.md` | 历史清理报告（供回溯） | 可选 |

---

## 清理策略（你要求“先都提交，后面完善再清理”）

当前策略：
- **保留并提交**：`workflows/project/logs/automation_runs/**`（审计/可续跑证据）
- **不再污染**：`.cursor/current_task_prompt.md`（prompt 已迁移到 run 日志目录：`.../_prompt.md`）

后续（架构完善后）可以考虑：
- 将 `automation_runs` 从主分支移出（转为 artifacts/独立仓库/分支），减少 main 噪音


