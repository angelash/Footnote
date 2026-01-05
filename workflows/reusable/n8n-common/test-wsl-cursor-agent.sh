#!/bin/bash
# 测试 WSL + cursor-agent 配置

echo "=== WSL + cursor-agent 配置测试 ==="
echo ""

# 1. 检查 cursor-agent
echo "1. 检查 cursor-agent:"
if [ -f ~/.local/bin/cursor-agent ]; then
    echo "   ✓ 找到: ~/.local/bin/cursor-agent"
    ~/.local/bin/cursor-agent --version
else
    echo "   ✗ 未找到 cursor-agent"
    exit 1
fi
echo ""

# 2. 检查项目路径（需要用户确认）
PROJECT_ROOT="${1:-/home/shash/work/Footnote}"
echo "2. 检查项目路径: $PROJECT_ROOT"
if [ -d "$PROJECT_ROOT" ]; then
    echo "   ✓ 项目目录存在"
    cd "$PROJECT_ROOT" && pwd
    ls -la | head -5
else
    echo "   ✗ 项目目录不存在"
    echo "   请提供正确的项目路径作为参数:"
    echo "   $0 /path/to/your/Footnote"
    exit 1
fi
echo ""

# 3. 测试创建提示文件
echo "3. 测试创建提示文件:"
mkdir -p .cursor
cat > .cursor/test-prompt.md << 'EOF'
# Test Task

Please list the files in design/ai-native/03_taskpacks/ directory.
EOF
echo "   ✓ 提示文件已创建: .cursor/test-prompt.md"
echo ""

# 4. 测试 cursor-agent 命令（不实际执行，只显示命令）
echo "4. cursor-agent 命令格式:"
echo "   cd $PROJECT_ROOT && \\"
echo "   ~/.local/bin/cursor-agent \\"
echo "     --print \\"
echo "     --force \\"
echo "     --approve-mcps \\"
echo "     --output-format text \\"
echo "     \"\$(cat .cursor/test-prompt.md)\""
echo ""

echo "=== 测试完成 ==="
echo ""
echo "如果所有检查通过，可以更新 n8n 工作流中的 project_root 为:"
echo "  $PROJECT_ROOT"


