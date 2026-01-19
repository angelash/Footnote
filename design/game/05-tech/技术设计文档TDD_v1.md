# 《备注 / Footnote》技术设计文档 (TDD) v1.0

> **文档性质**：技术架构规范  
> **适用对象**：开发团队  
> **最后更新**：2025-12-24  
> **关联文档**：`核心玩法系统设计_v1.md`

---

## 1. 技术栈

### 1.1 核心技术

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **运行时** | Phaser 3 | 3.70+ | 游戏引擎 |
| **语言** | TypeScript | 5.0+ | strict模式 |
| **构建** | Vite | 5.0+ | 开发/打包 |
| **存储** | IndexedDB | - | 本地存档 |
| **测试** | Vitest | 1.0+ | 单元测试 |
| **E2E** | Playwright | 1.40+ | 端到端测试 |

### 1.2 项目结构

```
Footnote/
├── .cursor/rules/          # Cursor AI规则
├── assets/                 # 游戏资源
│   ├── audio/             # 音频资源
│   │   ├── bgm/
│   │   ├── sfx/
│   │   └── ambience/
│   └── images/            # 图片资源
│       ├── backgrounds/
│       ├── characters/
│       ├── icons/
│       ├── ui/
│       └── effects/
├── design/                 # 设计文档
├── src/
│   ├── config/            # 配置文件
│   │   └── game.config.ts
│   ├── data/              # 数据定义
│   │   ├── audio/         # 音频配置YAML
│   │   ├── dialogues/     # 对话数据YAML
│   │   ├── cards/         # 卡片数据YAML
│   │   ├── zones/         # Zone配置YAML
│   │   └── scenes/        # 场景配置YAML
│   ├── scenes/            # Phaser场景
│   │   ├── BootScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── MenuScene.ts
│   │   ├── GameScene.ts
│   │   └── index.ts
│   ├── systems/           # 核心系统
│   │   ├── audio/         # 音频系统
│   │   ├── narrative/     # 叙事系统
│   │   ├── world/         # 世界状态
│   │   ├── save/          # 存档系统
│   │   ├── scene/         # 场景组装
│   │   └── ui/            # UI系统
│   ├── entities/          # 游戏实体
│   │   ├── Player.ts
│   │   └── NPC.ts
│   ├── types/             # 类型定义
│   │   ├── index.ts
│   │   └── scene.ts
│   ├── utils/             # 工具函数
│   └── main.ts            # 入口文件
├── tests/                  # 测试文件
│   ├── e2e/
│   ├── unit/
│   └── setup.ts
├── scripts/               # 构建脚本
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 2. 核心系统架构

### 2.1 系统依赖图

```
┌─────────────────────────────────────────────────────────────┐
│                      GameScene                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Player    │  │ ZoneManager │  │  UIManager  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  NarrativeEngine                       │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐   │  │
│  │  │ Dialogue  │ │   Card    │ │ ForeshadowTracker │   │  │
│  │  │ Manager   │ │  System   │ │                   │   │  │
│  │  └───────────┘ └───────────┘ └───────────────────┘   │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    WorldState                          │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐   │  │
│  │  │ Counters  │ │  Ability  │ │    ZoneState      │   │  │
│  │  │ (R/P/W)   │ │  System   │ │                   │   │  │
│  │  └───────────┘ └───────────┘ └───────────────────┘   │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   SaveManager                          │  │
│  │  ┌───────────────────────────────────────────────┐   │  │
│  │  │              IndexedDBAdapter                  │   │  │
│  │  └───────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▼                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   AudioManager                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 事件系统

```typescript
// src/systems/EventBus.ts
import { EventEmitter } from 'phaser';

export enum GameEvent {
  // 生命周期
  GAME_START = 'game:start',
  GAME_PAUSE = 'game:pause',
  GAME_RESUME = 'game:resume',
  
  // 场景
  ZONE_ENTER = 'zone:enter',
  ZONE_EXIT = 'zone:exit',
  ZONE_COMPLETE = 'zone:complete',
  
  // 玩家
  PLAYER_MOVE = 'player:move',
  PLAYER_INTERACT = 'player:interact',
  
  // 能力
  ABILITY_UNLOCK = 'ability:unlock',
  ABILITY_ACTIVATE = 'ability:activate',
  ABILITY_DEACTIVATE = 'ability:deactivate',
  
  // 叙事
  DIALOGUE_START = 'dialogue:start',
  DIALOGUE_END = 'dialogue:end',
  DIALOGUE_CHOICE = 'dialogue:choice',
  CARD_OBTAIN = 'card:obtain',
  FORESHADOW_TRIGGER = 'foreshadow:trigger',
  
  // 计数器
  COUNTER_CHANGE = 'counter:change',
  THRESHOLD_REACHED = 'threshold:reached',
  
  // 存档
  SAVE_START = 'save:start',
  SAVE_COMPLETE = 'save:complete',
  LOAD_START = 'load:start',
  LOAD_COMPLETE = 'load:complete',
}

export const eventBus = new EventEmitter();
```

---

## 3. 核心模块设计

### 3.1 WorldState

```typescript
// src/systems/world/WorldState.ts
export interface ICounters {
  R: number;  // 无收益残差
  P: number;  // 观察者压力
  W: number;  // 世界可读性（计算值）
}

export interface IWorldState {
  counters: ICounters;
  abilities: string[];
  flags: Record<string, boolean>;
  zoneStates: Record<string, IZoneState>;
  scars: IScar[];
  contaminations: IContamination[];
}

export class WorldState {
  private _counters: ICounters = { R: 0, P: 0, W: 100 };
  private _abilities: Set<string> = new Set();
  private _flags: Map<string, boolean> = new Map();
  private _eventModifier: number = 0;
  
  // R值操作
  addR(amount: number): void {
    const newR = Math.min(15, Math.max(0, this._counters.R + amount));
    if (newR !== this._counters.R) {
      this._counters.R = newR;
      this._recalculateW();
      this._checkThresholds();
      eventBus.emit(GameEvent.COUNTER_CHANGE, { type: 'R', value: newR });
    }
  }
  
  // P值操作
  addP(amount: number): void {
    const newP = Math.min(20, Math.max(0, this._counters.P + amount));
    if (newP !== this._counters.P) {
      this._counters.P = newP;
      this._recalculateW();
      this._checkThresholds();
      eventBus.emit(GameEvent.COUNTER_CHANGE, { type: 'P', value: newP });
    }
  }
  
  // W值计算
  private _recalculateW(): void {
    this._counters.W = Math.max(0, 
      100 - (this._counters.R * 3) - (this._counters.P * 2) - this._eventModifier
    );
  }
  
  // 阈值检查
  private _checkThresholds(): void {
    const { R, P, W } = this._counters;
    
    // R阈值
    if (R >= 3) eventBus.emit(GameEvent.THRESHOLD_REACHED, { type: 'R', level: 'subtle' });
    if (R >= 6) eventBus.emit(GameEvent.THRESHOLD_REACHED, { type: 'R', level: 'judgment' });
    if (R >= 10) eventBus.emit(GameEvent.THRESHOLD_REACHED, { type: 'R', level: 'rewrite' });
    
    // W阈值
    if (W < 60) eventBus.emit(GameEvent.THRESHOLD_REACHED, { type: 'W', level: 'unstable' });
    if (W < 40) eventBus.emit(GameEvent.THRESHOLD_REACHED, { type: 'W', level: 'critical' });
  }
  
  // 序列化
  serialize(): IWorldState {
    return {
      counters: { ...this._counters },
      abilities: Array.from(this._abilities),
      flags: Object.fromEntries(this._flags),
      zoneStates: this._serializeZones(),
      scars: this._serializeScars(),
      contaminations: this._serializeContaminations(),
    };
  }
  
  // 反序列化
  deserialize(data: IWorldState): void {
    this._counters = { ...data.counters };
    this._abilities = new Set(data.abilities);
    this._flags = new Map(Object.entries(data.flags));
    // ...
  }
}
```

### 3.2 SaveManager

```typescript
// src/systems/save/SaveManager.ts
export interface ISaveSlot {
  id: string;
  data: ISaveData;
  timestamp: number;
  chapter: string;
  zone: string;
  playtime: number;
}

export class SaveManager {
  private _adapter: IStorageAdapter;
  private _autoSaveInterval: number = 60000; // 1分钟
  
  constructor(adapter: IStorageAdapter) {
    this._adapter = adapter;
  }
  
  // 保存游戏
  async save(slotId: string): Promise<boolean> {
    eventBus.emit(GameEvent.SAVE_START);
    
    const saveData: ISaveData = {
      meta: this._createMeta(),
      world: worldState.serialize(),
      player: player.serialize(),
      collection: cardSystem.serialize(),
      timeNodes: timeSystem.getNodes(),
      settings: settingsManager.serialize(),
    };
    
    const success = await this._adapter.save(slotId, saveData);
    
    if (success) {
      eventBus.emit(GameEvent.SAVE_COMPLETE);
    }
    
    return success;
  }
  
  // 读取游戏
  async load(slotId: string): Promise<boolean> {
    eventBus.emit(GameEvent.LOAD_START);
    
    const saveData = await this._adapter.load(slotId);
    
    if (!saveData) {
      return false;
    }
    
    // 恢复状态
    worldState.deserialize(saveData.world);
    player.deserialize(saveData.player);
    cardSystem.deserialize(saveData.collection);
    timeSystem.setNodes(saveData.timeNodes);
    settingsManager.deserialize(saveData.settings);
    
    eventBus.emit(GameEvent.LOAD_COMPLETE);
    
    return true;
  }
  
  // 获取存档列表
  async getSlots(): Promise<ISaveSlot[]> {
    return this._adapter.getAllSlots();
  }
  
  // 自动存档
  startAutoSave(): void {
    setInterval(() => {
      this.save('auto');
    }, this._autoSaveInterval);
  }
}

// IndexedDB适配器
export class IndexedDBAdapter implements IStorageAdapter {
  private _dbName = 'FootnoteGame';
  private _storeName = 'saves';
  private _db: IDBDatabase | null = null;
  
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this._db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this._storeName)) {
          db.createObjectStore(this._storeName, { keyPath: 'id' });
        }
      };
    });
  }
  
  async save(slotId: string, data: ISaveData): Promise<boolean> {
    if (!this._db) return false;
    
    return new Promise((resolve) => {
      const transaction = this._db!.transaction([this._storeName], 'readwrite');
      const store = transaction.objectStore(this._storeName);
      
      const request = store.put({ id: slotId, data, timestamp: Date.now() });
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    });
  }
  
  async load(slotId: string): Promise<ISaveData | null> {
    if (!this._db) return null;
    
    return new Promise((resolve) => {
      const transaction = this._db!.transaction([this._storeName], 'readonly');
      const store = transaction.objectStore(this._storeName);
      
      const request = store.get(slotId);
      
      request.onsuccess = () => {
        resolve(request.result?.data || null);
      };
      request.onerror = () => resolve(null);
    });
  }
}
```

### 3.3 NarrativeEngine

```typescript
// src/systems/narrative/NarrativeEngine.ts
export class NarrativeEngine {
  private _dialogueManager: DialogueManager;
  private _cardSystem: CardSystem;
  private _foreshadowTracker: ForeshadowTracker;
  
  constructor() {
    this._dialogueManager = new DialogueManager();
    this._cardSystem = new CardSystem();
    this._foreshadowTracker = new ForeshadowTracker();
    
    this._setupListeners();
  }
  
  // 开始对话
  async startDialogue(dialogueId: string): Promise<void> {
    const dialogue = await this._dialogueManager.load(dialogueId);
    return this._dialogueManager.start(dialogue);
  }
  
  // 处理选择
  handleChoice(choiceId: string): void {
    const result = this._dialogueManager.selectChoice(choiceId);
    
    // 处理选择结果
    if (result.rChange) {
      worldState.addR(result.rChange);
    }
    if (result.pChange) {
      worldState.addP(result.pChange);
    }
    if (result.card) {
      this._cardSystem.obtain(result.card);
    }
    if (result.foreshadow) {
      this._foreshadowTracker.trigger(result.foreshadow);
    }
    if (result.flag) {
      worldState.setFlag(result.flag, true);
    }
  }
  
  // 获得卡片
  obtainCard(cardId: string): void {
    this._cardSystem.obtain(cardId);
    eventBus.emit(GameEvent.CARD_OBTAIN, { cardId });
  }
  
  // 触发伏笔
  triggerForeshadow(foreshadowId: string, action: 'plant' | 'deepen' | 'recall'): void {
    this._foreshadowTracker[action](foreshadowId);
    eventBus.emit(GameEvent.FORESHADOW_TRIGGER, { foreshadowId, action });
  }
}
```

---

## 4. 场景配置系统

### 4.1 SceneAssembler

```typescript
// src/systems/scene/SceneAssembler.ts
export interface ISceneConfig {
  id: string;
  title: string;
  background: IBackgroundConfig;
  objects: ISceneObjectConfig[];
  exits?: IExitConfig[];
  audio?: IAudioConfig;
  events?: IEventConfig[];
}

export class SceneAssembler {
  private _scene: Phaser.Scene;
  private _objects: Map<string, Phaser.GameObjects.GameObject[]>;
  private _callbacks: ISceneAssemblerCallbacks;
  
  constructor(scene: Phaser.Scene, callbacks: ISceneAssemblerCallbacks) {
    this._scene = scene;
    this._objects = new Map();
    this._callbacks = callbacks;
  }
  
  // 构建场景
  build(config: ISceneConfig): IAssembledScene {
    const assembled: IAssembledScene = {
      background: null,
      objects: [],
      exits: [],
    };
    
    // 创建背景
    if (config.background) {
      assembled.background = this._createBackground(config.background);
    }
    
    // 创建对象
    for (const objConfig of config.objects) {
      const objects = this._createObject(objConfig);
      assembled.objects.push(...objects);
      this._objects.set(objConfig.id, objects);
    }
    
    // 创建出口
    if (config.exits) {
      for (const exitConfig of config.exits) {
        assembled.exits.push(this._createExit(exitConfig));
      }
    }
    
    return assembled;
  }
  
  // 创建对象
  private _createObject(config: ISceneObjectConfig): Phaser.GameObjects.GameObject[] {
    const created: Phaser.GameObjects.GameObject[] = [];
    
    let display: Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    
    if (config.type === 'sprite' && config.animation) {
      display = this._scene.add.sprite(config.x, config.y, config.texture);
      this._setupAnimation(display as Phaser.GameObjects.Sprite, config.animation);
    } else {
      display = this._scene.add.image(config.x, config.y, config.texture);
    }
    
    // 设置属性
    if (config.scale) display.setScale(config.scale);
    if (config.depth !== undefined) {
      display.setDepth(config.depth);
    } else {
      display.setDepth(config.y); // Y-sort
    }
    
    created.push(display);
    
    // 设置交互
    if (config.interactive) {
      display.setInteractive({ useHandCursor: config.interactive.cursor });
      display.on('pointerdown', () => {
        this._handleInteraction(config);
      });
    }
    
    // 添加标签
    if (config.label) {
      const label = this._createLabel(config);
      created.push(label);
    }
    
    return created;
  }
  
  // 处理交互
  private _handleInteraction(config: ISceneObjectConfig): void {
    const action = config.interactive?.action;
    if (!action) return;
    
    switch (action.type) {
      case 'dialogue':
        this._callbacks.onDialogue?.(action.dialogueId || '', action.speaker, action.text);
        break;
      case 'card':
        this._callbacks.onCard?.(action.cardId || '');
        break;
      case 'gotoZone':
        this._callbacks.onGotoZone?.(action.zoneId || '');
        break;
    }
  }
  
  // 销毁场景
  destroy(): void {
    for (const objects of this._objects.values()) {
      objects.forEach(obj => obj.destroy());
    }
    this._objects.clear();
  }
}
```

### 4.2 Zone YAML配置

```yaml
# src/data/scenes/c0_z1.yaml
id: C0-Z1
title: 宿舍走廊
chapter: C0

background:
  texture: bg_c0z1
  x: 0
  y: 0
  origin: [0, 0]
  displaySize: [750, 1334]

player:
  spawn: [375, 1100]
  bounds: [50, 200, 700, 1200]

objects:
  - id: toolbox
    type: image
    texture: px_item_toolkit
    x: 200
    y: 600
    scale: 0.5
    depth: 10
    label: 工具包
    labelOffset: [0, 80]
    interactive:
      cursor: true
      testid: toolbox
      action:
        type: card
        cardId: CARD_C0_TOOLBOX

  - id: notice_board
    type: image
    texture: px_item_archive
    x: 500
    y: 450
    scale: 0.6
    depth: 8
    label: 公告板
    interactive:
      cursor: true
      action:
        type: dialogue
        speaker: 岑回
        text: 公告上的日期...好像有涂改痕迹。

exits:
  - id: exit_south
    position: [375, 1300]
    target: C0-Z2
    condition: has_toolbox

audio:
  bgm: bgm_prologue
  ambience: amb_indoor_office

events:
  on_enter:
    - type: dialogue
      speaker: 岑回
      text: 又是普通的一天...工具包应该在桌上。
```

---

## 5. 数据格式

### 5.1 对话数据

```yaml
# src/data/dialogues/c0.yaml
dialogues:
  CENHUI_C0_INTRO:
    speaker: 岑回
    portrait: portrait_cenhui_neutral
    lines:
      - text: 又是普通的一天...
        auto: false
      - text: 工具包应该在桌上。
        auto: true
        delay: 800

  GULIN_C0_FIRST:
    speaker: 顾临
    portrait: portrait_gulin_neutral
    lines:
      - text: 记录就好。
      - text: 别把主观当事实。
    options:
      - id: question
        text: 但我确实看到了...
        next: GULIN_C0_FIRST_A
        flags:
          questioned_gulin: true
      - id: accept
        text: 明白了。
        next: null
```

### 5.2 卡片数据

```yaml
# src/data/cards/archive.yaml
cards:
  CARD_C0_TOOLBOX:
    type: item
    title: 工具包
    subtitle: 维修局标准配发
    content: |
      编号：TK-2847
      内含：基础检测仪、标记笔、记录本
      注意：检测仪需定期校准
    image: card_item_toolbox
    obtained_at: C0-Z1

  CARD_WALL_SECRET:
    type: archive
    title: 被更正的记录
    subtitle: 薄墙巷口调查报告
    content: |
      调查结论：结构正常
      ——
      注：原报告已被系统更正
      更正原因：[数据缺失]
    image: card_archive_wall
    related_foreshadow: F01
```

---

## 6. 性能优化

### 6.1 资源加载策略

```typescript
// src/scenes/PreloadScene.ts
export class PreloadScene extends Phaser.Scene {
  preload(): void {
    // 按优先级加载
    this._loadCritical();  // 首屏必需
    this._loadChapter(0);  // 当前章节
    this._loadAudio();     // 音频
  }
  
  private _loadCritical(): void {
    // UI必需资源
    this.load.svg('ui_panel_main', 'assets/images/ui/panels/panel_main.svg');
    this.load.svg('btn_primary', 'assets/images/ui/buttons/btn_primary.svg');
    // ...
  }
  
  private _loadChapter(chapter: number): void {
    // 按章节加载背景
    const chapterKey = `c${chapter}`;
    const backgrounds = CHAPTER_BACKGROUNDS[chapterKey];
    backgrounds.forEach(bg => {
      this.load.svg(bg.key, bg.path);
    });
  }
}
```

### 6.2 对象池

```typescript
// src/systems/ObjectPool.ts
export class ObjectPool<T extends Phaser.GameObjects.GameObject> {
  private _pool: T[] = [];
  private _factory: () => T;
  
  constructor(factory: () => T, initialSize: number = 10) {
    this._factory = factory;
    this._warmup(initialSize);
  }
  
  get(): T {
    return this._pool.pop() || this._factory();
  }
  
  release(obj: T): void {
    obj.setActive(false);
    obj.setVisible(false);
    this._pool.push(obj);
  }
  
  private _warmup(size: number): void {
    for (let i = 0; i < size; i++) {
      const obj = this._factory();
      obj.setActive(false);
      obj.setVisible(false);
      this._pool.push(obj);
    }
  }
}
```

### 6.3 内存管理

```typescript
// Zone切换时的资源管理
class ZoneManager {
  private _currentZone: string = '';
  private _loadedAssets: Set<string> = new Set();
  
  async switchZone(zoneId: string): Promise<void> {
    // 卸载不需要的资源
    const toUnload = this._getUnusedAssets(zoneId);
    toUnload.forEach(key => {
      this._scene.textures.remove(key);
      this._loadedAssets.delete(key);
    });
    
    // 加载新资源
    const toLoad = this._getRequiredAssets(zoneId);
    await this._loadAssets(toLoad);
    
    this._currentZone = zoneId;
  }
}
```

---

## 7. 构建与部署

### 7.1 构建配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2018',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          vendor: ['yaml'],
        },
      },
    },
  },
  define: {
    __VERSION__: JSON.stringify(process.env.npm_package_version),
  },
});
```

### 7.2 部署流程

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

---

## 附录：API参考

### 核心单例

```typescript
// 全局访问
import { worldState } from '@/systems/world';
import { saveManager } from '@/systems/save';
import { narrativeEngine } from '@/systems/narrative';
import { audioManager } from '@/systems/audio';
import { eventBus } from '@/systems/EventBus';
```

### 类型定义

```typescript
// src/types/index.ts
export interface ISaveData { /* ... */ }
export interface IWorldState { /* ... */ }
export interface IDialogue { /* ... */ }
export interface ICard { /* ... */ }
export interface IForeshadow { /* ... */ }
export interface IZoneConfig { /* ... */ }
```

---

*文档结束*

