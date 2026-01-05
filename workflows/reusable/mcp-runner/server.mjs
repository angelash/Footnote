#!/usr/bin/env node
/**
 * Windows MCP Runner HTTP service.
 *
 * Why: Some n8n builds in this repo do not include "Execute Command" node.
 * This service replaces executeCommand by providing an HTTP endpoint that
 * runs workflows/reusable/mcp-runner/mcp-runner.mjs "agent" logic inside Node.
 *
 * Endpoints:
 * - GET  /health
 * - POST /agent  { mcp_url, prompt, task_type, complexity, model_override }
 *
 * Env:
 * - PORT (default 3211)
 * - HOST (default 127.0.0.1)
 * - CUSTOM_API_URL, CUSTOM_API_KEY, CUSTOM_MODELS (required for agent)
 */

import http from "node:http";
import { runAgent } from "./mcp-runner.mjs";

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || "3211");

const json = (res, statusCode, body) => {
  const data = JSON.stringify(body);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(data),
  });
  res.end(data);
};

const readJsonBody = async (req) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid JSON body: ${String(e)}`);
  }
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return json(res, 200, { ok: true, service: "mcp-runner", pid: process.pid });
    }

    if (req.method === "POST" && req.url === "/agent") {
      const body = await readJsonBody(req);
      const mcpUrl = body.mcp_url || body.mcpUrl;
      const prompt = body.prompt || "";
      const taskType = body.task_type || body.taskType || "browser-test";
      const complexity = body.complexity || "normal";
      const modelOverride = body.model_override || body.modelOverride || "";

      if (!mcpUrl) return json(res, 400, { ok: false, error: "mcp_url is required" });
      if (!prompt) return json(res, 400, { ok: false, error: "prompt is required" });

      const startedAt = Date.now();
      const output = await runAgent({
        mcpUrl,
        prompt,
        taskType,
        complexity,
        modelOverride,
      });

      return json(res, 200, {
        ok: true,
        elapsed_ms: Date.now() - startedAt,
        output,
      });
    }

    return json(res, 404, { ok: false, error: "not_found" });
  } catch (e) {
    return json(res, 500, { ok: false, error: String(e?.message || e) });
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[mcp-runner-server] listening on http://${HOST}:${PORT}`);
});


