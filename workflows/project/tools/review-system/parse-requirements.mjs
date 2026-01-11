#!/usr/bin/env node
/**
 * parse-requirements.mjs - 需求清单解析器
 *
 * 功能：
 * 1. 解析 Markdown 中的 `- [ ]` / `- [x]` checklist
 * 2. 解析表格中的状态列（如 `✅完成` / `❌未开始`）
 * 3. 提取任务的模块、章节、系统归属
 * 4. 输出结构化的工作项列表
 *
 * 用法：
 *   node parse-requirements.mjs --project-root=/path/to/project [--output=json|summary]
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

// ============================================
// 配置
// ============================================

const BIBLE_FILES = [
  'design/ai-native/01_bibles/tech_bible.md',
  'design/ai-native/01_bibles/design_bible.md',
  'design/ai-native/01_bibles/art_bible.md',
  'design/ai-native/01_bibles/qa_bible.md',
];

const SPEC_FILES = [
  'design/ai-native/02_specs/DEV-PLAN_2026Q1.md',
  'design/ai-native/02_specs/systems/narrative_system_spec.md',
  'design/ai-native/02_specs/systems/save_system_spec.md',
  'design/ai-native/02_specs/systems/event_system_spec.md',
  'design/ai-native/02_specs/systems/choice_system_spec.md',
  'design/ai-native/02_specs/systems/ui_system_spec.md',
  'design/ai-native/02_specs/ui/ui_components_spec.md',
  'design/ai-native/02_specs/ui/ui_flow_spec.md',
];

// 模块关键词映射
const MODULE_KEYWORDS = {
  narrative: ['narrative', '叙事', '对白', '剧情', 'dialogue', 'story', 'foreshadow', '伏笔'],
  system: ['system', '系统', 'engine', 'manager', 'worldstate', 'ability', '能力'],
  ui: ['ui', 'UI', '界面', 'component', '组件', 'menu', 'toast', 'card', 'inventory'],
  level: ['level', '关卡', 'zone', 'scene', '场景', 'chapter', '章节'],
  art: ['art', '美术', 'asset', '资源', 'sprite', 'animation', '动画'],
  qa: ['qa', 'QA', 'test', '测试', 'coverage', '覆盖率', 'e2e', 'lint'],
  infra: ['infra', 'build', '构建', 'ci', 'deploy', 'config', '配置', 'typecheck'],
};

// 系统关键词映射
const SYSTEM_KEYWORDS = {
  card: ['card', '卡片', 'inventory'],
  dialogue: ['dialogue', '对白', '对话', 'conversation'],
  save: ['save', '存档', 'load', '读档', 'persist'],
  ability: ['ability', '能力', 'depth', 'time', 'intervention'],
  world_state: ['worldstate', 'world_state', '世界状态', 'counter', '计数器'],
  event: ['event', '事件', 'trigger', '触发'],
  foreshadow: ['foreshadow', '伏笔'],
  audio: ['audio', '音频', 'bgm', 'sfx', 'sound'],
  input: ['input', '输入', 'touch', 'keyboard'],
  scene: ['scene', '场景', 'zone', 'assemble'],
  asset: ['asset', '资源', 'loader', 'manifest'],
  debug: ['debug', '调试', '__DEBUG__'],
};

// 章节关键词映射
const CHAPTER_KEYWORDS = {
  C0: ['c0', 'C0', '序章', 'prologue', 'tutorial'],
  C1: ['c1', 'C1', '第一章', 'chapter1', 'chapter 1'],
  C2: ['c2', 'C2', '第二章', 'chapter2', 'chapter 2'],
  C3: ['c3', 'C3', '第三章', 'chapter3', 'chapter 3'],
  C4: ['c4', 'C4', '第四章', 'chapter4', 'chapter 4'],
  C5: ['c5', 'C5', '终章', 'ending', 'epilogue'],
  common: ['common', '通用', 'core', '核心'],
};

// 优先级关键词
const PRIORITY_KEYWORDS = {
  P0: ['P0', 'p0', '必须', '阻塞', 'blocker', 'critical', '紧急'],
  P1: ['P1', 'p1', '重要', '尽量', 'major', 'should'],
  P2: ['P2', 'p2', '可选', 'minor', 'nice-to-have', 'optional'],
};

// ============================================
// 解析函数
// ============================================

/**
 * 解析 Markdown checklist
 * @param {string} content - Markdown 内容
 * @param {string} sourcePath - 来源文件路径
 * @returns {Array} 工作项列表
 */
function parseChecklistItems(content, sourcePath) {
  const items = [];
  const lines = content.split('\n');

  let currentSection = '';
  let currentSubsection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 检测标题（用于确定上下文）
    const h2Match = line.match(/^##\s+(.+)/);
    const h3Match = line.match(/^###\s+(.+)/);
    const h4Match = line.match(/^####\s+(.+)/);

    if (h2Match) {
      currentSection = h2Match[1].trim();
      currentSubsection = '';
      continue;
    }
    if (h3Match) {
      currentSubsection = h3Match[1].trim();
      continue;
    }
    if (h4Match) {
      currentSubsection = h4Match[1].trim();
      continue;
    }

    // 解析 checklist 项
    const checkboxMatch = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.+)/);
    if (checkboxMatch) {
      const indent = checkboxMatch[1].length;
      const checked = checkboxMatch[2].toLowerCase() === 'x';
      const text = checkboxMatch[3].trim();

      // 跳过空文本
      if (!text) continue;

      // 生成 ID
      const id = generateItemId(sourcePath, lineNum, text);

      // 推断属性
      const context = `${currentSection} ${currentSubsection} ${text}`;
      const module = inferModule(context);
      const system = inferSystem(context);
      const chapter = inferChapter(context);
      const priority = inferPriority(context);

      items.push({
        id,
        title: text,
        source: inferSource(sourcePath),
        source_path: sourcePath,
        source_line: lineNum,
        module,
        chapter,
        system,
        priority,
        status: checked ? 'done' : 'pending',
        completion_pct: checked ? 100 : 0,
        context: {
          section: currentSection,
          subsection: currentSubsection,
          indent,
        },
      });
    }
  }

  return items;
}

/**
 * 解析 Markdown 表格中的模块状态
 * @param {string} content - Markdown 内容
 * @param {string} sourcePath - 来源文件路径
 * @returns {Array} 工作项列表
 */
function parseTableItems(content, sourcePath) {
  const items = [];
  const lines = content.split('\n');

  let currentSection = '';
  let inTable = false;
  let headers = [];
  let statusColIndex = -1;
  let nameColIndex = -1;
  let pathColIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 检测标题
    const h2Match = line.match(/^##\s+(.+)/);
    const h3Match = line.match(/^###\s+(.+)/);
    if (h2Match) {
      currentSection = h2Match[1].trim();
      inTable = false;
      continue;
    }
    if (h3Match) {
      currentSection = h3Match[1].trim();
      inTable = false;
      continue;
    }

    // 检测表格头
    if (line.includes('|') && !inTable) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        headers = cells;
        // 查找状态列
        statusColIndex = headers.findIndex(
          (h) => h.includes('状态') || h.includes('Status') || h.includes('完成')
        );
        nameColIndex = headers.findIndex(
          (h) => h.includes('模块') || h.includes('名称') || h.includes('Name') || h.includes('功能')
        );
        pathColIndex = headers.findIndex((h) => h.includes('路径') || h.includes('Path'));
        inTable = true;
        continue;
      }
    }

    // 跳过分隔行
    if (inTable && line.match(/^\|[\s-:|]+\|$/)) {
      continue;
    }

    // 解析表格数据行
    if (inTable && line.includes('|')) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length < 2) {
        inTable = false;
        continue;
      }

      // 获取模块名和状态
      const name = nameColIndex >= 0 ? cells[nameColIndex] : cells[0];
      const status = statusColIndex >= 0 ? cells[statusColIndex] : '';
      const modulePath = pathColIndex >= 0 ? cells[pathColIndex] : '';

      // 跳过无效行
      if (!name || name.startsWith('-')) continue;

      // 解析状态
      const isDone = status.includes('✅') || status.includes('完成') || status.includes('Done');
      const isInProgress = status.includes('🚧') || status.includes('进行中') || status.includes('WIP');
      const isBlocked = status.includes('❌') || status.includes('阻塞') || status.includes('Blocked');

      let itemStatus = 'pending';
      let completionPct = 0;
      if (isDone) {
        itemStatus = 'done';
        completionPct = 100;
      } else if (isInProgress) {
        itemStatus = 'in_progress';
        completionPct = 50;
      } else if (isBlocked) {
        itemStatus = 'blocked';
        completionPct = 0;
      }

      const id = generateItemId(sourcePath, lineNum, name);
      const context = `${currentSection} ${name} ${modulePath}`;

      items.push({
        id,
        title: name.replace(/\*\*/g, '').trim(),
        source: inferSource(sourcePath),
        source_path: sourcePath,
        source_line: lineNum,
        module: inferModule(context),
        chapter: inferChapter(context),
        system: inferSystem(context),
        priority: inferPriority(context),
        status: itemStatus,
        completion_pct: completionPct,
        evidence: modulePath ? [`path:${modulePath.replace(/`/g, '')}`] : [],
        context: {
          section: currentSection,
          table_row: cells,
        },
      });
    }
  }

  return items;
}

/**
 * 解析里程碑/周计划中的任务
 * @param {string} content - Markdown 内容
 * @param {string} sourcePath - 来源文件路径
 * @returns {Array} 工作项列表
 */
function parseMilestoneItems(content, sourcePath) {
  const items = [];
  const lines = content.split('\n');

  let currentMilestone = '';
  let currentWeek = '';
  let currentPriority = 'P1';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 检测里程碑标题
    const msMatch = line.match(/^###\s+(M\d|W\d+)[：:]\s*(.+)/i);
    if (msMatch) {
      currentMilestone = msMatch[1].toUpperCase();
      currentWeek = msMatch[1].toUpperCase();
      continue;
    }

    // 检测优先级区块
    if (line.match(/^\*\*P0/i)) currentPriority = 'P0';
    else if (line.match(/^\*\*P1/i)) currentPriority = 'P1';
    else if (line.match(/^\*\*P2/i)) currentPriority = 'P2';

    // 解析任务项（加粗标题格式）
    const taskMatch = line.match(/^-\s+\*\*(.+?)\*\*/);
    if (taskMatch) {
      const title = taskMatch[1].trim();
      const id = generateItemId(sourcePath, lineNum, title);
      const context = `${currentMilestone} ${currentWeek} ${title}`;

      // 查找验收条件
      const acceptanceCriteria = [];
      for (let j = i + 1; j < lines.length && j < i + 20; j++) {
        const subLine = lines[j];
        if (subLine.match(/^-\s+\*\*/)) break; // 下一个任务
        if (subLine.match(/^###/)) break; // 下一个章节

        const checkMatch = subLine.match(/^\s+-\s+\[([ xX])\]\s+(.+)/);
        if (checkMatch) {
          acceptanceCriteria.push({
            text: checkMatch[2].trim(),
            checked: checkMatch[1].toLowerCase() === 'x',
          });
        }
      }

      // 计算完成度
      const totalCriteria = acceptanceCriteria.length;
      const doneCriteria = acceptanceCriteria.filter((c) => c.checked).length;
      const completionPct = totalCriteria > 0 ? Math.round((doneCriteria / totalCriteria) * 100) : 0;

      let status = 'pending';
      if (completionPct === 100) status = 'done';
      else if (completionPct > 0) status = 'in_progress';

      items.push({
        id,
        title,
        source: 'dev_plan',
        source_path: sourcePath,
        source_line: lineNum,
        module: inferModule(context),
        chapter: inferChapter(context),
        system: inferSystem(context),
        priority: currentPriority,
        status,
        completion_pct: completionPct,
        context: {
          milestone: currentMilestone,
          week: currentWeek,
          acceptance_criteria: acceptanceCriteria,
        },
      });
    }
  }

  return items;
}

// ============================================
// 辅助函数
// ============================================

function generateItemId(sourcePath, lineNum, text) {
  const fileName = path.basename(sourcePath, '.md');
  const slug = text
    .slice(0, 30)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${fileName}-L${lineNum}-${slug}`;
}

function inferSource(sourcePath) {
  if (sourcePath.includes('bible')) return 'bible';
  if (sourcePath.includes('spec')) return 'spec';
  if (sourcePath.includes('taskpack')) return 'taskpack';
  if (sourcePath.includes('DEV-PLAN')) return 'dev_plan';
  return 'manual';
}

function inferModule(context) {
  const ctx = context.toLowerCase();
  for (const [module, keywords] of Object.entries(MODULE_KEYWORDS)) {
    if (keywords.some((kw) => ctx.includes(kw.toLowerCase()))) {
      return module;
    }
  }
  return 'other';
}

function inferSystem(context) {
  const ctx = context.toLowerCase();
  for (const [system, keywords] of Object.entries(SYSTEM_KEYWORDS)) {
    if (keywords.some((kw) => ctx.includes(kw.toLowerCase()))) {
      return system;
    }
  }
  return 'other';
}

function inferChapter(context) {
  const ctx = context.toLowerCase();
  for (const [chapter, keywords] of Object.entries(CHAPTER_KEYWORDS)) {
    if (keywords.some((kw) => ctx.includes(kw.toLowerCase()))) {
      return chapter;
    }
  }
  return 'common';
}

function inferPriority(context) {
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    if (keywords.some((kw) => context.includes(kw))) {
      return priority;
    }
  }
  return 'P1';
}

// ============================================
// 主函数
// ============================================

async function parseAllRequirements(projectRoot) {
  const results = {
    ok: true,
    items: [],
    warnings: [],
    errors: [],
    sources: [],
  };

  // 解析 Bible 文件
  for (const relPath of BIBLE_FILES) {
    const absPath = path.join(projectRoot, relPath);
    try {
      const content = await fs.readFile(absPath, 'utf8');
      const checklistItems = parseChecklistItems(content, relPath);
      const tableItems = parseTableItems(content, relPath);
      results.items.push(...checklistItems, ...tableItems);
      results.sources.push({ path: relPath, type: 'bible', items_count: checklistItems.length + tableItems.length });
    } catch (e) {
      if (e.code !== 'ENOENT') {
        results.warnings.push(`Failed to parse ${relPath}: ${e.message}`);
      }
    }
  }

  // 解析 Spec 文件
  for (const relPath of SPEC_FILES) {
    const absPath = path.join(projectRoot, relPath);
    try {
      const content = await fs.readFile(absPath, 'utf8');
      const checklistItems = parseChecklistItems(content, relPath);
      const tableItems = parseTableItems(content, relPath);
      const milestoneItems = parseMilestoneItems(content, relPath);
      results.items.push(...checklistItems, ...tableItems, ...milestoneItems);
      results.sources.push({
        path: relPath,
        type: 'spec',
        items_count: checklistItems.length + tableItems.length + milestoneItems.length,
      });
    } catch (e) {
      if (e.code !== 'ENOENT') {
        results.warnings.push(`Failed to parse ${relPath}: ${e.message}`);
      }
    }
  }

  // 去重（基于 title + source_path）
  const seen = new Set();
  results.items = results.items.filter((item) => {
    const key = `${item.source_path}:${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return results;
}

/**
 * 生成统计摘要
 */
function generateSummary(items) {
  const summary = {
    total: items.length,
    by_status: {},
    by_module: {},
    by_priority: {},
    by_source: {},
    completion_pct: 0,
  };

  for (const item of items) {
    // 按状态
    summary.by_status[item.status] = (summary.by_status[item.status] || 0) + 1;
    // 按模块
    summary.by_module[item.module] = (summary.by_module[item.module] || 0) + 1;
    // 按优先级
    summary.by_priority[item.priority] = (summary.by_priority[item.priority] || 0) + 1;
    // 按来源
    summary.by_source[item.source] = (summary.by_source[item.source] || 0) + 1;
  }

  // 计算总完成度
  const doneCount = summary.by_status['done'] || 0;
  summary.completion_pct = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  return summary;
}

// ============================================
// CLI 入口
// ============================================

async function main() {
  const args = process.argv.slice(2);
  let projectRoot = process.cwd();
  let outputFormat = 'json';

  for (const arg of args) {
    if (arg.startsWith('--project-root=')) {
      projectRoot = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      outputFormat = arg.split('=')[1];
    }
  }

  try {
    const result = await parseAllRequirements(projectRoot);
    const summary = generateSummary(result.items);

    if (outputFormat === 'summary') {
      console.log('=== 需求清单解析结果 ===');
      console.log(`总工作项: ${summary.total}`);
      console.log(`完成度: ${summary.completion_pct}%`);
      console.log('\n按状态:');
      for (const [status, count] of Object.entries(summary.by_status)) {
        console.log(`  ${status}: ${count}`);
      }
      console.log('\n按模块:');
      for (const [module, count] of Object.entries(summary.by_module)) {
        console.log(`  ${module}: ${count}`);
      }
      console.log('\n按优先级:');
      for (const [priority, count] of Object.entries(summary.by_priority)) {
        console.log(`  ${priority}: ${count}`);
      }
      console.log('\n来源文件:');
      for (const src of result.sources) {
        console.log(`  ${src.path}: ${src.items_count} items`);
      }
      if (result.warnings.length > 0) {
        console.log('\n警告:');
        result.warnings.forEach((w) => console.log(`  - ${w}`));
      }
    } else {
      console.log(JSON.stringify({ ...result, summary }, null, 2));
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

// 导出供其他模块使用
export { parseAllRequirements, generateSummary, parseChecklistItems, parseTableItems, parseMilestoneItems };

// CLI 运行
main();
