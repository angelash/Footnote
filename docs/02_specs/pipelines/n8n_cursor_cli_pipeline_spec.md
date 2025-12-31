# n8n 主从（Windows + WSL）+ Cursor CLI（cursor-agent）AI-Native 任务执行架构规格

> 面向《备注 / Footnote》研发的**本地自动化执行架构**：用 n8n 管理任务流转，用 Task Pack 约束输入输出，用 Cursor CLI（`cursor-agent`）在仓库内完成改动，并用校验器与人工审批保证质量。

> 推进计划：`docs/02_specs/pipelines/n8n_cursor_cli_rollout_plan.md`

---

## 1. 目标与范围

### 1.1 目标（What）
- **结构化提需求**：把“需求”落到 `docs/03_taskpacks/*.md` 的 Task Pack（约束输入/输出/验收）。
- **可自动执行**：n8n 读取 Task Pack → 生成最小上下文 → 调用 `cursor-agent` 执行 → 跑校验器 → 输出回执。
- **可审计可回滚**：每次执行都有日志、回执、产物路径可追踪；失败能定位、可重跑。
- **主从分工**：Windows 主实例负责 UI/调度/分发；WSL 从实例负责 Linux/WSL 侧执行（`cursor-agent`、Git、工具链）。

### 1.2 非目标（Not now）
- 生产级 HA/多机集群、统一共享数据库（Postgres）并发队列（可作为后续 P1/P2）。
- “自动提交 PR / 自动合并”默认不启用（先做人工 Review 闭环）。

---

## 2. 架构总览

### 2.1 组件图（逻辑）
```
                    ┌───────────────────────────────┐
                    │ Windows: n8n-primary (5678)    │
                    │ - UI / Scheduler / Dispatcher  │
                    └───────────────┬───────────────┘
                                    │ (HTTP/Webhook 或手动)
                                    ▼
                    ┌───────────────────────────────┐
                    │ WSL: n8n-secondary (5680)      │
                    │ - Runner / ExecuteCommand      │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ WSL: cursor-agent CLI          │
                    │ - 读 Task Pack 允许输入         │
                    │ - 写 Deliverables 交付物        │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │ Repo (WSL 工作副本)             │
                    │ /home/shash/work/Footnote       │
                    └───────────────────────────────┘
```

### 2.2 关键前提（强约束）
- **执行副本在 WSL 文件系统**：从实例与 `cursor-agent` 默认以 `/home/shash/work/Footnote` 作为执行根目录（避免 `/mnt/*` 的性能与权限问题）。
- **Task Pack 是“契约”**：执行者只读 Allowed Inputs、只写 Deliverables；冻结目录（`docs/00_charter/`、`docs/01_bibles/`）不可修改。
- **主从不是“自动共享状态”**：除非显式配置共享 DB / 同步机制，否则主从实例的工作流与凭据互相独立。

---

## 3. 数据模型与工件（Artifacts）

### 3.1 Task Pack（输入契约）
- **位置**：`docs/03_taskpacks/*.md`
- **模板**：`docs/03_taskpacks/_template.md`
- **示例**：`docs/03_taskpacks/T-0001_c0_z1_dialogue.md`

Task Pack 必须包含：
- **Allowed Inputs**：允许读取的文件列表
- **Deliverables**：必须输出的目标路径
- **Constraints / Acceptance Checklist / 回执格式**

### 3.2 n8n 工作流定义（可导入）
- **WSL 从实例（直接执行）**：`tools/n8n/cursor-cli-task-workflow.json`
- **Windows 主实例（桥接 WSL）**：`tools/n8n/cursor-cli-task-workflow-windows.json`
- **OpenAI API 版本（可选）**：`tools/n8n/ai-native-task-workflow.json`

> 注意：这些 JSON 是“导入文件格式”，并不等价于 n8n Public API 的 create/update payload（字段更严格）。

---

## 4. 工作流程（Workflow）

### 4.1 标准执行链路（Cursor CLI 版本）
1. **Trigger**：Manual / Webhook / Schedule
2. **Set Task Parameters**：设置 `task_pack_path`、`role`、`project_root`
3. **Read Task Pack**：读 Task Pack 文本
4. **Build Prompt / Minimal Context**：生成给 `cursor-agent` 的最小提示（包含“只能读/写哪些文件”的硬约束）
5. **Execute Cursor CLI**：运行 `cursor-agent`（建议 `--approve-mcps --force` 等无人值守参数）
6. **Run Validators**：跑 `npm run validate` / `npm run typecheck` / `npm test` 等
7. **Check Validation / Human Review**：校验通过进入待审；失败进入返工
8. **Notify（可选）**：向通知接口/Issue 系统推送结果

### 4.2 主从联动（推荐形态）
**推荐策略**：主实例只做“分发”，执行全部落在从实例。
- 主实例 workflow：接收需求（Webhook/手动）→ 校验参数 → 调用从实例 Webhook
- 从实例 workflow：真正读文件、写产物、跑 `cursor-agent`、跑校验器、回执与通知

这样可以避免 Windows/WSL 路径转换与文件同步的复杂度。

---

## 5. 运行与配置（Ops）

### 5.1 端口与实例
- **主实例**：`http://localhost:5678`
- **从实例**：`http://localhost:5680`

### 5.2 账号/认证
- n8n 本身的登录账号（Owner）用于 UI 登录。
- n8n Public API 使用 **API Key**（Settings → n8n API 创建），该 Key **与 Cursor 登录无关**。

### 5.4 Cursor CLI（cursor-agent）能力与模型选择

- **是否能读取工程文件**：能（运行在仓库目录内，可通过工具/命令读取文件）。
- **是否能修改工程代码**：能（`--print` headless 模式“Has access to all tools, including write and bash”，需额外护栏）。
- **是否能指定模型**：能，支持 `--model <model>`；可用模型以运行时为准（`cursor-agent --help` 会提示示例；错误时会返回可用列表）。
- **是否需要封装**：强烈建议封装（见 Rollout Plan 的 P0-4）。
  - 理由：cursor-agent 具备执行命令/写文件能力，必须用“Deliverables 白名单校验 + git diff 审计 + 校验器阻断”防止跑偏/越权改动。

### 5.3 关键环境变量（建议）
最低限建议：
- `N8N_PORT`, `N8N_HOST`, `N8N_PROTOCOL`
- `NODE_ENV=production`

强烈建议补齐（避免“凭据不可解密/迁移后失效”）：
- `N8N_ENCRYPTION_KEY`：固定且只在本机安全保存，不要提交到 Git

---

## 6. 当前工程状态盘点（2025-12-31）

### 6.1 运行态（实际检测）
- **Windows 5678**：端口已监听，进程为 `node.exe ... n8n start`（当前不在 PM2 管理之下；PM2 中 `n8n-primary` 处于 stopped）。
- **WSL 5680**：`pm2 status` 显示 `n8n-secondary` online；从实例 UI 可用，Owner 已完成初始化。
- **WSL 工具链**：Node `v22.21.0` / npm `10.9.4` / n8n `2.1.4` / pm2 `6.0.14`。

### 6.2 仓库工件一致性问题（已发现）
- 工作流 JSON / 文档默认引用 `docs/03_taskpacks/T-0001_example.md`，但仓库实际存在的是 `T-0001_c0_z1_dialogue.md`（需要修正默认值或补齐示例文件）。
- 多份部署文档对“WSL 是否已安装 Node/n8n/PM2”“启动命令是否使用 `--port` 参数”等描述不一致（需要统一）。

---

## 7. 距离“正式可跑”的剩余事项（按优先级）

### P0（阻塞项：不做就无法稳定按设计推进）
1. **统一“执行副本”策略**（必须决策）
   - 选项 A：所有自动化只跑 WSL 副本（推荐，最简单）
   - 选项 B：Windows 与 WSL 双副本自动同步（需要明确 git/rsync/镜像策略）
2. **修正工作流默认 Task Pack 路径**：确保导入后“开箱即跑”。
3. **主实例纳入 PM2 管理**：避免“端口在但 PM2 显示 stopped”的漂移；并写清楚如何停掉手动启动的 `n8n start`。
4. **把“触发执行”标准化成 Webhook**：主实例 → 从实例的 dispatch workflow 落地。
5. **跑通一次 E2E 冒烟**：
   - 从实例读取一个 Task Pack
   - `cursor-agent` 能执行并落盘 Deliverables
   - 校验器能跑并产生 PASS/FAIL
   - 输出回执格式正确

### P1（可用性/工程化：做完后可规模化提需求）
1. **校验器标准化**：在 `package.json` 增加 `validate` 统一入口（typecheck/lint/test 分级）。
2. **工作流同步机制**：
   - 手动导入（最低可用）
   - 或用 n8n API Key + “sanitize workflow JSON”脚本实现一键同步（推荐）
3. **安全与密钥管理**：`N8N_ENCRYPTION_KEY` 固化、API Key 过期/轮换策略、禁止把 token 写入仓库。
4. **产物与审计**：输出统一落到 `docs/05_logs/` 或 PR/Issue 维度日志。
5. **通知闭环**：把“完成通知接口”做成工作流最后一步（成功/失败都通知）。

### P2（扩展/性能/治理）
1. 多 Runner（多台 WSL/多实例）与队列化分发
2. 共享数据库（Postgres）与统一账号/凭据
3. 细粒度权限隔离（不同角色不同 Allowed Inputs 白名单）
4. 指标与告警（执行耗时、失败率、资源占用）

---

## 8. 验收标准（定义“能正式跑起来”）
- [ ] 主/从实例都可一键启动/停止（脚本 + PM2）
- [ ] 任意一个 Task Pack 可由主实例分发到从实例执行
- [ ] `cursor-agent` 在无人值守模式下可稳定执行并修改仓库
- [ ] 校验器可运行并阻断失败产物进入“完成”
- [ ] 产出回执 + 日志可追溯
- [ ] 完成通知可达（成功/失败都有）



