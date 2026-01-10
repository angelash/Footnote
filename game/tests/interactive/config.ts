/**
 * ChromeMCP 交互测试配置
 */

export const TestConfig = {
  // 游戏 URL
  gameUrl: 'http://localhost:5173',

  // 超时设置（毫秒）
  timeouts: {
    pageLoad: 30000,
    gameLoad: 15000,
    sceneTransition: 3000,
    animation: 1000,
    shortWait: 500,
    longWait: 2000,
  },

  // Canvas 配置
  canvas: {
    selector: '#game-container canvas',
    // 游戏设计分辨率
    designWidth: 540,
    designHeight: 960,
  },

  // 菜单按钮位置（相对于 canvas 的百分比）
  menuButtons: {
    newGame: { x: 0.5, y: 0.5 },
    continue: { x: 0.5, y: 0.58 },
    settings: { x: 0.5, y: 0.66 },
    credits: { x: 0.5, y: 0.74 },
  },

  // 游戏内 UI 位置
  gameUI: {
    pauseButton: { x: 0.95, y: 0.05 },
    inventoryButton: { x: 0.05, y: 0.95 },
    dialogueNext: { x: 0.5, y: 0.9 },
  },

  // 截图保存路径
  screenshotDir: './tests/interactive/screenshots',

  // 调试模式
  debug: process.env.DEBUG_TESTS === 'true',
};

// MCP 服务器标识
export const MCP_SERVER = 'user-chrome-devtools';

// 游戏状态获取脚本
export const GameScripts = {
  // 获取当前场景
  getCurrentScene: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return null;
    const scenes = game.scene.getScenes(true);
    return scenes.length > 0 ? scenes[0].scene.key : null;
  }`,

  // 获取玩家位置
  getPlayerPosition: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return null;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._player) return null;
    return { x: scene._player.x, y: scene._player.y };
  }`,

  // 获取世界状态
  getWorldState: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return null;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._worldState) return null;
    return scene._worldState.getSnapshot();
  }`,

  // 检查对话框是否显示
  isDialogueVisible: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return false;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._dialogueUI) return false;
    return scene._dialogueUI.isVisible();
  }`,

  // 获取物品栏内容
  getInventoryItems: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return [];
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._inventoryUI) return [];
    return scene._inventoryUI.getItems();
  }`,

  // 获取当前 Zone
  getCurrentZone: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return null;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._narrativeEngine) return null;
    return scene._narrativeEngine.getCurrentZone();
  }`,

  // 检查暂停菜单是否显示
  isPauseMenuVisible: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return false;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._pauseMenu) return false;
    return scene._pauseMenu.isVisible();
  }`,

  // 获取 R 值
  getRValue: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return null;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._worldState) return null;
    return scene._worldState.getR();
  }`,

  // 检查存档是否存在
  hasSaveData: `() => {
    try {
      return localStorage.getItem('footnote_save') !== null;
    } catch {
      return false;
    }
  }`,

  // 获取能力状态
  getAbilityState: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return null;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._abilitySystem) return null;
    return scene._abilitySystem.getState();
  }`,

  // 获取加载进度
  getLoadingProgress: `() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (!loadingScreen) return 100;
    if (loadingScreen.classList.contains('hidden')) return 100;
    const progressBar = loadingScreen.querySelector('.loading-progress');
    if (progressBar) {
      return parseFloat(progressBar.style.width) || 0;
    }
    return 0;
  }`,
};

export default TestConfig;
