# 代码审查任务

## 角色
你是一位资深代码审查专家，负责评估代码变更的质量。

## 任务
请审查以下代码变更，从多个维度进行评分和分析。

## 变更信息

### 变更文件列表
```
.cursor/ai-review-prompt.md
workflows/project/tools/review-system/ai-code-review.mjs
workflows/project/tools/review-system/ai-design-review.mjs
workflows/project/tools/review-system/ai-progress-assessment.mjs
workflows/project/tools/review-system/parse-requirements.mjs
workflows/project/tools/review-system/prompts/code-review.md
workflows/project/tools/review-system/prompts/design-review.md
workflows/project/tools/review-system/prompts/progress-assessment.md
workflows/project/tools/review-system/score-calculator.mjs
workflows/project/tools/review-system/verify-completion.mjs
workflows/reusable/pipeline-sys/console/src/types/audit.types.ts
workflows/reusable/pipeline-sys/ui/src/api/reviewApi.ts
workflows/reusable/pipeline-sys/ui/src/components/Review/ReviewPanel.css
workflows/reusable/pipeline-sys/ui/src/components/Review/ReviewPanel.tsx
workflows/reusable/pipeline-sys/v2-design/examples/l0-audit-intake.flowspec.json
```

### 代码差异
```diff
diff --git a/.cursor/ai-review-prompt.md b/.cursor/ai-review-prompt.md
new file mode 100644
index 0000000..0afb51b
--- /dev/null
+++ b/.cursor/ai-review-prompt.md
@@ -0,0 +1,591 @@
+# 代码审查任务
+
+## 角色
+你是一位资深代码审查专家，负责评估代码变更的质量。
+
+## 任务
+请审查以下代码变更，从多个维度进行评分和分析。
+
+## 变更信息
+
+### 变更文件列表
+```
+game/tests/interactive/config.ts
+game/tests/interactive/helpers/assertions.ts
+game/tests/interactive/helpers/mcp-client.ts
+game/tests/interactive/runner.ts
+game/tests/interactive/specs/01-boot.spec.ts
+game/tests/interactive/specs/02-menu.spec.ts
+game/tests/interactive/specs/03-movement.spec.ts
+game/tests/interactive/specs/04-ui.spec.ts
+game/tests/interactive/specs/05-dialogue.spec.ts
+game/tests/interactive/specs/06-narrative.spec.ts
+game/tests/interactive/specs/07-save.spec.ts
+game/tests/interactive/specs/08-ability.spec.ts
+game/tests/interactive/specs/09-preview.spec.ts
+workflows/project/tools/review-system/parse-requirements.mjs
+workflows/project/tools/review-system/score-calculator.mjs
+workflows/project/tools/review-system/verify-completion.mjs
+workflows/reusable/pipeline-sys/console/src/clients/runnerClient.ts
+workflows/reusable/pipeline-sys/console/src/types/audit.types.ts
+workflows/reusable/pipeline-sys/ui/src/api/reviewApi.ts
+workflows/reusable/pipeline-sys/ui/src/components/Review/ReviewPanel.css
+```
+
+### 代码差异
+```diff
+diff --git a/game/tests/interactive/config.ts b/game/tests/interactive/config.ts
+index dc58214..06f5635 100644
+--- a/game/tests/interactive/config.ts
++++ b/game/tests/interactive/config.ts
+@@ -53,7 +53,7 @@ export const MCP_SERVER = 'user-chrome-devtools';
+ export const GameScripts = {
+   // 获取当前场景
+   getCurrentScene: `() => {
+-    const game = window.__PHASER_GAME__ || window.game;
++    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
+     if (!game) return null;
+     const scenes = game.scene.getScenes(true);
+     return scenes.length > 0 ? scenes[0].scene.key : null;
+@@ -61,7 +61,7 @@ export const GameScripts = {
+ 
+   // 获取玩家位置
+   getPlayerPosition: `() => {
+-    const game = window.__PHASER_GAME__ || window.game;
++    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
+     if (!game) return null;
+     const scene = game.scene.getScene('GameScene');
+     if (!scene || !scene._player) return null;
+@@ -70,7 +70,7 @@ export const GameScripts = {
+ 
+   // 获取世界状态
+   getWorldState: `() => {
+-    const game = window.__PHASER_GAME__ || window.game;
++    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
+     if (!game) return null;
+     const scene = game.scene.getScene('GameScene');
+     if (!scene || !scene._worldState) return null;
+@@ -79,7 +79,7 @@ export const GameScripts = {
+ 
+   // 检查对话框是否显示
+   isDialogueVisible: `() => {
+-    const game = window.__PHASER_GAME__ || window.game;
++    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
+     if (!game) return false;
+     const scene = game.scene.getScene('GameScene');
+     if (!scene || !scene._dialogueUI) return false;
+@@ -88,7 +88,7 @@ export const GameScripts = {
+ 
+   // 获取物品栏内容
+   getInventoryItems: `() => {
+-    const game = window.__PHASER_GAME__ || window.game;
++    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
+     if (!game) return [];
+     const scene = game.scene.getScene('GameScene');
+     if (!scene || !scene._inventoryUI) return [];
+@@ -97,7 +97,7 @@ export const GameScripts = {
+ 
+   // 获取当前 Zone
+   getCurrentZone: `() => {
+-    const game = window.__PHASER_GAME__ || window.game;
++    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
+     if (!game) return null;
+     const scene = game.scene.getScene('GameScene');
+     if (!scene || !scene._narrativeEngine) return null;
+@@ -106,7 +106,7 @@ export const GameScripts = {
+ 
+   // 检查暂停菜单是否显示
+   isPauseMenuVisible: `() => {
+-    const game = window.__PHASER_GAME__ || window.game;
++    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
+     if (!game) return false;
+     const scene = game.scene.getScene('GameScene');
+     if (!scene || !scene._pauseMenu) return false;
+@@ -115,7 +115,7 @@ export const GameScripts = {
+ 
+   // 获取 R 值
+   getRValue: `() => {
+-    const game = window.__PHASER_GAME__ || window.game;
++    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
+     if (!game) return null;
+     const scene = game.scene.getScene('GameScene');
+     if (!scene || !scene._worldState) return null;
+@@ -133,7 +133,7 @@ export const GameScripts = {
+ 
+   // 获取能力状态
+   getAbilityState: `() => {
+-    const game = window.__PHASER_GAME__ || window.game;
++    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
+     if (!game) return null;
+     const scene = game.scene.getScene('GameScene');
+     if (!scene || !scene._abilitySystem) return null;
+diff --git a/game/tests/interactive/helpers/assertions.ts b/game/tests/interactive/helpers/assertions.ts
+index e27d78b..0933695 100644
+--- a/game/tests/interactive/helpers/assertions.ts
++++ b/game/tests/interactive/helpers/assertions.ts
+@@ -4,7 +4,9 @@
+  * 用于交互测试的验证
+  */
+ 
+-import type { PlayerPosition, WorldStateSnapshot } from './game-helpers';
++import type { PlayerPosition } from './game-helpers';
++// WorldStateSnapshot 保留用于未来扩展
++export type { WorldStateSnapshot } from './game-helpers';
+ 
+ // 断言结果
+ export interface AssertionResult {
+diff --git a/game/tests/interactive/helpers/mcp-client.ts b/game/tests/interactive/helpers/mcp-client.ts
+index 1ea6353..35a6b29 100644
+--- a/game/tests/interactive/helpers/mcp-client.ts
++++ b/game/tests/interactive/helpers/mcp-client.ts
+@@ -4,7 +4,7 @@
+  * 提供与 user-chrome-devtools MCP 服务器交互的统一接口
+  */
+ 
+-import { MCP_SERVER, TestConfig } from '../config';
++import { TestConfig } from '../config';
+ 
+ // 测试结果类型
+ export interface TestResult {
+@@ -31,7 +31,6 @@ export interface SnapshotElement {
+  * 实际调用 MCP 工具需要通过 Cursor 的 CallMcpTool
+  */
+ export class MCPTestClient {
+-  private server = MCP_SERVER;
+   private lastSnapshot: SnapshotElement | null = null;
+ 
+   /**
+@@ -93,9 +92,9 @@ export class MCPTestClient {
+   /**
+    * 执行 JavaScript
+    */
+-  async evaluate<T>(script: string): Promise<T | null> {
++  async evaluate<T>(_script: string): Promise<T | null> {
+     // 使用 MCP evaluate_script 工具
+-    // CallMcpTool: evaluate_script { function: script }
++    // CallMcpTool: evaluate_script { function: _script }
+     console.log(`[MCP] Evaluate script`);
+     return null;
+   }
+diff --git a/game/tests/interactive/runner.ts b/game/tests/interactive/runner.ts
+index 20e17b0..5d3f452 100644
+--- a/game/tests/interactive/runner.ts
++++ b/game/tests/interactive/runner.ts
+@@ -126,8 +126,11 @@ export class InteractiveTestRunner {
+    * 为指定测试生成 MCP 工具调用序列
+    */
+   generateMCPScript(suiteKey: TestSuiteKey, testId: string): object[] {
+-    const suite = TestSuites[suiteKey];
+-    const test = suite.tests.find((t: { id: string }) => t.id === testId);
++    const suite = TestSuites[suiteKey] as { 
++      tests: { id: string; steps: Record<string, unknown>[] }[];
++      beforeAll?: Record<string, unknown>[];
++    };
++    const test = suite.tests.find((t) => t.id === testId);
+ 
+     if (!test) {
+       throw new Error(`Test ${testId} not found in suite ${suiteKey}`);
+diff --git a/game/tests/interactive/specs/01-boot.spec.ts b/game/tests/interactive/specs/01-boot.spec.ts
+index 6f4ddc2..d1a3f75 100644
+--- a/game/tests/interactive/specs/01-boot.spec.ts
++++ b/game/tests/interactive/specs/01-boot.spec.ts
+@@ -12,10 +12,8 @@
+ 
+ import { TestConfig, GameScripts } from '../config';
+ import { GameHelpers } from '../helpers/game-helpers';
+-import { createAssertions } from '../helpers/assertions';
+ 
+-// MCP 服务器标识
+-const MCP_SERVER = 'user-chrome-devtools';
++// MCP 服务器: user-chrome-devtools (供参考)
+ 
+ /**
+  * 测试套件：游戏启动和加载
+diff --git a/game/tests/interactive/specs/02-menu.spec.ts b/game/tests/interactive/specs/02-menu.spec.ts
+index eb45dca..63bdcb5 100644
+--- a/game/tests/interactive/specs/02-menu.spec.ts
++++ b/game/tests/interactive/specs/02-menu.spec.ts
+@@ -14,7 +14,7 @@
+ import { TestConfig, GameScripts } from '../config';
+ import { GameHelpers } from '../helpers/game-helpers';
+ 
+-const MCP_SERVER = 'user-chrome-devtools';
++// MCP 服务器: user-chrome-devtools (供参考)
+ 
+ /**
+  * 测试套件：主菜单交互
+diff --git a/game/tests/interactive/specs/03-movement.spec.ts b/game/tests/interactive/specs/03-movement.spec.ts
+index b20790b..dbe6cee 100644
+--- a/game/tests/interactive/specs/03-movement.spec.ts
++++ b/game/tests/interactive/specs/03-movement.spec.ts
+@@ -14,7 +14,7 @@
+ import { TestConfig, GameScripts } from '../config';
+ import { GameHelpers, PlayerPosition } from '../helpers/game-helpers';
+ 
+-const MCP_SERVER = 'user-chrome-devtools';
++// MCP 服务器: user-chrome-devtools (供参考)
+ 
+ /**
+  * 测试套件：移动控制
+diff --git a/game/tests/interactive/specs/04-ui.spec.ts b/game/tests/interactive/specs/04-ui.spec.ts
+index 8fd6bd4..3ab5358 100644
+--- a/game/tests/interactive/specs/04-ui.spec.ts
++++ b/game/tests/interactive/specs/04-ui.spec.ts
+@@ -13,7 +13,7 @@
+ import { TestConfig, GameScripts } from '../config';
+ import { GameHelpers } from '../helpers/game-helpers';
+ 
+-const MCP_SERVER = 'user-chrome-devtools';
++// MCP 服务器: user-chrome-devtools (供参考)
+ 
+ /**
+  * 测试套件：UI 系统
+diff --git a/game/tests/interactive/specs/05-dialogue.spec.ts b/game/tests/interactive/specs/05-dialogue.spec.ts
+index ec7bffc..9c3a80b 100644
+--- a/game/tests/interactive/specs/05-dialogue.spec.ts
++++ b/game/tests/interactive/specs/05-dialogue.spec.ts
+@@ -13,7 +13,7 @@
+ import { TestConfig, GameScripts } from '../config';
+ import { GameHelpers } from '../helpers/game-helpers';
+ 
+-const MCP_SERVER = 'user-chrome-devtools';
++// MCP 服务器: user-chrome-devtools (供参考)
+ 
+ /**
+  * 测试套件：对话系统
+diff --git a/game/tests/interactive/specs/06-narrative.spec.ts b/game/tests/interactive/specs/06-narrative.spec.ts
+index 2b98d01..d9c9f4d 100644
+--- a/game/tests/interactive/specs/06-narrative.spec.ts
++++ b/game/tests/interactive/specs/06-narrative.spec.ts
+@@ -13,7 +13,7 @@
+ import { TestConfig, GameScripts } from '../config';
+ import { GameHelpers } from '../helpers/game-helpers';
+ 
+-const MCP_SERVER = 'user-chrome-devtools';
++// MCP 服务器: user-chrome-devtools (供参考)
+ 
+ /**
+  * 测试套件：叙事系统
+diff --git a/game/tests/interactive/specs/07-save.spec.ts b/game/tests/interactive/specs/07-save.spec.ts
+index 51c6f1d..e9e1708 100644
+--- a/game/tests/interactive/specs/07-save.spec.ts
++++ b/game/tests/interactive/specs/07-save.spec.ts
+@@ -13,7 +13,7 @@
+ import { TestConfig, GameScripts } from '../config';
+ import { GameHelpers } from '../helpers/game-helpers';
+ 
+-const MCP_SERVER = 'user-chrome-devtools';
++// MCP 服务器: user-chrome-devtools (供参考)
+ 
+ /**
+  * 测试套件：存档系统
+diff --git a/game/tests/interactive/specs/08-ability.spec.ts b/game/tests/interactive/specs/08-ability.spec.ts
+index ffd3cf6..d130f50 100644
+--- a/game/tests/interactive/specs/08-ability.spec.ts
++++ b/game/tests/interactive/specs/08-ability.spec.ts
+@@ -13,7 +13,7 @@
+ import { TestConfig, GameScripts } from '../config';
+ import { GameHelpers } from '../helpers/game-helpers';
+ 
+-const MCP_SERVER = 'user-chrome-devtools';
++// MCP 服务器: user-chrome-devtools (供参考)
+ 
+ /**
+  * 测试套件：深度能力系统
+diff --git a/game/tests/interactive/specs/09-preview.spec.ts b/game/tests/interactive/specs/09-preview.spec.ts
+index 94b6d13..876e570 100644
+--- a/game/tests/interactive/specs/09-preview.spec.ts
++++ b/game/tests/interactive/specs/09-preview.spec.ts
+@@ -17,7 +17,7 @@
+ import { TestConfig, GameScripts } from '../config';
+ import { GameHelpers } from '../helpers/game-helpers';
+ 
+-const MCP_SERVER = 'user-chrome-devtools';
++// MCP 服务器: user-chrome-devtools (供参考)
+ 
+ // 预览场景 URL
+ const PREVIEW_URLS = {
+diff --git a/workflows/project/tools/review-system/parse-requirements.mjs b/workflows/project/tools/review-system/parse-requirements.mjs
+new file mode 100644
+index 0000000..6331f5e
+--- /dev/null
++++ b/workflows/project/tools/review-system/parse-requirements.mjs
+@@ -0,0 +1,587 @@
++#!/usr/bin/env node
++/**
++ * parse-requirements.mjs - 需求清单解析器
++ *
++ * 功能：
++ * 1. 解析 Markdown 中的 `- [ ]` / `- [x]` checklist
++ * 2. 解析表格中的状态列（如 `✅完成` / `❌未开始`）
++ * 3. 提取任务的模块、章节、系统归属
++ * 4. 输出结构化的工作项列表
++ *
++ * 用法：
++ *   node parse-requirements.mjs --project-root=/path/to/project [--output=json|summary]
++ */
++
++import { promises as fs } from 'node:fs';
++import path from 'node:path';
++
++// ============================================
++// 配置
++// ============================================
++
++const BIBLE_FILES = [
++  'design/ai-native/01_bibles/tech_bible.md',
++  'design/ai-native/01_bibles/design_bible.md',
++  'design/ai-native/01_bibles/art_bible.md',
++  'design/ai-native/01_bibles/qa_bible.md',
++];
++
++const SPEC_FILES = [
++  'design/ai-native/02_specs/DEV-PLAN_2026Q1.md',
++  'design/ai-native/02_specs/systems/narrative_system_spec.md',
++  'design/ai-native/02_specs/systems/save_system_spec.md',
++  'design/ai-native/02_specs/systems/event_system_spec.md',
++  'design/ai-native/02_specs/systems/choice_system_spec.md',
++  'design/ai-native/02_specs/systems/ui_system_spec.md',
++  'design/ai-native/02_specs/ui/ui_components_spec.md',
++  'design/ai-native/02_specs/ui/ui_flow_spec.md',
++];
++
++// 模块关键词映射
++const MODULE_KEYWORDS = {
++  narrative: ['narrative', '叙事', '对白', '剧情', 'dialogue', 'story', 'foreshadow', '伏笔'],
++  system: ['system', '系统', 'engine', 'manager', 'worldstate', 'ability', '能力'],
++  ui: ['ui', 'UI', '界面', 'component', '组件', 'menu', 'toast', 'card', 'inventory'],
++  level: ['level', '关卡', 'zone', 'scene', '场景', 'chapter', '章节'],
++  art: ['art', '美术', 'asset', '资源', 'sprite', 'animation', '动画'],
++  qa: ['qa', 'QA', 'test', '测试', 'coverage', '覆盖率', 'e2e', 'lint'],
++  infra: ['infra', 'build', '构建', 'ci', 'deploy', 'config', '配置', 'typecheck'],
++};
++
++// 系统关键词映射
++const SYSTEM_KEYWORDS = {
++  card: ['card', '卡片', 'inventory'],
++  dialogue: ['dialogue', '对白', '对话', 'conversation'],
++  save: ['save', '存档', 'load', '读档', 'persist'],
++  ability: ['ability', '能力', 'depth', 'time', 'intervention'],
++  world_state: ['worldstate', 'world_state', '世界状态', 'counter', '计数器'],
++  event: ['event', '事件', 'trigger', '触发'],
++  foreshadow: ['foreshadow', '伏笔'],
++  audio: ['audio', '音频', 'bgm', 'sfx', 'sound'],
++  input: ['input', '输入', 'touch', 'keyboard'],
++  scene: ['scene', '场景', 'zone', 'assemble'],
++  asset: ['asset', '资源', 'loader', 'manifest'],
++  debug: ['debug', '调试', '__DEBUG__'],
++};
++
++// 章节关键词映射
++const CHAPTER_KEYWORDS = {
++  C0: ['c0', 'C0', '序章', 'prologue', 'tutorial'],
++  C1: ['c1', 'C1', '第一章', 'chapter1', 'chapter 1'],
++  C2: ['c2', 'C2', '第二章', 'chapter2', 'chapter 2'],
++  C3: ['c3', 'C3', '第三章', 'chapter3', 'chapter 3'],
++  C4: ['c4', 'C4', '第四章', 'chapter4', 'chapter 4'],
++  C5: ['c5', 'C5', '终章', 'ending', 'epilogue'],
++  common: ['common', '通用', 'core', '核心'],
++};
++
++// 优先级关键词
++const PRIORITY_KEYWORDS = {
++  P0: ['P0', 'p0', '必须', '阻塞', 'blocker', 'critical', '紧急'],
++  P1: ['P1', 'p1', '重要', '尽量', 'major', 'should'],
++  P2: ['P2', 'p2', '可选', 'minor', 'nice-to-have', 'optional'],
++};
++
++// ============================================
++// 解析函数
++// ============================================
++
++/**
++ * 解析 Markdown checklist
++ * @param {string} content - Markdown 内容
++ * @param {string} sourcePath - 来源文件路径
++ * @returns {Array} 工作项列表
++ */
++function parseChecklistItems(content, sourcePath) {
++  const items = [];
++  const lines = content.split('\n');
++
++  let currentSection = '';
++  let currentSubsection = '';
++
++  for (let i = 0; i < lines.length; i++) {
++    const line = lines[i];
++    const lineNum = i + 1;
++
++    // 检测标题（用于确定上下文）
++    const h2Match = line.match(/^##\s+(.+)/);
++    const h3Match = line.match(/^###\s+(.+)/);
++    const h4Match = line.match(/^####\s+(.+)/);
++
++    if (h2Match) {
++      currentSection = h2Match[1].trim();
++      currentSubsection = '';
++      continue;
++    }
++    if (h3Match) {
++      currentSubsection = h3Match[1].trim();
++      continue;
++    }
++    if (h4Match) {
++      currentSubsection = h4Match[1].trim();
++      continue;
++    }
++
++    // 解析 checklist 项
++    const checkboxMatch = line.match(/^(\s*)-\s+\[([ xX])\]\s+(.+)/);
++    if (checkboxMatch) {
++      const indent = checkboxMatch[1].length;
++      const checked = checkboxMatch[2].toLowerCase() === 'x';
++      const text = checkboxMatch[3].trim();
++
++      // 跳过空文本
++      if (!text) continue;
++
++      // 生成 ID
++      const id = generateItemId(sourcePath, lineNum, text);
++
++      // 推断属性
++      const context = `${currentSection} ${currentSubsection} ${text}`;
++      const module = inferModule(context);
++      const system = inferSystem(context);
++      const chapter = inferChapter(context);
++      const priority = inferPriority(context);
++
++      items.push({
++        id,
++        title: text,
++        source: inferSource(sourcePath),
++        source_path: sourcePath,
++        source_line: lineNum,
++        module,
++        chapter,
++        system,
++        priority,
++        status: checked ? 'done' : 'pending',
++        completion_pct: checked ? 100 : 0,
++        context: {
++          section: currentSection,
++          subsection: currentSubsection,
++          indent,
++        },
++      });
++    }
++  }
++
++  return items;
++}
++
++/**
++ * 解析 Markdown 表格中的模块状态
++ * @param {string} content - Markdown 内容
++ * @param {string} sourcePath - 来源文件路径
++ * @returns {Array} 工作项列表
++ */
++function parseTableItems(content, sourcePath) {
++  const items = [];
++  const lines = content.split('\n');
++
++  let currentSection = '';
++  let inTable = false;
++  let headers = [];

... (truncated)
```

## 评估维度

请从以下5个维度进行评分（0-100分）：

1. **逻辑正确性 (logic)** - 代码逻辑是否正确，是否有明显bug
2. **代码规范 (style)** - 是否符合项目代码规范，命名是否清晰
3. **安全性 (security)** - 是否有安全漏洞，敏感信息泄露风险
4. **性能 (performance)** - 是否有性能问题，资源使用是否合理
5. **可维护性 (maintainability)** - 代码是否易于理解和维护

## 输出格式

请严格按照以下 JSON 格式输出：

```json
{
  "scores": {
    "logic": <0-100>,
    "style": <0-100>,
    "security": <0-100>,
    "performance": <0-100>,
    "maintainability": <0-100>
  },
  "issues": [
    {
      "severity": "blocker|major|minor|info",
      "file": "<文件路径>",
      "line": <行号或null>,
      "description": "<问题描述>",
      "suggestion": "<修改建议>"
    }
  ],
  "summary": "<一句话总结审查结果>",
  "recommendations": ["<建议1>", "<建议2>"]
}
```

## 评分标准

- 90-100: 优秀，无明显问题
- 80-89: 良好，有少量小问题
- 70-79: 中等，需要改进
- 60-69: 较差，有明显问题
- 0-59: 不合格，有严重问题

## 注意事项

1. 只输出 JSON，不要添加任何额外说明
2. issues 数组只包含实际发现的问题
3. 如果没有问题，issues 为空数组
4. summary 不超过 100 字
