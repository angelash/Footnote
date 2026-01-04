# WSL Runner（wsl-cursor-runner）

## 目的

在 WSL 内提供一个 HTTP Runner，供 n8n 工作流调用，从而避免依赖 n8n 的 `Execute Command` 节点。

## 端口与健康检查

- 默认监听：`http://127.0.0.1:3210`
- 健康检查：`GET /health`

## 固定流程 v1（/fixed-flow）

`POST /fixed-flow`：按固定 stage 自动流转并落盘到：

`docs/05_logs/automation_runs/<run_id>/...`

### 必要前提（否则会在 git 阶段失败）

WSL 环境必须配置 git identity（用于自动 commit）：

```bash
git config --global user.name "Footnote Bot"
git config --global user.email "footnote-bot@local"
```

> 注意：该配置只影响 WSL 自动化提交，不影响 Windows 的人工提交身份。


