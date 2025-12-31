# n8n 集群运行状态

**更新时间**: 2025-12-31

---

## ✅ 环境检查

### Windows 环境
- ✅ PM2: 已安装
- ✅ n8n: 已安装
- ✅ 主实例: 已启动（端口 5678）

### WSL 环境
- ✅ Node.js: 已安装
- ✅ PM2: 6.0.14
- ✅ n8n: 2.1.4
- ✅ 从实例: 已启动（端口 5680）

---

## 📊 运行状态

### 主实例 (Windows)
- **端口**: 5678
- **PM2 名称**: n8n-primary
- **访问地址**: http://localhost:5678
- **状态**: ✅ 运行中

### 从实例 (WSL)
- **端口**: 5680
- **PM2 名称**: n8n-secondary
- **访问地址**: http://localhost:5680
- **启动方式**: `pm2 start tools/n8n/start-n8n-secondary.sh --name n8n-secondary`
- **状态**: ✅ 运行中

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

### 重启实例
```bash
# Windows 主实例
pm2 restart n8n-primary

# WSL 从实例
wsl bash -c "cd /home/shash/work/Footnote && pm2 restart n8n-secondary"
```

### 停止实例
```bash
# Windows 主实例
pm2 stop n8n-primary

# WSL 从实例
wsl bash -c "cd /home/shash/work/Footnote && pm2 stop n8n-secondary"
```

---

## 🎯 下一步

1. **访问主实例**: http://localhost:5678
   - 登录: admin@footnote.local / Footnote2025!

2. **访问从实例**: http://localhost:5680
   - 登录: admin@footnote.local / Footnote2025!

3. **导入工作流**:
   - 主实例: 导入 `cursor-cli-task-workflow-windows.json`
   - 从实例: 导入 `cursor-cli-task-workflow.json`

4. **配置工作流同步**: 参见 `CLUSTER-SETUP.md`

---

*最后更新: 2025-12-31*

