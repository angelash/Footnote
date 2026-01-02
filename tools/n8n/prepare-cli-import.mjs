import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

function die(message) {
  // eslint-disable-next-line no-console
  console.error(`[prepare-cli-import] ERROR: ${message}`);
  process.exit(1);
}

function randomId(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function uuid() {
  // Node 18+ supports randomUUID()
  return crypto.randomUUID();
}

function main() {
  const [, , inputPathRaw, outputPathRaw] = process.argv;
  if (!inputPathRaw || !outputPathRaw) {
    die('Usage: node tools/n8n/prepare-cli-import.mjs <input.json> <output.json>');
  }

  const inputPath = path.resolve(process.cwd(), inputPathRaw);
  const outputPath = path.resolve(process.cwd(), outputPathRaw);

  const text = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(text);

  // If already in export format (array), pass-through.
  if (Array.isArray(parsed)) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), 'utf8');
    // eslint-disable-next-line no-console
    console.log(`[prepare-cli-import] OK (passthrough): ${outputPathRaw}`);
    return;
  }

  const now = new Date().toISOString();
  const versionUuid = uuid();

  const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
  // Ensure webhook nodes have webhookId (required for publishing webhooks on newer n8n)
  for (const node of nodes) {
    if (node && typeof node === 'object') {
      const type = typeof node.type === 'string' ? node.type : '';
      if (type === 'n8n-nodes-base.webhook' && typeof node.webhookId !== 'string') {
        // eslint-disable-next-line no-param-reassign
        node.webhookId = uuid();
      }
    }
  }

  const workflow = {
    name: parsed.name ?? 'Imported Workflow',
    description: parsed.description ?? null,
    active: Boolean(parsed.active ?? false),
    isArchived: false,
    nodes,
    connections: parsed.connections ?? {},
    settings: parsed.settings ?? { executionOrder: 'v1', availableInMCP: false },
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

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify([workflow], null, 2), 'utf8');
  // eslint-disable-next-line no-console
  console.log(`[prepare-cli-import] OK: ${outputPathRaw}`);
}

main();


