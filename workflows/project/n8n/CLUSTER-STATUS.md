# n8n 集群运行状态

**更新时间**: 2025-12-31

---

## ✅ 环境检查

### Windows 环境
- ✅ PM2: 已安装
- ✅ n8n: 已安装
- 🟡 5678: 可选（当前不作为核心任务入口）

### WSL 环境
- ✅ Node.js: 已安装
- ✅ PM2: 6.0.14
- ✅ n8n: 2.1.4
- ✅ 单入口实例: 已启动（端口 5680）
- ✅ WSL Runner: 已启动（`wsl-cursor-runner`，端口 3210）

---

## 📊 运行状态

### 单入口实例 (WSL)
- **端口**: 5680
- **PM2 名称**: n8n-secondary
- **访问地址**: http://localhost:5680
- **启动方式**: `pm2 start workflows/project/n8n/start-n8n-secondary.sh --name n8n-secondary`
- **状态**: ✅ 运行中

### WSL 执行器 (Runner)
- **端口**: 3210
- **PM2 名称**: wsl-cursor-runner
- **健康检查**: http://localhost:3210/health

---

## 🔧 管理命令

### 查看状态
```bash
# WSL
wsl bash -c "cd /home/shash/work/Footnote && pm2 status"
```

### 查看日志
```bash
# WSL
wsl bash -c "cd /home/shash/work/Footnote && pm2 logs n8n-secondary"
wsl bash -c "cd /home/shash/work/Footnote && pm2 logs wsl-cursor-runner"
```

### 重启实例
```bash
# WSL
wsl bash -c "cd /home/shash/work/Footnote && pm2 restart n8n-secondary --update-env"
wsl bash -c "cd /home/shash/work/Footnote && pm2 restart wsl-cursor-runner --update-env"
```

### 停止实例
```bash
# WSL
wsl bash -c "cd /home/shash/work/Footnote && pm2 stop n8n-secondary"
wsl bash -c "cd /home/shash/work/Footnote && pm2 stop wsl-cursor-runner"
```

---

## 🎯 下一步

1. **访问单入口实例**: http://localhost:5680
   - 登录: admin@footnote.local / Footnote2025!

2. **端到端冒烟**:
   - Windows：运行 `workflows/project/n8n/smoke-secondary.ps1`

4. **配置工作流同步**: 参见 `CLUSTER-SETUP.md`

---

*最后更新: 2025-12-31*

