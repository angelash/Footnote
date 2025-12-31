# ⚠️ n8n 工作流配置 - 需要你的确认

## 当前状态

✅ **已完成**:
- Cursor Agent 已找到: `~/.local/bin/cursor-agent` (版本 2025.12.17-996666f)
- WSL 环境正常
- n8n 工作流已更新为使用 WSL 路径和 cursor-agent

❌ **需要你确认**:
- **项目在 WSL 中的实际路径**

---

## 请告诉我

### 1. 项目在 WSL 中的实际路径是什么？

请在 WSL 中运行以下命令，找到你的项目：

```bash
# 方法 1: 如果你知道大概位置
find ~ -type d -name "Footnote" 2>/dev/null

# 方法 2: 列出常见项目目录
ls -la ~/work/
ls -la ~/projects/
ls -la ~/code/
ls -la ~/workspace/

# 方法 3: 如果你已经在项目目录中
pwd
```

**请把实际路径告诉我**，例如：
- `/home/shash/work/Footnote`
- `/home/shash/projects/Footnote`
- `/home/shash/code/Footnote`
- 或其他路径

### 2. 如果项目还没有在 WSL 中拉取

如果你需要在 WSL 中重新拉取项目：

```bash
# 进入工作目录
cd ~/work  # 或你喜欢的目录

# 克隆项目（如果使用 Git）
git clone <your-repo-url> Footnote

# 或者从 Windows 复制（不推荐，可能有权限问题）
# 建议直接在 WSL 中 git clone
```

---

## 更新 n8n 工作流

一旦你确认了项目路径，我需要更新以下文件：

1. **`tools/n8n/cursor-cli-task-workflow.json`**
   - 修改 `project_root` 参数为你的实际路径

2. **重新导入工作流到 n8n**

---

## 当前工作流配置

工作流已更新为：

- ✅ 使用 `cursor-agent` 而不是 `cursor`
- ✅ 使用 WSL 文件系统路径（不是 `/mnt/`）
- ✅ 命令格式：`~/.local/bin/cursor-agent --print --force --approve-mcps`

**只需要你提供项目路径即可！**

---

*等待你的确认...*


