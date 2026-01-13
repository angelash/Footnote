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
PROMPT_FILE="$(mktemp)"
trap 'rm -f "$PROMPT_FILE"' EXIT

cat > "$PROMPT_FILE" << 'PROMPT_END'
你是一个任务分析助手。根据以下需求，返回一个 JSON 对象（不要有其他内容）：

需求标题: ${TITLE}
需求描述: ${DESCRIPTION}
优先级: ${PRIORITY}

请分析并返回以下 JSON 格式：
```json
{
  "role": "<角色>",
  "task_type": "<类型>",
  "complexity": "<复杂度>",
  "summary": "<一句话总结>",
  "deliverables": ["<预期交付物1>", "<预期交付物2>"]
}
```

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

只返回 JSON，不要有其他文字。
PROMPT_END

# Replace variables in prompt
sed -i "s|\${TITLE}|$TITLE|g" "$PROMPT_FILE"
sed -i "s|\${DESCRIPTION}|$DESCRIPTION|g" "$PROMPT_FILE"
sed -i "s|\${PRIORITY}|$PRIORITY|g" "$PROMPT_FILE"

# Call cursor-agent
RESULT=$("$CURSOR_AGENT" chat --prompt-file "$PROMPT_FILE" --model "gpt-5.2" 2>/dev/null || echo '{"role":"L3_engineer","task_type":"code","complexity":"normal","summary":"无法分析","deliverables":[]}')

# Extract JSON from response (handle markdown code blocks)
JSON_RESULT=$(echo "$RESULT" | grep -Pzo '\{[^}]+\}' | head -1 || echo "$RESULT")

# Validate JSON and output
if echo "$JSON_RESULT" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  echo "$JSON_RESULT"
else
  # Fallback if JSON is invalid
  echo '{"role":"L3_engineer","task_type":"code","complexity":"normal","summary":"分析失败，使用默认值","deliverables":[]}'
fi
