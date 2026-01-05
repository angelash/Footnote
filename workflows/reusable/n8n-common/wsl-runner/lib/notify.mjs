/**
 * Notify utilities
 * 发送通知（复用现有逻辑）
 */

/**
 * 发送通知
 * @param {object} options 选项
 * @param {boolean} options.ok 是否成功
 * @param {string} options.taskId 任务 ID
 * @param {string} options.title 标题
 * @param {string} options.runId run ID
 * @param {number} options.stage 阶段
 * @param {string} options.projectRoot 项目根目录
 * @param {string} options.logRelDir 日志相对目录
 * @param {string} options.head git head
 * @returns {Promise<object>}
 */
export async function sendNotify({ ok, taskId, title, runId, stage, projectRoot, logRelDir, head }) {
  const payload = {
    receiver: 'gz0149',
    title: 'Cursor任务完成',
    msg: [
      `task_id=${taskId}`,
      `run_id=${runId}`,
      `stage=${stage}`,
      `ok=${ok}`,
      title ? `title=${title}` : '',
      head ? `head=${head}` : '',
      `logs=${logRelDir}`,
      `project_root=${projectRoot}`,
    ]
      .filter(Boolean)
      .join('\n'),
  };

  const startedAt = Date.now();
  try {
    const res = await fetch('https://newsfeed.4399om.com/api/messages/send.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

