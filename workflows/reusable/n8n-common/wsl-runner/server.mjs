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
import { TaskQueueManager, TaskStatus, QueueEventType } from "./lib/v2/task-queue.mjs";

// 使用 0.0.0.0 允许 Windows 主机访问 WSL 中的服务
const HOST = process.env.HOST || "0.0.0.0";
const PORT = Number(process.env.PORT || "3210");

// 队列管理器实例（启动时初始化）
let taskQueue = null;

// 异步任务追踪器（防止 Promise 被 GC）
const runningAsyncTasks = new Map();

const DEFAULT_PROJECT_ROOT = process.cwd();

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
 * 初始化任务队列管理器
 */
async function initTaskQueue(projectRoot) {
  if (taskQueue) return taskQueue;
  
  taskQueue = new TaskQueueManager({
    projectRoot,
    executor: executeQueuedTask,
    maxHistory: 100,
    maxQueueSize: 1000,
  });
  
  // 订阅队列事件用于日志
  taskQueue.on('event', (event) => {
    console.log(`[TaskQueue] ${event.type}:`, JSON.stringify(event).slice(0, 200));
  });
  
  await taskQueue.init();
  console.log('[TaskQueue] Initialized');
  
  return taskQueue;
}

/**
 * 执行队列中的任务
 * 这是 TaskQueueManager 的 executor 回调
 */
async function executeQueuedTask(task, options) {
  const projectRoot = task.inputs?.project_root || DEFAULT_PROJECT_ROOT;
  const flowspec = task.flowspec;
  const inputs = task.inputs || {};
  const runId = task.id;
  
  const runRelDir = path.posix.join(AUTOMATION_RUNS_DIR, runId);
  const runAbsDir = safeResolveUnderProject(projectRoot, runRelDir);
  
  // 确保运行目录存在
  await ensureDir(runAbsDir);
  
  // 解析 FlowSpec
  let flowSpecObj;
  const flowPath = safeResolveUnderProject(projectRoot, 
    flowspec.startsWith('/') ? flowspec : `workflows/reusable/pipeline-sys/v2-design/examples/${flowspec}`
  );
  try {
    const content = await fs.readFile(flowPath, "utf8");
    flowSpecObj = JSON.parse(content);
  } catch (e) {
    return { ok: false, error: `Failed to load flowspec: ${e.message}` };
  }
  
  // 创建工件写入器
  const artifactWriter = async (name, data, opts = {}) => {
    const absPath = path.posix.join(runAbsDir, name);
    if (opts.raw) {
      await writeText(absPath, data);
    } else {
      await writeJson(absPath, data);
    }
  };
  
  // 创建 FlowRunner（注入队列管理器）
  const runner = createFlowRunner({
    runId,
    runDir: runAbsDir,
    artifactWriter,
    emitEvents: true,
    queueManager: options.queueManager,
    baseUrl: `http://${HOST}:${PORT}`,
  });
  
  // 支持取消
  if (options.signal) {
    options.signal.addEventListener('abort', () => runner.cancel());
  }
  
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
      subtasks_count: runner.subtasks?.length || 0,
    };
  } catch (e) {
    return {
      ok: false,
      run_id: runId,
      error: e.message,
    };
  }
}

/**
 * 处理 v2 流程执行请求
 * 
 * @param {Object} body 请求体
 * @param {string} body.flowspec - FlowSpec JSON 对象或文件路径
 * @param {Object} [body.inputs] - 流程输入参数
 * @param {string} [body.run_id] - 自定义运行 ID
 * @param {string} [body.project_root] - 项目根目录
 * @param {boolean} [body.async] - 是否异步执行
 * @param {boolean} [body.use_queue] - 是否使用队列（默认 false）
 * @returns {Promise<Object>} 执行结果
 */
async function handleV2Run(body) {
  const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
  const flowspec = body.flowspec;
  const inputs = body.inputs || {};
  const customRunId = body.run_id || body.runId;
  const isAsync = body.async === true;
  const useQueue = body.use_queue === true;

  if (!flowspec) {
    return { ok: false, error: "flowspec is required (JSON object or file path)" };
  }

  // 如果使用队列，入队而非直接执行
  if (useQueue) {
    await initTaskQueue(projectRoot);
    const task = await taskQueue.enqueue({
      id: customRunId,
      flowspec: typeof flowspec === 'string' ? flowspec : 'inline-spec',
      inputs: { ...inputs, project_root: projectRoot, _flowspec_inline: typeof flowspec !== 'string' ? flowspec : undefined },
      priority: body.priority || 10,
      parent_id: body.parent_id,
    });
    
    return {
      ok: true,
      run_id: task.id,
      status: 'queued',
      message: 'Task queued for execution',
      queue_position: taskQueue.state.tasks.findIndex(t => t.id === task.id),
    };
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

  // 初始化队列管理器（用于子任务分发）
  await initTaskQueue(projectRoot);

  // 创建 FlowRunner
  const runner = createFlowRunner({
    runId,
    runDir: runAbsDir,
    artifactWriter,
    emitEvents: true,
    queueManager: taskQueue,
    baseUrl: `http://${HOST}:${PORT}`,
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
        subtasks_count: runner.subtasks?.length || 0,
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
    console.log(`[v2/run] ${runId} starting async execution...`);
    
    // 使用 setImmediate 确保 Promise 在下一个事件循环中执行
    const promise = new Promise((resolve) => {
      setImmediate(async () => {
        console.log(`[v2/run] ${runId} setImmediate callback triggered`);
        try {
          console.log(`[v2/run] ${runId} calling executeFlow()...`);
          const result = await executeFlow();
          console.log(`[v2/run] ${runId} executeFlow() completed:`, result?.status || 'unknown');
          resolve(result);
        } catch (e) {
          console.error(`[v2/run] ${runId} async error:`, e.message, e.stack);
          resolve({ ok: false, error: e.message });
        } finally {
          // 执行完成后从追踪器中移除
          runningAsyncTasks.delete(runId);
          console.log(`[v2/run] ${runId} removed from tracker (remaining: ${runningAsyncTasks.size})`);
        }
      });
    });

    // 保持 Promise 引用，防止被 GC
    runningAsyncTasks.set(runId, { promise, startedAt: Date.now() });
    console.log(`[v2/run] ${runId} added to tracker (total: ${runningAsyncTasks.size})`);

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

// FlowSpec 路径（相对于项目根目录）
const FIXED_FLOW_SPEC_PATH = "workflows/reusable/pipeline-sys/v2-design/examples/fixed-flow.flowspec.json";

/**
 * 处理 /fixed-flow 请求 - 使用 v2 引擎执行配置化流程
 * 
 * 这是 v1 硬编码流程的配置化替代版本。
 * 内部调用 v2 引擎 + fixed-flow.flowspec.json
 */
async function handleFixedFlow(body) {
  const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
  const taskId = body.task_id || body.taskId;
  const title = body.title || "";
  const role = body.role || "L3_engineer";
  const taskType = body.task_type || body.taskType || "code";
  const complexity = body.complexity || "normal";
  const modelOverride = body.model_override || body.modelOverride || "auto";
  const taskPackPath = body.task_pack_path || body.taskPackPath || "";
  const outcome = body.outcome || "";
  const runId = body.run_id || body.runId || makeRunId();
  const asyncMode = body.async !== false;

  if (!taskId) throw new Error("task_id is required");

  // 调用 v2 引擎执行 fixed-flow.flowspec.json
  const v2Result = await handleV2Run({
    flowspec: FIXED_FLOW_SPEC_PATH,
    inputs: {
      task_id: taskId,
      title,
      role,
      task_type: taskType,
      complexity,
      model_override: modelOverride,
      task_pack_path: taskPackPath,
      project_root: projectRoot,
      outcome,
    },
    run_id: runId,
    project_root: projectRoot,
    async: asyncMode,
  });

  // 转换为 v1 兼容的响应格式
  return {
    ok: v2Result.ok,
    run_id: v2Result.run_id,
    task_id: taskId,
    stage: v2Result.ok ? 99 : 0,
    elapsed_ms: v2Result.duration_ms,
    logs_dir: v2Result.logs_dir,
    started_async: v2Result.started_async,
    error: v2Result.error,
    // v2 扩展字段
    v2_status: v2Result.status,
    v2_output: v2Result.output,
  };
}

// ============================================
// [已删除] handleFixedFlowLegacy
// ============================================
// v1 硬编码流程已被配置化版本替代。
// 原代码约 400 行，已删除以简化维护。
// 如需查看历史版本，请参考 git log。
// ============================================

// 占位函数 - 防止意外调用
async function handleFixedFlowLegacy(_body) {
  throw new Error("handleFixedFlowLegacy has been removed. Use handleFixedFlow (v2 engine) instead.");
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

    // GET /async-tasks - 查看运行中的异步任务
    if (req.method === "GET" && req.url === "/async-tasks") {
      const tasks = [];
      for (const [runId, info] of runningAsyncTasks) {
        tasks.push({
          run_id: runId,
          started_at: new Date(info.startedAt).toISOString(),
          elapsed_ms: Date.now() - info.startedAt,
        });
      }
      return json(res, 200, { ok: true, count: tasks.length, tasks });
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

    // ============================================
    // 便捷入口端点：角色路由与快捷调用
    // ============================================

    const FLOWSPEC_BASE = "workflows/reusable/pipeline-sys/v2-design/examples";

    // POST /intake - 制作人统一入口
    if (req.method === "POST" && req.url === "/intake") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/pm-intake.flowspec.json`,
          inputs: {
            request_id: body.request_id || body.requestId || `REQ-${Date.now()}`,
            title: body.title || "",
            description: body.description || "",
            requester: body.requester || "api",
            priority: body.priority || "normal",
            target_role: body.target_role || body.targetRole || "",
            task_pack_path: body.task_pack_path || body.taskPackPath || "",
            auto_execute: body.auto_execute !== false
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /run-role - 通用角色路由（支持全部岗位）
    if (req.method === "POST" && req.url === "/run-role") {
      const body = await readJsonBody(req);
      const role = body.role || "L3_engineer";
      
      // 根据角色选择流程 - 完整映射表
      const roleToFlowspec = {
        // 通用程序
        "L3_engineer": "l3-execute",
        "L3_gameplay_engineer": "l3-execute",
        // 专项程序
        "L3_scripter": "l3-scripter",
        "L3_ui_engineer": "l3-ui-engineer",
        // 写手
        "L3_writer": "l3-writer",
        // 测试
        "L3_tester": "l3-tester",
        // 策划
        "L3_level_designer": "l3-level-designer",
        // 美术
        "L3_environment_artist": "l3-environment-artist",
        "L3_character_artist": "l3-character-artist",
        "L3_animator": "l3-animator",
        "L3_vfx_artist": "l3-vfx-artist",
        // 组长
        "L2_level_lead": "l2-level-lead",
        "L2_art_lead": "l2-art-lead",
        // 通用组长（使用 lead-decompose）
        "L2_client_lead": "lead-decompose",
        "L2_event_lead": "lead-decompose",
        "L2_narrative_lead": "lead-decompose",
        "L2_qa_lead": "lead-decompose",
        "L2_systems_lead": "lead-decompose",
        "L2_tools_lead": "lead-decompose",
        "L2_ui_lead": "lead-decompose",
        "L2_writing_lead": "lead-decompose",
      };
      
      // 获取流程规格，默认使用 l3-execute
      let flowspecName = roleToFlowspec[role];
      if (!flowspecName) {
        // 模糊匹配
        if (role.includes("writer")) flowspecName = "l3-writer";
        else if (role.includes("tester")) flowspecName = "l3-tester";
        else if (role.includes("scripter")) flowspecName = "l3-scripter";
        else if (role.includes("ui")) flowspecName = "l3-ui-engineer";
        else if (role.includes("level") && role.includes("designer")) flowspecName = "l3-level-designer";
        else if (role.includes("environment") || role.includes("scene") && role.includes("artist")) flowspecName = "l3-environment-artist";
        else if (role.includes("character") && role.includes("artist")) flowspecName = "l3-character-artist";
        else if (role.includes("animator") || role.includes("animation")) flowspecName = "l3-animator";
        else if (role.includes("vfx") || role.includes("effect")) flowspecName = "l3-vfx-artist";
        else if (role.includes("level") && role.includes("lead")) flowspecName = "l2-level-lead";
        else if (role.includes("art") && role.includes("lead")) flowspecName = "l2-art-lead";
        else if (role.includes("lead")) flowspecName = "lead-decompose";
        else flowspecName = "l3-execute";
      }
      let flowspec = `${FLOWSPEC_BASE}/${flowspecName}.flowspec.json`;
      
      try {
        const out = await handleV2Run({
          flowspec,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            role: role,
            task_type: body.task_type || body.taskType || "code",
            complexity: body.complexity || "normal"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /run-engineer - 程序员便捷入口
    if (req.method === "POST" && req.url === "/run-engineer") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-execute.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            role: "L3_engineer",
            task_type: "code",
            complexity: body.complexity || "normal"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /run-writer - 写手便捷入口
    if (req.method === "POST" && req.url === "/run-writer") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-writer.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            complexity: body.complexity || "normal",
            style_guide: body.style_guide || body.styleGuide || "design/01-narrative/对白词库 v1.md"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /run-tester - 测试员便捷入口
    if (req.method === "POST" && req.url === "/run-tester") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-tester.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            test_type: body.test_type || body.testType || "unit",
            requires_browser: body.requires_browser || body.requiresBrowser || false,
            complexity: body.complexity || "normal"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // === 白盒快速通道 ===
    
    // POST /whitebox/scene - 白盒场景占位
    if (req.method === "POST" && req.url === "/whitebox/scene") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/whitebox-scene.flowspec.json`,
          inputs: {
            zone_id: body.zone_id || body.zoneId,
            zone_name: body.zone_name || body.zoneName || body.title || "",
            zone_type: body.zone_type || body.zoneType || "life",
            chapter: body.chapter || "C0",
            width: body.width || 750,
            height: body.height || 1334,
            project_root: body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /whitebox/character - 白盒角色占位
    if (req.method === "POST" && req.url === "/whitebox/character") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/whitebox-character.flowspec.json`,
          inputs: {
            character_id: body.character_id || body.characterId,
            character_name: body.character_name || body.characterName || body.title || "",
            character_type: body.character_type || body.characterType || "npc",
            color: body.color || "#00FFF0",
            icon: body.icon || "👤",
            project_root: body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /whitebox/object - 白盒物件占位
    if (req.method === "POST" && req.url === "/whitebox/object") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/whitebox-object.flowspec.json`,
          inputs: {
            object_id: body.object_id || body.objectId,
            object_name: body.object_name || body.objectName || body.title || "",
            object_type: body.object_type || body.objectType || "interactable",
            zone_id: body.zone_id || body.zoneId,
            position_x: body.position_x || body.positionX || body.x || 375,
            position_y: body.position_y || body.positionY || body.y || 667,
            icon: body.icon || "📦",
            project_root: body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // === 专项程序员便捷入口 ===

    // POST /run-scripter - 脚本员便捷入口
    if (req.method === "POST" && req.url === "/run-scripter") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-scripter.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            zone_id: body.zone_id || body.zoneId || "",
            script_type: body.script_type || body.scriptType || "zone",
            model_override: body.model_override || body.modelOverride || "auto"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /run-ui-engineer - UI程序员便捷入口
    if (req.method === "POST" && req.url === "/run-ui-engineer") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-ui-engineer.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            ui_component: body.ui_component || body.uiComponent || "",
            model_override: body.model_override || body.modelOverride || "auto"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // === 策划便捷入口 ===

    // POST /run-level-designer - 场景策划便捷入口
    if (req.method === "POST" && req.url === "/run-level-designer") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-level-designer.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            zone_id: body.zone_id || body.zoneId || "",
            chapter: body.chapter || "",
            model_override: body.model_override || body.modelOverride || "auto"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // === 组长便捷入口 ===

    // POST /level-lead - 关卡组长便捷入口
    if (req.method === "POST" && req.url === "/level-lead") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l2-level-lead.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            description: body.description || "",
            chapter: body.chapter || "",
            zones: body.zones || [],
            auto_dispatch: body.auto_dispatch !== false
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /art-lead - 美术组长便捷入口
    if (req.method === "POST" && req.url === "/art-lead") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l2-art-lead.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            description: body.description || "",
            asset_types: body.asset_types || body.assetTypes || [],
            auto_dispatch: body.auto_dispatch !== false
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // === 美术便捷入口（Windows MCP Runner 执行） ===

    // POST /run-environment-artist - 场景美术便捷入口
    if (req.method === "POST" && req.url === "/run-environment-artist") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-environment-artist.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            zone_id: body.zone_id || body.zoneId || "",
            asset_type: body.asset_type || body.assetType || "background",
            width: body.width || 750,
            height: body.height || 1334
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /run-character-artist - 角色美术便捷入口
    if (req.method === "POST" && req.url === "/run-character-artist") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-character-artist.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            character_id: body.character_id || body.characterId,
            asset_type: body.asset_type || body.assetType || "portrait",
            expressions: body.expressions || ["neutral", "happy", "sad", "angry", "surprised"]
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /run-animator - 动画便捷入口
    if (req.method === "POST" && req.url === "/run-animator") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-animator.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            animation_type: body.animation_type || body.animationType || "character",
            character_id: body.character_id || body.characterId || "",
            animation_name: body.animation_name || body.animationName || "idle",
            frame_count: body.frame_count || body.frameCount || 8,
            frame_rate: body.frame_rate || body.frameRate || 12,
            output_mode: body.output_mode || body.outputMode || "spritesheet"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /run-vfx-artist - 特效便捷入口
    if (req.method === "POST" && req.url === "/run-vfx-artist") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-vfx-artist.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            task_pack_path: body.task_pack_path || body.taskPackPath,
            vfx_type: body.vfx_type || body.vfxType || "particle",
            vfx_name: body.vfx_name || body.vfxName || "effect",
            frame_count: body.frame_count || body.frameCount || 16,
            width: body.width || 256,
            height: body.height || 256,
            loop: body.loop !== false
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /decompose - 组长拆解入口
    if (req.method === "POST" && req.url === "/decompose") {
      const body = await readJsonBody(req);
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/lead-decompose.flowspec.json`,
          inputs: {
            task_id: body.task_id || body.taskId || `TASK-${Date.now()}`,
            title: body.title || "",
            description: body.description || "",
            lead_role: body.lead_role || body.leadRole || "L2_client_lead",
            max_subtasks: body.max_subtasks || body.maxSubtasks || 5,
            auto_dispatch: body.auto_dispatch || body.autoDispatch || false
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // ============================================
    // 审查系统 API
    // ============================================

    // POST /review/code - 代码审查
    if (req.method === "POST" && req.url === "/review/code") {
      const body = await readJsonBody(req);
      const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l2-code-review.flowspec.json`,
          inputs: {
            project_root: projectRoot,
            task_id: body.task_id || body.taskId,
            title: body.title || "",
            commit_range: body.commit_range || body.commitRange || "HEAD~1..HEAD",
            changed_files: body.changed_files || body.changedFiles || "",
            review_dimensions: body.review_dimensions || body.reviewDimensions || "logic,style,security,performance,maintainability",
            pass_threshold: body.pass_threshold || body.passThreshold || 60,
            reviewer: body.reviewer || "AI"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /review/design - 设计审查
    if (req.method === "POST" && req.url === "/review/design") {
      const body = await readJsonBody(req);
      const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l1-design-review.flowspec.json`,
          inputs: {
            project_root: projectRoot,
            doc_path: body.doc_path || body.docPath,
            doc_type: body.doc_type || body.docType || "spec",
            review_focus: body.review_focus || body.reviewFocus || "completeness,consistency,feasibility,clarity",
            parent_doc_path: body.parent_doc_path || body.parentDocPath || "",
            pass_threshold: body.pass_threshold || body.passThreshold || 70,
            reviewer: body.reviewer || "AI"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /review/qa-signoff - QA签字
    if (req.method === "POST" && req.url === "/review/qa-signoff") {
      const body = await readJsonBody(req);
      const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l3-qa-signoff.flowspec.json`,
          inputs: {
            project_root: projectRoot,
            task_id: body.task_id || body.taskId,
            task_pack_path: body.task_pack_path || body.taskPackPath,
            signoff_type: body.signoff_type || body.signoffType || "feature",
            auto_checks: body.auto_checks || body.autoChecks || "lint,typecheck,test,build",
            signer: body.signer || "L3_tester"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /review/acceptance - 里程碑验收
    if (req.method === "POST" && req.url === "/review/acceptance") {
      const body = await readJsonBody(req);
      const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l0-acceptance-review.flowspec.json`,
          inputs: {
            project_root: projectRoot,
            milestone_id: body.milestone_id || body.milestoneId,
            scope_chapters: body.scope_chapters || body.scopeChapters || "",
            scope_systems: body.scope_systems || body.scopeSystems || "",
            period_start: body.period_start || body.periodStart || "",
            period_end: body.period_end || body.periodEnd || "",
            reviewer: body.reviewer || "L0_producer"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /audit/intake - 制作人总体审核入口
    if (req.method === "POST" && req.url === "/audit/intake") {
      const body = await readJsonBody(req);
      const projectRoot = body.project_root || body.projectRoot || DEFAULT_PROJECT_ROOT;
      try {
        const out = await handleV2Run({
          flowspec: `${FLOWSPEC_BASE}/l0-audit-intake.flowspec.json`,
          inputs: {
            project_root: projectRoot,
            audit_scope: body.audit_scope || body.auditScope || "all",
            milestone_id: body.milestone_id || body.milestoneId || "",
            chapter_ids: body.chapter_ids || body.chapterIds || "",
            period_days: body.period_days || body.periodDays || 7,
            include_code_review: body.include_code_review !== false,
            include_design_review: body.include_design_review !== false,
            include_qa_signoff: body.include_qa_signoff !== false,
            auto_trigger_missing: body.auto_trigger_missing || body.autoTriggerMissing || false,
            report_format: body.report_format || body.reportFormat || "markdown",
            requester: body.requester || "L0_producer"
          },
          async: body.async !== false
        });
        return json(res, 200, out);
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // GET /reviews - 列出所有审查记录
    if (req.method === "GET" && req.url?.startsWith("/reviews")) {
      const q = getQueryParams(req.url);
      const reviewType = q.type || "";
      const limit = parseInt(q.limit || "50", 10);
      const projectRoot = q.project_root || DEFAULT_PROJECT_ROOT;
      
      try {
        const reviewsDir = path.posix.join(projectRoot, "workflows/project/logs/reviews");
        await ensureDir(reviewsDir);
        
        const files = await fs.readdir(reviewsDir).catch(() => []);
        let reviews = [];
        
        for (const file of files.slice(0, limit)) {
          if (file.endsWith(".json")) {
            try {
              const content = await fs.readFile(path.posix.join(reviewsDir, file), "utf8");
              const review = JSON.parse(content);
              if (!reviewType || 
                  (reviewType === "code" && review.review_id?.startsWith("CR-")) ||
                  (reviewType === "design" && review.review_id?.startsWith("DR-")) ||
                  (reviewType === "qa" && review.signoff_id?.startsWith("QA-")) ||
                  (reviewType === "acceptance" && review.acceptance_id?.startsWith("ACC-"))) {
                reviews.push(review);
              }
            } catch (e) { /* skip invalid files */ }
          }
        }
        
        return json(res, 200, { 
          ok: true, 
          reviews,
          total: reviews.length,
          filter: reviewType || "all"
        });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // GET /audits - 列出审核报告
    if (req.method === "GET" && req.url?.startsWith("/audits")) {
      const q = getQueryParams(req.url);
      const limit = parseInt(q.limit || "20", 10);
      const projectRoot = q.project_root || DEFAULT_PROJECT_ROOT;
      
      try {
        const auditsDir = path.posix.join(projectRoot, "workflows/project/logs/audits");
        await ensureDir(auditsDir);
        
        const files = await fs.readdir(auditsDir).catch(() => []);
        let audits = [];
        
        for (const file of files.slice(0, limit)) {
          if (file.endsWith(".json")) {
            try {
              const content = await fs.readFile(path.posix.join(auditsDir, file), "utf8");
              audits.push(JSON.parse(content));
            } catch (e) { /* skip invalid files */ }
          }
        }
        
        return json(res, 200, { 
          ok: true, 
          audits,
          total: audits.length
        });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // ============================================
    // 队列管理 API
    // ============================================

    // GET /queue - 获取队列状态
    if (req.method === "GET" && req.url === "/queue") {
      try {
        await initTaskQueue(DEFAULT_PROJECT_ROOT);
        const status = taskQueue.getStatus();
        return json(res, 200, { ok: true, ...status });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // GET /queue/history - 获取队列历史
    if (req.method === "GET" && req.url?.startsWith("/queue/history")) {
      const q = getQueryParams(req.url);
      const limit = parseInt(q.limit || '20', 10);
      const offset = parseInt(q.offset || '0', 10);
      try {
        await initTaskQueue(DEFAULT_PROJECT_ROOT);
        const history = taskQueue.getHistory(limit, offset);
        return json(res, 200, { 
          ok: true, 
          history,
          total: taskQueue.state.history.length,
          limit,
          offset
        });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /queue/pause - 暂停队列
    if (req.method === "POST" && req.url === "/queue/pause") {
      try {
        await initTaskQueue(DEFAULT_PROJECT_ROOT);
        await taskQueue.pause();
        return json(res, 200, { 
          ok: true, 
          paused: true, 
          message: "Queue paused. Current task will complete, new tasks won't start."
        });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /queue/resume - 恢复队列
    if (req.method === "POST" && req.url === "/queue/resume") {
      try {
        await initTaskQueue(DEFAULT_PROJECT_ROOT);
        await taskQueue.resume();
        return json(res, 200, { 
          ok: true, 
          paused: false, 
          message: "Queue resumed. Pending tasks will start processing."
        });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /queue/clear - 清空待执行队列
    if (req.method === "POST" && req.url === "/queue/clear") {
      try {
        await initTaskQueue(DEFAULT_PROJECT_ROOT);
        const count = await taskQueue.clear();
        return json(res, 200, { 
          ok: true, 
          cleared_count: count,
          message: `Cleared ${count} queued tasks.`
        });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // GET /queue/:task_id - 获取任务详情
    if (req.method === "GET" && req.url?.match(/^\/queue\/[^/]+$/)) {
      const taskId = req.url.split('/')[2];
      try {
        await initTaskQueue(DEFAULT_PROJECT_ROOT);
        const task = taskQueue.getTask(taskId);
        if (!task) {
          return json(res, 404, { ok: false, error: "Task not found" });
        }
        return json(res, 200, { ok: true, task });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // DELETE /queue/:task_id - 取消/移除任务
    if (req.method === "DELETE" && req.url?.match(/^\/queue\/[^/]+$/)) {
      const taskId = req.url.split('/')[2];
      try {
        await initTaskQueue(DEFAULT_PROJECT_ROOT);
        const cancelled = await taskQueue.cancel(taskId);
        if (!cancelled) {
          return json(res, 404, { ok: false, error: "Task not found or already completed" });
        }
        return json(res, 200, { 
          ok: true, 
          task_id: taskId, 
          message: "Task cancelled"
        });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /queue/:task_id/retry - 重试失败任务
    if (req.method === "POST" && req.url?.match(/^\/queue\/[^/]+\/retry$/)) {
      const taskId = req.url.split('/')[2];
      try {
        await initTaskQueue(DEFAULT_PROJECT_ROOT);
        const newTask = await taskQueue.retry(taskId);
        if (!newTask) {
          return json(res, 404, { ok: false, error: "Task not found or not in failed/cancelled state" });
        }
        return json(res, 200, { 
          ok: true, 
          original_task_id: taskId,
          new_task_id: newTask.id,
          message: "Task queued for retry"
        });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // POST /queue/:task_id/priority - 调整优先级
    if (req.method === "POST" && req.url?.match(/^\/queue\/[^/]+\/priority$/)) {
      const taskId = req.url.split('/')[2];
      const body = await readJsonBody(req);
      const priority = body.priority;
      
      if (typeof priority !== 'number') {
        return json(res, 400, { ok: false, error: "priority (number) is required" });
      }
      
      try {
        await initTaskQueue(DEFAULT_PROJECT_ROOT);
        const updated = await taskQueue.setPriority(taskId, priority);
        if (!updated) {
          return json(res, 404, { ok: false, error: "Task not found in queue" });
        }
        return json(res, 200, { 
          ok: true, 
          task_id: taskId,
          priority,
          message: "Priority updated"
        });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // GET /queue/:task_id/subtasks - 获取子任务列表
    if (req.method === "GET" && req.url?.match(/^\/queue\/[^/]+\/subtasks$/)) {
      const taskId = req.url.split('/')[2];
      try {
        await initTaskQueue(DEFAULT_PROJECT_ROOT);
        const subtasks = taskQueue.getSubtasks(taskId);
        return json(res, 200, { 
          ok: true, 
          parent_id: taskId,
          count: subtasks.length,
          subtasks
        });
      } catch (e) {
        return json(res, 500, { ok: false, error: String(e?.message || e) });
      }
    }

    // GET /flows - 列出可用流程
    if (req.method === "GET" && req.url === "/flows") {
      return json(res, 200, {
        ok: true,
        flows: [
          // 入口流程
          { id: "fixed-flow", name: "AI-Native Fixed Flow", endpoint: "/fixed-flow", description: "原有固定流程（配置化版本）" },
          { id: "pm-intake", name: "制作人入口", endpoint: "/intake", description: "统一入口，自动分析需求并路由" },
          { id: "run-role", name: "通用角色路由", endpoint: "/run-role", description: "根据 role 参数自动选择流程" },
          
          // 白盒快速通道（Phase 0）
          { id: "whitebox-scene", name: "白盒场景", endpoint: "/whitebox/scene", description: "快速生成场景占位资源" },
          { id: "whitebox-character", name: "白盒角色", endpoint: "/whitebox/character", description: "快速生成角色占位资源" },
          { id: "whitebox-object", name: "白盒物件", endpoint: "/whitebox/object", description: "快速生成物件占位资源" },
          
          // 程序类（Phase 1）
          { id: "l3-execute", name: "L3 程序员", endpoint: "/run-engineer", description: "通用程序员执行流程" },
          { id: "l3-scripter", name: "L3 脚本员", endpoint: "/run-scripter", description: "Zone/Event/对白脚本编写" },
          { id: "l3-ui-engineer", name: "L3 UI程序员", endpoint: "/run-ui-engineer", description: "UI界面/组件实现" },
          { id: "l3-writer", name: "L3 写手", endpoint: "/run-writer", description: "文案/对白/剧情写作" },
          { id: "l3-tester", name: "L3 测试员", endpoint: "/run-tester", description: "单元测试/E2E测试/浏览器测试" },
          
          // 策划类（Phase 2）
          { id: "l2-level-lead", name: "关卡组长", endpoint: "/level-lead", description: "关卡任务拆解分发" },
          { id: "l3-level-designer", name: "场景策划", endpoint: "/run-level-designer", description: "Zone布局/谜题/叙事节奏设计" },
          
          // 美术类（Phase 3, 需要 Windows MCP Runner）
          { id: "l2-art-lead", name: "美术组长", endpoint: "/art-lead", description: "美术任务拆解分发" },
          { id: "l3-environment-artist", name: "场景美术", endpoint: "/run-environment-artist", description: "场景背景/地图元素（PNG）" },
          { id: "l3-character-artist", name: "角色美术", endpoint: "/run-character-artist", description: "角色立绘/表情差分（PNG）" },
          { id: "l3-animator", name: "动画", endpoint: "/run-animator", description: "角色动画/过场动画（PNG序列）" },
          { id: "l3-vfx-artist", name: "特效", endpoint: "/run-vfx-artist", description: "视觉特效/粒子效果（PNG）" },
          
          // 通用组长
          { id: "lead-decompose", name: "组长拆解", endpoint: "/decompose", description: "大任务拆分为子任务" },
          
          // 审查系统
          { id: "l2-code-review", name: "代码审查", endpoint: "/review/code", description: "L2 组长级代码审查" },
          { id: "l1-design-review", name: "设计审查", endpoint: "/review/design", description: "L1 总监级设计审查" },
          { id: "l3-qa-signoff", name: "QA签字", endpoint: "/review/qa-signoff", description: "L3 测试员验收签字" },
          { id: "l0-acceptance-review", name: "里程碑验收", endpoint: "/review/acceptance", description: "L0 里程碑综合验收" },
          { id: "l0-audit-intake", name: "总体审核", endpoint: "/audit/intake", description: "制作人一键审核入口" }
        ],
        review_endpoints: [
          { method: "POST", endpoint: "/review/code", description: "发起代码审查" },
          { method: "POST", endpoint: "/review/design", description: "发起设计审查" },
          { method: "POST", endpoint: "/review/qa-signoff", description: "发起QA签字" },
          { method: "POST", endpoint: "/review/acceptance", description: "发起里程碑验收" },
          { method: "POST", endpoint: "/audit/intake", description: "制作人总体审核" },
          { method: "GET", endpoint: "/reviews", description: "列出审查记录（支持 ?type=code|design|qa|acceptance）" },
          { method: "GET", endpoint: "/audits", description: "列出审核报告" }
        ],
        queue_endpoints: [
          { method: "GET", endpoint: "/queue", description: "获取队列状态" },
          { method: "GET", endpoint: "/queue/history", description: "获取历史记录（支持 limit/offset）" },
          { method: "POST", endpoint: "/queue/pause", description: "暂停队列" },
          { method: "POST", endpoint: "/queue/resume", description: "恢复队列" },
          { method: "POST", endpoint: "/queue/clear", description: "清空待执行队列" },
          { method: "GET", endpoint: "/queue/:task_id", description: "获取任务详情" },
          { method: "DELETE", endpoint: "/queue/:task_id", description: "取消/移除任务" },
          { method: "POST", endpoint: "/queue/:task_id/retry", description: "重试失败任务" },
          { method: "POST", endpoint: "/queue/:task_id/priority", description: "调整优先级" },
          { method: "GET", endpoint: "/queue/:task_id/subtasks", description: "获取子任务列表" }
        ]
      });
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


