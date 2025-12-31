# WSL Node.js 安装指南

## 当前状态

✅ **确认**: WSL 中 Node.js **未安装**
- `node: command not found`
- npm 存在但可能是从 Windows 映射的

---

## 安装方法

### 方法 1: 使用 NodeSource（推荐）

```bash
# 在 WSL 中执行
wsl

# 更新包列表
sudo apt-get update

# 安装依赖
sudo apt-get install -y curl gnupg2

# 添加 NodeSource 仓库（Node.js 22.x）
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# 安装 Node.js
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 方法 2: 使用 nvm（Node Version Manager）

```bash
# 在 WSL 中执行
wsl

# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell
source ~/.bashrc

# 安装 Node.js 22
nvm install 22
nvm use 22
nvm alias default 22

# 验证安装
node --version
npm --version
```

### 方法 3: 使用 Ubuntu 官方仓库（版本可能较旧）

```bash
# 在 WSL 中执行
wsl

# 更新包列表
sudo apt-get update

# 安装 Node.js 和 npm
sudo apt-get install -y nodejs npm

# 验证安装
node --version
npm --version
```

---

## 快速安装脚本

已创建安装脚本：`tools/n8n/install-wsl-nodejs.sh`

```bash
# 在 WSL 中执行
wsl bash tools/n8n/install-wsl-nodejs.sh
```

**注意**: 安装过程需要 sudo 权限，可能需要输入密码。

---

## 安装后步骤

### 1. 安装 PM2 和 n8n

```bash
# 在 WSL 中
cd /home/shash/work/Footnote
npm install -g pm2 n8n
```

### 2. 验证安装

```bash
pm2 --version
n8n --version
```

### 3. 启动 n8n 从实例

```bash
cd /home/shash/work/Footnote
N8N_PORT=5679 N8N_HOST=0.0.0.0 n8n start
```

---

## 推荐方法

**推荐使用方法 1（NodeSource）**，因为：
- ✅ 版本最新（Node.js 22.x）
- ✅ 安装简单
- ✅ 官方支持

---

*最后更新: 2025-12-31*

