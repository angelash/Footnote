import { readFileSync } from 'fs';

const spec = JSON.parse(readFileSync('workflows/reusable/pipeline-sys/v2-design/examples/l0-audit-intake.flowspec.json', 'utf8'));

console.log('Flow ID:', spec.id);
console.log('Nodes count:', spec.nodes?.length);
console.log('Edges count:', spec.edges?.length);

// 找到入口节点（没有入边的节点）
const nodesWithInEdges = new Set(spec.edges?.map(e => e.to) || []);
const entryNodes = spec.nodes?.filter(n => !nodesWithInEdges.has(n.id)) || [];

console.log('Entry nodes:', entryNodes.map(n => n.id));
console.log('First node:', spec.nodes?.[0]?.id);
