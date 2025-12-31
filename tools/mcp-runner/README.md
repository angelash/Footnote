# Windows MCP Runner（无 Cursor CLI）方案说明

> 适用场景：Windows 环境**没有 cursor-agent**，但需要执行“浏览器测试 / ChromeMCP / Browser MCP / 多模态识别”等任务。
>
> 核心思路：在 Windows 侧运行一个**独立程序**（MCP Runner），通过调用大模型 API 生成工具调用，再通过 MCP 协议调用 Browser/Chrome MCP 工具完成操作。

---

## 1. 与现有方案的关系

- **WSL 侧（默认执行器）**：仍使用 `cursor-agent` 执行代码/文档任务（见 `tools/n8n/run-cursor-task.sh`）。
- **Windows 侧（浏览器/MCP任务）**：使用本目录下的 `mcp-runner.mjs` 驱动 MCP（代替 `cursor-agent --browser`）。

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

### 2.2 大模型 API Key
MCP Runner 将从环境变量读取 API Key（不要提交到仓库）：
- `OPENAI_API_KEY`（后续可扩展 Anthropic/Gemini）

---

## 3. 目前实现的能力（MVP）

`mcp-runner.mjs` 目前提供 **MCP 连通性冒烟**（不含完整 agent loop）：
- `tools/list`：列出 MCP server 暴露的工具
- `tools/call`：按名称调用一个工具（参数为 JSON）

这两项足以验证 “Windows 上独立程序 ↔ MCP 服务” 的链路是通的。

---

## 4. 使用方法

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

---

## 5. 下一步（落地到“模型 API 驱动 MCP”）

1. **把 MCP tools/list 的 schema 转换为 LLM function/tool schema**
2. **实现 agent loop**：
   - prompt → LLM 产出 tool call → MCP tools/call → 结果回灌 → 直到输出 final
3. **接入模型策略**（与你的约定一致）：
   - doc → `gpt-5.2`
   - code → `opus-4.5`
   - multimodal → `gemini-3-pro`
   - complexity=high/max → 对应 high/max 档
4. **加入护栏**：
   - 浏览器任务默认只读/只测（禁止写代码）
   - 若允许写代码，必须限制到 Deliverables 白名单


