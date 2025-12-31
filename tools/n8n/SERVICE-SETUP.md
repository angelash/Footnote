# n8n 常驻服务配置指南

## 当前状态

**当前配置**: 手动启动  
**启动方式**: `n8n` 命令  
**访问地址**: http://localhost:5678

---

## 配置为系统服务（推荐）

### 方案 1: 使用 systemd（WSL/Linux）

#### 1. 创建服务文件

```bash
sudo nano /etc/systemd/system/n8n.service
```

#### 2. 服务配置内容

```ini
[Unit]
Description=n8n workflow automation
After=network.target

[Service]
Type=simple
User=shash
WorkingDirectory=/home/shash/work/Footnote
Environment="NODE_ENV=production"
Environment="N8N_BASIC_AUTH_ACTIVE=true"
Environment="N8N_BASIC_AUTH_USER=admin@footnote.local"
Environment="N8N_BASIC_AUTH_PASSWORD=Footnote2025!"
ExecStart=/mnt/c/Users/Lenovo/AppData/Roaming/npm/n8n start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 3. 启用并启动服务

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用服务（开机自启）
sudo systemctl enable n8n

# 启动服务
sudo systemctl start n8n

# 查看状态
sudo systemctl status n8n

# 查看日志
sudo journalctl -u n8n -f
```

#### 4. 常用命令

```bash
# 启动
sudo systemctl start n8n

# 停止
sudo systemctl stop n8n

# 重启
sudo systemctl restart n8n

# 查看状态
sudo systemctl status n8n

# 查看日志
sudo journalctl -u n8n -n 50
```

---

### 方案 2: 使用 PM2（Node.js 进程管理器）

#### Windows 环境（当前架构）

**架构说明**：
- PM2 在 Windows 上管理 n8n
- n8n 在 Windows 上运行
- cursor-agent 在 WSL 中运行（通过 `wsl` 命令调用）

#### 1. 在 Windows 上安装 PM2

```bash
# 在 Windows PowerShell 或 CMD 中
npm install -g pm2
```

#### 2. 创建启动脚本（Windows）

```powershell
# 在项目根目录创建 start-n8n.bat
@echo off
cd /d F:\workspace\github\Footnote
n8n start
```

或者使用 PowerShell 脚本：

```powershell
# start-n8n.ps1
Set-Location F:\workspace\github\Footnote
n8n start
```

#### 3. 使用 PM2 启动（Windows）

```bash
# 启动 n8n
pm2 start n8n --name n8n

# 或者使用脚本
pm2 start start-n8n.bat --name n8n --interpreter cmd

# 保存配置
pm2 save

# 配置开机自启（需要管理员权限）
pm2 startup
# 按照提示执行生成的命令

# 查看状态
pm2 status

# 查看日志
pm2 logs n8n

# 停止
pm2 stop n8n

# 重启
pm2 restart n8n
```

#### 4. 工作流配置

**重要**：如果 n8n 在 Windows 上运行，需要使用 `cursor-cli-task-workflow-windows.json`：

- 文件读取使用 Windows 路径：`F:/workspace/github/Footnote`
- 命令执行使用 WSL 路径：`/home/shash/work/Footnote`
- 所有命令前加 `wsl` 前缀

#### WSL 环境（备选方案）

如果选择在 WSL 中运行 n8n：

```bash
# 在 WSL 中安装 PM2
npm install -g pm2

# 创建启动脚本
cat > tools/n8n/start-n8n.sh << 'EOF'
#!/bin/bash
cd /home/shash/work/Footnote
n8n start
EOF

chmod +x tools/n8n/start-n8n.sh

# 使用 PM2 启动
pm2 start tools/n8n/start-n8n.sh --name n8n
pm2 save
pm2 startup
```

---

### 方案 3: 使用 screen/tmux（简单方案）

#### 使用 screen

```bash
# 创建 screen 会话
screen -S n8n

# 在 screen 中启动 n8n
n8n

# 按 Ctrl+A 然后 D 退出（n8n 继续运行）

# 重新连接
screen -r n8n
```

#### 使用 tmux

```bash
# 创建 tmux 会话
tmux new -s n8n

# 在 tmux 中启动 n8n
n8n

# 按 Ctrl+B 然后 D 退出（n8n 继续运行）

# 重新连接
tmux attach -t n8n
```

---

## 环境变量配置

如果需要配置环境变量，可以创建 `.env` 文件：

```bash
# 在项目根目录
cat > .env.n8n << 'EOF'
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin@footnote.local
N8N_BASIC_AUTH_PASSWORD=Footnote2025!
N8N_PORT=5678
N8N_HOST=0.0.0.0
EOF
```

然后在服务配置中加载：

```ini
EnvironmentFile=/home/shash/work/Footnote/.env.n8n
```

---

## 推荐方案

**推荐使用 PM2**，因为：
- ✅ 简单易用
- ✅ 自动重启
- ✅ 日志管理
- ✅ 进程监控
- ✅ 开机自启

---

## 检查服务状态

```bash
# systemd
sudo systemctl status n8n

# PM2
pm2 status

# 检查端口
netstat -tuln | grep 5678
# 或
ss -tuln | grep 5678
```

---

*最后更新: 2025-12-31*

