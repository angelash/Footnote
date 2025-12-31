# WSL 环境测试报告

**测试时间**: 2025-12-30  
**测试环境**: WSL Ubuntu 24.04  
**用户**: shash

---

## ✅ 测试结果

### 1. 项目路径
- **路径**: `/home/shash/work/Footnote`
- **状态**: ✅ 存在且可访问
- **Git 仓库**: `git@github.com:angelash/Footnote.git`
- **Git 操作**: ✅ pull/push 正常

### 2. Cursor Agent
- **路径**: `~/.local/bin/cursor-agent`
- **版本**: `2025.12.17-996666f`
- **状态**: ✅ 可用

### 3. 工作流配置
- **项目路径**: `/home/shash/work/Footnote` ✅
- **命令格式**: `~/.local/bin/cursor-agent --print --force --approve-mcps` ✅
- **文件操作**: ✅ 可以读取任务包文件

### 4. Git 测试
```bash
$ cd /home/shash/work/Footnote
$ git pull
# 成功拉取最新代码
$ git status
# On branch main
# Your branch is up to date with 'origin/main'.
# nothing to commit, working tree clean
```

---

## 📋 工作流配置

### n8n 工作流参数

在 **Set Task Parameters** 节点中：

| 参数 | 值 | 说明 |
|------|-----|------|
| `project_root` | `/home/shash/work/Footnote` | WSL 文件系统路径 |
| `wsl_user` | `shash` | WSL 用户名 |
| `task_pack_path` | `docs/03_taskpacks/T-0001_c0_z1_dialogue.md` | 任务包路径 |
| `role` | `L3_writer` | 执行角色 |

### 执行命令

**Execute Cursor CLI** 节点：
```bash
bash -c 'cd /home/shash/work/Footnote && ~/.local/bin/cursor-agent --print --force --approve-mcps --output-format text "$(cat .cursor/current_task_prompt.md)"'
```

**Run Validators** 节点：
```bash
bash -c 'cd /home/shash/work/Footnote && npm run validate --if-present 2>&1 || echo "No validator configured"'
```

---

## ⚠️ 注意事项

### 1. n8n 运行环境

**如果 n8n 在 Windows 中运行**，需要在命令前加 `wsl`：

```bash
wsl bash -c 'cd /home/shash/work/Footnote && ~/.local/bin/cursor-agent ...'
```

**如果 n8n 在 WSL 中运行**（推荐），当前配置即可直接使用。

### 2. Cursor API Key

`cursor-agent` 需要 API key 才能执行任务。可以通过：

- 环境变量: `CURSOR_API_KEY`
- 命令行参数: `--api-key <key>`

### 3. 文件路径

- ✅ **使用**: `/home/shash/work/Footnote` (WSL 文件系统)
- ❌ **不使用**: `/mnt/f/workspace/github/Footnote` (Windows 挂载点)

---

## 🚀 下一步

1. ✅ 工作流配置已更新
2. ⏳ 在 n8n 中导入更新后的工作流
3. ⏳ 测试执行一个真实任务
4. ⏳ 配置 Cursor API Key（如需要）

---

*测试完成时间: 2025-12-30*

