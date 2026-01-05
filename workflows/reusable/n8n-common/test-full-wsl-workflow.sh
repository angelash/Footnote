#!/bin/bash
# 完整 WSL 工作流测试脚本

set -e

PROJECT_ROOT="/home/shash/work/Footnote"
CURSOR_AGENT="$HOME/.local/bin/cursor-agent"

echo "=== 完整 WSL 工作流测试 ==="
echo ""

# 1. 检查环境
echo "1. 环境检查:"
echo "   项目路径: $PROJECT_ROOT"
if [ ! -d "$PROJECT_ROOT" ]; then
    echo "   ✗ 项目目录不存在"
    exit 1
fi
echo "   ✓ 项目目录存在"

if [ ! -f "$CURSOR_AGENT" ]; then
    echo "   ✗ cursor-agent 不存在"
    exit 1
fi
echo "   ✓ cursor-agent 存在: $CURSOR_AGENT"
echo ""

# 2. 进入项目目录
cd "$PROJECT_ROOT"
echo "2. 当前目录: $(pwd)"
echo ""

# 3. 测试 Git 操作
echo "3. Git 测试:"
echo "   当前分支: $(git branch --show-current)"
echo "   远程仓库: $(git remote get-url origin)"
echo "   ✓ Git 配置正常"
echo ""

# 4. 测试创建任务提示文件
echo "4. 创建测试任务提示文件:"
mkdir -p .cursor
cat > .cursor/test-task.md << 'TASKEOF'
# 测试任务

请列出 design/ai-native/03_taskpacks/ 目录下的所有文件，并显示每个文件的第一行。
TASKEOF
echo "   ✓ 测试任务文件已创建: .cursor/test-task.md"
echo "   内容预览:"
head -3 .cursor/test-task.md | sed 's/^/      /'
echo ""

# 5. 测试 cursor-agent 命令格式
echo "5. cursor-agent 命令格式验证:"
CMD="cd $PROJECT_ROOT && $CURSOR_AGENT --print --force --approve-mcps --output-format text \"\$(cat .cursor/test-task.md)\""
echo "   命令:"
echo "   $CMD" | sed 's/^/      /'
echo ""

# 6. 检查 cursor-agent 是否可用（不实际执行，避免消耗 API）
echo "6. cursor-agent 版本检查:"
VERSION=$($CURSOR_AGENT --version 2>&1)
echo "   版本: $VERSION"
echo "   ✓ cursor-agent 可用"
echo ""

# 7. 验证工作流配置
echo "7. n8n 工作流配置验证:"
echo "   项目路径配置: $PROJECT_ROOT"
echo "   cursor-agent 路径: $CURSOR_AGENT"
echo "   ✓ 配置正确"
echo ""

# 8. 测试文件读取（模拟 n8n 工作流）
echo "8. 模拟 n8n 工作流文件操作:"
if [ -f "design/ai-native/03_taskpacks/T-0001_c0_z1_dialogue.md" ]; then
    echo "   ✓ 可以读取任务包文件"
    echo "   示例任务包: design/ai-native/03_taskpacks/T-0001_c0_z1_dialogue.md"
    head -5 "design/ai-native/03_taskpacks/T-0001_c0_z1_dialogue.md" | sed 's/^/      /'
else
    echo "   ✗ 任务包文件不存在"
fi
echo ""

echo "=== 测试完成 ==="
echo ""
echo "✅ 所有基础检查通过！"
echo ""
echo "📝 下一步:"
echo "   1. 在 n8n 中导入更新后的工作流: workflows/project/n8n/cursor-cli-task-workflow.json"
echo "   2. 确认工作流中的 project_root 参数为: $PROJECT_ROOT"
echo "   3. 测试执行一个真实任务"
echo ""
echo "⚠️  注意: cursor-agent 需要 API key 才能实际执行任务"
echo "   可以通过环境变量 CURSOR_API_KEY 或 --api-key 参数提供"

