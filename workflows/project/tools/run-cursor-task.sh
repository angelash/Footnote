#!/usr/bin/env bash
set -euo pipefail

# Run Cursor Agent with model policy + guardrails.
# Intended to be called from n8n (WSL runner).
#
# Usage:
#   workflows/project/n8n/run-cursor-task.sh \
#     --task-pack design/ai-native/03_taskpacks/T-0001_c0_z1_dialogue.md \
#     --prompt-file .cursor/current_task_prompt.md \
#     --task-type doc \
#     --complexity normal \
#     [--model-override gpt-5.2-high] \
#     [--chat-id <uuid>] \
#     [--chat-id-file <path>]

die() { echo "[run-cursor-task] ERROR: $*" >&2; exit 1; }

TASK_PACK=""
PROMPT_FILE=""
TASK_TYPE="doc"
COMPLEXITY="normal"
# Always pass a value from automation ("auto"|"none"|"-"|explicit model). Avoids arg parsing issues.
MODEL_OVERRIDE="auto"
CURSOR_AGENT="${CURSOR_AGENT:-$HOME/.local/bin/cursor-agent}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-text}"
CHAT_ID=""
CHAT_ID_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task-pack) TASK_PACK="$2"; shift 2;;
    --prompt-file) PROMPT_FILE="$2"; shift 2;;
    --task-type) TASK_TYPE="$2"; shift 2;;
    --complexity) COMPLEXITY="$2"; shift 2;;
    --model-override) MODEL_OVERRIDE="$2"; shift 2;;
    --chat-id) CHAT_ID="$2"; shift 2;;
    --chat-id-file) CHAT_ID_FILE="$2"; shift 2;;
    *) die "Unknown arg: $1";;
  esac
done

[[ -n "$TASK_PACK" ]] || die "--task-pack required"
[[ -f "$TASK_PACK" ]] || die "Task pack not found: $TASK_PACK"
[[ -x "$CURSOR_AGENT" ]] || die "cursor-agent not executable: $CURSOR_AGENT"

# 如果没有 prompt-file，从 task-pack 自动生成
if [[ -z "$PROMPT_FILE" ]]; then
  echo "[run-cursor-task] No prompt file provided, generating from task-pack..." >&2
  PROMPT_FILE="$(mktemp --suffix=.md)"
  GENERATED_PROMPT=1
  
  # 从 TaskPack 提取关键信息并生成 prompt
  cat > "$PROMPT_FILE" << PROMPT_EOF
你是一个高效的任务执行助手。请根据以下 TaskPack 执行任务。

## TaskPack 内容

$(cat "$TASK_PACK")

## 执行要求

1. 仔细阅读 TaskPack 中的所有章节
2. 严格按照 Deliverables 列出的交付物进行交付
3. 遵守 Constraints 中的所有约束
4. 完成后确认 Acceptance Checklist 中的每一项

请开始执行任务。
PROMPT_EOF
  
  echo "[run-cursor-task] Generated prompt file: $PROMPT_FILE" >&2
else
  GENERATED_PROMPT=0
  [[ -f "$PROMPT_FILE" ]] || die "Prompt file not found: $PROMPT_FILE"
fi

# 清理生成的临时文件
cleanup_prompt() {
  if [[ "${GENERATED_PROMPT:-0}" == "1" && -f "$PROMPT_FILE" ]]; then
    rm -f "$PROMPT_FILE"
  fi
}
trap cleanup_prompt EXIT

select_model() {
  local taskType="$1"
  local complexity="$2"
  local override="$3"
  local taskPack="$4"

  # 如果明确指定了模型，直接使用
  case "$override" in
    ""|auto|none|"-") override="";;
    *)
      echo "$override"
      return 0
      ;;
  esac

  # 尝试使用 AI 智能选择模型
  local AI_ANALYZE_SCRIPT="${SCRIPT_DIR}/ai-analyze.sh"
  if [[ -x "$AI_ANALYZE_SCRIPT" ]]; then
    local taskContent=""
    if [[ -f "$taskPack" ]]; then
      taskContent="$(head -100 "$taskPack" 2>/dev/null | tr '\n' ' ' | sed 's/"/\\"/g')"
    fi
    local inputJson="{\"task_type\":\"$taskType\",\"complexity\":\"$complexity\",\"task_content\":\"$taskContent\"}"
    
    # 尝试 AI 选择（带超时，失败则降级）
    local aiResult
    aiResult=$(timeout 30s bash "$AI_ANALYZE_SCRIPT" --type model-select --input "$inputJson" 2>/dev/null || echo "")
    
    if [[ -n "$aiResult" ]]; then
      local recommended
      recommended=$(echo "$aiResult" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('recommended_model',''))" 2>/dev/null || echo "")
      if [[ -n "$recommended" && "$recommended" != "auto" ]]; then
        echo "[run-cursor-task] AI recommended model: $recommended" >&2
        echo "$recommended"
        return 0
      fi
    fi
  fi

  # 降级：使用硬编码规则
  echo "[run-cursor-task] Using fallback model selection" >&2
  case "$taskType" in
    doc)
      case "$complexity" in
        high|max|complex) echo "gpt-5.2-high";;
        normal) echo "gpt-5.2";;
        *) echo "gpt-5.2";;
      esac
      ;;
    code)
      case "$complexity" in
        high|max|complex) echo "opus-4.5-thinking";;
        normal) echo "opus-4.5";;
        *) echo "opus-4.5";;
      esac
      ;;
    multimodal)
      echo "gemini-3-pro"
      ;;
    *)
      # Safe default based on complexity
      case "$complexity" in
        high|max|complex) echo "opus-4.5-thinking";;
        *) echo "opus-4.5";;
      esac
      ;;
  esac
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

MODEL="$(select_model "$TASK_TYPE" "$COMPLEXITY" "$MODEL_OVERRIDE" "$TASK_PACK")"

echo "[run-cursor-task] task_pack=$TASK_PACK task_type=$TASK_TYPE complexity=$COMPLEXITY model=$MODEL" >&2

# Extract Deliverables allowlist from Task Pack (simple parser).
# Matches lines starting with "- " within section "## 3. Deliverables" until next "## ".
    # Deliverables in Task Packs often use annotated bullets like:
    # - [`file`] `path/to/file` (notes)
    # Normalize these into raw repo-relative paths for guardrails.
    mapfile -t DELIVERABLES < <(
      awk '
        BEGIN{inSection=0}
        /^##[[:space:]]*3\.[[:space:]]*Deliverables/{inSection=1; next}
        /^##[[:space:]]*/{if(inSection==1) exit}
        {if(inSection==1 && $0 ~ /^- /) {sub(/^- /,"",$0); print $0}}
      ' "$TASK_PACK" \
        | sed 's/\r$//' \
        | sed -E 's/^\\[[^]]+\\][[:space:]]*//' \
        | sed -E 's/^`([^`]+)`.*/\1/' \
        | sed -E 's/^[[:space:]]*//' \
        | sed -E 's/[[:space:]].*$//'
    )

if [[ ${#DELIVERABLES[@]} -eq 0 ]]; then
  echo "[run-cursor-task] WARN: No deliverables parsed from task pack. Guardrail will only allow .cursor/* changes." >&2
fi

# Snapshot before (with timeout to avoid hanging on slow WSL/Windows file systems)
BEFORE_DIFF="$(mktemp)"
AFTER_DIFF="$(mktemp)"
trap 'rm -f "$BEFORE_DIFF" "$AFTER_DIFF"' EXIT

# Use timeout to prevent git from hanging indefinitely
timeout 10s git diff --name-only > "$BEFORE_DIFF" 2>/dev/null || {
  echo "[run-cursor-task] WARN: git diff timed out or failed, skipping pre-check" >&2
  echo "" > "$BEFORE_DIFF"
}

# Handle chat ID for conversation history
# If chat-id-file is provided, try to read existing chat ID
if [[ -n "$CHAT_ID_FILE" && -f "$CHAT_ID_FILE" ]]; then
  CHAT_ID="$(cat "$CHAT_ID_FILE" 2>/dev/null | tr -d '[:space:]' || echo "")"
fi

# If no chat ID yet, create a new chat
if [[ -z "$CHAT_ID" ]]; then
  echo "[run-cursor-task] Creating new chat session..." >&2
  CHAT_ID="$("$CURSOR_AGENT" create-chat 2>/dev/null | tr -d '[:space:]' || echo "")"
  if [[ -z "$CHAT_ID" ]]; then
    echo "[run-cursor-task] WARN: Failed to create chat, continuing without conversation history" >&2
  else
    echo "[run-cursor-task] Created chat: $CHAT_ID" >&2
    # Save chat ID to file if provided
    if [[ -n "$CHAT_ID_FILE" ]]; then
      echo "$CHAT_ID" > "$CHAT_ID_FILE"
      echo "[run-cursor-task] Saved chat ID to: $CHAT_ID_FILE" >&2
    fi
  fi
else
  echo "[run-cursor-task] Resuming chat: $CHAT_ID" >&2
fi

# Run Cursor Agent (headless)
PROMPT_CONTENT="$(cat "$PROMPT_FILE")"

set +e
# Build command with optional --resume
CURSOR_CMD=(
  "$CURSOR_AGENT"
  --print
  --force
  --approve-mcps
  --output-format "$OUTPUT_FORMAT"
  --model "$MODEL"
)

# Add --resume if we have a chat ID
if [[ -n "$CHAT_ID" ]]; then
  CURSOR_CMD+=(--resume "$CHAT_ID")
fi

# Add prompt content
CURSOR_CMD+=("$PROMPT_CONTENT")

# 运行 cursor-agent，使用 unbuffered 输出并转发到 stderr
# 这样 shell executor 的 onStderr 回调能实时捕获流式输出
# stdbuf -oL 禁用 stdout 行缓冲，2>&1 合并 stderr，>&2 输出到 stderr
if command -v stdbuf >/dev/null 2>&1; then
  # 使用 stdbuf 禁用缓冲，实时输出
  stdbuf -oL -eL "${CURSOR_CMD[@]}" 2>&1 >&2
  AGENT_EXIT=$?
else
  # 降级：直接运行，输出可能有缓冲
  "${CURSOR_CMD[@]}" 2>&1 >&2
  AGENT_EXIT=$?
fi
set -e

# Use timeout to prevent git from hanging
timeout 10s git diff --name-only > "$AFTER_DIFF" 2>/dev/null || {
  echo "[run-cursor-task] WARN: git diff (after) timed out or failed" >&2
  echo "" > "$AFTER_DIFF"
}

# Compute changed files since before
CHANGED_FILES="$(comm -13 <(sort "$BEFORE_DIFF") <(sort "$AFTER_DIFF") || true)"

is_allowed_change() {
  local f="$1"
  # Always allow internal prompt files
  if [[ "$f" == ".cursor/"* ]]; then return 0; fi
  # Allow fixed-flow audit logs (user requested to keep committing them for now)
  if [[ "$f" == "workflows/project/logs/automation_runs/"* ]]; then return 0; fi
  for d in "${DELIVERABLES[@]}"; do
    [[ -n "$d" ]] || continue
    if [[ "$f" == "$d" ]]; then return 0; fi
  done
  return 1
}

if [[ -n "$CHANGED_FILES" ]]; then
  while IFS= read -r f; do
    [[ -n "$f" ]] || continue
    if ! is_allowed_change "$f"; then
      echo "[run-cursor-task] ERROR: Changed file not in Deliverables: $f" >&2
      echo "[run-cursor-task] Deliverables allowlist:" >&2
      printf '  - %s\n' "${DELIVERABLES[@]}" >&2
      exit 20
    fi
  done <<< "$CHANGED_FILES"
fi

if [[ $AGENT_EXIT -ne 0 ]]; then
  echo "[run-cursor-task] cursor-agent exit=$AGENT_EXIT" >&2
  exit "$AGENT_EXIT"
fi

# Output chat ID for logging
if [[ -n "$CHAT_ID" ]]; then
  echo "[run-cursor-task] chat_id=$CHAT_ID" >&2
fi

echo "[run-cursor-task] OK" >&2


