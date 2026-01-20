/**
 * 游戏相关辅助函数
 * 
 * 封装常用的游戏操作和状态检查
 */

import { TestConfig, GameScripts } from '../config';

// 玩家位置类型
export interface PlayerPosition {
  x: number;
  y: number;
}

// 世界状态快照
export interface WorldStateSnapshot {
  currentZone: string;
  r: number;
  p: number;
  w: number;
  visitedZones: string[];
  flags: Record<string, boolean>;
}

// 游戏场景类型
export type SceneKey = 'BootScene' | 'PreloadScene' | 'MenuScene' | 'GameScene' | string;

/**
 * 游戏操作辅助类
 * 
 * 使用说明：这些函数返回需要通过 MCP evaluate_script 执行的脚本
 */
export class GameHelpers {
  /**
   * 等待游戏加载完成
   * 返回用于检查加载状态的脚本
   */
  static getLoadingCompleteScript(): string {
    return `() => {
      const loadingScreen = document.getElementById('loading-screen');
      return loadingScreen && loadingScreen.classList.contains('hidden');
    }`;
  }

  /**
   * 获取当前场景
   */
  static getCurrentSceneScript(): string {
    return GameScripts.getCurrentScene;
  }

  /**
   * 获取玩家位置
   */
  static getPlayerPositionScript(): string {
    return GameScripts.getPlayerPosition;
  }

  /**
   * 获取世界状态
   */
  static getWorldStateScript(): string {
    return GameScripts.getWorldState;
  }

  /**
   * 检查对话是否显示
   */
  static isDialogueVisibleScript(): string {
    return GameScripts.isDialogueVisible;
  }

  /**
   * 检查暂停菜单是否显示
   */
  static isPauseMenuVisibleScript(): string {
    return GameScripts.isPauseMenuVisible;
  }

  /**
   * 获取 R 值
   */
  static getRValueScript(): string {
    return GameScripts.getRValue;
  }

  /**
   * 检查存档是否存在
   */
  static hasSaveDataScript(): string {
    return GameScripts.hasSaveData;
  }

  /**
   * 获取能力状态
   */
  static getAbilityStateScript(): string {
    return GameScripts.getAbilityState;
  }

  /**
   * 获取当前 Zone
   */
  static getCurrentZoneScript(): string {
    return GameScripts.getCurrentZone;
  }

  /**
   * 获取物品栏
   */
  static getInventoryItemsScript(): string {
    return GameScripts.getInventoryItems;
  }

  /**
   * 模拟按键（用于 Canvas 游戏）
   */
  static simulateKeyScript(key: string, type: 'down' | 'up' | 'press'): string {
    return `() => {
      const canvas = document.querySelector('${TestConfig.canvas.selector}');
      if (!canvas) return false;
      
      const event = new KeyboardEvent('key${type}', {
        key: '${key}',
        code: 'Key${key.toUpperCase()}',
        bubbles: true,
        cancelable: true
      });
      
      canvas.dispatchEvent(event);
      return true;
    }`;
  }

  /**
   * 模拟按住按键一段时间
   */
  static simulateKeyHoldScript(key: string, duration: number): string {
    return `async () => {
      const canvas = document.querySelector('${TestConfig.canvas.selector}');
      if (!canvas) return false;
      
      const keyDown = new KeyboardEvent('keydown', {
        key: '${key}',
        code: 'Key${key.toUpperCase()}',
        bubbles: true,
        cancelable: true
      });
      
      const keyUp = new KeyboardEvent('keyup', {
        key: '${key}',
        code: 'Key${key.toUpperCase()}',
        bubbles: true,
        cancelable: true
      });
      
      canvas.dispatchEvent(keyDown);
      
      await new Promise(resolve => setTimeout(resolve, ${duration}));
      
      canvas.dispatchEvent(keyUp);
      return true;
    }`;
  }

  /**
   * 模拟点击 Canvas 指定位置
   */
  static simulateCanvasClickScript(xPercent: number, yPercent: number): string {
    return `() => {
      const canvas = document.querySelector('${TestConfig.canvas.selector}');
      if (!canvas) return false;
      
      const rect = canvas.getBoundingClientRect();
      const x = rect.left + rect.width * ${xPercent};
      const y = rect.top + rect.height * ${yPercent};
      
      const events = ['mousedown', 'mouseup', 'click'];
      events.forEach(type => {
        const event = new MouseEvent(type, {
          clientX: x,
          clientY: y,
          bubbles: true,
          cancelable: true,
          view: window
        });
        canvas.dispatchEvent(event);
      });
      
      return true;
    }`;
  }

  /**
   * 获取 Canvas 尺寸
   */
  static getCanvasSizeScript(): string {
    return `() => {
      const canvas = document.querySelector('${TestConfig.canvas.selector}');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }`;
  }

  /**
   * 清除存档数据
   */
  static clearSaveDataScript(): string {
    return `() => {
      try {
        localStorage.removeItem('footnote_save');
        localStorage.removeItem('footnote_settings');
        return true;
      } catch {
        return false;
      }
    }`;
  }

  /**
   * 检查 Toast 是否显示
   */
  static isToastVisibleScript(): string {
    return `() => {
      const game = window.__PHASER_GAME__ || window.game;
      if (!game) return false;
      const scene = game.scene.getScene('GameScene');
      if (!scene || !scene._toastManager) return false;
      return scene._toastManager.isActive();
    }`;
  }

  /**
   * 获取当前对话内容
   */
  static getDialogueContentScript(): string {
    return `() => {
      const game = window.__PHASER_GAME__ || window.game;
      if (!game) return null;
      const scene = game.scene.getScene('GameScene');
      if (!scene || !scene._dialogueUI) return null;
      return scene._dialogueUI.getCurrentContent();
    }`;
  }

  /**
   * 触发调试命令
   */
  static triggerDebugCommandScript(command: string): string {
    return `() => {
      const game = window.__PHASER_GAME__ || window.game;
      if (!game) return false;
      const scene = game.scene.getScene('GameScene');
      if (!scene || !scene._debugCommands) return false;
      return scene._debugCommands.execute('${command}');
    }`;
  }

  /**
   * 跳转到指定 Zone（调试用）
   */
  static teleportToZoneScript(zoneId: string): string {
    return `() => {
      const game = window.__PHASER_GAME__ || window.game;
      if (!game) return false;
      const scene = game.scene.getScene('GameScene');
      if (!scene || !scene._narrativeEngine) return false;
      scene._narrativeEngine.loadZone('${zoneId}');
      return true;
    }`;
  }

  /**
   * 设置 R 值（调试用）
   */
  static setRValueScript(value: number): string {
    return `() => {
      const game = window.__PHASER_GAME__ || window.game;
      if (!game) return false;
      const scene = game.scene.getScene('GameScene');
      if (!scene || !scene._worldState) return false;
      scene._worldState.setR(${value});
      return true;
    }`;
  }

  /**
   * 解锁能力（调试用）
   */
  static unlockAbilityScript(abilityId: string): string {
    return `() => {
      const game = window.__PHASER_GAME__ || window.game;
      if (!game) return false;
      const scene = game.scene.getScene('GameScene');
      if (!scene || !scene._abilitySystem) return false;
      scene._abilitySystem.unlock('${abilityId}');
      return true;
    }`;
  }

  /**
   * 添加卡片到物品栏（调试用）
   */
  static addCardScript(cardId: string): string {
    return `() => {
      const game = window.__PHASER_GAME__ || window.game;
      if (!game) return false;
      const scene = game.scene.getScene('GameScene');
      if (!scene || !scene._inventoryUI) return false;
      scene._inventoryUI.addCard('${cardId}');
      return true;
    }`;
  }

  /**
   * 跳转到指定章节
   */
  static gotoChapterScript(chapter: string): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.gotoChapter('${chapter}');
      }
      return false;
    }`;
  }

  /**
   * 设置结局条件
   */
  static setupEndingScript(ending: 'A' | 'B' | 'C'): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.setupEnding('${ending}');
      }
      return false;
    }`;
  }

  /**
   * 设置 R 值
   */
  static setRScript(value: number): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.setR(${value});
      }
      return false;
    }`;
  }

  /**
   * 增加 R 值
   */
  static addRScript(delta: number): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.addR(${delta});
      }
      return false;
    }`;
  }

  /**
   * 设置 P 值
   */
  static setPScript(value: number): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.setP(${value});
      }
      return false;
    }`;
  }

  /**
   * 增加 P 值
   */
  static addPScript(delta: number): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.addP(${delta});
      }
      return false;
    }`;
  }

  /**
   * 解锁所有能力
   */
  static unlockAllAbilitiesScript(): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.unlockAllAbilities();
      }
      return false;
    }`;
  }

  /**
   * 完成指定 Zone
   */
  static completeZoneScript(zoneId: string): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.completeZone('${zoneId}');
      }
      return false;
    }`;
  }

  /**
   * 重置游戏状态
   */
  static resetScript(): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.reset();
      }
      return false;
    }`;
  }

  /**
   * 设置 FLAG
   */
  static setFlagScript(name: string, value: boolean = true): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.setFlag('${name}', ${value});
      }
      return false;
    }`;
  }

  /**
   * 获取游戏状态快照
   */
  static getGameStateScript(): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.getGameState();
      }
      return null;
    }`;
  }

  /**
   * 执行测试脚本
   */
  static runTestScript(scriptName: string): string {
    return `async () => {
      if (window.__DEBUG__) {
        // 动态导入测试脚本
        const { ${scriptName} } = await import('/tests/auto/TestRunner.ts');
        return window.__DEBUG__.runTest(${scriptName});
      }
      return null;
    }`;
  }

  /**
   * 触发对话
   */
  static triggerDialogueScript(dialogueId: string): string {
    return `async () => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.triggerDialogue('${dialogueId}');
      }
      return false;
    }`;
  }

  /**
   * 跳过对话
   */
  static skipDialogueScript(): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.skipDialogue();
      }
      return false;
    }`;
  }

  /**
   * 获取测试结果
   */
  static getTestResultsScript(): string {
    return `() => {
      if (window.__DEBUG__) {
        return window.__DEBUG__.getTestResults();
      }
      return [];
    }`;
  }
}

/**
 * 计算 Canvas 内的点击坐标
 */
export function calculateCanvasPosition(
  canvasWidth: number,
  canvasHeight: number,
  xPercent: number,
  yPercent: number
): { x: number; y: number } {
  return {
    x: canvasWidth * xPercent,
    y: canvasHeight * yPercent,
  };
}

/**
 * 格式化测试日志
 */
export function formatTestLog(testName: string, action: string, result?: unknown): string {
  const timestamp = new Date().toISOString();
  const resultStr = result !== undefined ? ` -> ${JSON.stringify(result)}` : '';
  return `[${timestamp}] ${testName}: ${action}${resultStr}`;
}

export default GameHelpers;
