#!/usr/bin/env bash
set -euo pipefail

# 通用 AI 分析脚本 - 调用 cursor-agent 进行各种分析任务
# 支持多种分析类型：code-review, design-review, task-decompose, model-select
#
# Usage:
#   ai-analyze.sh --type <type> --input <json-input> [--model <model>]
#
# Types:
#   code-review     - 代码审查分析
#   design-review   - 设计文档审查
#   task-decompose  - 任务拆分分析
#   model-select    - 智能模型选择
#   plan-generate   - 执行计划生成
#   taskpack-generate - TaskPack 生成

die() { echo "[ai-analyze] ERROR: $*" >&2; exit 1; }
warn() { echo "[ai-analyze] WARN: $*" >&2; }
info() { echo "[ai-analyze] INFO: $*" >&2; }

TYPE=""
INPUT=""
MODEL="gpt-5.2"
CURSOR_AGENT="${CURSOR_AGENT:-$HOME/.local/bin/cursor-agent}"
TIMEOUT_SECONDS=120

while [[ $# -gt 0 ]]; do
  case "$1" in
    --type) TYPE="$2"; shift 2;;
    --input) INPUT="$2"; shift 2;;
    --model) MODEL="$2"; shift 2;;
    --timeout) TIMEOUT_SECONDS="$2"; shift 2;;
    *) die "Unknown arg: $1";;
  esac
done

[[ -n "$TYPE" ]] || die "--type required"
[[ -n "$INPUT" ]] || die "--input required (JSON string)"
[[ -x "$CURSOR_AGENT" ]] || {
  warn "cursor-agent not found at $CURSOR_AGENT, using fallback"
  USE_FALLBACK=1
}

# 创建临时 prompt 文件
PROMPT_FILE="$(mktemp)"
trap 'rm -f "$PROMPT_FILE"' EXIT

# 根据类型生成不同的 prompt
generate_prompt() {
  local type="$1"
  local input="$2"
  
  case "$type" in
    code-review)
      cat << 'EOF'
你是一个代码审查专家。请分析以下代码变更并给出评分和建议。

输入数据：
INPUT_DATA

请返回以下 JSON 格式（只返回 JSON，不要其他内容）：
```json
{
  "logic": <0-100>,
  "style": <0-100>,
  "security": <0-100>,
  "performance": <0-100>,
  "maintainability": <0-100>,
  "issues": [
    {"severity": "critical|major|minor|info", "file": "path", "line": <n>, "message": "描述"}
  ],
  "suggestions": ["建议1", "建议2"],
  "summary": "一句话总结"
}
```
EOF
      ;;
    
    design-review)
      cat << 'EOF'
你是一个设计文档审查专家。请分析以下设计文档并给出评分和建议。

输入数据：
INPUT_DATA

请返回以下 JSON 格式（只返回 JSON，不要其他内容）：
```json
{
  "completeness": <0-100>,
  "consistency": <0-100>,
  "feasibility": <0-100>,
  "clarity": <0-100>,
  "missing_sections": ["缺失章节1"],
  "issues": [
    {"type": "missing|unclear|inconsistent", "section": "章节", "message": "描述"}
  ],
  "suggestions": ["建议1", "建议2"],
  "summary": "一句话总结"
}
```
EOF
      ;;
    
    task-decompose)
      cat << 'EOF'
你是一个项目管理专家。请分析以下任务并给出合理的拆分方案。

输入数据：
INPUT_DATA

请返回以下 JSON 格式（只返回 JSON，不要其他内容）：
```json
{
  "complexity": "simple|normal|complex",
  "estimated_hours": <数字>,
  "modules": ["模块1", "模块2"],
  "subtasks": [
    {
      "id": "SUB1",
      "title": "子任务标题",
      "description": "描述",
      "role": "L3_engineer|L3_writer|L3_tester|L3_ui_engineer",
      "priority": "high|normal|low",
      "estimated_hours": <数字>
    }
  ],
  "dependencies": [
    {"from": "SUB1", "to": "SUB2"}
  ],
  "risks": ["风险1"],
  "summary": "一句话总结"
}
```
EOF
      ;;
    
    model-select)
      cat << 'EOF'
你是一个 AI 模型选择专家。根据任务类型和复杂度，选择最合适的模型。

输入数据：
INPUT_DATA

可选模型：
- gpt-5.2: 通用文本任务，快速响应
- gpt-5.2-high: 复杂文本任务
- opus-4.5: 代码生成，推理能力强
- opus-4.5-thinking: 复杂代码任务，深度思考
- gemini-3-pro: 多模态任务，图像理解
- auto: 让系统自动选择

请返回以下 JSON 格式（只返回 JSON，不要其他内容）：
```json
{
  "recommended_model": "模型名称",
  "reason": "选择理由",
  "alternatives": ["备选模型1", "备选模型2"],
  "confidence": <0-100>
}
```
EOF
      ;;
    
    plan-generate)
      cat << 'EOF'
你是一个任务规划专家。请为以下任务生成详细的执行计划。

输入数据：
INPUT_DATA

请返回以下 JSON 格式（只返回 JSON，不要其他内容）：
```json
{
  "task_type": "code|doc|multimodal",
  "complexity": "simple|normal|complex",
  "estimated_duration_minutes": <数字>,
  "steps": [
    {"order": 1, "action": "动作描述", "expected_output": "预期输出"}
  ],
  "required_tools": ["tool1", "tool2"],
  "potential_blockers": ["可能的阻碍"],
  "success_criteria": ["成功标准1", "成功标准2"],
  "summary": "一句话总结"
}
```
EOF
      ;;
    
    taskpack-generate)
      cat << 'EOF'
你是一个 TaskPack 生成专家。请根据需求生成完整的 TaskPack 内容。

输入数据：
INPUT_DATA

请返回以下 JSON 格式（只返回 JSON，不要其他内容）：
```json
{
  "task_id": "生成的任务ID",
  "title": "任务标题",
  "task_type": "code|doc|multimodal",
  "complexity": "simple|normal|complex",
  "outcome": "预期结果详细描述",
  "allowed_inputs": ["允许的输入1", "允许的输入2"],
  "deliverables": ["交付物1", "交付物2"],
  "constraints": ["约束1", "约束2"],
  "acceptance_checklist": ["验收项1", "验收项2"],
  "recommended_role": "L3_engineer|L3_writer|L3_tester|L3_ui_engineer",
  "estimated_hours": <数字>
}
```
EOF
      ;;
    
    *)
      die "Unknown type: $type"
      ;;
  esac
}

# 生成 prompt
PROMPT_RAW="$(generate_prompt "$TYPE" "$INPUT")"
# 替换输入数据
PROMPT="$(echo "$PROMPT_RAW" | sed "s|INPUT_DATA|$INPUT|g")"

info "Running $TYPE analysis with model $MODEL"

# 调用 cursor-agent 或使用 fallback
if [[ "${USE_FALLBACK:-}" == "1" ]]; then
  # Fallback: 返回默认值
  warn "Using fallback response"
  case "$TYPE" in
    code-review)
      echo '{"logic":75,"style":75,"security":75,"performance":75,"maintainability":75,"issues":[],"suggestions":["需要 AI 分析"],"summary":"无法进行 AI 分析，使用默认评分"}'
      ;;
    design-review)
      echo '{"completeness":70,"consistency":70,"feasibility":70,"clarity":70,"missing_sections":[],"issues":[],"suggestions":["需要 AI 分析"],"summary":"无法进行 AI 分析，使用默认评分"}'
      ;;
    task-decompose)
      echo '{"complexity":"normal","estimated_hours":4,"modules":["general"],"subtasks":[],"dependencies":[],"risks":["无法进行 AI 分析"],"summary":"需要人工拆分任务"}'
      ;;
    model-select)
      echo '{"recommended_model":"auto","reason":"无法进行 AI 分析，使用默认模型","alternatives":[],"confidence":50}'
      ;;
    plan-generate)
      echo '{"task_type":"code","complexity":"normal","estimated_duration_minutes":60,"steps":[],"required_tools":[],"potential_blockers":[],"success_criteria":[],"summary":"需要人工规划"}'
      ;;
    taskpack-generate)
      echo '{"task_id":"UNKNOWN","title":"未知任务","task_type":"code","complexity":"normal","outcome":"需要人工填写","allowed_inputs":["./"],"deliverables":["待定"],"constraints":["不得修改冻结目录"],"acceptance_checklist":["交付物落盘"],"recommended_role":"L3_engineer","estimated_hours":4}'
      ;;
  esac
  exit 0
fi

# 调用 cursor-agent（必须使用 --print 才能获取输出，prompt 直接作为参数）
info "Calling cursor-agent..."
RESULT=$(timeout "${TIMEOUT_SECONDS}s" "$CURSOR_AGENT" --print --output-format text --model "$MODEL" "$PROMPT" 2>/dev/null || echo "")

if [[ -z "$RESULT" ]]; then
  warn "cursor-agent returned empty result, using fallback"
  # 使用 fallback
  USE_FALLBACK=1
  exec "$0" --type "$TYPE" --input "$INPUT" --model "$MODEL"
fi

# 提取 JSON（处理 markdown 代码块）
extract_json() {
  local text="$1"
  # 尝试提取 ```json ... ``` 块
  local json_block=$(echo "$text" | sed -n '/```json/,/```/p' | sed '1d;$d')
  if [[ -n "$json_block" ]]; then
    echo "$json_block"
    return
  fi
  # 尝试提取 {...} 块
  local json_obj=$(echo "$text" | grep -Pzo '\{[\s\S]*\}' | head -1 || echo "")
  if [[ -n "$json_obj" ]]; then
    echo "$json_obj"
    return
  fi
  # 返回原文
  echo "$text"
}

JSON_RESULT=$(extract_json "$RESULT")

# 验证 JSON
if echo "$JSON_RESULT" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  echo "$JSON_RESULT"
else
  warn "Invalid JSON from AI, using fallback"
  USE_FALLBACK=1
  exec "$0" --type "$TYPE" --input "$INPUT" --model "$MODEL"
fi
