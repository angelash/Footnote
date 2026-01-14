#!/usr/bin/env bash
set -euo pipefail

# Analyze a request using cursor-agent to determine task type, role, complexity.
# Returns JSON: { "role": "...", "task_type": "...", "complexity": "...", "summary": "..." }
#
# Usage:
#   analyze-request.sh --title "..." --description "..." [--priority normal]

die() { echo "[analyze-request] ERROR: $*" >&2; exit 1; }

TITLE=""
DESCRIPTION=""
PRIORITY="normal"
CURSOR_AGENT="${CURSOR_AGENT:-$HOME/.local/bin/cursor-agent}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title) TITLE="$2"; shift 2;;
    --description) DESCRIPTION="$2"; shift 2;;
    --priority) PRIORITY="$2"; shift 2;;
    *) die "Unknown arg: $1";;
  esac
done

[[ -n "$TITLE" ]] || die "--title required"
[[ -n "$DESCRIPTION" ]] || die "--description required"
[[ -x "$CURSOR_AGENT" ]] || die "cursor-agent not executable: $CURSOR_AGENT"

# Create prompt for analysis
PROMPT="你是一个任务分析助手。根据以下需求，返回一个 JSON 对象（不要有其他内容）：

需求标题: $TITLE
需求描述: $DESCRIPTION
优先级: $PRIORITY

请分析并返回以下 JSON 格式：
{
  \"role\": \"<角色>\",
  \"task_type\": \"<类型>\",
  \"complexity\": \"<复杂度>\",
  \"summary\": \"<一句话总结>\",
  \"deliverables\": [\"<预期交付物1>\", \"<预期交付物2>\"]
}

角色选项（选择最合适的一个）：
- L3_engineer: 代码开发、Bug修复、系统实现
- L3_writer: 文案写作、对白、剧情、叙事内容
- L3_tester: 测试验证、QA检查
- L3_ui_engineer: UI界面、交互组件
- L3_level_designer: 关卡设计
- L3_scripter: 脚本逻辑、事件编排

任务类型：
- code: 代码相关
- doc: 文档/文案相关
- multimodal: 涉及多种资源

复杂度：
- simple: 单一文件小改动
- normal: 多文件普通改动
- complex: 跨系统或架构级改动

只返回 JSON，不要有其他文字。"

# Call cursor-agent with --print flag for script output
echo "[analyze-request] Calling cursor-agent with model gpt-5.2..." >&2
RESULT=$("$CURSOR_AGENT" --print --output-format text --model "gpt-5.2" "$PROMPT" 2>/dev/null || echo '{"role":"L3_engineer","task_type":"code","complexity":"normal","summary":"无法分析","deliverables":[]}')

# Extract and validate JSON from response
# Use Python for robust JSON extraction (handles nested objects, markdown code blocks, etc.)
JSON_RESULT=$(python3 << PYEOF
import re
import json
import sys

text = '''$RESULT'''

# Try to extract JSON from various formats
result = None

# Method 1: Try to parse the whole response as JSON
try:
    result = json.loads(text.strip())
except:
    pass

# Method 2: Extract from markdown code block
if not result:
    match = re.search(r'\`\`\`(?:json)?\s*(\{[\s\S]*?\})\s*\`\`\`', text)
    if match:
        try:
            result = json.loads(match.group(1))
        except:
            pass

# Method 3: Find the first {...} block (greedy match for nested objects)
if not result:
    # Find all { positions and match balanced braces
    start = text.find('{')
    if start >= 0:
        depth = 0
        end = start
        for i in range(start, len(text)):
            if text[i] == '{':
                depth += 1
            elif text[i] == '}':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        try:
            result = json.loads(text[start:end])
        except:
            pass

# Validate required fields
if result and isinstance(result, dict):
    # Ensure required fields exist
    if 'role' in result and 'task_type' in result:
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)

# Fallback
print('{"role":"L3_engineer","task_type":"code","complexity":"normal","summary":"分析失败，使用默认值","deliverables":[]}')
PYEOF
)

echo "$JSON_RESULT"
