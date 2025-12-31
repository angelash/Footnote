# n8n + PM2 + WSL 架构分析

## 架构方案

```
Windows 环境
├── PM2 (进程管理器)
│   └── n8n (工作流引擎)
│       └── 执行命令 → wsl bash -c "..."
│
WSL 环境
└── cursor-agent (AI 执行器)
    └── 项目: /home/shash/work/Footnote
```

---

## ✅ 可行性分析

### 1. PM2 在 Windows 上

**支持情况**：
- ✅ PM2 官方支持 Windows
- ✅ 可以管理 Node.js 进程
- ⚠️ 部分高级功能可能受限（如集群模式）

**安装**：
```bash
npm install -g pm2
```

### 2. n8n 在 Windows 上

**支持情况**：
- ✅ n8n 完全支持 Windows
- ✅ 所有功能正常
- ✅ 可以通过 `wsl` 命令调用 WSL 中的工具

### 3. cursor-agent 在 WSL 中

**支持情况**：
- ✅ cursor-agent 在 WSL 中运行正常
- ✅ 项目在 WSL 文件系统中（性能更好）
- ✅ 通过 `wsl` 命令从 Windows 调用

---

## ⚠️ 潜在问题

### 1. 命令执行方式

**当前工作流配置**（假设 n8n 在 WSL）：
```bash
bash -c 'cd /home/shash/work/Footnote && ~/.local/bin/cursor-agent ...'
```

**如果 n8n 在 Windows，需要修改为**：
```bash
wsl bash -c 'cd /home/shash/work/Footnote && ~/.local/bin/cursor-agent ...'
```

### 2. 路径转换

**问题**：
- n8n 在 Windows 中读取文件时，路径是 Windows 格式
- 但执行命令需要在 WSL 中使用 Linux 路径

**解决方案**：
- 文件读取：n8n 使用 Windows 路径（如果文件在 Windows 挂载点）
- 命令执行：通过 `wsl` 转换到 WSL 路径

### 3. 性能影响

**跨系统调用开销**：
- `wsl` 命令启动有一定延迟（~100-200ms）
- 对于长时间运行的 AI 任务，影响可忽略

### 4. PM2 在 Windows 的限制

**可能的问题**：
- 日志轮转功能可能不如 Linux 版本
- 进程监控功能可能受限
- 开机自启需要额外配置（Windows 服务或任务计划程序）

---

## 🎯 推荐方案

### 方案 A: 当前架构（Windows + WSL）

**优点**：
- ✅ 利用 Windows 的 PM2 和 n8n
- ✅ cursor-agent 在 WSL 中运行（性能好）
- ✅ 项目在 WSL 文件系统中（Git 操作快）

**缺点**：
- ⚠️ 需要 `wsl` 命令桥接
- ⚠️ 路径转换复杂

**适用场景**：
- 主要开发环境在 Windows
- 需要利用 Windows 的工具生态

### 方案 B: 全部在 WSL 中（推荐）

**优点**：
- ✅ 统一环境，无需路径转换
- ✅ PM2 在 Linux 上功能完整
- ✅ 性能更好（无跨系统调用）

**缺点**：
- ⚠️ 需要 WSL 中安装 PM2 和 n8n

**适用场景**：
- 主要开发在 WSL 中
- 追求最佳性能

---

## 🔧 配置调整

### 如果选择方案 A（Windows + WSL）

需要更新工作流命令：

**Execute Cursor CLI** 节点：
```bash
wsl bash -c 'cd /home/shash/work/Footnote && ~/.local/bin/cursor-agent --print --force --approve-mcps --output-format text "$(cat .cursor/current_task_prompt.md)"'
```

**Read Task Pack** 节点：
- 如果任务包在 Windows 路径，使用 Windows 路径
- 如果任务包在 WSL 路径，需要通过 `wsl` 读取

**Write Prompt File** 节点：
- 同样需要考虑路径问题

### 如果选择方案 B（全部在 WSL）

工作流配置保持不变（当前配置即可）。

---

## 📋 决策建议

**如果 n8n 已经在 Windows 上运行**：
- ✅ 继续使用方案 A
- ✅ 更新工作流命令添加 `wsl` 前缀
- ✅ 使用 Windows 的 PM2 管理 n8n

**如果还没有部署 n8n**：
- ✅ 推荐方案 B（全部在 WSL）
- ✅ 在 WSL 中安装 PM2 和 n8n
- ✅ 统一环境，减少复杂度

---

## 🚀 快速检查

检查当前 n8n 运行位置：

```bash
# Windows
netstat -ano | findstr :5678

# WSL
ps aux | grep n8n
```

检查 PM2 位置：

```bash
# Windows
where pm2

# WSL
which pm2
```

---

*最后更新: 2025-12-31*

