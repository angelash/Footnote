# WSL Runner（wsl-cursor-runner）

## 目的

在 WSL 内提供一个 HTTP Runner，供 n8n 工作流调用，从而避免依赖 n8n 的 `Execute Command` 节点。

## 端口与健康检查

- 默认监听：`http://127.0.0.1:3210`
- 健康检查：`GET /health`

## 工作目录

默认 `project_root` 为 `/mnt/f/workspace/github/Footnote`，通过 WSL 的 `/mnt/` 挂载访问 Windows 文件系统。

> **注意**：WSL 和 Windows 访问的是**同一个物理仓库**，无需通过 git 同步。

## Git 提交控制（skip_git）

### 背景

之前 WSL 有独立的仓库副本时，需要自动 git commit 来同步变更。现在统一使用同一个仓库后，**默认关闭自动提交**，由人工控制。

### 使用方式

所有 FlowSpec 流程都支持 `skip_git` 参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `skip_git` | boolean | `true` | `true`=跳过 Git 提交，`false`=执行 Git 提交推送 |

### 调用示例

```bash
# 默认跳过 git（人工提交）
curl -X POST http://localhost:3210/run-tester \
  -H "Content-Type: application/json" \
  -d '{"task_id": "T-001", "task_pack_path": "..."}'

# 显式启用 git 自动提交
curl -X POST http://localhost:3210/run-tester \
  -H "Content-Type: application/json" \
  -d '{"task_id": "T-001", "task_pack_path": "...", "skip_git": false}'
```

### 后续规划

等系统流转完全成熟、产出可控后，可将 `skip_git` 默认值改为 `false` 实现全自动提交。

## 固定流程（/fixed-flow）

`POST /fixed-flow`：按固定 stage 自动流转并落盘到：

`workflows/project/logs/automation_runs/<run_id>/...`

### 异步启动（推荐）

默认以异步方式启动：接口会立刻返回 `run_id`，后台继续跑完整流程。

查询状态：

`GET /fixed-flow/status?run_id=<run_id>`

### Git 提交（可选）

当 `skip_git=false` 时：
- 只有流程完成（`stage=99`）才执行 commit/push
- 避免"流程未完成但已提交"的问题

### 必要前提（仅在启用 git 时需要）

WSL 环境必须配置 git identity：

```bash
git config --global user.name "Footnote Bot"
git config --global user.email "footnote-bot@local"
```

> 注意：该配置只影响 WSL 自动化提交，不影响 Windows 的人工提交身份。
