#!/usr/bin/env node
/**
 * WSL Cursor Runner HTTP server
 * - Exposes POST /execute for secondary n8n to trigger cursor-agent via tools/n8n/run-cursor-task.sh
 * - Avoids using n8n Execute Command node (may be unavailable/disabled)
 */

import http from "node:http";
import { spawn } from "node:child_process";

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

function runBash(command, cwd, extraEnv = {}) {
  return new Promise((resolve) => {
    const child = spawn("bash", ["-lc", command], {
      cwd,
      env: { ...process.env, ...extraEnv },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d.toString("utf8")));
    child.stderr.on("data", (d) => (stderr += d.toString("utf8")));
    child.on("close", (code) => resolve({ code: code ?? 0, stdout, stderr }));
  });
}

async function handle(req, res) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "127.0.0.1"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/execute") {
    const raw = await readBody(req);
    const parsed = parseJsonSafe(raw || "{}");
    if (!parsed.ok) {
      json(res, 400, { ok: false, error: `Invalid JSON: ${parsed.error}` });
      return;
    }

    const body = parsed.value ?? {};
    const projectRoot = body.project_root_wsl || process.env.PROJECT_ROOT_WSL || "/home/shash/work/Footnote";
    const taskPackPath = body.task_pack_path || "docs/03_taskpacks/T-0001_c0_z1_dialogue.md";
    const prompt = body.prompt || "";
    const taskType = body.task_type || "code";
    const complexity = body.complexity || "normal";
    const modelOverride = body.model_override || "auto";

    if (!prompt || typeof prompt !== "string") {
      json(res, 400, { ok: false, error: "prompt is required" });
      return;
    }

    // Write prompt to .cursor/current_task_prompt.md then run run-cursor-task.sh
    const cmd = [
      `cd "${projectRoot}"`,
      `mkdir -p .cursor`,
      // Use printf to preserve newlines safely (JSON already decoded)
      `python3 - <<'PY'\nimport os\np=os.environ.get('PROMPT','')\nos.makedirs('.cursor', exist_ok=True)\nopen('.cursor/current_task_prompt.md','w',encoding='utf-8').write(p)\nprint('wrote .cursor/current_task_prompt.md')\nPY`,
      `tools/n8n/run-cursor-task.sh "$(cat .cursor/current_task_prompt.md)" --task-pack-path "${taskPackPath}" --task-type "${taskType}" --complexity "${complexity}" --model-override "${modelOverride}"`,
    ].join(" && ");

    const { code, stdout, stderr } = await runBash(cmd, projectRoot, { PROMPT: prompt });
    json(res, 200, { ok: code === 0, exitCode: code, stdout, stderr });
    return;
  }

  json(res, 404, { ok: false, error: "not_found" });
}

function main() {
  const port = Number(process.env.CURSOR_RUNNER_PORT || 3990);
  const host = process.env.CURSOR_RUNNER_HOST || "127.0.0.1";

  const server = http.createServer((req, res) => {
    handle(req, res).catch((e) => json(res, 500, { ok: false, error: String(e) }));
  });

  server.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`[cursor-runner-server] listening on http://${host}:${port}`);
  });
}

main();


