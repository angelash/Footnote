# n8n 集群快速启动指南

## 当前状态

✅ **WSL 从实例**: 运行中（端口 5679）  
⚠️ **Windows 主实例**: 需要修复启动方式

---

## 快速启动命令

### Windows 主实例

```powershell
pm2 delete n8n-primary
pm2 start n8n --name n8n-primary -- --port 5678 --host 0.0.0.0
pm2 save
```

### WSL 从实例

```bash
wsl bash -c "cd /home/shash/work/Footnote && pm2 delete n8n-secondary"
wsl bash -c "cd /home/shash/work/Footnote && pm2 start n8n --name n8n-secondary -- --port 5679 --host 0.0.0.0"
wsl bash -c "cd /home/shash/work/Footnote && pm2 save"
```

---

## 访问地址

- **主实例**: http://localhost:5678
- **从实例**: http://localhost:5679

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

