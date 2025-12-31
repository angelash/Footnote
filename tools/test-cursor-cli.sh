#!/bin/bash
# 测试 Cursor CLI 和 WSL 访问控制（在 WSL 内部运行）

echo "=== 测试 Cursor CLI 和 WSL ==="
echo ""

echo "1. 测试 Cursor CLI 版本:"
cursor --version
echo ""

echo "2. 测试当前环境:"
uname -a
echo ""

echo "3. 测试项目目录访问:"
cd /mnt/f/workspace/github/Footnote && pwd && ls -la docs/03_taskpacks/ | head -3
echo ""

echo "4. 测试读取任务包:"
cat /mnt/f/workspace/github/Footnote/docs/03_taskpacks/T-0001_c0_z1_dialogue.md | grep -E '^task_id:|^status:' | head -2
echo ""

echo "5. 测试文件写入:"
echo "Test from WSL $(date)" > /mnt/f/workspace/github/Footnote/.cursor/wsl-test.txt
cat /mnt/f/workspace/github/Footnote/.cursor/wsl-test.txt
echo ""

echo "=== 测试完成 ==="

