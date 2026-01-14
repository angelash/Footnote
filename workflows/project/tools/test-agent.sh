#!/usr/bin/env bash
set -euo pipefail

CURSOR_AGENT="${CURSOR_AGENT:-$HOME/.local/bin/cursor-agent}"

echo "Testing cursor-agent..."
RESULT=$("$CURSOR_AGENT" --print --output-format text --model gpt-5.2 \
  "你是任务分析助手。分析这个任务并只返回JSON：标题=CreateTestFile，描述=创建测试文件。JSON格式：{\"role\":\"L3_engineer\",\"task_type\":\"code\",\"complexity\":\"normal\",\"summary\":\"描述\",\"deliverables\":[\"文件\"]}")

echo "Result: $RESULT"
