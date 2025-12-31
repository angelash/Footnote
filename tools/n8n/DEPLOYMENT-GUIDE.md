# n8n 集群部署指南

## 当前部署状态

### ✅ Windows 环境
- Node.js v22.15.0 ✓
- npm 11.6.2 ✓
- PM2 ✓
- n8n ✓

### ⏳ WSL 环境
- Node.js - **需要安装**
- PM2 - 等待 Node.js
- n8n - 等待 Node.js

---

## 快速启动（临时方案）

### Windows 主实例

```powershell
# 设置环境变量并启动
$env:N8N_PORT=5678
$env:N8N_HOST='0.0.0.0'
$env:N8N_BASIC_AUTH_ACTIVE='true'
$env:N8N_BASIC_AUTH_USER='admin@footnote.local'
$env:N8N_BASIC_AUTH_PASSWORD='Footnote2025!'
n8n start
```

访问: http://localhost:5678

### WSL 从实例（需要先安装 Node.js）

```bash
# 1. 安装 Node.js
wsl bash -c "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs"

# 2. 安装 PM2 和 n8n
wsl bash -c "cd /home/shash/work/Footnote && npm install -g pm2 n8n"

# 3. 启动从实例
wsl bash -c "cd /home/shash/work/Footnote && N8N_PORT=5680 N8N_HOST=0.0.0.0 n8n start"
```

访问: http://localhost:5680

---

## PM2 配置（待修复）

当前 PM2 配置文件有问题，需要修复后才能使用。

**临时方案**: 直接使用 `n8n start` 命令启动。

---

*最后更新: 2025-12-31*

