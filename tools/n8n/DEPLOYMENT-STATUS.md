# n8n 集群部署状态

**更新时间**: 2025-12-31

---

## ✅ 当前运行态（实测）

### Windows 主实例（5678）
- ✅ **端口**：5678 已监听
- ✅ **UI**：http://localhost:5678（Sign in 页面可访问）
- ✅ **进程托管**：`pm2 status` 中 `n8n-primary` 为 **online**（PID 与 5678 监听一致）

### WSL 从实例（5680）
- ✅ **PM2**：`n8n-secondary` online
- ✅ **UI**：http://localhost:5680

---

## ✅ 环境检查（实测）

### Windows
- ✅ Node.js / npm / n8n / PM2 可用

### WSL
- ✅ Node.js `v22.21.0`
- ✅ npm `10.9.4`
- ✅ n8n `2.1.4`
- ✅ PM2 `6.0.14`

---

## ✅ 已完成（对“二级 n8n + Cursor CLI”方案的基础支撑）
- ✅ 主/从实例端口就绪（5678 / 5680）
- ✅ WSL 执行环境就绪（Node/n8n/PM2）

---

## ⏳ 待完成（P0 阻塞项）
1. **导入/同步工作流**
   - 主实例：`tools/n8n/dispatch-to-secondary-workflow.json`（主→从分发）
   - 从实例：`tools/n8n/cursor-cli-task-workflow.json`（WSL 直跑，含 Webhook `execute-task`）
2. **跑通一次端到端冒烟**：Task Pack → cursor-agent → 校验器 → 回执/日志
3. **明确 repo 同步策略**：Windows 工作区与 WSL 工作副本的一致性如何保证

---

*最后更新: 2025-12-31*

