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

// Zone 配置常量
export const ZONES = {
  C0: ['C0-Z1', 'C0-Z2', 'C0-Z3', 'C0-Z4', 'C0-Z5', 'C0-Z6'],
  C1: ['C1-Z1', 'C1-Z2', 'C1-Z3', 'C1-Z4', 'C1-Z5', 'C1-Z6'],
  C2: ['C2-Z1', 'C2-Z2', 'C2-Z3', 'C2-Z4', 'C2-Z5', 'C2-Z6', 'C2-Z7'],
  C3: ['C3-Z1', 'C3-Z2', 'C3-Z3', 'C3-Z4', 'C3-Z5', 'C3-Z6', 'C3-Z7'],
  C4: ['C4-Z1', 'C4-Z2', 'C4-Z3', 'C4-Z4', 'C4-Z5', 'C4-Z6', 'C4-Z7', 'C4-Z8'],
  C5: ['C5-Z1', 'C5-Z2', 'C5-Z3', 'C5-Z4', 'C5-Z5', 'C5-Z6', 'C5-Z7'],
  CF: ['CF-Z1', 'CF-Z2', 'CF-Z3', 'CF-Z4', 'CF-Z5', 'CF-Z6'],
} as const;

// 能力解锁点
export const ABILITY_UNLOCK_ZONES = {
  DEPTH_PERCEPTION: 'C2-Z1',
  DEPTH_INTERVENTION: 'C3-Z1',
  TIME_INTERVENTION: 'C4-Z2',
} as const;

// R值变化点
export const R_VALUE_ZONES = {
  'C0-Z2': 1,  // 首次无收益选择
  'C2-Z4': 2,  // 路标修补
  'C3-Z4': 2,  // 空椅子任务
  'C4-Z6': 2,  // 无人需要的地图
  'CF-Z2': 2,  // 最后的无收益选择
} as const;

// 结局条件
export const ENDING_CONDITIONS = {
  A: { R: { max: 5 }, W: { min: 61 }, zone: 'CF-Z3', description: '平面稳定' },
  B: { R: { min: 6, max: 9 }, W: { min: 41, max: 60 }, zone: 'CF-Z4', description: '真实释放' },
  C: { R: { min: 10 }, W: { max: 40 }, zone: 'CF-Z5', description: '成为系统' },
} as const;

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

  // 获取 P 值
  getPValue: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return null;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._worldState) return null;
    return scene._worldState.getP();
  }`,

  // 获取 W 值
  getWValue: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return null;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._worldState) return null;
    return scene._worldState.getW();
  }`,

  // 获取所有计数器
  getAllCounters: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return null;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._worldState) return null;
    return {
      R: scene._worldState.getR(),
      P: scene._worldState.getP(),
      W: scene._worldState.getW(),
    };
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

  // 获取已访问的 Zone 列表
  getVisitedZones: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return [];
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._worldState) return [];
    return scene._worldState.getVisitedZones();
  }`,

  // 获取已完成的 Zone 列表
  getCompletedZones: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return [];
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._worldState) return [];
    return scene._worldState.getCompletedZones();
  }`,

  // 获取已获得的卡片列表
  getObtainedCards: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return [];
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._inventoryUI) return [];
    return scene._inventoryUI.getCards();
  }`,

  // 获取当前章节
  getCurrentChapter: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return null;
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._narrativeEngine) return null;
    const zone = scene._narrativeEngine.getCurrentZone();
    if (!zone) return null;
    return zone.split('-')[0];
  }`,

  // 检查结局 FLAG
  getEndingFlags: `() => {
    const game = window.__GAME__ || window.__PHASER_GAME__ || window.game;
    if (!game) return {};
    const scene = game.scene.getScene('GameScene');
    if (!scene || !scene._worldState) return {};
    return {
      A: scene._worldState.getFlag('FLAG_ENDING_A'),
      B: scene._worldState.getFlag('FLAG_ENDING_B'),
      C: scene._worldState.getFlag('FLAG_ENDING_C'),
    };
  }`,
};

export default TestConfig;
