#!/usr/bin/env bash
#
# 触发“缺失审查”的批量执行脚本（供 l0-audit-intake 调用）
#
# 设计目标：
# - 尽可能触发 Code/Design/QA 审查以生成 review 记录
# - 即使部分触发失败，也不要让总体审核流程失败（脚本最终 exit 0）
#
set -uo pipefail

AUDIT_ID="${AUDIT_ID:-}"
PERIOD_DAYS="${PERIOD_DAYS:-7}"
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"

INCLUDE_CODE_REVIEW="${INCLUDE_CODE_REVIEW:-true}"
INCLUDE_DESIGN_REVIEW="${INCLUDE_DESIGN_REVIEW:-true}"
INCLUDE_QA_SIGNOFF="${INCLUDE_QA_SIGNOFF:-true}"

QA_AUTO_CHECKS="${QA_AUTO_CHECKS:-lint,typecheck,test,build}"
QA_SIGNER="${QA_SIGNER:-L3_tester}"
REVIEWER="${REVIEWER:-AI}"

# Runner 访问地址：
# - 在部分 WSL 环境中，服务并不监听 127.0.0.1/localhost，只能通过 WSL 自身 IP 访问
# - 为了让“完整审核 -> 自动触发子审查”稳定工作，这里默认探测 WSL IP
if [ -z "${RUNNER_BASE_URL:-}" ]; then
  wsl_ip="$(hostname -I 2>/dev/null | cut -d' ' -f1 | tr -d '\n' || true)"
  if [ -n "$wsl_ip" ]; then
    RUNNER_BASE_URL="http://${wsl_ip}:3210"
  else
    RUNNER_BASE_URL="http://127.0.0.1:3210"
  fi
fi

if [ -z "$AUDIT_ID" ]; then
  echo "ERROR: AUDIT_ID is required" >&2
  # 这里仍然 exit 0，避免影响总体审核；但会在 stdout 留下错误提示
  echo "auto_trigger_failed=1"
  exit 0
fi

failures=0
triggered_code=0
triggered_design=0
triggered_qa=0

log() {
  # 统一前缀，便于在 node_runs.json 中检索
  echo "[audit:auto-trigger] $*"
}

post_json() {
  local url="$1"
  local body="$2"

  if command -v curl >/dev/null 2>&1; then
    curl -sS -X POST "$url" -H "Content-Type: application/json" -d "$body"
    return $?
  fi

  # fallback: node fetch（WSL Runner 一定有 node）
  node -e "fetch(process.argv[1],{method:'POST',headers:{'Content-Type':'application/json'},body:process.argv[2]}).then(r=>r.text()).then(t=>{process.stdout.write(t||'');}).catch(e=>{console.error(String(e&&e.message||e)); process.exit(2);});" "$url" "$body"
  return $?
}

resp_ok() {
  # 通过简单匹配判断 ok 字段（避免依赖 jq）
  # 返回：0=ok true；1=其他
  local resp="$1"
  echo "$resp" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'
}

log "start"
log "audit_id=$AUDIT_ID"
log "project_root=$PROJECT_ROOT"
log "period_days=$PERIOD_DAYS"
log "include_code_review=$INCLUDE_CODE_REVIEW include_design_review=$INCLUDE_DESIGN_REVIEW include_qa_signoff=$INCLUDE_QA_SIGNOFF"
log "qa_auto_checks=$QA_AUTO_CHECKS qa_signer=$QA_SIGNER reviewer=$REVIEWER"

# --------------------------------------------
# 1) Code Review：对周期内 commit 做一次聚合审查
# --------------------------------------------
if [ "$INCLUDE_CODE_REVIEW" = "true" ]; then
  since_commit="$(git rev-list --reverse --since="$PERIOD_DAYS days ago" HEAD 2>/dev/null | head -1 || true)"
  if [ -n "$since_commit" ]; then
    commit_range="${since_commit}..HEAD"
    log "trigger code review: commit_range=$commit_range"
    body="$(printf '{"project_root":"%s","task_id":"%s","title":"%s","commit_range":"%s","reviewer":"%s","async":false}' \
      "$PROJECT_ROOT" \
      "${AUDIT_ID}-CODE" \
      "Auto Code Review for ${AUDIT_ID}" \
      "$commit_range" \
      "$REVIEWER")"
    resp="$(post_json "${RUNNER_BASE_URL}/review/code" "$body" 2>/dev/null || true)"
    if resp_ok "$resp"; then
      triggered_code=1
      log "code review started/finished ok"
    else
      failures=$((failures + 1))
      log "code review failed (response not ok)"
      log "code review response: ${resp:0:400}"
    fi
  else
    log "skip code review: no commits in period"
  fi
else
  log "skip code review: disabled"
fi

# --------------------------------------------
# 2) Design Review：对周期内 Spec 做逐文件审查
# --------------------------------------------
if [ "$INCLUDE_DESIGN_REVIEW" = "true" ]; then
  while IFS= read -r spec; do
    [ -z "$spec" ] && continue
    log "trigger design review: doc_path=$spec"
    body="$(printf '{"project_root":"%s","doc_path":"%s","doc_type":"spec","reviewer":"%s","async":false}' \
      "$PROJECT_ROOT" "$spec" "$REVIEWER")"
    resp="$(post_json "${RUNNER_BASE_URL}/review/design" "$body" 2>/dev/null || true)"
    if resp_ok "$resp"; then
      triggered_design=$((triggered_design + 1))
      log "design review ok: $spec"
    else
      failures=$((failures + 1))
      log "design review failed: $spec"
      log "design review response: ${resp:0:400}"
    fi
  done < <(find design/ai-native/02_specs -name '*.md' -mtime "-${PERIOD_DAYS}" 2>/dev/null | sort)
else
  log "skip design review: disabled"
fi

# --------------------------------------------
# 3) QA Signoff：对周期内 TaskPack 做逐文件签字（会执行 lint/typecheck/test/build）
# --------------------------------------------
if [ "$INCLUDE_QA_SIGNOFF" = "true" ]; then
  while IFS= read -r taskpack; do
    [ -z "$taskpack" ] && continue
    task_id="$(grep -m1 '^task_id:' "$taskpack" 2>/dev/null | sed 's/^task_id:[[:space:]]*//; s/\"//g' | tr -d '\r' || true)"
    if [ -z "$task_id" ]; then
      base="$(basename "$taskpack")"
      task_id="TASKPACK-${base%.*}"
    fi

    log "trigger qa signoff: task_id=$task_id task_pack_path=$taskpack auto_checks=$QA_AUTO_CHECKS"
    body="$(printf '{"project_root":"%s","task_id":"%s","task_pack_path":"%s","auto_checks":"%s","signer":"%s","async":false}' \
      "$PROJECT_ROOT" "$task_id" "$taskpack" "$QA_AUTO_CHECKS" "$QA_SIGNER")"
    resp="$(post_json "${RUNNER_BASE_URL}/review/qa-signoff" "$body" 2>/dev/null || true)"
    if resp_ok "$resp"; then
      triggered_qa=$((triggered_qa + 1))
      log "qa signoff ok: $taskpack"
    else
      failures=$((failures + 1))
      log "qa signoff failed: $taskpack"
      log "qa signoff response: ${resp:0:400}"
    fi
  done < <(find design/ai-native/03_taskpacks -name '*.md' -mtime "-${PERIOD_DAYS}" 2>/dev/null | sort)
else
  log "skip qa signoff: disabled"
fi

log "done"
echo "code_review_triggered=${triggered_code}"
echo "design_review_triggered=${triggered_design}"
echo "qa_signoff_triggered=${triggered_qa}"
echo "auto_trigger_failed=$([ "$failures" -gt 0 ] && echo 1 || echo 0)"
echo "auto_trigger_failures=${failures}"

# 关键：不让总体审核失败
exit 0

