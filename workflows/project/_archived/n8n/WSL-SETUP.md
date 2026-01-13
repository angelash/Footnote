# n8n 工作流 WSL 环境配置指南

## 环境要求

### 1. WSL 环境
- **用户**: `shash` (根据实际情况修改)
- **项目路径**: `/mnt/f/workspace/github/Footnote` (根据实际情况修改)
- **Cursor Agent**: `~/.local/bin/cursor-agent`

### 2. 项目位置确认

**请确认你的项目在 WSL 中的实际路径：**

```bash
# 在 WSL 中运行
cd ~/work
# 或者
cd ~/projects
# 或者你的项目实际位置

# 确认项目存在
ls -la Footnote/
```

**常见位置：**
- `~/work/Footnote`
- `~/projects/Footnote`
- `~/code/Footnote`
- `~/workspace/Footnote`

### 3. 更新 n8n 工作流配置

在 n8n 工作流的 **"Set Task Parameters"** 节点中，修改以下参数：

| 参数 | 当前值 | 需要修改为 |
|------|--------|-----------|
| `project_root` | `/mnt/f/workspace/github/Footnote` | **你的实际项目路径** |
| `wsl_user` | `shash` | **你的 WSL 用户名** |

### 4. Cursor Agent 命令说明

工作流使用以下命令执行任务：

```bash
cd /mnt/f/workspace/github/Footnote && \
~/.local/bin/cursor-agent \
  --print \
  --force \
  --approve-mcps \
  --output-format text \
  "$(cat .cursor/current_task_prompt.md)"
```

**参数说明：**
- `--print`: 非交互式模式，输出到控制台
- `--force`: 强制允许所有命令执行
- `--approve-mcps`: 自动批准 MCP 服务器
- `--output-format text`: 输出文本格式（便于 n8n 处理）

### 5. n8n 执行环境

**选项 A: n8n 在 WSL 中运行（推荐）**

如果 n8n 在 WSL 中运行，命令可以直接执行，不需要 `wsl` 包装。

**选项 B: n8n 在 Windows 中运行**

如果 n8n 在 Windows 中运行，需要在命令前加 `wsl`：

```bash
wsl bash -c "cd /mnt/f/workspace/github/Footnote && ~/.local/bin/cursor-agent --print --force --approve-mcps \"\$(cat .cursor/current_task_prompt.md)\""
```

### 6. 测试命令

在 WSL 中测试完整流程：

```bash
# 1. 切换到项目目录
cd /mnt/f/workspace/github/Footnote

# 2. 创建测试提示文件
cat > .cursor/current_task_prompt.md << 'EOF'
# Test Task

Please list all files in the docs/03_taskpacks/ directory.
EOF

# 3. 执行 cursor-agent
~/.local/bin/cursor-agent --print --force --approve-mcps --output-format text "$(cat .cursor/current_task_prompt.md)"
```

### 7. 路径映射

| Windows 路径 | WSL 路径 | 说明 |
|-------------|---------|------|
| `F:\workspace\github\Footnote` | `/mnt/f/workspace/github/Footnote` | ❌ 不要使用（Windows 挂载） |
| - | `/mnt/f/workspace/github/Footnote` | ✅ 使用（WSL 文件系统） |

**重要**: 项目必须在 WSL 文件系统中（`/home/...`），不能在 Windows 挂载点（`/mnt/...`）。

---

## 故障排查

### 问题 1: `cursor-agent: command not found`

**解决**:
```bash
# 检查 cursor-agent 是否存在
ls -la ~/.local/bin/cursor-agent

# 如果不存在，检查安装位置
find ~ -name cursor-agent -type f 2>/dev/null

# 添加到 PATH 或使用完整路径
export PATH="$HOME/.local/bin:$PATH"
```

### 问题 2: 项目路径不存在

**解决**:
```bash
# 确认项目实际位置
find ~ -type d -name "Footnote" 2>/dev/null

# 更新 n8n 工作流中的 project_root 参数
```

### 问题 3: 权限问题

**解决**:
```bash
# 确保文件可读
chmod +r .cursor/current_task_prompt.md

# 确保目录可写
chmod +w .cursor/
```

---

*最后更新: 2025-12-30*


