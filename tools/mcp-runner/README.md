# Windows MCP Runner（无 Cursor CLI）方案说明

> 适用场景：Windows 环境**没有 cursor-agent**，但需要执行“浏览器测试 / ChromeMCP / Browser MCP / 多模态识别”等任务。
>
> 核心思路：在 Windows 侧运行一个**独立程序**（MCP Runner），通过调用大模型 API 生成工具调用，再通过 MCP 协议调用 Browser/Chrome MCP 工具完成操作。

---

## 1. 与现有方案的关系（重要澄清）

- **Cursor CLI（cursor-agent）不会被本工具替换**：WSL 侧继续用 `cursor-agent` 跑代码/文档任务（见 `tools/n8n/run-cursor-task.sh`），并使用 Cursor 自有模型体系。
- **本工具只解决一个问题**：当 **Windows 没有 cursor-agent** 但需要跑浏览器/ChromeMCP/Browser MCP 时，用 `CUSTOM_API_URL` 的模型 API 来驱动 MCP 工具。

规格文档：
- `docs/02_specs/pipelines/n8n_cursor_cli_pipeline_spec.md`
- `docs/02_specs/pipelines/n8n_cursor_cli_rollout_plan.md`

---

## 2. 前置条件

### 2.1 Browser MCP（Chrome 扩展 + 服务）
参考仓库文档 `docs/智绘AI生图自动化演示文案.md`：
- Chrome 安装 Browser MCP 扩展
- Cursor 的 `~/.cursor/mcp.json` 示例：

```json
{
  "mcpServers": {
    "cursor-browser-extension": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

> 注意：`mcp-runner` 直接连 `http://localhost:3000/mcp`，不依赖 Cursor。

### 2.2 自定义模型 API（CUSTOM_*，仅用于 Windows MCP Runner）

MCP Runner 从环境变量读取（**不要提交到仓库**）：
- `CUSTOM_API_URL`：例如 `https://aihub.gz4399.com/v1`
- `CUSTOM_API_KEY`：Bearer key
- `CUSTOM_MODELS`：JSON 字符串，描述可用模型与默认温度等

> 注意：仓库 `.gitignore` 已忽略 `.env/.env.local`，你可以在本机用 `.env.local` 管理这些值。

---

## 3. 目前实现的能力（MVP）

`mcp-runner.mjs` 目前提供 **MCP 连通性冒烟**（不含完整 agent loop）：
- `tools/list`：列出 MCP server 暴露的工具
- `tools/call`：按名称调用一个工具（参数为 JSON）

并新增 **LLM 驱动 MCP 的最小闭环**（beta）：
- `agent`：调用 `CUSTOM_API_URL` 的 `chat/completions` 让模型产出工具调用 JSON → 执行 MCP tools/call → 回灌结果循环

这两项足以验证 “Windows 上独立程序 ↔ MCP 服务” 的链路是通的。

---

## 4. 使用方法

### 4.0 Windows 侧推荐入口（避免引号/换行坑）

当通过 n8n 的 Execute Command 节点调用时，建议使用包装脚本 `tools/mcp-runner/run-agent.ps1`，
通过 `PromptB64` 传入提示词，避免命令行引号/换行导致参数截断。

### 4.1 列出 MCP 工具

```bash
node tools/mcp-runner/mcp-runner.mjs list-tools --mcp-url http://localhost:3000/mcp
```

### 4.2 调用一个 MCP 工具（示例：navigate）

```bash
node tools/mcp-runner/mcp-runner.mjs call-tool \
  --mcp-url http://localhost:3000/mcp \
  --tool browser_navigate \
  --args "{\"url\":\"http://localhost:5173\"}"
```

### 4.3 运行 agent（模型 API 驱动 MCP）

先在本机环境变量中设置（示例，不要写入仓库）：

```bash
setx CUSTOM_API_URL "https://aihub.gz4399.com/v1"
setx CUSTOM_API_KEY "YOUR_KEY"
setx CUSTOM_MODELS "{\"gpt-5-chat-latest\":{\"temperature\":0.2,\"visible\":true}}"
```

然后执行：

```bash
node tools/mcp-runner/mcp-runner.mjs agent ^
  --mcp-url http://localhost:3000/mcp ^
  --task-type doc ^
  --complexity normal ^
  --model gpt-5-chat-latest ^
  --prompt "打开 http://localhost:5173 ，等待 2 秒，然后截图。"
```

### 4.4 浏览器测试任务（browser-test）

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File tools/mcp-runner/run-agent.ps1 `
  -McpUrl "http://localhost:3000/mcp" `
  -TaskType "browser-test" `
  -Complexity "normal" `
  -Prompt "打开目标页面，执行关键点击与截图，然后输出结论。"
```

---

## 5. 下一步（落地到“模型 API 驱动 MCP”）

1. **把 MCP tools/list 的 schema 转换为 LLM function/tool schema**
2. **实现 agent loop**：
   - prompt → LLM 产出 tool call → MCP tools/call → 结果回灌 → 直到输出 final
3. **接入模型策略**（以你提供的 `CUSTOM_MODELS` 为准）：
   - doc → `gpt-5-chat-latest`
   - code → `claude-opus-4-5-20251101`
   - reasoning/复杂任务 → `deepseek-reasoner`（可作为 high/max 默认）
   - ⚠️ multimodal：当前 `CUSTOM_MODELS` 未提供对应模型 ID，需补充（否则必须 `--model` 覆盖）
4. **加入护栏**：
   - 浏览器任务默认只读/只测（禁止写代码）
   - 若允许写代码，必须限制到 Deliverables 白名单


