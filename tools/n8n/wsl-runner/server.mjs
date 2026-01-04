#!/usr/bin/env node
/**
 * WSL Cursor Runner HTTP service.
 *
 * Why: n8n in this setup may not include Execute Command node, so workflows
 * must call an HTTP runner that executes shell commands inside WSL.
 *
 * Endpoints:
 * - GET  /health
 * - POST /execute-task      { task_pack_path, role, task_type, complexity, model_override, project_root? }
 * - POST /compose-taskpack  { ... taskpack fields ... }
 * - POST /fixed-flow        { task_id, title?, task_pack_path?, role?, task_type?, complexity?, model_override?, auto?, resume_from_stage?, run_id?, project_root? }
 *
 * Env:
 * - HOST (default 127.0.0.1)
 * - PORT (default 3210)
 */

import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || "3210");

const DEFAULT_PROJECT_ROOT = "/home/shash/work/Footnote";

const AUTOMATION_RUNS_DIR = "docs/05_logs/automation_runs";
const LOCK_DIR = path.posix.join(AUTOMATION_RUNS_DIR, "_lock");

const nowIso = () => new Date().toISOString();

const ensureDir = async (absDir) => {
  await fs.mkdir(absDir, { recursive: true });
};

const writeJson = async (absPath, data) => {
  await ensureDir(path.posix.dirname(absPath));
  await fs.writeFile(absPath, JSON.stringify(data, null, 2), "utf8");
};

const writeText = async (absPath, text) => {
  await ensureDir(path.posix.dirname(absPath));
  await fs.writeFile(absPath, text, "utf8");
};

function makeRunId() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const ts =
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    "-" +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds());
  const rnd = Math.random().toString(16).slice(2, 6);
  return `RUN-${ts}-${rnd}`;
}

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

const run = async (cmd, args, opts) =>
  await new Promise((resolve) => {
    const child = spawn(cmd, args, {
      ...opts,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (d) => stdout.push(d));
    child.stderr.on("data", (d) => stderr.push(d));
    child.on("close", (code) => {
      resolve({
        code: code ?? 0,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });

const safeResolveUnderProject = (projectRoot, relPath) => {
  // Normalize to prevent traversal.
  const abs = path.posix.resolve(projectRoot, relPath);
  const pr = path.posix.resolve(projectRoot);
  if (!abs.startsWith(pr + "/") && abs !== pr) {
    throw new Error(`Path escapes project_root: ${relPath}`);
  }
  return abs;
};

async function withRepoLock(projectRoot, runId, fn) {
  const lockAbs = safeResolveUnderProject(projectRoot, LOCK_DIR);
  const myLockAbs = path.posix.join(lockAbs, runId);
  try {
    // mkdir is atomic-ish; if lock exists -> fail fast (single-task serial).
    await fs.mkdir(lockAbs, { recursive: true });
    await fs.mkdir(myLockAbs);
  } catch (e) {
    throw new Error("lock_busy: another task is running");
  }

  try {
    return await fn();
  } finally {
    // best-effort unlock
    try {
      await fs.rm(myLockAbs, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

async function gitPreflight(projectRoot) {
  const startedAt = Date.now();
  const status = await run("bash", ["-lc", "git status --porcelain"], { cwd: projectRoot, env: process.env });
  if (status.code !== 0) {
    return { ok: false, reason: "git_status_failed", ...status, elapsed_ms: Date.now() - startedAt };
  }
  if (status.stdout.trim()) {
    return { ok: false, reason: "repo_dirty", detail: status.stdout.trim(), elapsed_ms: Date.now() - startedAt };
  }

  const branch = await run("bash", ["-lc", "git branch --show-current"], { cwd: projectRoot, env: process.env });
  const head = await run("bash", ["-lc", "git rev-parse --short HEAD"], { cwd: projectRoot, env: process.env });
  const pull = await run("bash", ["-lc", "git pull --ff-only"], { cwd: projectRoot, env: process.env });
  return {
    ok: pull.code === 0,
    elapsed_ms: Date.now() - startedAt,
    branch: branch.stdout.trim(),
    head: head.stdout.trim(),
    pull,
  };
}

async function gitCommitPush({ projectRoot, taskId, title, runId }) {
  const startedAt = Date.now();
  const add = await run("bash", ["-lc", "git add -A"], { cwd: projectRoot, env: process.env });
  const diffNames = await run("bash", ["-lc", "git diff --cached --name-only"], { cwd: projectRoot, env: process.env });

  const changed = diffNames.stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!changed.length) {
    return {
      ok: true,
      elapsed_ms: Date.now() - startedAt,
      no_changes: true,
      changed_files: [],
    };
  }

  const safeTitle = String(title || "task").replace(/\s+/g, " ").trim().slice(0, 80);
  const msg = `${taskId}: ${safeTitle} [run:${runId}]`;
  const commit = await run("bash", ["-lc", `git commit -m ${JSON.stringify(msg)}`], {
    cwd: projectRoot,
    env: process.env,
  });
  const head = await run("bash", ["-lc", "git rev-parse --short HEAD"], { cwd: projectRoot, env: process.env });
  const push = await run("bash", ["-lc", "git push origin main"], { cwd: projectRoot, env: process.env });

  return {
    ok: add.code === 0 && commit.code === 0 && push.code === 0,
    elapsed_ms: Date.now() - startedAt,
    changed_files: changed,
    commit,
    head: head.stdout.trim(),
    push,
  };
}

async function sendNotify({ ok, taskId, title, runId, stage, projectRoot, logRelDir, head }) {
  const payload = {
    receiver: "gz0149",
    title: "Cursor任务完成",
    msg: [
      `task_id=${taskId}`,
      `run_id=${runId}`,
      `stage=${stage}`,
      `ok=${ok}`,
      title ? `title=${title}` : "",
      head ? `head=${head}` : "",
      `logs=${logRelDir}`,
      `project_root=${projectRoot}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };

  const startedAt = Date.now();
  try {
    const res = await fetch("https://newsfeed.4399om.com/api/messages/send.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    return {
      ok: res.ok,
      elapsed_ms: Date.now() - startedAt,
      status: res.status,
      body: text.slice(0, 2000),
    };
  } catch (e) {
    return { ok: false, elapsed_ms: Date.now() - startedAt, error: String(e?.message || e) };
  }
}

function buildCursorPrompt({ role, taskPackText }) {
  return [
    "# Task Execution Instructions",
    "",
    `## Current Role: ${role}`,
    "",
    "## Task Pack:",
    taskPackText,
    "",
    "## Execution Rules:",
    "1. Only read files listed in Allowed Inputs",
    "2. Only write to paths listed in Deliverables",
    "3. Follow all constraints strictly",
    "4. Output a receipt in this format:",
    "",
    "```",
    "【完成内容】",
    "- ...",
    "",
    "【输出文件】",
    "- ...",
    "",
    "【自检】",
    "- [ ] ...",
    "",
    "【风险与未完成】",
    "- (如有)",
    "```",
    "",
  ].join("\n");
}

async function handleExecuteTask(body) {
  const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
  const taskPackPath = body.task_pack_path || body.taskPackPath;
  const role = body.role || "L3_engineer";
  const taskType = body.task_type || body.taskType || "code";
  const complexity = body.complexity || "normal";
  const modelOverride = body.model_override || body.modelOverride || "auto";

  if (!taskPackPath) throw new Error("task_pack_path is required");

  const taskPackAbs = safeResolveUnderProject(projectRoot, taskPackPath);
  const taskPackText = await fs.readFile(taskPackAbs, "utf8");

  const prompt = buildCursorPrompt({ role, taskPackText });
  const promptAbs = safeResolveUnderProject(projectRoot, ".cursor/current_task_prompt.md");
  await fs.mkdir(path.posix.dirname(promptAbs), { recursive: true });
  await fs.writeFile(promptAbs, prompt, "utf8");

  const startedAt = Date.now();
  const agentRes = await run(
    "bash",
    [
      "tools/n8n/run-cursor-task.sh",
      "--task-pack",
      taskPackPath,
      "--prompt-file",
      ".cursor/current_task_prompt.md",
      "--task-type",
      taskType,
      "--complexity",
      complexity,
      "--model-override",
      modelOverride,
    ],
    { cwd: projectRoot, env: process.env }
  );

  const validateRes = await run("bash", ["-lc", "npm run validate --if-present"], {
    cwd: projectRoot,
    env: process.env,
  });

  return {
    ok: agentRes.code === 0 && validateRes.code === 0,
    elapsed_ms: Date.now() - startedAt,
    task_pack_path: taskPackPath,
    role,
    task_type: taskType,
    complexity,
    model_override: modelOverride,
    agent: agentRes,
    validate: validateRes,
  };
}

function slugify(s) {
  return String(s || "task")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function handleComposeTaskpack(body) {
  const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
  const now = new Date();
  const ts = now.toISOString().replace(/[-:]/g, "").slice(0, 15); // YYYYMMDDTHHMMSS

  const taskId = body.task_id || body.taskId || `T-${ts}_auto`;
  const title = body.title || "Generated TaskPack";
  const taskType = body.task_type || "code";
  const complexity = body.complexity || "normal";
  const modelOverride = body.model_override || "auto";
  const executionRuntime = body.execution_runtime || "wsl";
  const requiresMcp = Boolean(body.requires_mcp || false);
  const outcome = body.outcome || body.description || "";

  const fileName = `${taskId}_${slugify(title)}.md`.replace(/[^a-zA-Z0-9._-]/g, "_");
  const relPath = path.posix.join("docs/03_taskpacks", fileName);
  const absPath = safeResolveUnderProject(projectRoot, relPath);

  const content = [
    "---",
    `task_id: ${taskId}`,
    `title: "${String(title).replace(/"/g, '\\"')}"`,
    `task_type: ${taskType}`,
    `complexity: ${complexity}`,
    `model_override: ${modelOverride}`,
    `execution_runtime: ${executionRuntime}`,
    `requires_mcp: ${requiresMcp}`,
    "---",
    "",
    `# TASK-PACK: ${taskId}`,
    "",
    "## 1. Outcome（可观察结果）",
    outcome || "-",
    "",
    "## 2. Allowed Inputs（允许引用的输入）",
    "- [`dir`] `./`",
    "",
    "## 3. Deliverables（必须交付物）",
    "- [`file`] `docs/03_taskpacks/...` (as needed)",
    "",
    "## 4. Constraints（硬约束 / 禁止事项）",
    "- 不得修改冻结目录：`docs/00_charter/**`、`docs/01_bibles/**`",
    "",
    "## 5. Acceptance Checklist（验收清单）",
    "- [ ] 交付物落盘",
    "",
  ].join("\n");

  await fs.mkdir(path.posix.dirname(absPath), { recursive: true });
  await fs.writeFile(absPath, content, "utf8");

  return { ok: true, task_id: taskId, task_pack_path: relPath };
}

async function handleFixedFlow(body) {
  const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
  const taskId = body.task_id || body.taskId;
  const title = body.title || "";
  const role = body.role || "L3_engineer";
  const taskType = body.task_type || body.taskType || "code";
  const complexity = body.complexity || "normal";
  const modelOverride = body.model_override || body.modelOverride || "auto";

  const auto = body.auto !== false;
  const resumeFromStage = Number(body.resume_from_stage ?? body.resumeFromStage ?? 0);
  const runId = body.run_id || body.runId || makeRunId();

  if (!taskId) throw new Error("task_id is required");

  const runRelDir = path.posix.join(AUTOMATION_RUNS_DIR, runId);
  const runAbsDir = safeResolveUnderProject(projectRoot, runRelDir);

  const statusAbs = path.posix.join(runAbsDir, "status.json");
  const intakeAbs = path.posix.join(runAbsDir, "00_intake.json");
  const preflightAbs = path.posix.join(runAbsDir, "01_preflight.json");
  const planAbs = path.posix.join(runAbsDir, "02_plan.json");
  const taskpackAbs = path.posix.join(runAbsDir, "03_taskpack.md");
  const executeAbs = path.posix.join(runAbsDir, "04_execute.json");
  const validateAbs = path.posix.join(runAbsDir, "05_validate.json");
  const gitAbs = path.posix.join(runAbsDir, "06_git.json");
  const notifyAbs = path.posix.join(runAbsDir, "07_notify.json");

  const startedAt = Date.now();
  await ensureDir(runAbsDir);

  await writeJson(intakeAbs, {
    task_id: taskId,
    title,
    role,
    task_type: taskType,
    complexity,
    model_override: modelOverride,
    auto,
    resume_from_stage: resumeFromStage,
    run_id: runId,
    project_root: projectRoot,
    received_at: nowIso(),
    raw_body: body,
  });

  const statusBase = {
    run_id: runId,
    task_id: taskId,
    stage: 0,
    attempt: 1,
    ok: false,
    started_at: nowIso(),
    updated_at: nowIso(),
    repo: { root: projectRoot, branch: "", head: "" },
  };

  const out = await withRepoLock(projectRoot, runId, async () => {
    // Stage 01: preflight
    if (resumeFromStage <= 1) {
      await writeJson(statusAbs, { ...statusBase, stage: 1, updated_at: nowIso() });
      const pf = await gitPreflight(projectRoot);
      await writeJson(preflightAbs, pf);
      if (!pf.ok) {
        await writeJson(statusAbs, { ...statusBase, stage: 1, ok: false, error: pf.reason || "preflight_failed", updated_at: nowIso() });
        return { ok: false, run_id: runId, stage: 1, error: pf.reason || "preflight_failed" };
      }
      statusBase.repo.branch = pf.branch || "";
      statusBase.repo.head = pf.head || "";
    }

    // Stage 02: plan
    if (resumeFromStage <= 2) {
      await writeJson(statusAbs, { ...statusBase, stage: 2, updated_at: nowIso() });
      await writeJson(planAbs, {
        ok: true,
        planned_at: nowIso(),
        role,
        task_type: taskType,
        complexity,
        model_override: modelOverride,
        runner: "wsl-runner",
      });
    }

    // Stage 03: taskpack
    let taskPackPath = body.task_pack_path || body.taskPackPath || "";
    if (resumeFromStage <= 3) {
      await writeJson(statusAbs, { ...statusBase, stage: 3, updated_at: nowIso() });
      if (!taskPackPath) {
        const composed = await handleComposeTaskpack({
          task_id: taskId,
          title: title || "Generated TaskPack",
          task_type: taskType,
          complexity,
          model_override: modelOverride,
          execution_runtime: "wsl",
          requires_mcp: false,
          outcome: body.outcome || "",
          project_root: projectRoot,
        });
        taskPackPath = composed.task_pack_path;
      }
      const abs = safeResolveUnderProject(projectRoot, taskPackPath);
      const text = await fs.readFile(abs, "utf8");
      await writeText(taskpackAbs, text);
    }

    // Stage 04: execute
    let execOut = null;
    if (resumeFromStage <= 4) {
      await writeJson(statusAbs, { ...statusBase, stage: 4, updated_at: nowIso() });
      execOut = await handleExecuteTask({
        project_root: projectRoot,
        task_pack_path: taskPackPath,
        role,
        task_type: taskType,
        complexity,
        model_override: modelOverride,
      });
      await writeJson(executeAbs, execOut);
      if (!execOut.ok) {
        await writeJson(statusAbs, { ...statusBase, stage: 4, ok: false, error: "execute_failed", updated_at: nowIso() });
        return { ok: false, run_id: runId, stage: 4, error: "execute_failed", execute: execOut };
      }
    }

    // Stage 05: validate
    let validateOut = null;
    if (resumeFromStage <= 5) {
      await writeJson(statusAbs, { ...statusBase, stage: 5, updated_at: nowIso() });
      const validateRes = await run("bash", ["-lc", "npm run validate --if-present"], { cwd: projectRoot, env: process.env });
      validateOut = { ok: validateRes.code === 0, ...validateRes };
      await writeJson(validateAbs, validateOut);
      if (!validateOut.ok) {
        await writeJson(statusAbs, { ...statusBase, stage: 5, ok: false, error: "validate_failed", updated_at: nowIso() });
        return { ok: false, run_id: runId, stage: 5, error: "validate_failed", validate: validateOut };
      }
    }

    // Stage 06: git
    let gitOut = null;
    if (resumeFromStage <= 6) {
      await writeJson(statusAbs, { ...statusBase, stage: 6, updated_at: nowIso() });
      gitOut = await gitCommitPush({ projectRoot, taskId, title, runId });
      await writeJson(gitAbs, gitOut);
      if (!gitOut.ok) {
        await writeJson(statusAbs, { ...statusBase, stage: 6, ok: false, error: "git_failed", updated_at: nowIso() });
        return { ok: false, run_id: runId, stage: 6, error: "git_failed", git: gitOut };
      }
      statusBase.repo.head = gitOut.head || statusBase.repo.head;
    }

    // Stage 07: notify
    let notifyOut = null;
    if (resumeFromStage <= 7) {
      await writeJson(statusAbs, { ...statusBase, stage: 7, updated_at: nowIso() });
      notifyOut = await sendNotify({
        ok: true,
        taskId,
        title,
        runId,
        stage: 7,
        projectRoot,
        logRelDir: runRelDir,
        head: statusBase.repo.head,
      });
      await writeJson(notifyAbs, notifyOut);
    }

    await writeJson(statusAbs, { ...statusBase, stage: 99, ok: true, updated_at: nowIso() });
    return {
      ok: true,
      run_id: runId,
      task_id: taskId,
      stage: 99,
      elapsed_ms: Date.now() - startedAt,
      logs_dir: runRelDir,
      task_pack_path: taskPackPath,
    };
  });

  if (!auto) {
    // v1: currently still runs full chain; auto is reserved for future pause/resume semantics.
  }

  return out;
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      return json(res, 200, { ok: true, service: "wsl-cursor-runner", pid: process.pid });
    }

    if (req.method === "POST" && req.url === "/execute-task") {
      const body = await readJsonBody(req);
      const out = await handleExecuteTask(body);
      return json(res, 200, out);
    }

    if (req.method === "POST" && req.url === "/compose-taskpack") {
      const body = await readJsonBody(req);
      const out = await handleComposeTaskpack(body);
      return json(res, 200, out);
    }

    if (req.method === "POST" && req.url === "/fixed-flow") {
      const body = await readJsonBody(req);
      const out = await handleFixedFlow(body);
      return json(res, 200, out);
    }

    return json(res, 404, { ok: false, error: "not_found" });
  } catch (e) {
    return json(res, 500, { ok: false, error: String(e?.message || e) });
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[wsl-cursor-runner] listening on http://${HOST}:${PORT}`);
});


