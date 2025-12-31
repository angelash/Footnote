# n8n 集群部署状态

**部署时间**: 2025-12-31

---

## ✅ 已完成

### Windows 环境
- ✅ Node.js v22.15.0 已安装
- ✅ npm 11.6.2 已安装
- ✅ PM2 已安装
- ✅ n8n 已安装

### 待完成

### WSL 环境
- ⏳ **需要安装 Node.js**（WSL 中未检测到 Node.js）
- ⏳ 安装 PM2（需要先有 Node.js）
- ⏳ 安装 n8n（需要先有 Node.js）
- ⏳ 配置并启动从实例

---

## 下一步操作

### 1. 在 WSL 中安装 Node.js

```bash
# 方法 1: 使用 NodeSource（推荐）
wsl bash -c "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs"

# 方法 2: 使用 nvm
wsl bash -c "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
wsl bash -c "source ~/.bashrc && nvm install 22"
```

### 2. 在 WSL 中安装 PM2 和 n8n

```bash
wsl bash -c "cd /home/shash/work/Footnote && npm install -g pm2 n8n"
```

### 3. 启动 WSL 从实例

```bash
wsl bash -c "cd /home/shash/work/Footnote && pm2 start tools/n8n/ecosystem.config.wsl.js --only n8n-secondary"
```

---

## 当前状态

### Windows 主实例
- **状态**: 配置中
- **端口**: 5678
- **PM2 进程**: 待启动

### WSL 从实例
- **状态**: 等待 Node.js 安装
- **端口**: 5679
- **PM2 进程**: 未启动

---

*最后更新: 2025-12-31*

