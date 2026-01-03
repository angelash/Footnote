# n8n AI-Native 工作流

> **推荐先读架构规格**：`docs/02_specs/pipelines/n8n_cursor_cli_pipeline_spec.md`

## 快速开始

### 1. 启动 n8n

**当前默认形态（已选择 C）**：
- **单入口（推荐）**：只使用 **WSL 实例 `5680`** 作为所有 AI-Native 任务入口（执行都在 WSL）
- **Windows 5678（可选）**：后续如需“主从分发 / browser-test”等再启用

```bash
n8n start
```

默认入口（WSL）：http://localhost:5680

**配置为常驻服务**: 参见 [SERVICE-SETUP.md](./SERVICE-SETUP.md)  
**主从集群架构**: 参见 [CLUSTER-SETUP.md](./CLUSTER-SETUP.md)

### 2. 登录信息

首次使用时已创建账号：
- **Email**: `admin@footnote.local`
- **Password**: `Footnote2025!`

### 3. 导入工作流

1. 点击左侧菜单 → **Workflows**
2. 点击右上角 **Import from file**
3. 选择要导入的工作流：
   - `cursor-cli-task-workflow.json` - 使用 Cursor CLI 执行
   - `ai-native-task-workflow.json` - 使用 OpenAI API 执行
   - `windows-mcp-runner-browser-test-workflow.json` - Windows 侧用 MCP Runner 跑 ChromeMCP/Browser MCP（无 cursor-agent）
   - `launcher-l3-writer-to-wsl.json` - 文案执行入口（固定 role=L3_writer，转发到 5680）
   - `launcher-l3-engineer-to-wsl.json` - 程序执行入口（固定 role=L3_engineer，转发到 5680）
   - `factory-intake-workflow.json` - 工厂入口（制作人统一入口：/intake）
   - `factory-run-role-workflow.json` - 工厂入口（通用岗位入口：/run-role）

从实例（WSL 5680）额外导入：
- `taskpack-factory-workflow.json` - 生成 Task Pack（/compose-taskpack）
   
工作流目录（按岗位/工种）：`tools/n8n/WORKFLOW-CATALOG.md`

---

## 工作流说明

### Cursor CLI 版本（推荐）

```
Manual Trigger
    ↓
Set Task Parameters (配置任务路径)
    ↓
Read Task Pack (读取任务包)
    ↓
Build Cursor Prompt (构建提示)
    ↓
Write Prompt File (写入临时文件)
    ↓
Execute Cursor CLI (调用 Cursor)
    ↓
Run Validators (运行校验器)
    ↓
Check Validation (检查结果)
    ↓
┌──────────┐     ┌──────────┐
│ 通过     │     │ 不通过   │
│ 等待审批 │     │ 返工标记 │
└──────────┘     └──────────┘
```

### OpenAI API 版本

类似流程，但使用 OpenAI 节点直接调用 API。

---

## 配置项

### WSL 环境配置（当前使用）

**项目路径**: `/home/shash/work/Footnote`  
**Cursor Agent**: `~/.local/bin/cursor-agent`

### 模型选择（按任务类型）

> 推荐在工作流里通过参数控制（`task_type / complexity / model_override`），并由封装脚本 `tools/n8n/run-cursor-task.sh` 统一选择模型与做变更护栏。

- **doc** → 默认 `gpt-5.2`（复杂/Max → `gpt-5.2-high`）
- **code** → 默认 `opus-4.5`（复杂/Max → `opus-4.5-thinking`）
- **multimodal** → 默认 `gemini-3-pro`
- **model_override**：直接指定 `cursor-agent --model`（例如 `gpt-5.2-high`），填 `auto` 表示走默认映射

### Windows 浏览器/MCP 任务（无 Cursor CLI）

> 约束：Windows 环境没有 `cursor-agent` 时，浏览器测试/ChromeMCP 任务应使用 **独立 MCP Runner**（模型 API 驱动 MCP），而不是 `cursor-agent --browser`。

- MCP Runner：`tools/mcp-runner/mcp-runner.mjs`
- Browser MCP 配置示例：`docs/智绘AI生图自动化演示文案.md`

#### Windows 浏览器测试工作流（Webhook）

（可选）Windows 侧导入并启用：
- `tools/n8n/windows-mcp-runner-browser-test-workflow.json`
  - Webhook：`POST http://127.0.0.1:5678/webhook/browser-test`
  - body 示例：
    - `mcp_url`: MCP server endpoint（默认读取 `$env.MCP_URL`，例：`http://localhost:3000/mcp`）
    - `prompt`: 测试指令（会被自动 base64 传递给 `tools/mcp-runner/run-agent.ps1`）
    - `task_type`: `browser-test`
    - `complexity`: `normal|high|max`
    - `model_override`: 可选，指定 CUSTOM_API 中的 model id

### 修改任务参数

在 **Set Task Parameters** 节点中修改：

| 参数 | 说明 | 示例 |
|------|------|------|
| `task_pack_path` | Task Pack 文件路径 | `docs/03_taskpacks/T-0001.md` |
| `role` | 执行角色 | `L3_writer` |
| `task_type` | 任务类型（用于选模型） | `doc` / `code` / `multimodal` |
| `complexity` | 复杂度（用于选高/Max档） | `normal` / `high` / `max` |
| `model_override` | 显式指定模型（可选） | `auto` / `gpt-5.2-high` |
| `project_root` | 项目根目录（WSL 路径） | `/home/shash/work/Footnote` |
| `wsl_user` | WSL 用户名 | `shash` |

### 主→从分发（Webhook）

（当前选择 C：暂不使用 5678 分发）

入口（5680）：
- `POST http://localhost:5680/webhook/compose-taskpack`
- `POST http://localhost:5680/webhook/execute-task`

冒烟脚本（5680）：
- `tools/n8n/smoke-secondary.ps1`

**重要**: 
- 项目必须在 WSL 文件系统中（`/home/...`），不能在 Windows 挂载点（`/mnt/...`）
- 使用 `cursor-agent` 而不是 `cursor` 命令

### GitHub 集成（可选）

如需创建 Review Issue，设置环境变量：

```bash
# Windows
set N8N_GITHUB_OWNER=your-username
set N8N_GITHUB_REPO=Footnote
set N8N_GITHUB_TOKEN=ghp_xxx

# 或在 n8n 的 Settings → Credentials 中配置 GitHub
```

---

## 使用流程

### 手动执行单个任务

1. 打开 **Cursor CLI Execution** 工作流
2. 修改 **Set Task Parameters** 中的 `task_pack_path`
3. 点击 **Execute workflow** 按钮
4. 查看执行结果

### 批量执行（进阶）

1. 修改触发器为 **Webhook**
2. 使用脚本批量调用：

```bash
curl -X POST http://localhost:5680/webhook/execute-task \
  -H "Content-Type: application/json" \
  -d '{"task_pack_path": "docs/03_taskpacks/T-0001_c0_z1_dialogue.md", "role": "L3_writer", "task_type":"doc", "complexity":"normal", "model_override":"auto"}'
```

---

## 常见问题

### Q: Cursor CLI 不可用？

**WSL 环境**（当前配置）:

```bash
# 在 WSL 中检查 cursor-agent
~/.local/bin/cursor-agent --version

# 如果不存在，检查安装位置
find ~ -name cursor-agent -type f 2>/dev/null
```

**Windows 环境**:

```bash
# 检查 Cursor CLI
cursor --version

# 如果不行，手动添加到 PATH
# Windows: 通常在 %LOCALAPPDATA%\Programs\cursor\
```

### Q: n8n 在 Windows 还是 WSL 中运行？

**如果 n8n 在 Windows 中运行**，需要在工作流的命令前加 `wsl`：

```bash
wsl bash -c "cd /home/shash/work/Footnote && ~/.local/bin/cursor-agent ..."
```

**如果 n8n 在 WSL 中运行**，可以直接执行：

```bash
cd /home/shash/work/Footnote && ~/.local/bin/cursor-agent ...
```

当前工作流配置为**直接在 WSL 中执行**（假设 n8n 在 WSL 中运行）。如果 n8n 在 Windows 中，需要修改 **Execute Cursor CLI** 和 **Run Validators** 节点的命令。

### Q: 如何添加新的校验器？

在 **Run Validators** 节点中修改命令：

```bash
npm run lint && npm run test:unit
```

### Q: 工作流执行失败？

1. 检查 **Logs** 面板查看错误
2. 确认文件路径正确
3. 确认 Cursor/npm 在 PATH 中

---

## 下一步

1. **创建/选择第一个 Task Pack**:
   - 模板：`docs/03_taskpacks/_template.md`
   - 示例：`docs/03_taskpacks/T-0001_c0_z1_dialogue.md`
2. **测试工作流**: 手动执行一次
3. **添加校验器**: 根据项目需求
4. **切换到 Webhook**: 实现自动触发

---

## 文件列表

```
tools/n8n/
├── README.md                      # 本文件
├── ai-native-task-workflow.json   # OpenAI API 版本
└── cursor-cli-task-workflow.json  # Cursor CLI 版本
```



