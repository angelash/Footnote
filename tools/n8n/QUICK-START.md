# n8n 集群快速启动指南

## 当前状态

✅ **WSL 从实例**: 运行中（端口 5680）  
⚠️ **Windows 主实例**: 5678 端口已监听，但建议统一纳入 PM2 托管（避免状态漂移）

---

## 快速启动命令

### Windows 主实例

```powershell
# 注意：n8n v2 不支持 --port 参数，端口/host 用环境变量配置
$env:N8N_PORT=5678
$env:N8N_HOST='0.0.0.0'
$env:N8N_PROTOCOL='http'

pm2 delete n8n-primary 2>$null
pm2 start n8n --name n8n-primary -- start
pm2 save
```

### WSL 从实例

```bash
wsl bash -c "cd /home/shash/work/Footnote && pm2 delete n8n-secondary 2>/dev/null"
wsl bash -c "cd /home/shash/work/Footnote && pm2 start tools/n8n/start-n8n-secondary.sh --name n8n-secondary"
wsl bash -c "cd /home/shash/work/Footnote && pm2 save"
```

---

## 访问地址

- **主实例**: http://localhost:5678
- **从实例**: http://localhost:5680

**登录信息**:
- Email: `admin@footnote.local`
- Password: `Footnote2025!`

---

## 查看状态

```bash
# Windows 主实例
pm2 status

# WSL 从实例
wsl bash -c "cd /home/shash/work/Footnote && pm2 status"
```

---

*最后更新: 2025-12-31*

