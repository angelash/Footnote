#!/usr/bin/env bash
set -euo pipefail

# Run Cursor Agent with model policy + guardrails.
# Intended to be called from n8n (WSL runner).
#
# Usage:
#   tools/n8n/run-cursor-task.sh \
#     --task-pack docs/03_taskpacks/T-0001_c0_z1_dialogue.md \
#     --prompt-file .cursor/current_task_prompt.md \
#     --task-type doc \
#     --complexity normal \
#     [--model-override gpt-5.2-high]

die() { echo "[run-cursor-task] ERROR: $*" >&2; exit 1; }

TASK_PACK=""
PROMPT_FILE=""
TASK_TYPE="doc"
COMPLEXITY="normal"
# Always pass a value from automation ("auto"|"none"|"-"|explicit model). Avoids arg parsing issues.
MODEL_OVERRIDE="auto"
CURSOR_AGENT="${CURSOR_AGENT:-$HOME/.local/bin/cursor-agent}"
OUTPUT_FORMAT="${OUTPUT_FORMAT:-text}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task-pack) TASK_PACK="$2"; shift 2;;
    --prompt-file) PROMPT_FILE="$2"; shift 2;;
    --task-type) TASK_TYPE="$2"; shift 2;;
    --complexity) COMPLEXITY="$2"; shift 2;;
    --model-override) MODEL_OVERRIDE="$2"; shift 2;;
    *) die "Unknown arg: $1";;
  esac
done

[[ -n "$TASK_PACK" ]] || die "--task-pack required"
[[ -n "$PROMPT_FILE" ]] || die "--prompt-file required"
[[ -f "$TASK_PACK" ]] || die "Task pack not found: $TASK_PACK"
[[ -f "$PROMPT_FILE" ]] || die "Prompt file not found: $PROMPT_FILE"
[[ -x "$CURSOR_AGENT" ]] || die "cursor-agent not executable: $CURSOR_AGENT"

select_model() {
  local taskType="$1"
  local complexity="$2"
  local override="$3"

  case "$override" in
    ""|auto|none|"-") override="";;
  esac

  if [[ -n "$override" ]]; then
    echo "$override"
    return 0
  fi

  case "$taskType" in
    doc)
      case "$complexity" in
        high|max) echo "gpt-5.2-high";;
        normal) echo "gpt-5.2";;
        *) echo "gpt-5.2";;
      esac
      ;;
    code)
      case "$complexity" in
        high|max) echo "opus-4.5-thinking";;
        normal) echo "opus-4.5";;
        *) echo "opus-4.5";;
      esac
      ;;
    multimodal)
      echo "gemini-3-pro"
      ;;
    *)
      # Safe default
      echo "auto"
      ;;
  esac
}

MODEL="$(select_model "$TASK_TYPE" "$COMPLEXITY" "$MODEL_OVERRIDE")"

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

# Snapshot before
BEFORE_DIFF="$(mktemp)"
AFTER_DIFF="$(mktemp)"
trap 'rm -f "$BEFORE_DIFF" "$AFTER_DIFF"' EXIT

git diff --name-only > "$BEFORE_DIFF" || true

# Run Cursor Agent (headless)
PROMPT_CONTENT="$(cat "$PROMPT_FILE")"

set +e
"$CURSOR_AGENT" \
  --print \
  --force \
  --approve-mcps \
  --output-format "$OUTPUT_FORMAT" \
  --model "$MODEL" \
  "$PROMPT_CONTENT"
AGENT_EXIT=$?
set -e

git diff --name-only > "$AFTER_DIFF" || true

# Compute changed files since before
CHANGED_FILES="$(comm -13 <(sort "$BEFORE_DIFF") <(sort "$AFTER_DIFF") || true)"

is_allowed_change() {
  local f="$1"
  # Always allow internal prompt files
  if [[ "$f" == ".cursor/"* ]]; then return 0; fi
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

echo "[run-cursor-task] OK" >&2


