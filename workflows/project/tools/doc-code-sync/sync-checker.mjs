#!/usr/bin/env node
/**
 * Document-Code Synchronization Checker
 * 
 * 检查设计文档与代码实现之间的一致性:
 * 1. Spec 文档中定义的接口 vs 代码中的实际接口
 * 2. 常量值一致性（如 Art Bible 中的色值 vs ui.config.ts）
 * 3. 数据结构一致性
 * 
 * 使用方式:
 *   node sync-checker.mjs                    # 运行所有检查
 *   node sync-checker.mjs --interfaces       # 仅检查接口
 *   node sync-checker.mjs --constants        # 仅检查常量
 *   node sync-checker.mjs --verbose          # 详细输出
 *   node sync-checker.mjs --json             # JSON 格式输出
 * 
 * @module doc-code-sync/sync-checker
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractInterfacesFromSpec } from './extractors/spec-extractor.mjs';
import { extractInterfacesFromCode } from './extractors/code-extractor.mjs';
import { extractColorsFromDoc, extractColorsFromCode } from './extractors/color-extractor.mjs';
import { compareInterfaces, compareColors, generateReport } from './compare.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');

// ==================== 配置 ====================

const CONFIG = {
  // Spec 文档路径（相对于项目根目录）
  specDirs: [
    'design/ai-native/02_specs/systems',
  ],
  
  // 代码路径（相对于项目根目录）
  codeDirs: [
    'game/src/types',
    'game/src/systems',
    'game/src/config',
  ],
  
  // 文档色彩定义路径
  colorDocPath: 'design/ai-native/01_bibles/art_bible.md',
  
  // 代码色彩定义路径
  colorCodePath: 'game/src/config/ui.config.ts',
  
  // 接口映射配置（Spec 中的接口名 -> 代码中应存在的接口名）
  interfaceMappings: {
    // 可以定义别名映射
    // 'ISpecInterface': 'ICodeInterface'
  },
  
  // 忽略的接口（不需要检查）
  ignoredInterfaces: [
    /^I.*Internal$/,  // 内部接口
    /^I.*Config$/,    // 配置接口可能在不同地方
  ],
};

// ==================== 主函数 ====================

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  console.log('📋 Document-Code Synchronization Checker\n');
  console.log('=' .repeat(60) + '\n');
  
  const results = {
    interfaces: null,
    colors: null,
    timestamp: new Date().toISOString(),
    success: true,
  };
  
  try {
    // 1. 接口检查
    if (options.all || options.interfaces) {
      console.log('🔍 Checking interfaces...\n');
      results.interfaces = await checkInterfaces(options);
    }
    
    // 2. 常量检查（颜色）
    if (options.all || options.constants) {
      console.log('\n🎨 Checking color constants...\n');
      results.colors = await checkColors(options);
    }
    
    // 3. 生成报告
    const report = generateReport(results, options);
    
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }
    
    // 4. 返回退出码
    results.success = report.summary.mismatches === 0;
    process.exit(results.success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// ==================== 检查函数 ====================

/**
 * 检查接口一致性
 */
async function checkInterfaces(options) {
  const specInterfaces = new Map();
  const codeInterfaces = new Map();
  
  // 1. 提取 Spec 中的接口
  for (const specDir of CONFIG.specDirs) {
    const fullPath = path.join(PROJECT_ROOT, specDir);
    if (!fs.existsSync(fullPath)) {
      if (options.verbose) {
        console.log(`  ⚠️  Spec directory not found: ${specDir}`);
      }
      continue;
    }
    
    const files = fs.readdirSync(fullPath)
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(fullPath, f));
    
    for (const file of files) {
      const interfaces = await extractInterfacesFromSpec(file);
      const relativePath = path.relative(PROJECT_ROOT, file);
      
      if (options.verbose) {
        console.log(`  📄 ${relativePath}: ${interfaces.length} interfaces`);
      }
      
      for (const iface of interfaces) {
        if (!isIgnored(iface.name)) {
          specInterfaces.set(iface.name, {
            ...iface,
            source: relativePath,
          });
        }
      }
    }
  }
  
  // 2. 提取代码中的接口
  for (const codeDir of CONFIG.codeDirs) {
    const fullPath = path.join(PROJECT_ROOT, codeDir);
    if (!fs.existsSync(fullPath)) {
      if (options.verbose) {
        console.log(`  ⚠️  Code directory not found: ${codeDir}`);
      }
      continue;
    }
    
    const files = getAllTsFiles(fullPath);
    
    for (const file of files) {
      const interfaces = await extractInterfacesFromCode(file);
      const relativePath = path.relative(PROJECT_ROOT, file);
      
      if (options.verbose && interfaces.length > 0) {
        console.log(`  📦 ${relativePath}: ${interfaces.length} interfaces`);
      }
      
      for (const iface of interfaces) {
        codeInterfaces.set(iface.name, {
          ...iface,
          source: relativePath,
        });
      }
    }
  }
  
  // 3. 比较接口
  return compareInterfaces(specInterfaces, codeInterfaces, CONFIG.interfaceMappings);
}

/**
 * 检查颜色常量一致性
 */
async function checkColors(options) {
  const docColorPath = path.join(PROJECT_ROOT, CONFIG.colorDocPath);
  const codeColorPath = path.join(PROJECT_ROOT, CONFIG.colorCodePath);
  
  // 1. 提取文档中的颜色
  let docColors = new Map();
  if (fs.existsSync(docColorPath)) {
    docColors = await extractColorsFromDoc(docColorPath);
    if (options.verbose) {
      console.log(`  📄 ${CONFIG.colorDocPath}: ${docColors.size} colors`);
    }
  } else {
    console.log(`  ⚠️  Color doc not found: ${CONFIG.colorDocPath}`);
  }
  
  // 2. 提取代码中的颜色
  let codeColors = new Map();
  if (fs.existsSync(codeColorPath)) {
    codeColors = await extractColorsFromCode(codeColorPath);
    if (options.verbose) {
      console.log(`  📦 ${CONFIG.colorCodePath}: ${codeColors.size} colors`);
    }
  } else {
    console.log(`  ⚠️  Color code not found: ${CONFIG.colorCodePath}`);
  }
  
  // 3. 比较颜色
  return compareColors(docColors, codeColors);
}

// ==================== 工具函数 ====================

/**
 * 解析命令行参数
 */
function parseArgs(args) {
  const options = {
    all: true,
    interfaces: false,
    constants: false,
    verbose: false,
    json: false,
  };
  
  for (const arg of args) {
    switch (arg) {
      case '--interfaces':
        options.interfaces = true;
        options.all = false;
        break;
      case '--constants':
        options.constants = true;
        options.all = false;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--json':
        options.json = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }
  
  return options;
}

/**
 * 递归获取所有 TypeScript 文件
 */
function getAllTsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 检查接口是否在忽略列表中
 */
function isIgnored(interfaceName) {
  return CONFIG.ignoredInterfaces.some(pattern => pattern.test(interfaceName));
}

/**
 * 打印报告
 */
function printReport(report) {
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SYNC CHECK REPORT');
  console.log('=' .repeat(60) + '\n');
  
  // Summary
  console.log('📋 Summary:');
  console.log(`   Total checks: ${report.summary.total}`);
  console.log(`   Matches:      ${report.summary.matches} ✅`);
  console.log(`   Mismatches:   ${report.summary.mismatches} ${report.summary.mismatches > 0 ? '❌' : ''}`);
  console.log(`   Warnings:     ${report.summary.warnings} ⚠️`);
  console.log();
  
  // Interface mismatches
  if (report.interfaces?.mismatches?.length > 0) {
    console.log('🔍 Interface Mismatches:');
    for (const m of report.interfaces.mismatches) {
      console.log(`\n   ❌ ${m.name}`);
      console.log(`      Spec: ${m.specSource || 'N/A'}`);
      console.log(`      Code: ${m.codeSource || 'Not found'}`);
      if (m.differences?.length > 0) {
        console.log('      Differences:');
        for (const diff of m.differences) {
          console.log(`        - ${diff}`);
        }
      }
    }
    console.log();
  }
  
  // Interface warnings (missing in spec)
  if (report.interfaces?.onlyInCode?.length > 0) {
    console.log('⚠️  Interfaces only in code (not documented):');
    for (const name of report.interfaces.onlyInCode.slice(0, 10)) {
      console.log(`      ${name}`);
    }
    if (report.interfaces.onlyInCode.length > 10) {
      console.log(`      ... and ${report.interfaces.onlyInCode.length - 10} more`);
    }
    console.log();
  }
  
  // Color mismatches
  if (report.colors?.mismatches?.length > 0) {
    console.log('🎨 Color Mismatches:');
    for (const m of report.colors.mismatches) {
      console.log(`\n   ❌ ${m.name}`);
      console.log(`      Doc:  ${m.docValue}`);
      console.log(`      Code: ${m.codeValue}`);
    }
    console.log();
  }
  
  // Final status
  console.log('=' .repeat(60));
  if (report.summary.mismatches === 0) {
    console.log('✅ All checks passed!');
  } else {
    console.log(`❌ Found ${report.summary.mismatches} mismatch(es). Please review and fix.`);
  }
  console.log('=' .repeat(60) + '\n');
}

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
Document-Code Synchronization Checker

Usage: node sync-checker.mjs [options]

Options:
  --interfaces   Only check interface definitions
  --constants    Only check constant values (colors, etc.)
  --verbose, -v  Show detailed output
  --json         Output report as JSON
  --help, -h     Show this help message

Examples:
  node sync-checker.mjs                    # Run all checks
  node sync-checker.mjs --interfaces -v    # Check interfaces with verbose output
  node sync-checker.mjs --constants --json # Check constants, output as JSON
`);
}

// ==================== 运行 ====================

main();
