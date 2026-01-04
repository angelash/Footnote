#!/bin/bash
# WSL 环境检查脚本

echo "=== WSL 环境检查 ==="
echo ""

echo "1. 用户信息:"
echo "   User: $(whoami)"
echo "   Home: $HOME"
echo ""

echo "2. Cursor Agent 位置:"
if [ -f ~/.local/bin/cursor-agent ]; then
    echo "   ✓ 找到: ~/.local/bin/cursor-agent"
    ~/.local/bin/cursor-agent --version 2>&1 | head -1
else
    echo "   ✗ 未找到 cursor-agent"
fi
echo ""

echo "3. 项目目录检查:"
echo "   检查常见位置:"
for dir in ~/work ~/projects ~/code ~/workspace ~/dev; do
    if [ -d "$dir" ]; then
        echo "   ✓ $dir 存在"
        ls -la "$dir" | head -5
    fi
done
echo ""

echo "4. WSL 文件系统:"
df -h / | tail -1
echo ""

echo "5. 环境变量 PATH:"
echo "$PATH" | tr ':' '\n' | grep -E 'local/bin|cursor' || echo "   未找到 cursor 相关路径"
echo ""

echo "=== 检查完成 ==="
echo ""
echo "请确认:"
echo "1. 项目在 WSL 中的实际路径（例如: ~/work/Footnote 或 ~/projects/Footnote）"
echo "2. 是否使用 cursor-agent 而不是 cursor 命令"


