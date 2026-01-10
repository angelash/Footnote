/**
 * ChromeMCP 客户端封装
 * 
 * 提供与 user-chrome-devtools MCP 服务器交互的统一接口
 */

import { MCP_SERVER, TestConfig } from '../config';

// 测试结果类型
export interface TestResult {
  passed: boolean;
  message: string;
  duration: number;
  screenshot?: string;
  error?: Error;
}

// 页面快照元素
export interface SnapshotElement {
  uid: string;
  role: string;
  name?: string;
  value?: string;
  children?: SnapshotElement[];
}

/**
 * MCP 测试客户端
 * 
 * 注意：这个类设计为被 AI Agent 使用
 * 实际调用 MCP 工具需要通过 Cursor 的 CallMcpTool
 */
export class MCPTestClient {
  private server = MCP_SERVER;
  private lastSnapshot: SnapshotElement | null = null;

  /**
   * 导航到游戏页面
   */
  async navigateToGame(): Promise<void> {
    // 使用 MCP navigate_page 工具
    // CallMcpTool: navigate_page { type: "url", url: TestConfig.gameUrl }
    console.log(`[MCP] Navigate to: ${TestConfig.gameUrl}`);
  }

  /**
   * 获取页面快照
   */
  async takeSnapshot(verbose = false): Promise<SnapshotElement | null> {
    // 使用 MCP take_snapshot 工具
    // CallMcpTool: take_snapshot { verbose }
    console.log(`[MCP] Take snapshot (verbose: ${verbose})`);
    return this.lastSnapshot;
  }

  /**
   * 截图
   */
  async takeScreenshot(filePath?: string): Promise<string> {
    // 使用 MCP take_screenshot 工具
    // CallMcpTool: take_screenshot { format: "png", filePath }
    console.log(`[MCP] Take screenshot${filePath ? ` -> ${filePath}` : ''}`);
    return filePath || 'screenshot.png';
  }

  /**
   * 点击元素
   */
  async click(uid: string, dblClick = false): Promise<void> {
    // 使用 MCP click 工具
    // CallMcpTool: click { uid, dblClick }
    console.log(`[MCP] Click: ${uid} (double: ${dblClick})`);
  }

  /**
   * 按键
   */
  async pressKey(key: string): Promise<void> {
    // 使用 MCP press_key 工具
    // CallMcpTool: press_key { key }
    console.log(`[MCP] Press key: ${key}`);
  }

  /**
   * 持续按键（按下 -> 等待 -> 释放）
   */
  async holdKey(key: string, duration: number): Promise<void> {
    // Phaser 需要检测 keydown 和 keyup
    // 使用 evaluate_script 模拟
    console.log(`[MCP] Hold key: ${key} for ${duration}ms`);
  }

  /**
   * 执行 JavaScript
   */
  async evaluate<T>(script: string): Promise<T | null> {
    // 使用 MCP evaluate_script 工具
    // CallMcpTool: evaluate_script { function: script }
    console.log(`[MCP] Evaluate script`);
    return null;
  }

  /**
   * 拖拽元素
   */
  async drag(fromUid: string, toUid: string): Promise<void> {
    // 使用 MCP drag 工具
    // CallMcpTool: drag { from_uid: fromUid, to_uid: toUid }
    console.log(`[MCP] Drag: ${fromUid} -> ${toUid}`);
  }

  /**
   * 等待条件满足
   */
  async waitFor(condition: () => Promise<boolean>, timeout = 5000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await this.sleep(100);
    }
    return false;
  }

  /**
   * 等待指定时间
   */
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 在快照中查找元素
   */
  findElement(snapshot: SnapshotElement, predicate: (el: SnapshotElement) => boolean): SnapshotElement | null {
    if (predicate(snapshot)) {
      return snapshot;
    }
    if (snapshot.children) {
      for (const child of snapshot.children) {
        const found = this.findElement(child, predicate);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * 根据名称查找元素
   */
  findElementByName(snapshot: SnapshotElement, name: string): SnapshotElement | null {
    return this.findElement(snapshot, el => el.name === name);
  }

  /**
   * 根据角色查找元素
   */
  findElementByRole(snapshot: SnapshotElement, role: string): SnapshotElement | null {
    return this.findElement(snapshot, el => el.role === role);
  }
}

/**
 * 创建测试客户端实例
 */
export function createMCPClient(): MCPTestClient {
  return new MCPTestClient();
}

export default MCPTestClient;
