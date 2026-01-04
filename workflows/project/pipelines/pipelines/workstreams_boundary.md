# 两条线的边界规范：环境部署/流程改进 vs 产品生产（v1）

> 目的：把“改流程/改部署”与“做产品/出产物”两条线彻底拆开，避免互相污染；同时让 n8n 可以作为控制塔，按固定流程自动流转，并把每一步结果落盘（当前 `resume_from_stage` 续跑能力仍在持续补齐中）。

---

## 0. 一句话定义

- **环境部署/流程改进线（Env/Process）**：让“工厂流水线本身”可用、可观测、可续跑、可升级。
- **实际产品生产线（Production）**：用已稳定的流水线，持续产出游戏内容/代码/资源，并进入岗位 Review。

---

## 1. 工作环境边界（强制）

### 1.1 Windows vs WSL 的角色分工

| 维度 | Windows（工作区/人工操作） | WSL（执行/运行环境） |
|---|---|---|
| **职责** | 修改流程/部署代码、调整规格、人工提交 push | 拉取最新 main 后运行：n8n、runner、cursor-cli 执行 |
| **真源** | **GitHub main 为真源**；Windows 负责提交 push（Env/Process） | **不直接提交** Env/Process 改动；只 pull 使用 |
| **n8n 设置** |（可选）浏览器/ChromeMCP 在 Windows | **n8n(5680) UI 配置由网页操作**（控制塔） |
| **自动化执行** | 不跑 cursor-cli（或仅辅助） | cursor-cli/校验/落盘/git push（Production） |

> 关键规则：  
> - **Env/Process 改动：Windows 改 → 人工 push → WSL pull 部署**  
> - **Production 任务：n8n 自动触发 → WSL 执行并（按流程）commit/push → Windows/团队 pull & review**

---

## 2. 两条线的输入/输出与变更范围（强制）

### 2.1 Env/Process 线（允许改动范围）

**目标**：让流水线“可用、可续跑、可观测、可控”。

- **允许修改（典型）**
  - `tools/n8n/**`（runner、脚本、pm2 配置、工作流导入文件）
  - `tools/mcp-runner/**`（Windows MCP runner）
  - `docs/02_specs/pipelines/**`（流程规格/标准）
  - `docs/05_logs/**`（建议仅新增**日志样例/说明**；避免提交“本机临时跑出来的杂项”）
- **禁止修改（强制冻结）**
  - `docs/00_charter/**`
  - `docs/01_bibles/**`

**提交策略（v1）**
- 由 Windows 工作区人工提交到 `main`（你确认先不做多分支）。
- 必须写清楚：变更动机、影响面、回滚方案（至少在 commit message 或变更日志里体现）。

### 2.2 Production 线（允许改动范围）

**目标**：产出产品交付物（代码/内容/资源/测试），并进入岗位 Review。

- **允许修改（典型）**
  - `src/**`, `tests/**`, `assets/**`, `design/**`, `docs/03_taskpacks/**`, `docs/04_acceptance/**`, `docs/05_logs/**(本次run工件)`
- **禁止修改（强制冻结）**
  - `docs/00_charter/**`
  - `docs/01_bibles/**`

**提交策略（v1）**
- 由 n8n 固定流程在 WSL 执行完成后 **自动 commit/push main**（你确认允许）。
- 当出现冲突/脏工作区：流程必须 **Fail 并落盘**，不允许“带病 push”；人工介入修复后可重跑（建议新 `run_id`）。
- 串行锁：Runner 版本可通过 `_lock/` 做“锁忙即失败”；n8n 原生 fixed-flow 目前尚未加入锁节点（需人工避免并发触发）。

> 重要对齐（当前落地行为）：`fixedflow-v1-001` 在 git 阶段使用 `git add -A`，因此 `docs/05_logs/automation_runs/<run_id>/` 的审计文件会随提交入库。若你希望“审计落盘但不入库”，需要后续调整 `.gitignore` 或改工作流 git add 白名单策略。

---

## 3. 固定流程标准（Production 线强制遵守）

Production 线必须遵守：
- `docs/02_specs/pipelines/n8n_fixed_flow_standard.md`

核心约束（摘要）：
- **自动流转**：默认 `auto=true`
- **全程落盘**：`docs/05_logs/automation_runs/<run_id>/...`
- **可续跑（现状）**：保留 `resume_from_stage` 参数，但 fixed-flow 目前仅实现“跳过 preflight”；需要重跑建议新 `run_id`
- **单任务串行（现状）**：Runner 版本有 `_lock/`；n8n 原生 fixed-flow 暂无锁

---

## 4. 审计与可观测性（两条线都要）

### 4.1 Production（必须）
- 每次运行必须可追溯：
  - `run_id / task_id / stage / ok`
  - commit hash（如有）
  - 产物路径（Deliverables）
  - 日志目录：`docs/05_logs/automation_runs/<run_id>/`

### 4.2 Env/Process（建议）
- 每次改动建议同步更新：
  - `docs/02_specs/pipelines/*`（规格/约束）
  - `tools/n8n/*`（部署/运维说明）

---

## 5. v1 的已知限制（先接受，后续再进化）

- 单 repo 单任务串行（避免并发写）
- 允许直接 push main（PoC 期策略）
- 不做多 workspace pool / worktree（未来多人并发必做）

> v2 演进方向：多 workspace、多分支 + PR、合并队列、冲突人工合并、权限隔离。


