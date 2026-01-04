# WSL Runner（wsl-cursor-runner）

## 目的

在 WSL 内提供一个 HTTP Runner，供 n8n 工作流调用，从而避免依赖 n8n 的 `Execute Command` 节点。

## 端口与健康检查

- 默认监听：`http://127.0.0.1:3210`
- 健康检查：`GET /health`

## 固定流程 v1（/fixed-flow）

`POST /fixed-flow`：按固定 stage 自动流转并落盘到：

`docs/05_logs/automation_runs/<run_id>/...`

### 异步启动（推荐）

默认以异步方式启动：接口会立刻返回 `run_id`，后台继续跑完整流程。

查询状态：

`GET /fixed-flow/status?run_id=<run_id>`

### 提交时机（重要）

> 新约束：**只有真正完成（`stage=99`）才允许 commit/push**。

因此该 runner 会先写入：
- `07_notify.json`（通知结果）
- `status.json`（`stage=99`）

再执行 `git add/commit/push`，避免“流程还没 done 但 main 已出现 commit”的观感混乱。

> 注：为了满足“stage=99 后才提交”，Runner 在 commit/push 时不会再更新 `status.json`（否则会造成“已提交但工作区又被写脏”的问题）。

### 必要前提（否则会在 git 阶段失败）

WSL 环境必须配置 git identity（用于自动 commit）：

```bash
git config --global user.name "Footnote Bot"
git config --global user.email "footnote-bot@local"
```

> 注意：该配置只影响 WSL 自动化提交，不影响 Windows 的人工提交身份。


