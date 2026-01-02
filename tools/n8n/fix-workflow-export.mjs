import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function die(message) {
  // eslint-disable-next-line no-console
  console.error(`[fix-workflow-export] ERROR: ${message}`);
  process.exit(1);
}

function main() {
  const [, , srcPathRaw, workflowId, outPathRaw] = process.argv;
  if (!srcPathRaw || !workflowId || !outPathRaw) {
    die('Usage: node tools/n8n/fix-workflow-export.mjs <src-workflow.json> <workflowId> <out.json>');
  }

  const srcPath = path.resolve(process.cwd(), srcPathRaw);
  const outPath = path.resolve(process.cwd(), outPathRaw);

  const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  if (Array.isArray(src)) {
    die('src-workflow.json must be UI-style workflow JSON (object), not an exported array');
  }

  const now = new Date().toISOString();
  const versionUuid = crypto.randomUUID();

  const nodes = Array.isArray(src.nodes) ? src.nodes : [];
  for (const node of nodes) {
    if (node && typeof node === 'object' && node.type === 'n8n-nodes-base.webhook') {
      if (typeof node.webhookId !== 'string' || node.webhookId.length < 8) {
        // eslint-disable-next-line no-param-reassign
        node.webhookId = crypto.randomUUID();
      }
    }
  }

  const wf = {
    id: workflowId,
    name: src.name ?? 'Workflow',
    description: src.description ?? null,
    active: Boolean(src.active ?? false),
    isArchived: false,
    nodes,
    connections: src.connections ?? {},
    settings: { executionOrder: 'v1', availableInMCP: false, ...(src.settings ?? {}) },
    staticData: null,
    meta: null,
    pinData: {},
    versionId: versionUuid,
    activeVersionId: versionUuid,
    versionCounter: 1,
    triggerCount: 0,
    tags: [],
    createdAt: now,
    updatedAt: now,
    shared: [],
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify([wf], null, 2), 'utf8');
  // eslint-disable-next-line no-console
  console.log(`[fix-workflow-export] OK: ${outPathRaw}`);
}

main();


