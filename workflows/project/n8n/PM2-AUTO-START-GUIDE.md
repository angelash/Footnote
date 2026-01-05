# PM2 开机自启动配置指南

> 本文档说明如何在 WSL 中配置 PM2 开机自启动，确保重启 WSL 后 n8n 自动启动。

## 背景

PM2 进程管理器可以保存进程列表，但默认不会在系统启动时自动恢复。需要配置 systemd 服务来实现开机自启动。

## 前置条件

- ✅ WSL 中已安装 PM2：`npm install -g pm2`
- ✅ WSL 中已安装 n8n：`npm install -g n8n`
- ✅ PM2 进程已配置并运行：`pm2 list` 能看到 `n8n-secondary` 和 `wsl-cursor-runner`
- ✅ PM2 进程已保存：`pm2 save` 已执行

## 配置步骤

### 步骤 1：确认当前状态

```bash
cd /home/shash/work/Footnote

# 检查 PM2 进程状态
pm2 list

# 确保进程已保存
pm2 save
```

应该看到：
- `n8n-secondary` - 状态：online
- `wsl-cursor-runner` - 状态：online

### 步骤 2：配置 systemd 自启动

**重要**：由于 WSL 的 PATH 环境变量可能包含 Windows 路径（如 `C:\Program Files\NVIDIA`），路径中的空格会导致命令解析失败。

**推荐方式**（直接指定完整路径，避免 PATH 问题）：

```bash
sudo /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u shash --hp /home/shash
```

**如果遇到 PATH 问题**（如 `env: 'Files/NVIDIA': No such file or directory`），使用以下方式：

```bash
# 方式 1：使用干净的 Linux PATH
sudo env PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/lib/node_modules/pm2/bin:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u shash --hp /home/shash

# 方式 2：先清理 PATH，再执行
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
sudo env PATH=$PATH /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u shash --hp /home/shash
```

### 步骤 3：验证配置

```bash
# 检查服务文件是否创建
ls -la /etc/systemd/system/pm2-shash.service

# 检查服务是否已启用
systemctl is-enabled pm2-shash.service
# 应该输出：enabled

# 查看服务状态
sudo systemctl status pm2-shash.service
```

### 步骤 4：确保进程已保存

```bash
cd /home/shash/work/Footnote
pm2 save
```

## 配置说明

执行 `pm2 startup` 后，会创建 systemd 服务文件 `/etc/systemd/system/pm2-shash.service`，内容如下：

```ini
[Unit]
Description=PM2 process manager
Documentation=https://pm2.keymetrics.io/
After=network.target

[Service]
Type=forking
User=shash
LimitNOFILE=infinity
LimitNPROC=infinity
LimitCORE=infinity
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin
Environment=PM2_HOME=/home/shash/.pm2
PIDFile=/home/shash/.pm2/pm2.pid
Restart=on-failure

ExecStart=/usr/lib/node_modules/pm2/bin/pm2 resurrect
ExecReload=/usr/lib/node_modules/pm2/bin/pm2 reload all
ExecStop=/usr/lib/node_modules/pm2/bin/pm2 kill

[Install]
WantedBy=multi-user.target
```

**关键点**：
- `ExecStart`：系统启动时执行 `pm2 resurrect`，自动恢复保存的进程
- `Restart=on-failure`：进程失败时自动重启
- `User=shash`：以 shash 用户运行

## 验证自启动

### 方法 1：重启 WSL 测试

```bash
# 在 Windows PowerShell 中
wsl --shutdown

# 重新打开 WSL 后检查
pm2 list
# 应该能看到 n8n-secondary 和 wsl-cursor-runner 自动启动
```

### 方法 2：手动测试服务

```bash
# 停止 PM2 进程
pm2 stop all

# 手动触发服务启动（模拟系统启动）
sudo systemctl start pm2-shash.service

# 检查进程是否恢复
pm2 list
```

## 常见问题

### 问题 1：PATH 环境变量包含 Windows 路径

**错误信息**：
```
env: 'Files/NVIDIA': No such file or directory
```

**原因**：WSL 的 PATH 环境变量包含 Windows 路径（如 `C:\Program Files\NVIDIA`），路径中的空格导致命令解析失败。

**解决方案**：
- 使用完整路径：`sudo /usr/lib/node_modules/pm2/bin/pm2 startup ...`
- 或使用干净的 Linux PATH：`sudo env PATH=/usr/local/sbin:/usr/local/bin:... pm2 startup ...`

### 问题 2：服务未自动启动

**检查项**：
1. 确认服务已启用：`systemctl is-enabled pm2-shash.service` 应该输出 `enabled`
2. 确认进程已保存：`pm2 save` 已执行
3. 检查服务日志：`sudo journalctl -u pm2-shash.service -n 50`

### 问题 3：PM2 进程未恢复

**可能原因**：
- `~/.pm2/dump.pm2` 文件不存在或损坏
- 进程配置中的路径不正确

**解决方案**：
```bash
# 重新保存进程
pm2 save

# 检查保存文件
cat ~/.pm2/dump.pm2 | grep -E '"name"|"autostart"'

# 手动测试恢复
pm2 resurrect
```

## 管理命令

### 启用/禁用自启动

```bash
# 启用自启动
sudo systemctl enable pm2-shash.service

# 禁用自启动
sudo systemctl disable pm2-shash.service
```

### 移除自启动配置

```bash
pm2 unstartup systemd
```

### 查看服务状态

```bash
# 查看服务状态
sudo systemctl status pm2-shash.service

# 查看服务日志
sudo journalctl -u pm2-shash.service -f
```

## 相关文档

- PM2 官方文档：https://pm2.keymetrics.io/docs/usage/startup/
- 项目 n8n 配置：`workflows/project/n8n/CLUSTER-SETUP.md`
- 快速启动指南：`workflows/project/n8n/QUICK-START.md`

## 配置记录

- **配置日期**：2025-01-05
- **配置用户**：shash
- **WSL 路径**：/home/shash/work/Footnote
- **服务文件**：/etc/systemd/system/pm2-shash.service
- **PM2 数据目录**：/home/shash/.pm2

---

*最后更新：2025-01-05*

