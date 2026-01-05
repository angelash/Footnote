# n8n + Cursor CLI（cursor-agent）落地推进计划（Rollout Plan）

> 本计划用于把“n8n 固定流程 + Task Pack/结构化输入 + Cursor CLI 执行”从**可用**推进到**可持续规模化提需求**。
>
> 架构规格：`workflows/project/pipelines/n8n_cursor_cli_pipeline_spec.md`

---

## 0. 现状快照（2026-01-04）

- **单入口（WSL 5680）**：`pm2 status` 显示 `n8n-secondary` online；作为执行入口与看板。
- **Windows 5678**：未来如需要浏览器/MCP 扩展再启用；当前不作为必选链路。
- **Task Pack**：仓库已有 `design/ai-native/03_taskpacks/_template.md` 与示例 `T-0001_c0_z1_dialogue.md`。
- **工作流导入文件**：`workflows/project/n8n/*.json` 已准备；默认 Task Pack 路径已修正为存在的示例文件。

---

## 1. 新标准（必须先落地的“固定流程驱动”约定）

> 你已确认：需要 **自动流转（无需人工确认）**、**每一步落盘**、并保留“可续跑”的扩展能力。

本项目采用的固定流程标准（v1）已落盘：
- `workflows/project/pipelines/n8n_fixed_flow_standard.md`

### 1.1 关键要求（摘要）
- **全自动**：默认 `auto=true`，工作流从 intake 跑到 notify，不等待人工确认
- **全程落盘**：每个 stage 产出到 `workflows/project/logs/automation_runs/<run_id>/...`
- **可续跑（对齐最新实现）**：保留 `resume_from_stage` 参数，但 `fixedflow-v1-001` 目前仅实现“跳过 preflight”（`resume_from_stage > 1`）；更细粒度的分段续跑属于后续增强项
- **单任务串行**：v1 只允许一次跑一个任务（避免 repo 并发写）
- **Git 固定策略（v1）**：允许直接 push `main`（你已确认）；后续再演进到分支+PR

---

## 2. 模型选择策略（落地约定）

### D1：执行副本策略（必须二选一）
- **A（推荐）只跑 WSL 副本**：自动化执行只在 `/home/shash/work/Footnote` 上发生；Windows 主实例仅做分发/看板
  - 优点：最简单，少路径/同步坑
  - 缺点：需要你接受“最终产物以 WSL 副本为准”，并有一套回到 Windows 的同步/提交方式
- **B 双副本同步**：Windows 工作区（F:\）与 WSL 工作副本自动同步
  - 优点：Windows IDE 与自动化执行保持一致
  - 缺点：需要明确同步工具、冲突策略、权限与性能（高复杂度）

**本计划默认采用 A**。若你选 B，需要在 P0 增加“同步机制落地”并调整后续步骤。

---

## 2.1 模型选择策略（落地约定）

> 重要澄清：**Cursor CLI（cursor-agent）使用 Cursor 自己的模型体系**；你提供的 `CUSTOM_API_*` 是另一条独立能力（Windows MCP Runner），两者不要混用。

### A) WSL Runner（cursor-agent）模型策略（Cursor 自有模型）

目标：运行 `cursor-agent` 时**按任务类型自动指定模型**，并支持按复杂度启用“高/Max”档。

**Task Pack 字段（建议）**
- `task_type`: `doc` | `code` | `multimodal`
- `complexity`: `normal` | `high` | `max`
- `model_override`: 可选，显式指定 `cursor-agent --model`（优先级最高）

**默认映射（cursor-agent）**
- **文档类（doc）**：`gpt-5.2`
  - `high/max`：优先 `gpt-5.2-high`（若不可用则回退 `gpt-5.2`）
- **代码类（code）**：`opus-4.5`
  - `high/max`：优先 `opus-4.5-thinking`（若不可用则回退 `opus-4.5`）
- **多模态识别（multimodal）**：`gemini-3-pro`
  - `high/max`：仍使用 `gemini-3-pro`（目前无明确高档变体则不切）

> 注：可用模型列表以 Cursor 运行时为准；`cursor-agent --model` 传错会返回可用列表（已实测）。

### B) Windows Runner（独立 MCP Runner）模型策略（CUSTOM_API_*）

Windows 侧如果**没有 cursor-agent**，浏览器/ChromeMCP 任务用独立程序走 `CUSTOM_API_URL`（`/chat/completions`）来驱动 MCP。该 Runner 的模型映射以 `CUSTOM_MODELS` 为准，并通过 `--model` 显式选择。

> 注：可用模型列表以运行时为准；`cursor-agent --help` 支持 `--model`，传错会返回可用列表（已实测）。

---

## 2.2 MCP/ChromeMCP 策略（落地约定）

### 原则
- **代码/文档任务**：默认只跑 **WSL 执行器**（执行副本 A）。
- **需要浏览器自动化/ChromeMCP 的任务**：建议使用 **Windows 执行器**（因为 Chrome/扩展/MCP 通常在 Windows 侧）。

### 两种执行器（建议落地为两个 runner）
- **Runner-WSL（默认）**：`n8n-secondary (WSL 5680)` → `cursor-agent`（WSL）→ 文件/命令/WSL 工具链
- **Runner-Windows（浏览器任务）**：`n8n-primary (Windows 5678)` → **独立 MCP Runner 程序** → ChromeMCP/Browser MCP  
  - 约束：Windows **没有 cursor-agent**，因此必须改为“模型 API 驱动 MCP”的独立程序

### Task Pack 字段（建议）
- `execution_runtime`: `wsl` | `windows`（默认 `wsl`）
- `requires_mcp`: 可选，例如 `browser`（浏览器自动化）

> 浏览器 MCP 的具体配置可参考仓库内已有文档（例如 `docs/智绘AI生图自动化演示文案.md` 中的 `~/.cursor/mcp.json` 配置示例）。

---

## 3. 里程碑（Milestones）

### M0：跑通一次“固定流程 v1”端到端冒烟（目标：今天）
- [ ] 5680 可访问
- [ ] 触发一次 Webhook 执行（`POST /webhook/fixed-flow`）
- [ ] 每个 stage 均有落盘（`workflows/project/logs/automation_runs/<run_id>/`）
- [ ] cursor-agent 产出 Deliverables（按 Task Pack/固定流程）
- [ ] 校验器 PASS/FAIL 可阻断
- [ ] git commit/push（v1 可直接 main）
- [ ] 输出回执 + 通知闭环

### M1：可持续提需求（目标：1~2 天）
- [ ] 统一入口（Webhook/表单）可用
- [ ] 参数/回执/落盘目录结构标准化
- [ ] “失败可重跑/可定位/可续跑”闭环跑通

### M2：工程化规模化（目标：3~7 天）
- [ ] 校验器标准化（validate/typecheck/lint/test）
- [ ] 工作流/runner 部署自动化（或明确手动流程+审计）
- [ ] 密钥与安全边界固化（N8N_ENCRYPTION_KEY、API Key 轮换）
- [ ] 产物审计与通知闭环（成功/失败都通知）

---

## 4. P0 阻塞项任务清单（必须做）

### P0-1 单入口（5680）托管与可观测性
- **目标**：5680 的 n8n 进程由 PM2 管理（`n8n-secondary` online），并具备健康检查与日志可读性

### P0-2 导入/部署固定流程工作流（v1）
- **从实例（5680）**：导入并启用
  - `workflows/project/n8n/fixed-flow-pipeline.json`（`POST /webhook/fixed-flow`）
  - `workflows/project/n8n/status-query-workflow.json`（`GET /webhook/status?run_id=...`）
  - （可选）`workflows/project/n8n/dashboard/index.html` 用于可视化查看进度

### P0-3 阶段落盘与可续跑
- **目标**：每次执行落盘到 `workflows/project/logs/automation_runs/<run_id>/...`
  - 关键文件（对齐 `fixedflow-v1-001`）：`00_intake.json`、`01_preflight.json`、`_prompt.md`、`04_execute.json`、`05_validate.json`、`06_git.json`、`07_notify.json`、`status.json`
  - `resume_from_stage` 当前仅用于“跳过 preflight”，完整分段续跑需后续补齐工作流路由

### P0-4 cursor-agent 执行安全护栏（强烈建议）
> 实测：`cursor-agent --print` 具备执行命令/写文件能力，若缺少护栏，可能出现“跑偏/越权/改错文件”的风险。

- **已落盘**：WSL 护栏脚本 `workflows/project/n8n/run-cursor-task.sh`
  - 输入：task_pack_path、role、model
  - 动作：生成 prompt → 执行 cursor-agent → 运行校验器 → `git diff --name-only` 校验只改 Deliverables → 输出回执
- **验收**：若出现非 Deliverables 的改动，脚本直接 fail 并阻断进入“完成”

### P0-5 冒烟任务包（保证“开箱即跑”）
- 选用：`design/ai-native/03_taskpacks/T-0001_c0_z1_dialogue.md`
- 目标：一次跑通 M0

### P0-6 Windows 浏览器/MCP 测试链路（ChromeMCP / Browser MCP）（可选）

- **目标**：当 Windows 侧没有 `cursor-agent` 时，仍能通过 n8n 触发浏览器自动化测试
- **执行器**：`tools/mcp-runner/mcp-runner.mjs` + `tools/mcp-runner/run-agent.ps1`
- **工作流（主实例导入）**：`workflows/project/n8n/windows-mcp-runner-browser-test-workflow.json`
  - Webhook：`POST http://127.0.0.1:5678/webhook/browser-test`
  - body：`{ mcp_url, prompt, task_type:'browser-test', complexity, model_override }`

---

## 4. P1 可用性/工程化任务清单（建议做）

### P1-1 校验入口标准化
- 在 `package.json` 增加 `validate`（或明确 `typecheck/lint/test` 的组合与阈值）
- n8n 的 “Run Validators” 节点统一调用 `npm run validate --if-present`

### P1-2 工作流同步机制（主从一致性）
- **最低可用**：手动导出/导入
- **推荐**：用 Public API + API Key 同步
  - 注意：Public API 的 schema 严格，必须 sanitize payload（只保留 name/nodes/connections/settings/active）

### P1-3 密钥/配置固化
- 固化 `N8N_ENCRYPTION_KEY`（不入库）
- API Key 轮换策略（到期提醒）

### P1-4 审计与通知
- 每次执行将回执/关键信息写入审计目录（如 `workflows/project/logs/` 或 Issue）
- 成功/失败都调用通知接口

---

## 5. P2 扩展（以后再做）
- 队列化分发、多 runner、多机器
- 共享 DB（Postgres）统一状态
- 指标/告警与权限隔离

---

## 6. “正式可跑”的验收标准（Definition of Done）
- [ ] 主/从实例都可一键启动/停止（脚本+PM2）
- [ ] 主→从分发可用（Webhook/表单）
- [ ] 任意 Task Pack 可执行并产出 Deliverables
- [ ] 有护栏：只允许改 Deliverables（自动检测）
- [ ] 校验器可阻断失败
- [ ] 回执+日志可追溯，通知闭环完善


