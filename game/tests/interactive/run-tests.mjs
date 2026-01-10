#!/usr/bin/env node
/**
 * ChromeMCP 交互测试执行入口
 * 
 * 用法:
 *   node run-tests.mjs [选项]
 * 
 * 选项:
 *   --suite <name>  运行指定测试套件 (boot|menu|movement|ui|dialogue|narrative|save|ability|preview)
 *   --test <id>     运行指定测试 (如 boot-001)
 *   --list          列出所有测试
 *   --plan          生成测试计划
 *   --help          显示帮助
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试套件信息
const SUITES = {
  boot: {
    name: '游戏启动和加载测试',
    file: '01-boot.spec.ts',
    tests: 10,
  },
  menu: {
    name: '主菜单交互测试',
    file: '02-menu.spec.ts',
    tests: 10,
  },
  movement: {
    name: '移动控制测试',
    file: '03-movement.spec.ts',
    tests: 10,
  },
  ui: {
    name: 'UI 系统测试',
    file: '04-ui.spec.ts',
    tests: 12,
  },
  dialogue: {
    name: '对话系统测试',
    file: '05-dialogue.spec.ts',
    tests: 10,
  },
  narrative: {
    name: '叙事系统测试',
    file: '06-narrative.spec.ts',
    tests: 12,
  },
  save: {
    name: '存档系统测试',
    file: '07-save.spec.ts',
    tests: 10,
  },
  ability: {
    name: '深度能力系统测试',
    file: '08-ability.spec.ts',
    tests: 12,
  },
  preview: {
    name: '预览场景测试',
    file: '09-preview.spec.ts',
    tests: 15,
  },
};

function printHelp() {
  console.log(`
ChromeMCP 交互测试框架
======================

用法:
  node run-tests.mjs [选项]

选项:
  --suite <name>  运行指定测试套件
  --test <id>     运行指定测试 (如 boot-001)
  --list          列出所有测试
  --plan          生成测试计划文档
  --help          显示帮助

可用测试套件:
${Object.entries(SUITES).map(([key, val]) => `  ${key.padEnd(12)} - ${val.name} (${val.tests} 个测试)`).join('\n')}

示例:
  node run-tests.mjs --list
  node run-tests.mjs --suite boot
  node run-tests.mjs --test boot-001
  node run-tests.mjs --plan > test-plan.md

注意:
  此工具生成测试执行指南。实际测试需要通过 AI Agent 使用
  Chrome DevTools MCP 服务器执行。

  执行测试前请确保:
  1. 游戏开发服务器已启动 (npm run dev)
  2. Chrome 浏览器已打开并访问游戏
  3. Chrome DevTools MCP 服务器已启用
`);
}

function listTests() {
  console.log('\n📋 ChromeMCP 交互测试用例列表\n');
  console.log('=' .repeat(60));

  let totalTests = 0;

  for (const [key, suite] of Object.entries(SUITES)) {
    console.log(`\n## ${suite.name}`);
    console.log(`   文件: specs/${suite.file}`);
    console.log(`   测试数: ${suite.tests}`);
    console.log('');

    // 读取测试文件获取具体测试 ID
    const filePath = path.join(__dirname, 'specs', suite.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const testMatches = content.matchAll(/id:\s*['"]([^'"]+)['"]/g);
      const nameMatches = content.matchAll(/name:\s*['"]([^'"]+)['"]/g);

      const ids = [...testMatches].map(m => m[1]);
      const names = [...nameMatches].map(m => m[1]);

      for (let i = 0; i < ids.length; i++) {
        console.log(`   - ${ids[i]}: ${names[i] || '(未命名)'}`);
        totalTests++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`总计: ${Object.keys(SUITES).length} 个套件, ${totalTests} 个测试`);
  console.log('');
}

function generatePlan() {
  console.log('# ChromeMCP 交互测试计划\n');
  console.log(`生成时间: ${new Date().toISOString()}\n`);
  console.log('## 概述\n');
  console.log('本测试计划涵盖 Footnote 游戏的所有交互功能测试。');
  console.log('测试使用 Chrome DevTools MCP 服务器执行真实浏览器交互。\n');

  console.log('## 前置条件\n');
  console.log('1. 启动游戏开发服务器: `npm run dev`');
  console.log('2. 打开 Chrome 浏览器访问 http://localhost:5173');
  console.log('3. 确保 Chrome DevTools MCP 服务器已启用\n');

  console.log('## 测试套件\n');

  let totalTests = 0;

  for (const [key, suite] of Object.entries(SUITES)) {
    console.log(`### ${suite.name}\n`);
    console.log(`- 标识: \`${key}\``);
    console.log(`- 文件: \`specs/${suite.file}\``);
    console.log(`- 测试数: ${suite.tests}\n`);

    const filePath = path.join(__dirname, 'specs', suite.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const testMatches = content.matchAll(/id:\s*['"]([^'"]+)['"]/g);
      const nameMatches = content.matchAll(/name:\s*['"]([^'"]+)['"]/g);
      const descMatches = content.matchAll(/description:\s*['"]([^'"]+)['"]/g);

      const ids = [...testMatches].map(m => m[1]);
      const names = [...nameMatches].map(m => m[1]);
      const descs = [...descMatches].map(m => m[1]);

      console.log('| ID | 名称 | 描述 |');
      console.log('|---|---|---|');

      for (let i = 0; i < ids.length; i++) {
        console.log(`| ${ids[i]} | ${names[i] || '-'} | ${descs[i] || '-'} |`);
        totalTests++;
      }
      console.log('');
    }
  }

  console.log('## 执行方式\n');
  console.log('使用 AI Agent 执行测试:\n');
  console.log('```');
  console.log('User: 请执行 boot-001 测试');
  console.log('');
  console.log('Agent: 好的，我来执行测试 boot-001...');
  console.log('[使用 MCP 工具导航到游戏页面]');
  console.log('[使用 MCP 工具验证页面标题]');
  console.log('[报告测试结果]');
  console.log('```\n');

  console.log('## 统计\n');
  console.log(`- 总测试套件: ${Object.keys(SUITES).length}`);
  console.log(`- 总测试用例: ${totalTests}`);
}

function showSuiteInfo(suiteName) {
  const suite = SUITES[suiteName];
  if (!suite) {
    console.error(`❌ 未知的测试套件: ${suiteName}`);
    console.log(`可用套件: ${Object.keys(SUITES).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🧪 测试套件: ${suite.name}\n`);
  console.log(`文件: specs/${suite.file}`);
  console.log(`测试数: ${suite.tests}\n`);

  console.log('执行此套件的 MCP 调用序列:\n');
  console.log('1. CallMcpTool: navigate_page');
  console.log('   server: user-chrome-devtools');
  console.log('   params: { type: "url", url: "http://localhost:5173" }\n');
  console.log('2. CallMcpTool: take_snapshot');
  console.log('   server: user-chrome-devtools\n');
  console.log('3. [执行测试步骤...]\n');
  console.log('4. CallMcpTool: take_screenshot');
  console.log('   server: user-chrome-devtools');
  console.log('   params: { format: "png" }\n');

  console.log(`详细测试步骤请查看: specs/${suite.file}`);
}

function showTestInfo(testId) {
  // 确定测试所属套件
  const prefix = testId.split('-')[0];
  const suiteMap = {
    boot: 'boot',
    menu: 'menu',
    move: 'movement',
    ui: 'ui',
    dialogue: 'dialogue',
    narrative: 'narrative',
    save: 'save',
    ability: 'ability',
    preview: 'preview',
  };

  const suiteName = suiteMap[prefix];
  if (!suiteName) {
    console.error(`❌ 无法识别测试 ID: ${testId}`);
    process.exit(1);
  }

  const suite = SUITES[suiteName];
  console.log(`\n🧪 测试: ${testId}\n`);
  console.log(`套件: ${suite.name}`);
  console.log(`文件: specs/${suite.file}\n`);

  // 读取测试详情
  const filePath = path.join(__dirname, 'specs', suite.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 简单查找测试块
    const testRegex = new RegExp(`id:\\s*['"]${testId}['"][^}]*name:\\s*['"]([^'"]+)['"][^}]*description:\\s*['"]([^'"]+)['"]`, 's');
    const match = content.match(testRegex);
    
    if (match) {
      console.log(`名称: ${match[1]}`);
      console.log(`描述: ${match[2]}`);
    }
  }

  console.log('\n执行此测试:');
  console.log('使用 AI Agent 对话: "请执行测试 ' + testId + '"');
}

// 主程序
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help')) {
  printHelp();
  process.exit(0);
}

if (args.includes('--list')) {
  listTests();
  process.exit(0);
}

if (args.includes('--plan')) {
  generatePlan();
  process.exit(0);
}

const suiteIndex = args.indexOf('--suite');
if (suiteIndex !== -1 && args[suiteIndex + 1]) {
  showSuiteInfo(args[suiteIndex + 1]);
  process.exit(0);
}

const testIndex = args.indexOf('--test');
if (testIndex !== -1 && args[testIndex + 1]) {
  showTestInfo(args[testIndex + 1]);
  process.exit(0);
}

// 未知参数
console.error('❌ 未知参数，使用 --help 查看帮助');
process.exit(1);
