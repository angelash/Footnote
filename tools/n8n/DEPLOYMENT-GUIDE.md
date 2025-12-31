# n8n 集群部署指南

> 本文面向“Windows 主实例 + WSL 从实例”的本地集群方案。
>
> 架构规格请看：`docs/02_specs/pipelines/n8n_cursor_cli_pipeline_spec.md`

## 0. 快速自检（推荐先跑）

```powershell
pm2 status
netstat -ano | findstr ":5678"
wsl bash -c "pm2 status"
netstat -ano | findstr ":5680"
```

---

## 1. 启动主实例（Windows, 5678）

```powershell
# 方式 A：直接启动（不推荐长期用；缺少自动重启/统一管理）
$env:N8N_PORT=5678
$env:N8N_HOST='0.0.0.0'
n8n start

# 方式 B：PM2 托管（推荐）
# 注意：n8n v2 不支持 --port 参数，端口请用环境变量配置
$env:N8N_PORT=5678
$env:N8N_HOST='0.0.0.0'
$env:N8N_PROTOCOL='http'
pm2 delete n8n-primary 2>$null
pm2 start n8n --name n8n-primary -- start
pm2 save
```

访问: http://localhost:5678

---

## 2. 启动从实例（WSL, 5680）

```bash
# 1) 确认 WSL 依赖（如缺失再安装）
wsl bash -c "node --version && npm --version && n8n --version && pm2 --version"

# 2) PM2 托管从实例（推荐）
wsl bash -c "cd /home/shash/work/Footnote && pm2 delete n8n-secondary 2>/dev/null"
wsl bash -c "cd /home/shash/work/Footnote && pm2 start tools/n8n/start-n8n-secondary.sh --name n8n-secondary"
wsl bash -c "cd /home/shash/work/Footnote && pm2 save"
```

访问: http://localhost:5680

---

## 3. 导入工作流（第一次必须）

> 从实例/主实例的工作流目前以 JSON 文件形式存放在仓库，需要在 UI 里导入一次。

1. 打开 n8n UI → Workflows
2. Import from file
3. 选择导入：
   - 从实例（WSL）：`tools/n8n/cursor-cli-task-workflow.json`
   - 主实例（Windows）：`tools/n8n/cursor-cli-task-workflow-windows.json`

---

*最后更新: 2025-12-31*

