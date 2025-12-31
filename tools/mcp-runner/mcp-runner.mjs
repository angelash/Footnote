#!/usr/bin/env node
/**
 * Minimal MCP client runner (Windows-friendly).
 *
 * MVP goal:
 * - verify connectivity to an MCP server over HTTP
 * - list tools (tools/list)
 * - call tool (tools/call)
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

async function main() {
  if (!command || command === "-h" || command === "--help") {
    // eslint-disable-next-line no-console
    console.log(`Usage:
  node tools/mcp-runner/mcp-runner.mjs list-tools --mcp-url <url>
  node tools/mcp-runner/mcp-runner.mjs call-tool  --mcp-url <url> --tool <name> --args <json>

Examples:
  node tools/mcp-runner/mcp-runner.mjs list-tools --mcp-url http://localhost:3000/mcp
  node tools/mcp-runner/mcp-runner.mjs call-tool --mcp-url http://localhost:3000/mcp --tool browser_navigate --args '{"url":"http://localhost:5173"}'
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

  die(`Unknown command: ${command}`);
}

await main();


