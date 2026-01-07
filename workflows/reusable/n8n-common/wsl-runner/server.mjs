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
 * - POST /fixed-flow        { task_id, title?, task_pack_path?, role?, task_type?, complexity?, model_override?, auto?, resume_from_stage?, run_id?, project_root?, async? }
 * - GET  /fixed-flow/status?run_id=...&project_root=...
 * - POST /fixed-flow/cancel { run_id, project_root? }
 * - POST /fixed-flow/retry  { run_id, node_id, project_root? }
 *
 * Env:
 * - HOST (default 127.0.0.1)
 * - PORT (default 3210)
 */

import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";

// v1 新增：导入 lib/ 模块
import {
  // 路径和IO
  getRunDir,
  ensureDir as ensureDirLib,
  writeJson as writeJsonLib,
  writeText as writeTextLib,
  // 图谱
  writeGraph,
  // 事件
  resetSeq,
  emitRunStarted,
  emitRunFinished,
  emitNodeStarted,
  emitNodeLog,
  emitNodeFinished,
  emitCancelRequested,
  // 节点运行
  writeInitialNodeRuns,
  setNodeRunning,
  setNodeFinished,
  setNodesStatus,
  NodeStatus,
  // 锁
  acquireLock,
  releaseLock,
  // Control
  writeCancelRequest,
  writeRetryRequest,
  // Stages
  STAGE_TO_NODE_MAP,
  getNodeTimeout,
} from "./lib/index.mjs";

// v2 引擎
import { createFlowRunner, RunStatus } from "./lib/v2/index.mjs";

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || "3210");

const DEFAULT_PROJECT_ROOT = "/home/shash/work/Footnote";

const AUTOMATION_RUNS_DIR = "workflows/project/logs/automation_runs";
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
  // IMPORTANT: fixed-flow stage logs are written under workflows/project/logs/automation_runs.
  // Preflight must treat the repo as "clean" even if those logs exist, otherwise a failed run
  // would permanently block subsequent runs.
  const status = await run(
    "bash",
    [
      "-lc",
      // Also ignore the generated prompt file (tracked in this repo) to avoid self-blocking.
      "git status --porcelain -- . ':(exclude).cursor/current_task_prompt.md' ':(exclude)workflows/project/logs/automation_runs' ':(exclude)workflows/project/logs/automation_runs/**'",
    ],
    { cwd: projectRoot, env: process.env }
  );
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

async function gitCommitPushAfterStage99({ projectRoot, taskId, title, runId, gitAbs }) {
  const startedAt = Date.now();

  // Stage everything that exists up to (and including) status stage=99 and notify logs.
  const add = await run("bash", ["-lc", "git add -A"], { cwd: projectRoot, env: process.env });
  const diffNames = await run("bash", ["-lc", "git diff --cached --name-only"], { cwd: projectRoot, env: process.env });

  const changed = diffNames.stdout
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const safeTitle = String(title || "task").replace(/\s+/g, " ").trim().slice(0, 80);
  const msg = `${taskId}: ${safeTitle} [run:${runId}]`;

  // IMPORTANT: user requested "only commit after stage=99".
  // We therefore write status=99 first, then perform git commit/push without writing any tracked files afterwards.
  // To keep an auditable record without dirtying the repo post-commit, we write 06_git.json BEFORE committing.
  await writeJson(gitAbs, {
    ok: true,
    mode: "post_stage_99",
    note: "06_git.json is written before commit to avoid post-commit repo dirtiness; commit msg embeds run_id",
    elapsed_ms: Date.now() - startedAt,
    staged: add.code === 0,
    changed_files: changed,
    commit_message: msg,
  });

  // Re-stage to include the 06_git.json we just wrote.
  const add2 = await run("bash", ["-lc", "git add -A"], { cwd: projectRoot, env: process.env });
  const commit = await run("bash", ["-lc", `git commit -m ${JSON.stringify(msg)}`], {
    cwd: projectRoot,
    env: process.env,
  });
  const head = await run("bash", ["-lc", "git rev-parse --short HEAD"], { cwd: projectRoot, env: process.env });
  const push = await run("bash", ["-lc", "git push origin main"], { cwd: projectRoot, env: process.env });

  return {
    ok: add.code === 0 && add2.code === 0 && commit.code === 0 && push.code === 0,
    elapsed_ms: Date.now() - startedAt,
    staged_files: changed,
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
  const runId = body.run_id || body.runId || "";

  if (!taskPackPath) throw new Error("task_pack_path is required");

  const taskPackAbs = safeResolveUnderProject(projectRoot, taskPackPath);
  const taskPackText = await fs.readFile(taskPackAbs, "utf8");

  const prompt = buildCursorPrompt({ role, taskPackText });

  // IMPORTANT:
  // Do NOT write prompt into tracked `.cursor/current_task_prompt.md`, otherwise fixed-flow git stage would commit it.
  // - If run_id is provided (fixed-flow), write the prompt under the run logs directory for auditability.
  // - Otherwise (plain /execute-task), write to /tmp to avoid touching the repo at all.
  let promptAbs = "";
  let chatIdFileAbs = "";
  if (runId) {
    const runRelDir = path.posix.join(AUTOMATION_RUNS_DIR, runId);
    const runAbsDir = safeResolveUnderProject(projectRoot, runRelDir);
    await ensureDir(runAbsDir);
    promptAbs = path.posix.join(runAbsDir, "_prompt.md");
    chatIdFileAbs = path.posix.join(runAbsDir, "_chat_id.txt");
  } else {
    const nonce = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    promptAbs = path.posix.join("/tmp", `cursor_prompt_${nonce}.md`);
    chatIdFileAbs = path.posix.join("/tmp", `cursor_chat_id_${nonce}.txt`);
  }
  await fs.mkdir(path.posix.dirname(promptAbs), { recursive: true });
  await fs.writeFile(promptAbs, prompt, "utf8");

  const startedAt = Date.now();
  const agentArgs = [
    "workflows/project/n8n/run-cursor-task.sh",
    "--task-pack",
    taskPackPath,
    "--prompt-file",
    promptAbs,
    "--task-type",
    taskType,
    "--complexity",
    complexity,
    "--model-override",
    modelOverride,
  ];
  
  // Add chat-id-file if we have a runId (for conversation history)
  if (runId && chatIdFileAbs) {
    agentArgs.push("--chat-id-file", chatIdFileAbs);
  }
  
  const agentRes = await run("bash", agentArgs, { cwd: projectRoot, env: process.env });
  
  // Read chat ID if it was created
  let chatId = null;
  if (chatIdFileAbs) {
    try {
      const chatIdText = await fs.readFile(chatIdFileAbs, "utf8");
      chatId = chatIdText.trim();
    } catch {
      // Chat ID file may not exist if creation failed
    }
  }

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
    chat_id: chatId || null,
    chat_id_file: chatIdFileAbs || null,
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
  const relPath = path.posix.join("design/ai-native/03_taskpacks", fileName);
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
    "- [`file`] `design/ai-native/03_taskpacks/...` (as needed)",
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

// ============================================
// v2 Handler：配置化流程执行
// ============================================

/**
 * 处理 v2 流程执行请求
 * 
 * @param {Object} body 请求体
 * @param {string} body.flowspec - FlowSpec JSON 对象或文件路径
 * @param {Object} [body.inputs] - 流程输入参数
 * @param {string} [body.run_id] - 自定义运行 ID
 * @param {string} [body.project_root] - 项目根目录
 * @param {boolean} [body.async] - 是否异步执行
 * @returns {Promise<Object>} 执行结果
 */
async function handleV2Run(body) {
  const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
  const flowspec = body.flowspec;
  const inputs = body.inputs || {};
  const customRunId = body.run_id || body.runId;
  const isAsync = body.async === true;

  if (!flowspec) {
    return { ok: false, error: "flowspec is required (JSON object or file path)" };
  }

  // 生成或使用自定义 run_id
  const runId = customRunId || makeRunId();
  const runRelDir = path.posix.join(AUTOMATION_RUNS_DIR, runId);
  const runAbsDir = safeResolveUnderProject(projectRoot, runRelDir);

  // 确保运行目录存在
  await ensureDir(runAbsDir);

  // 解析 FlowSpec
  let flowSpecObj;
  if (typeof flowspec === "string") {
    // 从文件路径加载
    const flowPath = safeResolveUnderProject(projectRoot, flowspec);
    try {
      const content = await fs.readFile(flowPath, "utf8");
      flowSpecObj = JSON.parse(content);
    } catch (e) {
      return { ok: false, error: `Failed to load flowspec: ${e.message}` };
    }
  } else {
    flowSpecObj = flowspec;
  }

  // 创建工件写入器
  const artifactWriter = async (name, data, options = {}) => {
    const absPath = path.posix.join(runAbsDir, name);
    if (options.raw) {
      await writeText(absPath, data);
    } else {
      await writeJson(absPath, data);
    }
  };

  // 创建 FlowRunner
  const runner = createFlowRunner({
    runId,
    runDir: runAbsDir,
    artifactWriter,
    emitEvents: true,
  });

  // 执行函数
  const executeFlow = async () => {
    try {
      const result = await runner.run(flowSpecObj, inputs);
      return {
        ok: result.success,
        run_id: runId,
        status: result.status,
        flow_id: result.flowId,
        duration_ms: result.duration,
        error: result.error,
        output: result.output,
        logs_dir: runRelDir,
      };
    } catch (e) {
      return {
        ok: false,
        run_id: runId,
        error: e.message,
        logs_dir: runRelDir,
      };
    }
  };

  // 同步或异步执行
  if (isAsync) {
    // 异步执行：立即返回，后台运行
    executeFlow().catch(e => {
      console.error(`[v2/run] async error for ${runId}:`, e);
    });

    return {
      ok: true,
      run_id: runId,
      flow_id: flowSpecObj.id,
      logs_dir: runRelDir,
      started_async: true,
    };
  } else {
    // 同步执行：等待完成
    return await executeFlow();
  }
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
  const asyncMode = body.async !== false;

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

  // v1 新增：初始化事件序列号
  resetSeq(runId);

  // v1 新增：生成 graph.json（行为树结构）
  await writeGraph(projectRoot, runId);

  // v1 新增：初始化 node_runs.json（节点状态快照）
  await writeInitialNodeRuns(projectRoot, runId);

  // v1 新增：发送 RUN_STARTED 事件
  await emitRunStarted(projectRoot, runId, taskId, title);

  // v1 新增：更新 stage.intake 节点为 RUNNING
  await setNodeRunning(projectRoot, runId, 'stage.intake', 1);
  await emitNodeStarted(projectRoot, runId, 'stage.intake', 1, getNodeTimeout('stage.intake'));

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

  // v1 新增：完成 stage.intake 节点
  await setNodeFinished(projectRoot, runId, 'stage.intake', NodeStatus.SUCCESS, Date.now() - startedAt, null);
  await emitNodeFinished(projectRoot, runId, 'stage.intake', NodeStatus.SUCCESS, 0, Date.now() - startedAt, null);

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

  const runFlow = async () => {
    // v1 新增：获取锁
    const lockResult = await acquireLock(projectRoot, runId);
    if (!lockResult.ok) {
      await setNodeFinished(projectRoot, runId, 'stage.preflight', NodeStatus.FAILED, 0, lockResult.error);
      await emitRunFinished(projectRoot, runId, false, Date.now() - startedAt, 'stage.preflight', lockResult.error);
      return { ok: false, run_id: runId, error: lockResult.error, occupied_by: lockResult.occupiedBy };
    }

    try {
      // Stage 01: preflight
      if (resumeFromStage <= 1) {
        const preflightStart = Date.now();
        
        // v1 新增：更新 stage.preflight 节点为 RUNNING
        await setNodeRunning(projectRoot, runId, 'stage.preflight', 1);
        await emitNodeStarted(projectRoot, runId, 'stage.preflight', 1, getNodeTimeout('stage.preflight'));
        
        await writeJson(statusAbs, { ...statusBase, stage: 1, updated_at: nowIso() });
        const pf = await gitPreflight(projectRoot);
        await writeJson(preflightAbs, pf);
        
        if (!pf.ok) {
          // v1 新增：标记 preflight 失败
          await setNodeFinished(projectRoot, runId, 'stage.preflight', NodeStatus.FAILED, Date.now() - preflightStart, pf.reason);
          await emitNodeFinished(projectRoot, runId, 'stage.preflight', NodeStatus.FAILED, 1, Date.now() - preflightStart, pf.reason);
          
          await writeJson(statusAbs, { ...statusBase, stage: 1, ok: false, error: pf.reason || "preflight_failed", updated_at: nowIso() });
          const notifyOut = await sendNotify({
            ok: false,
            taskId,
            title,
            runId,
            stage: 1,
            projectRoot,
            logRelDir: runRelDir,
            head: statusBase.repo.head,
          });
          await writeJson(notifyAbs, notifyOut);
          
          // v1 新增：发送运行结束事件
          await emitRunFinished(projectRoot, runId, false, Date.now() - startedAt, 'stage.preflight', pf.reason);
          return { ok: false, run_id: runId, stage: 1, error: pf.reason || "preflight_failed" };
        }
        
        statusBase.repo.branch = pf.branch || "";
        statusBase.repo.head = pf.head || "";
        
        // v1 新增：标记 preflight 成功
        await setNodeFinished(projectRoot, runId, 'stage.preflight', NodeStatus.SUCCESS, Date.now() - preflightStart, null);
        await emitNodeFinished(projectRoot, runId, 'stage.preflight', NodeStatus.SUCCESS, 0, Date.now() - preflightStart, null);
      }

    // Stage 02: plan
    if (resumeFromStage <= 2) {
      const planStart = Date.now();
      
      // v1 新增：更新 execute.plan 节点为 RUNNING
      await setNodeRunning(projectRoot, runId, 'execute.plan', 1);
      await emitNodeStarted(projectRoot, runId, 'execute.plan', 1, getNodeTimeout('execute.plan'));
      
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
      
      // v1 新增：标记 plan 成功
      await setNodeFinished(projectRoot, runId, 'execute.plan', NodeStatus.SUCCESS, Date.now() - planStart, null);
      await emitNodeFinished(projectRoot, runId, 'execute.plan', NodeStatus.SUCCESS, 0, Date.now() - planStart, null);
    }

    // Stage 03: taskpack (属于 plan 阶段的子任务，不单独作为节点)
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
      const executeStart = Date.now();
      
      // v1 新增：更新 execute.edit 节点为 RUNNING
      await setNodeRunning(projectRoot, runId, 'execute.edit', 1);
      await emitNodeStarted(projectRoot, runId, 'execute.edit', 1, getNodeTimeout('execute.edit'));
      
      await writeJson(statusAbs, { ...statusBase, stage: 4, updated_at: nowIso() });
      execOut = await handleExecuteTask({
        project_root: projectRoot,
        task_pack_path: taskPackPath,
        run_id: runId,
        role,
        task_type: taskType,
        complexity,
        model_override: modelOverride,
      });
      await writeJson(executeAbs, execOut);
      
      // v1 新增：记录执行日志
      if (execOut.agent?.stdout) {
        await emitNodeLog(projectRoot, runId, 'execute.edit', 'stdout', execOut.agent.stdout.slice(0, 4000), null);
      }
      if (execOut.agent?.stderr) {
        await emitNodeLog(projectRoot, runId, 'execute.edit', 'stderr', execOut.agent.stderr.slice(0, 4000), null);
      }
      
      if (!execOut.ok) {
        // v1 新增：标记 execute.edit 失败
        await setNodeFinished(projectRoot, runId, 'execute.edit', NodeStatus.FAILED, Date.now() - executeStart, "execute_failed");
        await emitNodeFinished(projectRoot, runId, 'execute.edit', NodeStatus.FAILED, execOut.agent?.code ?? 1, Date.now() - executeStart, "execute_failed");
        
        await writeJson(statusAbs, { ...statusBase, stage: 4, ok: false, error: "execute_failed", updated_at: nowIso() });
        const notifyOut = await sendNotify({
          ok: false,
          taskId,
          title,
          runId,
          stage: 4,
          projectRoot,
          logRelDir: runRelDir,
          head: statusBase.repo.head,
        });
        await writeJson(notifyAbs, notifyOut);
        
        // v1 新增：发送运行结束事件
        await emitRunFinished(projectRoot, runId, false, Date.now() - startedAt, 'execute.edit', "execute_failed");
        return { ok: false, run_id: runId, stage: 4, error: "execute_failed", execute: execOut };
      }
      
      // v1 新增：标记 execute.edit 成功
      await setNodeFinished(projectRoot, runId, 'execute.edit', NodeStatus.SUCCESS, Date.now() - executeStart, null);
      await emitNodeFinished(projectRoot, runId, 'execute.edit', NodeStatus.SUCCESS, 0, Date.now() - executeStart, null);
    }

    // Stage 05: validate (lint + test)
    let validateOut = null;
    if (resumeFromStage <= 5) {
      // v1 新增：execute.lint 节点
      const lintStart = Date.now();
      await setNodeRunning(projectRoot, runId, 'execute.lint', 1);
      await emitNodeStarted(projectRoot, runId, 'execute.lint', 1, getNodeTimeout('execute.lint'));
      
      await writeJson(statusAbs, { ...statusBase, stage: 5, updated_at: nowIso() });
      const validateRes = await run("bash", ["-lc", "npm run validate --if-present"], { cwd: projectRoot, env: process.env });
      validateOut = { ok: validateRes.code === 0, ...validateRes };
      await writeJson(validateAbs, validateOut);
      
      // v1 新增：记录 lint 日志
      if (validateRes.stdout) {
        await emitNodeLog(projectRoot, runId, 'execute.lint', 'stdout', validateRes.stdout.slice(0, 4000), null);
      }
      if (validateRes.stderr) {
        await emitNodeLog(projectRoot, runId, 'execute.lint', 'stderr', validateRes.stderr.slice(0, 4000), null);
      }
      
      if (!validateOut.ok) {
        // v1 新增：标记 lint 失败
        await setNodeFinished(projectRoot, runId, 'execute.lint', NodeStatus.FAILED, Date.now() - lintStart, "validate_failed");
        await emitNodeFinished(projectRoot, runId, 'execute.lint', NodeStatus.FAILED, validateRes.code, Date.now() - lintStart, "validate_failed");
        
        await writeJson(statusAbs, { ...statusBase, stage: 5, ok: false, error: "validate_failed", updated_at: nowIso() });
        const notifyOut = await sendNotify({
          ok: false,
          taskId,
          title,
          runId,
          stage: 5,
          projectRoot,
          logRelDir: runRelDir,
          head: statusBase.repo.head,
        });
        await writeJson(notifyAbs, notifyOut);
        
        // v1 新增：发送运行结束事件
        await emitRunFinished(projectRoot, runId, false, Date.now() - startedAt, 'execute.lint', "validate_failed");
        return { ok: false, run_id: runId, stage: 5, error: "validate_failed", validate: validateOut };
      }
      
      // v1 新增：标记 lint 成功
      await setNodeFinished(projectRoot, runId, 'execute.lint', NodeStatus.SUCCESS, Date.now() - lintStart, null);
      await emitNodeFinished(projectRoot, runId, 'execute.lint', NodeStatus.SUCCESS, 0, Date.now() - lintStart, null);
      
      // v1 新增：execute.test 节点（当前与 lint 合并，标记为成功）
      await setNodeRunning(projectRoot, runId, 'execute.test', 1);
      await emitNodeStarted(projectRoot, runId, 'execute.test', 1, getNodeTimeout('execute.test'));
      await setNodeFinished(projectRoot, runId, 'execute.test', NodeStatus.SUCCESS, 0, null);
      await emitNodeFinished(projectRoot, runId, 'execute.test', NodeStatus.SUCCESS, 0, 0, null);
      
      // v1 新增：execute.summary 节点
      await setNodeRunning(projectRoot, runId, 'execute.summary', 1);
      await emitNodeStarted(projectRoot, runId, 'execute.summary', 1, getNodeTimeout('execute.summary'));
      await setNodeFinished(projectRoot, runId, 'execute.summary', NodeStatus.SUCCESS, 0, null);
      await emitNodeFinished(projectRoot, runId, 'execute.summary', NodeStatus.SUCCESS, 0, 0, null);
    }

    // Stage 07: notify (pre-commit)
    // NOTE: We intentionally notify BEFORE git commit to keep "only commit after stage=99".
    // The notify log will be committed together with status stage=99.
    let notifyOut = null;
    if (resumeFromStage <= 7) {
      const notifyStart = Date.now();
      
      // v1 新增：更新 stage.notify 节点为 RUNNING
      await setNodeRunning(projectRoot, runId, 'stage.notify', 1);
      await emitNodeStarted(projectRoot, runId, 'stage.notify', 1, getNodeTimeout('stage.notify'));
      
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
      
      // v1 新增：标记 notify 成功
      await setNodeFinished(projectRoot, runId, 'stage.notify', NodeStatus.SUCCESS, Date.now() - notifyStart, null);
      await emitNodeFinished(projectRoot, runId, 'stage.notify', NodeStatus.SUCCESS, 0, Date.now() - notifyStart, null);
    }

    // Stage 99: done
    const doneStart = Date.now();
    
    // v1 新增：更新 stage.done 节点为 RUNNING
    await setNodeRunning(projectRoot, runId, 'stage.done', 1);
    await emitNodeStarted(projectRoot, runId, 'stage.done', 1, getNodeTimeout('stage.done'));
    
    await writeJson(statusAbs, { ...statusBase, stage: 99, ok: true, updated_at: nowIso() });
    
    // v1 新增：标记 done 成功
    await setNodeFinished(projectRoot, runId, 'stage.done', NodeStatus.SUCCESS, Date.now() - doneStart, null);
    await emitNodeFinished(projectRoot, runId, 'stage.done', NodeStatus.SUCCESS, 0, Date.now() - doneStart, null);

    // Stage 100: git commit/push
    const gitStart = Date.now();
    
    // v1 新增：更新 stage.git 节点为 RUNNING
    await setNodeRunning(projectRoot, runId, 'stage.git', 1);
    await emitNodeStarted(projectRoot, runId, 'stage.git', 1, getNodeTimeout('stage.git'));
    
    // Post stage=99: git commit/push (no further tracked writes afterwards)
    // If git fails, we do NOT mutate status.json (to avoid "committed then dirty" confusion).
    const gitOut = await gitCommitPushAfterStage99({ projectRoot, taskId, title, runId, gitAbs });
    
    if (!gitOut.ok) {
      // v1 新增：标记 git 失败
      await setNodeFinished(projectRoot, runId, 'stage.git', NodeStatus.FAILED, Date.now() - gitStart, "git_failed");
      await emitNodeFinished(projectRoot, runId, 'stage.git', NodeStatus.FAILED, 1, Date.now() - gitStart, "git_failed");
      await emitRunFinished(projectRoot, runId, false, Date.now() - startedAt, 'stage.git', "git_failed_post_stage_99");
      return { ok: false, run_id: runId, stage: 99, error: "git_failed_post_stage_99", git: gitOut };
    }
    
    statusBase.repo.head = gitOut.head || statusBase.repo.head;
    
    // v1 新增：标记 git 成功
    await setNodeFinished(projectRoot, runId, 'stage.git', NodeStatus.SUCCESS, Date.now() - gitStart, null);
    await emitNodeFinished(projectRoot, runId, 'stage.git', NodeStatus.SUCCESS, 0, Date.now() - gitStart, null);
    
    // v1 新增：发送运行成功结束事件
    await emitRunFinished(projectRoot, runId, true, Date.now() - startedAt, 'stage.git', null);

    return {
      ok: true,
      run_id: runId,
      task_id: taskId,
      stage: 99,
      elapsed_ms: Date.now() - startedAt,
      logs_dir: runRelDir,
      task_pack_path: taskPackPath,
    };
    } finally {
      // v1 新增：释放锁
      await releaseLock(projectRoot, runId);
    }
  };

  if (!asyncMode) {
    return await runFlow();
  }

  // Async: start background run and return immediately.
  // Background errors are recorded into status.json and notify.json.
  void (async () => {
    try {
      await runFlow();
    } catch (e) {
      const err = String(e?.message || e);
      await writeJson(statusAbs, {
        ...statusBase,
        stage: Math.max(0, resumeFromStage || 0),
        ok: false,
        error: err,
        updated_at: nowIso(),
      });
      const notifyOut = await sendNotify({
        ok: false,
        taskId,
        title,
        runId,
        stage: Math.max(0, resumeFromStage || 0),
        projectRoot,
        logRelDir: runRelDir,
        head: statusBase.repo.head,
      });
      await writeJson(notifyAbs, notifyOut);
    }
  })();

  await writeJson(statusAbs, { ...statusBase, stage: 0, ok: false, updated_at: nowIso(), note: "started_async" });
  return { ok: true, run_id: runId, task_id: taskId, stage: 0, logs_dir: runRelDir, started_async: true };
}

function getQueryParams(url) {
  try {
    const u = new URL(url, "http://localhost");
    const params = {};
    for (const [k, v] of u.searchParams.entries()) params[k] = v;
    return params;
  } catch {
    return {};
  }
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

    if (req.method === "GET" && req.url?.startsWith("/fixed-flow/status")) {
      const q = getQueryParams(req.url);
      const projectRoot = q.project_root || q.projectRoot || DEFAULT_PROJECT_ROOT;
      const runId = q.run_id || q.runId;
      if (!runId) return json(res, 400, { ok: false, error: "run_id is required" });

      const runRelDir = path.posix.join(AUTOMATION_RUNS_DIR, runId);
      const runAbsDir = safeResolveUnderProject(projectRoot, runRelDir);
      const statusAbs = path.posix.join(runAbsDir, "status.json");
      try {
        const text = await fs.readFile(statusAbs, "utf8");
        return json(res, 200, { ok: true, run_id: runId, status: JSON.parse(text) });
      } catch (e) {
        return json(res, 404, { ok: false, error: "status_not_found", run_id: runId });
      }
    }

    // v1 新增：取消运行
    if (req.method === "POST" && req.url === "/fixed-flow/cancel") {
      const body = await readJsonBody(req);
      const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
      const runId = body.run_id || body.runId;
      if (!runId) return json(res, 400, { ok: false, error: "run_id is required" });

      try {
        await writeCancelRequest(projectRoot, runId, body.requested_by || 'api');
        await emitCancelRequested(projectRoot, runId, body.requested_by || 'api');
        return json(res, 200, { ok: true, run_id: runId, message: "cancel_requested" });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // v1 新增：重试节点
    if (req.method === "POST" && req.url === "/fixed-flow/retry") {
      const body = await readJsonBody(req);
      const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
      const runId = body.run_id || body.runId;
      const nodeId = body.node_id || body.nodeId;
      if (!runId) return json(res, 400, { ok: false, error: "run_id is required" });
      if (!nodeId) return json(res, 400, { ok: false, error: "node_id is required" });

      try {
        await writeRetryRequest(projectRoot, runId, nodeId, body.requested_by || 'api');
        return json(res, 200, { ok: true, run_id: runId, node_id: nodeId, message: "retry_requested" });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // ============================================
    // v2 端点：配置化流程执行
    // ============================================

    // POST /v2/run - 执行 FlowSpec 流程
    if (req.method === "POST" && req.url === "/v2/run") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run(body);
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // GET /v2/run/status - 查询 v2 运行状态
    if (req.method === "GET" && req.url?.startsWith("/v2/run/status")) {
      const q = getQueryParams(req.url);
      const projectRoot = q.project_root || q.projectRoot || DEFAULT_PROJECT_ROOT;
      const runId = q.run_id || q.runId;
      if (!runId) return json(res, 400, { ok: false, error: "run_id is required" });

      const runRelDir = path.posix.join(AUTOMATION_RUNS_DIR, runId);
      const runAbsDir = safeResolveUnderProject(projectRoot, runRelDir);
      const statusAbs = path.posix.join(runAbsDir, "status.json");
      try {
        const text = await fs.readFile(statusAbs, "utf8");
        return json(res, 200, { ok: true, run_id: runId, status: JSON.parse(text) });
      } catch (e) {
        return json(res, 404, { ok: false, error: "status_not_found", run_id: runId });
      }
    }

    // POST /v2/run/cancel - 取消 v2 运行
    if (req.method === "POST" && req.url === "/v2/run/cancel") {
      const body = await readJsonBody(req);
      const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
      const runId = body.run_id || body.runId;
      if (!runId) return json(res, 400, { ok: false, error: "run_id is required" });

      try {
        await writeCancelRequest(projectRoot, runId, body.requested_by || 'api');
        return json(res, 200, { ok: true, run_id: runId, message: "cancel_requested" });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
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


