#!/usr/bin/env node
/**
 * Minimal MCP client runner (Windows-friendly).
 *
 * MVP goal:
 * - verify connectivity to an MCP server over HTTP
 * - list tools (tools/list)
 * - call tool (tools/call)
 * - beta: LLM drives MCP tool calls via CUSTOM_API_URL (/chat/completions)
 *
 * NOTE:
 * - This is NOT the full "LLM drives MCP" agent loop yet.
 * - It exists to validate infrastructure and unblock n8n integration.
 */

const die = (msg) => {
  // eslint-disable-next-line no-console
  console.error(`[mcp-runner] ERROR: ${msg}`);
  process.exit(1);
};

const argv = process.argv.slice(2);
const command = argv[0];

const getArg = (name, fallback = undefined) => {
  const idx = argv.indexOf(name);
  if (idx === -1) return fallback;
  const v = argv[idx + 1];
  if (!v) die(`Missing value for ${name}`);
  return v;
};

const parseJson = (s, label) => {
  try {
    return JSON.parse(s);
  } catch (e) {
    die(`Invalid JSON for ${label}: ${String(e)}`);
  }
};

const readEnv = (name) => process.env[name] ?? "";

const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/+$/, "");

const toCompletionUrl = (baseUrl) => `${normalizeBaseUrl(baseUrl)}/chat/completions`;

const stringifySafe = (v) => {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
};

const coerceTextContent = (content) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    // Some OpenAI-compatible APIs return content as an array of parts.
    return content
      .map((p) => {
        if (typeof p === "string") return p;
        if (p && typeof p === "object" && typeof p.text === "string") return p.text;
        if (p && typeof p === "object" && typeof p.content === "string") return p.content;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
};

async function callCustomChatCompletions({ model, messages, temperature }) {
  const apiUrl = readEnv("CUSTOM_API_URL");
  const apiKey = readEnv("CUSTOM_API_KEY");
  if (!apiUrl) die("CUSTOM_API_URL is required for agent mode");
  if (!apiKey) die("CUSTOM_API_KEY is required for agent mode");

  const url = toCompletionUrl(apiUrl);

  const payload = {
    model,
    messages,
    stream: false,
  };
  if (typeof temperature === "number") payload.temperature = temperature;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  if (!res.ok) {
    die(`LLM HTTP ${res.status}: ${text}`);
  }

  const json = parseJson(text, "LLM response");
  const choice = json?.choices?.[0];
  const msg = choice?.message;
  const content = coerceTextContent(msg?.content);
  if (!content) die(`LLM returned empty content: ${stringifySafe(json)}`);
  return content;
}

function pickModelFromPolicy({ taskType, complexity }) {
  // Use CUSTOM_MODELS if present; otherwise fall back to hardcoded IDs.
  // You can always override via --model.
  const raw = readEnv("CUSTOM_MODELS");
  const models = raw ? parseJson(raw, "CUSTOM_MODELS") : {};

  const has = (id) => Boolean(models && typeof models === "object" && id in models);

  // Default IDs (as per user-provided examples)
  const DOC = has("gpt-5-chat-latest") ? "gpt-5-chat-latest" : "gpt-5-chat-latest";
  const CODE = has("claude-opus-4-5-20251101") ? "claude-opus-4-5-20251101" : "claude-opus-4-5-20251101";
  const REASONER = has("deepseek-reasoner") ? "deepseek-reasoner" : "deepseek-reasoner";
  const SONNET = has("claude-sonnet-4-5-20250929") ? "claude-sonnet-4-5-20250929" : "claude-sonnet-4-5-20250929";

  if (taskType === "code") return CODE;
  if (taskType === "doc") {
    if (complexity === "high" || complexity === "max") return SONNET;
    return DOC;
  }
  if (taskType === "browser-test") {
    // Windows 浏览器测试/ChromeMCP 任务：默认用文档/通用模型驱动工具调用
    // 如需更强推理或特定模型，使用 --model 覆盖。
    if (complexity === "high" || complexity === "max") return SONNET;
    return DOC;
  }
  if (taskType === "multimodal") {
    // No explicit multimodal model provided in CUSTOM_MODELS; require override for correctness.
    return DOC;
  }

  // Fallback
  if (complexity === "high" || complexity === "max") return REASONER;
  return DOC;
}

/**
 * The MCP HTTP transport format varies by server implementation.
 * Many servers accept JSON-RPC 2.0 with methods like "tools/list" and "tools/call".
 *
 * This client uses a conservative JSON-RPC request body:
 * { jsonrpc: "2.0", id, method, params }
 */
async function mcpRpc(mcpUrl, method, params) {
  const body = {
    jsonrpc: "2.0",
    id: Date.now(),
    method,
    params,
  };

  const res = await fetch(mcpUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    die(`HTTP ${res.status} from MCP server: ${text}`);
  }

  const json = parseJson(text, "MCP response");
  if (json.error) {
    die(`MCP error: ${JSON.stringify(json.error)}`);
  }
  return json.result;
}

async function listTools(mcpUrl) {
  // try both "tools/list" and "tools.list" for compatibility
  try {
    return await mcpRpc(mcpUrl, "tools/list", {});
  } catch {
    return await mcpRpc(mcpUrl, "tools.list", {});
  }
}

async function callTool(mcpUrl, toolName, args) {
  const params = { name: toolName, arguments: args };
  try {
    return await mcpRpc(mcpUrl, "tools/call", params);
  } catch {
    return await mcpRpc(mcpUrl, "tools.call", params);
  }
}

const extractFirstJson = (text) => {
  // Try to locate the first JSON object in a model's response.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
};

async function runAgent({ mcpUrl, prompt, taskType, complexity, modelOverride }) {
  const model = modelOverride || pickModelFromPolicy({ taskType, complexity });

  // We keep the protocol extremely strict to make parsing deterministic.
  const system = [
    "You are an automation agent that can call MCP tools.",
    "You MUST respond with a single JSON object ONLY, no markdown, no prose.",
    'Response schema: {"toolCalls":[{"name":"<toolName>","arguments":{...}}]} OR {"final":"..."}',
    "If you call tools, keep toolCalls length <= 3 per step.",
    "Use only the tool names provided.",
  ].join("\n");

  const tools = await listTools(mcpUrl);
  const toolNames = Array.isArray(tools?.tools)
    ? tools.tools.map((t) => t?.name).filter(Boolean)
    : [];

  const contextToolList = toolNames.length
    ? `Available tools:\n${toolNames.map((n) => `- ${n}`).join("\n")}`
    : "Available tools: (tool listing unavailable)";

  let transcript = [];
  let lastObservation = "";

  for (let step = 0; step < 6; step += 1) {
    const user = [
      `TaskType=${taskType} Complexity=${complexity}`,
      contextToolList,
      prompt,
      lastObservation ? `LastObservation:\n${lastObservation}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const content = await callCustomChatCompletions({
      model,
      messages: [
        { role: "system", content: system },
        ...transcript,
        { role: "user", content: user },
      ],
      temperature: 0.2,
    });

    const parsed = extractFirstJson(content);
    if (!parsed) die(`Agent output is not valid JSON: ${content}`);

    if (typeof parsed.final === "string") {
      // eslint-disable-next-line no-console
      console.log(parsed.final);
      return;
    }

    const toolCalls = Array.isArray(parsed.toolCalls) ? parsed.toolCalls : [];
    if (toolCalls.length === 0) {
      die(`Agent returned neither final nor toolCalls: ${content}`);
    }

    const observations = [];
    for (const tc of toolCalls) {
      const name = tc?.name;
      const args = tc?.arguments ?? {};
      if (!name || typeof name !== "string") die(`Invalid tool call: ${stringifySafe(tc)}`);
      if (toolNames.length && !toolNames.includes(name)) {
        die(`Tool not allowed (not in tools/list): ${name}`);
      }
      const result = await callTool(mcpUrl, name, args);
      observations.push({ name, result });
    }

    lastObservation = JSON.stringify(observations, null, 2);
    transcript.push({ role: "assistant", content });
    transcript.push({ role: "user", content: `ToolResults:\n${lastObservation}` });
  }

  die("Agent exceeded max steps without returning final");
}

async function main() {
  if (!command || command === "-h" || command === "--help") {
    // eslint-disable-next-line no-console
    console.log(`Usage:
  node tools/mcp-runner/mcp-runner.mjs list-tools --mcp-url <url>
  node tools/mcp-runner/mcp-runner.mjs call-tool  --mcp-url <url> --tool <name> --args <json>
  node tools/mcp-runner/mcp-runner.mjs agent     --mcp-url <url> --prompt <text> [--task-type doc|code|multimodal|browser-test] [--complexity normal|high|max] [--model <id>]

Examples:
  node tools/mcp-runner/mcp-runner.mjs list-tools --mcp-url http://localhost:3000/mcp
  node tools/mcp-runner/mcp-runner.mjs call-tool --mcp-url http://localhost:3000/mcp --tool browser_navigate --args '{"url":"http://localhost:5173"}'
  node tools/mcp-runner/mcp-runner.mjs agent --mcp-url http://localhost:3000/mcp --task-type doc --model gpt-5-chat-latest --prompt "打开百度并截图"
`);
    return;
  }

  const mcpUrl = getArg("--mcp-url");
  if (!mcpUrl) die("--mcp-url required");

  if (command === "list-tools") {
    const result = await listTools(mcpUrl);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "call-tool") {
    const toolName = getArg("--tool");
    const argsStr = getArg("--args", "{}");
    const args = parseJson(argsStr, "--args");
    const result = await callTool(mcpUrl, toolName, args);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (command === "agent") {
    const prompt = getArg("--prompt");
    if (!prompt) die("--prompt required");
    const taskType = getArg("--task-type", "doc");
    const complexity = getArg("--complexity", "normal");
    const modelOverride = getArg("--model", "");
    await runAgent({
      mcpUrl,
      prompt,
      taskType,
      complexity,
      modelOverride: modelOverride || "",
    });
    return;
  }

  die(`Unknown command: ${command}`);
}

await main();


