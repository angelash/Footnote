/**
 * ChromeMCP 交互测试运行器
 * 
 * 这是一个测试运行指南，说明如何使用 Chrome DevTools MCP 运行这些测试。
 * 实际测试执行需要通过 AI Agent 使用 MCP 工具完成。
 */

import {
  BootTests,
  MenuTests,
  MovementTests,
  UITests,
  DialogueTests,
  NarrativeTests,
  SaveTests,
  AbilityTests,
  PreviewTests,
  AllTestSuites,
} from './specs';

// 测试套件映射
const TestSuites = {
  boot: BootTests,
  menu: MenuTests,
  movement: MovementTests,
  ui: UITests,
  dialogue: DialogueTests,
  narrative: NarrativeTests,
  save: SaveTests,
  ability: AbilityTests,
  preview: PreviewTests,
};

type TestSuiteKey = keyof typeof TestSuites;

// 测试结果类型
interface TestResult {
  testId: string;
  testName: string;
  passed: boolean;
  duration: number;
  error?: string;
  screenshots?: string[];
}

interface SuiteResult {
  suiteName: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestResult[];
}

/**
 * 测试运行器类
 * 
 * 注意：这个类是测试执行的指南和数据结构定义
 * 实际执行需要通过 AI Agent 调用 MCP 工具
 */
export class InteractiveTestRunner {
  private results: SuiteResult[] = [];

  /**
   * 获取所有可用的测试套件
   */
  getAvailableSuites(): string[] {
    return Object.keys(TestSuites);
  }

  /**
   * 获取指定测试套件
   */
  getSuite(name: TestSuiteKey) {
    return TestSuites[name];
  }

  /**
   * 获取所有测试套件
   */
  getAllSuites() {
    return Object.values(TestSuites);
  }

  /**
   * 生成测试执行计划
   */
  generateTestPlan(suiteNames?: TestSuiteKey[]): string {
    const suites = suiteNames
      ? suiteNames.map(name => TestSuites[name])
      : Object.values(TestSuites);

    let plan = '# ChromeMCP 交互测试执行计划\n\n';
    plan += `生成时间: ${new Date().toISOString()}\n\n`;

    let totalTests = 0;

    for (const suite of suites) {
      plan += `## ${suite.name}\n\n`;
      plan += `测试数量: ${suite.tests.length}\n\n`;

      for (const test of suite.tests) {
        plan += `### ${test.id}: ${test.name}\n`;
        plan += `${test.description}\n\n`;
        plan += '步骤:\n';

        for (let i = 0; i < test.steps.length; i++) {
          const step = test.steps[i];
          plan += `${i + 1}. [${step.action}] ${step.description}\n`;
          if (step.tool) {
            plan += `   工具: ${step.tool}\n`;
          }
        }
        plan += '\n';
        totalTests++;
      }
    }

    plan += `---\n总计: ${totalTests} 个测试\n`;
    return plan;
  }

  /**
   * 生成 MCP 执行脚本
   * 
   * 为指定测试生成 MCP 工具调用序列
   */
  generateMCPScript(suiteKey: TestSuiteKey, testId: string): object[] {
    const suite = TestSuites[suiteKey];
    const test = suite.tests.find((t: { id: string }) => t.id === testId);

    if (!test) {
      throw new Error(`Test ${testId} not found in suite ${suiteKey}`);
    }

    const mcpCalls: object[] = [];

    // 添加 beforeAll 步骤
    if (suite.beforeAll) {
      for (const step of suite.beforeAll) {
        mcpCalls.push(this.stepToMCPCall(step));
      }
    }

    // 添加测试步骤
    for (const step of test.steps) {
      mcpCalls.push(this.stepToMCPCall(step));
    }

    return mcpCalls;
  }

  /**
   * 将测试步骤转换为 MCP 调用
   */
  private stepToMCPCall(step: Record<string, unknown>): object {
    if (step.action === 'sleep') {
      return {
        type: 'wait',
        duration: step.duration as number,
        description: step.description,
      };
    }

    if (step.action === 'assert') {
      return {
        type: 'assert',
        assertion: step.assertion,
        params: step.params,
        description: step.description,
      };
    }

    return {
      type: 'mcp_call',
      server: 'user-chrome-devtools',
      tool: step.tool,
      params: step.params,
      expected: step.expected,
      validate: step.validate ? String(step.validate) : undefined,
      saveAs: step.saveAs,
      description: step.description,
    };
  }

  /**
   * 记录测试结果
   */
  recordResult(suiteName: string, result: TestResult): void {
    let suiteResult = this.results.find(r => r.suiteName === suiteName);
    if (!suiteResult) {
      suiteResult = {
        suiteName,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        tests: [],
      };
      this.results.push(suiteResult);
    }

    suiteResult.tests.push(result);
    suiteResult.duration += result.duration;

    if (result.passed) {
      suiteResult.passed++;
    } else {
      suiteResult.failed++;
    }
  }

  /**
   * 生成测试报告
   */
  generateReport(): string {
    let report = '# ChromeMCP 交互测试报告\n\n';
    report += `生成时间: ${new Date().toISOString()}\n\n`;

    let totalPassed = 0;
    let totalFailed = 0;
    let totalDuration = 0;

    for (const suite of this.results) {
      report += `## ${suite.suiteName}\n\n`;
      report += `- 通过: ${suite.passed}\n`;
      report += `- 失败: ${suite.failed}\n`;
      report += `- 耗时: ${suite.duration}ms\n\n`;

      for (const test of suite.tests) {
        const status = test.passed ? '✅' : '❌';
        report += `${status} ${test.testId}: ${test.testName} (${test.duration}ms)\n`;
        if (test.error) {
          report += `   错误: ${test.error}\n`;
        }
      }
      report += '\n';

      totalPassed += suite.passed;
      totalFailed += suite.failed;
      totalDuration += suite.duration;
    }

    report += '---\n';
    report += `## 总结\n\n`;
    report += `- 总通过: ${totalPassed}\n`;
    report += `- 总失败: ${totalFailed}\n`;
    report += `- 总耗时: ${totalDuration}ms\n`;
    report += `- 通过率: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(2)}%\n`;

    return report;
  }

  /**
   * 获取测试统计
   */
  getStats(): {
    totalSuites: number;
    totalTests: number;
    passed: number;
    failed: number;
    passRate: number;
  } {
    let totalTests = 0;
    let passed = 0;
    let failed = 0;

    for (const suite of this.results) {
      totalTests += suite.tests.length;
      passed += suite.passed;
      failed += suite.failed;
    }

    return {
      totalSuites: this.results.length,
      totalTests,
      passed,
      failed,
      passRate: totalTests > 0 ? (passed / totalTests) * 100 : 0,
    };
  }
}

/**
 * 测试执行指南
 * 
 * 使用 AI Agent 执行测试的步骤：
 * 
 * 1. 启动游戏开发服务器
 *    ```bash
 *    cd game && npm run dev
 *    ```
 * 
 * 2. 在 Chrome 中打开游戏 (http://localhost:5173)
 * 
 * 3. 使用 AI Agent 调用 MCP 工具执行测试
 *    - 使用 navigate_page 导航到游戏
 *    - 使用 take_snapshot 获取页面状态
 *    - 使用 evaluate_script 执行游戏状态检查
 *    - 使用 click/press_key 执行交互
 *    - 使用 take_screenshot 截图验证
 * 
 * 示例 AI Agent 对话：
 * 
 * User: 运行启动测试 boot-001
 * 
 * Agent: 我来执行测试 boot-001...
 * [使用 MCP 工具执行测试步骤]
 * [验证结果]
 * [报告测试结果]
 */

// 导出
export {
  TestSuites,
  AllTestSuites,
};

export default InteractiveTestRunner;
