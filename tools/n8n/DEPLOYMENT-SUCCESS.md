# ✅ n8n 集群部署成功

**部署时间**: 2025-12-31

---

## 🎉 部署状态

### ✅ Windows 主实例
- **状态**: ✅ **运行中** (online)
- **端口**: 5678
- **PM2 名称**: n8n-primary
- **PID**: 55300
- **内存**: 147.1mb
- **访问地址**: http://localhost:5678

### ✅ WSL 从实例
- **状态**: ✅ **运行中** (online)
- **端口**: 5679
- **PM2 名称**: n8n-secondary
- **PID**: 3358
- **内存**: 53.8mb
- **访问地址**: http://localhost:5679

---

## 📋 访问信息

### 登录凭据
- **Email**: `admin@footnote.local`
- **Password**: `Footnote2025!`

### 访问地址
- **主实例**: http://localhost:5678
- **从实例**: http://localhost:5679

---

## 🔧 管理命令

### 查看状态
```bash
# Windows 主实例
pm2 status

# WSL 从实例
wsl bash -c "cd /home/shash/work/Footnote && pm2 status"
```

### 查看日志
```bash
# Windows 主实例
pm2 logs n8n-primary

# WSL 从实例
wsl bash -c "cd /home/shash/work/Footnote && pm2 logs n8n-secondary"
```

### 重启
```bash
# Windows 主实例
pm2 restart n8n-primary

# WSL 从实例
wsl bash -c "cd /home/shash/work/Footnote && pm2 restart n8n-secondary"
```

### 停止
```bash
# Windows 主实例
pm2 stop n8n-primary

# WSL 从实例
wsl bash -c "cd /home/shash/work/Footnote && pm2 stop n8n-secondary"
```

---

## 🚀 下一步

1. **访问主实例**: http://localhost:5678
   - 导入工作流: `cursor-cli-task-workflow-windows.json`

2. **访问从实例**: http://localhost:5679
   - 导入工作流: `cursor-cli-task-workflow.json`

3. **配置工作流同步**: 参见 `CLUSTER-SETUP.md`

---

## ⚠️ 注意事项

### Windows 主实例启动方式

由于 PM2 在 Windows 上的限制，主实例使用以下方式启动：

```bash
pm2 start "C:\Users\Lenovo\AppData\Roaming\npm\node_modules\n8n\bin\n8n" --name n8n-primary --interpreter node
```

环境变量需要在启动前设置，或使用 `.env` 文件。

### WSL 从实例启动方式

```bash
wsl bash -c "cd /home/shash/work/Footnote && pm2 start n8n --name n8n-secondary -- --port 5679 --host 0.0.0.0"
```

---

*最后更新: 2025-12-31*

