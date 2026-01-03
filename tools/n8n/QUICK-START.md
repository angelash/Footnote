# n8n 集群快速启动指南

## 当前状态

✅ **单入口（推荐）**: 仅使用 WSL 实例（端口 5680）作为所有 AI-Native 任务入口  
🟡 **Windows 5678**: 可选保留（后续需要“主从分发 / browser-test”等再启用）

---

## 快速启动命令

### WSL 单入口实例（5680）

```bash
wsl bash -c "cd /home/shash/work/Footnote && pm2 delete n8n-secondary 2>/dev/null"
wsl bash -c "cd /home/shash/work/Footnote && pm2 start tools/n8n/start-n8n-secondary.sh --name n8n-secondary"
wsl bash -c "cd /home/shash/work/Footnote && pm2 start tools/n8n/wsl-runner/start-server.sh --name wsl-cursor-runner"
wsl bash -c "cd /home/shash/work/Footnote && pm2 save"
```

---

## 访问地址

- **单入口实例**: http://localhost:5680

**登录信息**:
- Email: `admin@footnote.local`
- Password: `Footnote2025!`

---

## 查看状态

```bash
# WSL 实例
wsl bash -c "cd /home/shash/work/Footnote && pm2 status"
```

---

## 入口（5680）

已发布的 Webhook：
- `POST http://localhost:5680/webhook/compose-taskpack`
- `POST http://localhost:5680/webhook/execute-task`

---

## 端到端冒烟（5680 单入口）

在 Windows PowerShell 运行：

```powershell
.\tools\n8n\smoke-secondary.ps1
```

*最后更新: 2025-12-31*

