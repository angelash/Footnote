# n8n 主从 + Cursor CLI（cursor-agent）落地推进计划（Rollout Plan）

> 本计划用于把“主从 n8n + Task Pack + Cursor CLI 执行”从**可用**推进到**可持续规模化提需求**。
>
> 架构规格：`docs/02_specs/pipelines/n8n_cursor_cli_pipeline_spec.md`

---

## 0. 现状快照（2025-12-31）

- **主实例（Windows 5678）**：端口已监听，UI 可访问；但当前是 `n8n start` 直接启动，`pm2 status` 中 `n8n-primary` 可能为 stopped（状态漂移风险）。
- **从实例（WSL 5680）**：`pm2 status` 显示 `n8n-secondary` online；WSL 工具链可用（Node/n8n/PM2）。
- **Task Pack**：仓库已有 `docs/03_taskpacks/_template.md` 与示例 `T-0001_c0_z1_dialogue.md`。
- **工作流导入文件**：`tools/n8n/*.json` 已准备；默认 Task Pack 路径已修正为存在的示例文件。

---

## 1. 需要先确认的决策（P0-Decision）

### D1：执行副本策略（必须二选一）
- **A（推荐）只跑 WSL 副本**：自动化执行只在 `/home/shash/work/Footnote` 上发生；Windows 主实例仅做分发/看板
  - 优点：最简单，少路径/同步坑
  - 缺点：需要你接受“最终产物以 WSL 副本为准”，并有一套回到 Windows 的同步/提交方式
- **B 双副本同步**：Windows 工作区（F:\）与 WSL 工作副本自动同步
  - 优点：Windows IDE 与自动化执行保持一致
  - 缺点：需要明确同步工具、冲突策略、权限与性能（高复杂度）

**本计划默认采用 A**。若你选 B，需要在 P0 增加“同步机制落地”并调整后续步骤。

---

## 1.1 模型选择策略（落地约定）

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

## 1.2 MCP/ChromeMCP 策略（落地约定）

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

## 2. 里程碑（Milestones）

### M0：跑通一次端到端（E2E）冒烟（目标：今天）
- [ ] 主/从实例可访问
- [ ] 从实例导入 `cursor-cli-task-workflow.json`
- [ ] 指定 `task_pack_path=docs/03_taskpacks/T-0001_c0_z1_dialogue.md` 执行一次
- [ ] cursor-agent 产出 Deliverables（按 Task Pack）
- [ ] 跑校验器并产生 PASS/FAIL
- [ ] 输出回执 + 可追踪日志

### M1：可持续提需求（目标：1~2 天）
- [ ] 主实例提供统一入口（Webhook/手动表单）→ 分发到从实例执行
- [ ] 参数与回执格式标准化
- [ ] “失败可重跑/可定位”闭环跑通

### M2：工程化规模化（目标：3~7 天）
- [ ] 校验器标准化（validate/typecheck/lint/test）
- [ ] 工作流同步自动化（或明确手动流程+审计）
- [ ] 密钥与安全边界固化（N8N_ENCRYPTION_KEY、API Key 轮换）
- [ ] 产物审计与通知闭环（成功/失败都通知）

---

## 3. P0 阻塞项任务清单（必须做）

### P0-1 统一主实例托管（消除漂移）
- **目标**：5678 的 n8n 进程由 PM2 管理（`n8n-primary` online）
- **交付**：
  - `pm2 status` 显示 `n8n-primary` online
  - `netstat :5678` 的 PID 对应 PM2 托管进程
- **建议动作**：
  - 停掉当前手动 `n8n start` 进程
  - 用 `pm2 start n8n --name n8n-primary -- start` 启动（端口用环境变量）

### P0-2 导入工作流（主/从）
- **从实例**：导入 `tools/n8n/cursor-cli-task-workflow.json`
- **主实例**：导入 `tools/n8n/cursor-cli-task-workflow-windows.json`（如果主实例要直接桥接 WSL）

### P0-3 增加“主→从分发”工作流（建议）
- **主实例**：提供一个 Webhook（或表单）接收 `{task_pack_path, role, model?}` → 转发到从实例 Webhook
- **从实例**：提供一个 Webhook 版本执行工作流（替代 Manual Trigger）

### P0-4 cursor-agent 执行安全护栏（强烈建议）
> 实测：`cursor-agent --print` 具备执行命令/写文件能力，若缺少护栏，可能出现“跑偏/越权/改错文件”的风险。

- **建议封装**：新增一个 WSL 脚本（示例）`tools/n8n/run-cursor-task.sh`
  - 输入：task_pack_path、role、model
  - 动作：生成 prompt → 执行 cursor-agent → 运行校验器 → `git diff --name-only` 校验只改 Deliverables → 输出回执
- **验收**：若出现非 Deliverables 的改动，脚本直接 fail 并阻断进入“完成”

### P0-5 冒烟任务包（保证“开箱即跑”）
- 选用：`docs/03_taskpacks/T-0001_c0_z1_dialogue.md`
- 目标：一次跑通 M0

### P0-6 Windows 浏览器/MCP 测试链路（ChromeMCP / Browser MCP）

- **目标**：当 Windows 侧没有 `cursor-agent` 时，仍能通过 n8n 触发浏览器自动化测试
- **执行器**：`tools/mcp-runner/mcp-runner.mjs` + `tools/mcp-runner/run-agent.ps1`
- **工作流（主实例导入）**：`tools/n8n/windows-mcp-runner-browser-test-workflow.json`
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
- 每次执行将回执/关键信息写入审计目录（如 `docs/05_logs/` 或 Issue）
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


