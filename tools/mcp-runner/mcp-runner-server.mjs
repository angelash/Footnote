#!/usr/bin/env node
/**
 * Windows MCP Runner HTTP server
 * - Exposes POST /agent for n8n HTTP Request node (no executeCommand needed)
 * - Internally calls runAgent() from mcp-runner.mjs
 */

import http from "node:http";

import { runAgent } from "./mcp-runner.mjs";

function json(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parseJsonSafe(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function handle(req, res) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/agent") {
    const raw = await readBody(req);
    const parsed = parseJsonSafe(raw || "{}");
    if (!parsed.ok) {
      json(res, 400, { ok: false, error: `Invalid JSON: ${parsed.error}` });
      return;
    }

    const body = parsed.value ?? {};
    const mcpUrl = body.mcp_url || body.mcpUrl;
    const prompt = body.prompt;
    const taskType = body.task_type || body.taskType || "browser-test";
    const complexity = body.complexity || "normal";
    const modelOverride = body.model_override || body.modelOverride || "";

    if (!mcpUrl || typeof mcpUrl !== "string") {
      json(res, 400, { ok: false, error: "mcp_url is required" });
      return;
    }
    if (!prompt || typeof prompt !== "string") {
      json(res, 400, { ok: false, error: "prompt is required" });
      return;
    }

    try {
      const final = await runAgent({
        mcpUrl,
        prompt,
        taskType,
        complexity,
        modelOverride,
      });
      json(res, 200, { ok: true, final });
    } catch (e) {
      json(res, 500, { ok: false, error: String(e) });
    }
    return;
  }

  json(res, 404, { ok: false, error: "not_found" });
}

function main() {
  const port = Number(process.env.MCP_RUNNER_PORT || 3980);
  const host = process.env.MCP_RUNNER_HOST || "127.0.0.1";

  const server = http.createServer((req, res) => {
    handle(req, res).catch((e) => json(res, 500, { ok: false, error: String(e) }));
  });

  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`[mcp-runner-server] listening on http://${host}:${port}`);
  });
}

main();


