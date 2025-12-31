#!/bin/bash
# 模拟 n8n 工作流中的命令执行

PROJECT_ROOT="/mnt/f/workspace/github/Footnote"
TASK_PACK_PATH="docs/03_taskpacks/T-0001_c0_z1_dialogue.md"

echo "=== 模拟 n8n 工作流命令执行 ==="
echo ""

echo "1. 切换到项目目录:"
cd "$PROJECT_ROOT" && pwd
echo ""

echo "2. 读取任务包:"
if [ -f "$TASK_PACK_PATH" ]; then
    echo "✓ 任务包文件存在"
    head -10 "$TASK_PACK_PATH"
else
    echo "✗ 任务包文件不存在"
fi
echo ""

echo "3. 创建提示文件:"
PROMPT_FILE=".cursor/current_task_prompt.md"
mkdir -p .cursor
cat > "$PROMPT_FILE" << 'EOF'
# Task Execution Instructions

## Current Role: L3_writer

## Task Pack:
测试任务包内容

## Execution Rules:
1. Only read files listed in Allowed Inputs
2. Only write to paths listed in Deliverables
3. Follow all constraints strictly
EOF
echo "✓ 提示文件已创建: $PROMPT_FILE"
echo ""

echo "4. 测试 Cursor CLI 命令（模拟 n8n）:"
echo "命令: cursor --message \"Execute the task in $PROMPT_FILE\""
echo "（注意：如果 Cursor CLI 不支持 --message，可能需要使用其他方式）"
echo ""

echo "5. 验证文件系统访问:"
ls -la .cursor/ | head -5
echo ""

echo "=== 测试完成 ==="


