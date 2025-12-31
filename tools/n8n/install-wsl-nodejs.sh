#!/bin/bash
# WSL Node.js 安装脚本

set -e

echo "=== 在 WSL 中安装 Node.js ==="
echo ""

# 检查是否已安装
if command -v node &> /dev/null; then
    echo "Node.js 已安装: $(node --version)"
    echo "npm 版本: $(npm --version)"
    exit 0
fi

echo "1. 更新包列表..."
sudo apt-get update

echo ""
echo "2. 安装依赖..."
sudo apt-get install -y curl gnupg2

echo ""
echo "3. 添加 NodeSource 仓库..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

echo ""
echo "4. 安装 Node.js..."
sudo apt-get install -y nodejs

echo ""
echo "5. 验证安装..."
node --version
npm --version

echo ""
echo "=== 安装完成 ==="
echo ""
echo "下一步: 安装 PM2 和 n8n"
echo "  npm install -g pm2 n8n"

