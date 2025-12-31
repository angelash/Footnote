# n8n AI-Native 工作流

## 快速开始

### 1. 启动 n8n

```bash
n8n
```

访问 http://localhost:5678

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

### 修改任务参数

在 **Set Task Parameters** 节点中修改：

| 参数 | 说明 | 示例 |
|------|------|------|
| `task_pack_path` | Task Pack 文件路径 | `docs/03_taskpacks/T-0001.md` |
| `role` | 执行角色 | `L3_writer` |
| `project_root` | 项目根目录（WSL 路径） | `/home/shash/work/Footnote` |
| `wsl_user` | WSL 用户名 | `shash` |

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
curl -X POST http://localhost:5678/webhook/xxx \
  -H "Content-Type: application/json" \
  -d '{"task_pack_path": "docs/03_taskpacks/T-0001.md", "role": "L3_writer"}'
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

1. **创建第一个 Task Pack**: `docs/03_taskpacks/T-0001_example.md`
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



