# 🎮 白盒开发流程指南

> **目标**：用占位资源快速验证功能，后续无缝替换正式美术资源

---

## 📋 目录

1. [概述](#概述)
2. [资源模式架构](#资源模式架构)
3. [各类资源占位方案](#各类资源占位方案)
4. [Billboard 文字标识系统](#billboard-文字标识系统)
5. [资源切换机制](#资源切换机制)
6. [开发流程](#开发流程)
7. [里程碑计划](#里程碑计划)

---

## 概述

### 🎯 核心理念

```
功能版（白盒）→ 验证玩法 → 正式资源替换 → 发布版
```

### 📦 资源分类策略

| 资源类型 | 白盒方案 | 替换难度 |
|----------|----------|----------|
| **背景** | 纯色块 + 边界线 | ⭐ 简单 |
| **角色** | 文字 Billboard | ⭐ 简单 |
| **物件** | 文字 Billboard + 边框 | ⭐ 简单 |
| **UI** | 线框 SVG（运行时生成） | ⭐⭐ 中等 |
| **特效** | 简单几何动画 | ⭐⭐ 中等 |
| **音频** | 静音/简单提示音 | ⭐ 简单 |

---

## 资源模式架构

### 配置文件：`src/config/assetMode.config.ts`

```typescript
/**
 * 资源模式配置
 * 控制使用白盒占位资源还是正式资源
 */

export enum AssetMode {
  /** 白盒模式 - 使用占位资源 */
  WHITEBOX = 'whitebox',
  /** 混合模式 - 部分使用正式资源 */
  HYBRID = 'hybrid',
  /** 正式模式 - 全部使用正式资源 */
  PRODUCTION = 'production',
}

export interface IAssetModeConfig {
  mode: AssetMode;
  
  /** 各类资源是否使用正式版 */
  useProductionAssets: {
    backgrounds: boolean;
    characters: boolean;
    objects: boolean;
    ui: boolean;
    effects: boolean;
    audio: boolean;
  };
  
  /** Billboard 配置 */
  billboard: {
    /** 是否显示类型标签 */
    showTypeLabel: boolean;
    /** 是否显示边界框 */
    showBoundingBox: boolean;
    /** 字体大小 */
    fontSize: number;
    /** 背景透明度 */
    bgAlpha: number;
  };
  
  /** 调试选项 */
  debug: {
    /** 显示碰撞框 */
    showHitboxes: boolean;
    /** 显示交互区域 */
    showInteractZones: boolean;
    /** 显示网格 */
    showGrid: boolean;
  };
}

// 默认白盒配置
export const WHITEBOX_CONFIG: IAssetModeConfig = {
  mode: AssetMode.WHITEBOX,
  useProductionAssets: {
    backgrounds: false,
    characters: false,
    objects: false,
    ui: false,
    effects: false,
    audio: false,
  },
  billboard: {
    showTypeLabel: true,
    showBoundingBox: true,
    fontSize: 14,
    bgAlpha: 0.8,
  },
  debug: {
    showHitboxes: true,
    showInteractZones: true,
    showGrid: false,
  },
};

// 混合配置（逐步替换用）
export const HYBRID_CONFIG: IAssetModeConfig = {
  mode: AssetMode.HYBRID,
  useProductionAssets: {
    backgrounds: true,   // 背景先替换
    characters: false,   // 角色保持占位
    objects: false,
    ui: false,
    effects: false,
    audio: true,         // 音频先替换
  },
  billboard: {
    showTypeLabel: true,
    showBoundingBox: false,
    fontSize: 12,
    bgAlpha: 0.6,
  },
  debug: {
    showHitboxes: false,
    showInteractZones: true,
    showGrid: false,
  },
};

// 正式配置
export const PRODUCTION_CONFIG: IAssetModeConfig = {
  mode: AssetMode.PRODUCTION,
  useProductionAssets: {
    backgrounds: true,
    characters: true,
    objects: true,
    ui: true,
    effects: true,
    audio: true,
  },
  billboard: {
    showTypeLabel: false,
    showBoundingBox: false,
    fontSize: 12,
    bgAlpha: 0,
  },
  debug: {
    showHitboxes: false,
    showInteractZones: false,
    showGrid: false,
  },
};

// 当前使用的配置（开发时切换这里）
export const CURRENT_ASSET_MODE = WHITEBOX_CONFIG;
```

---

## 各类资源占位方案

### 1️⃣ 背景 - 纯色块 + 区域标注

```typescript
// 白盒背景配色方案
const ZONE_TYPE_COLORS = {
  // 生活区 - 暖灰色
  'life': { bg: 0x2D2D33, border: 0x4A4A52 },
  // 市政区 - 冷蓝灰
  'municipal': { bg: 0x1E2836, border: 0x3A5070 },
  // 边缘区 - 暗红色
  'edge': { bg: 0x2D1E1E, border: 0x5A3030 },
  // 异常区 - 紫色
  'anomaly': { bg: 0x251E2D, border: 0x4A3060 },
  // 神殿 - 金色调
  'temple': { bg: 0x2D2818, border: 0x5A5030 },
};

// 背景元素标注
interface IWhiteboxBackground {
  zoneType: string;
  zoneName: string;
  gridSize: number;      // 网格大小（用于位置参考）
  landmarks: {           // 地标标注
    x: number;
    y: number;
    label: string;
  }[];
}
```

**视觉效果**：
```
┌─────────────────────────────────────┐
│  C0-Z1 宿舍走廊                      │
│  [生活区]                            │
│                                      │
│  ┌─────┐         ┌─────┐            │
│  │ 入口 │         │ 公告 │            │
│  └─────┘         └─────┘            │
│                                      │
│         ┌─────────────┐             │
│         │   走廊中央   │             │
│         └─────────────┘             │
│                                      │
│  ┌─────┐                ┌─────┐     │
│  │ 房门 │                │ 电梯 │     │
│  └─────┘                └─────┘     │
└─────────────────────────────────────┘
```

### 2️⃣ 角色 - 文字 Billboard

```typescript
interface ICharacterBillboard {
  id: string;           // 角色ID
  name: string;         // 显示名称
  role: string;         // 角色定位
  color: number;        // 标识颜色
  size: { w: number; h: number };  // 碰撞尺寸
}

const CHARACTER_BILLBOARDS: Record<string, ICharacterBillboard> = {
  'cenhui': {
    id: 'cenhui',
    name: '岑回',
    role: '主角/外勤',
    color: 0x00FFAA,
    size: { w: 48, h: 64 },
  },
  'gulin': {
    id: 'gulin',
    name: '顾临',
    role: '维修局主管',
    color: 0x4A9EFF,
    size: { w: 48, h: 64 },
  },
  'songlan': {
    id: 'songlan',
    name: '宋岚',
    role: '层下记录者',
    color: 0xFFD700,
    size: { w: 48, h: 64 },
  },
  // ... 其他角色
};
```

**视觉效果**：
```
    ┌──────────┐
    │  岑回    │   ← 名称
    │  主角    │   ← 角色
    │ ┌────┐  │
    │ │ 🟢 │  │   ← 颜色标识
    │ └────┘  │
    └──────────┘
```

### 3️⃣ 物件 - 文字 Billboard + 类型图标

```typescript
interface IObjectBillboard {
  id: string;
  name: string;
  type: 'interactable' | 'decoration' | 'trigger' | 'blocker';
  icon: string;         // 简单文字图标
  size: { w: number; h: number };
  interactive: boolean;
}

const OBJECT_TYPE_ICONS = {
  'interactable': '🔍',  // 可交互
  'decoration': '📦',    // 装饰
  'trigger': '⚡',       // 触发器
  'blocker': '🚧',       // 阻挡物
  'door': '🚪',
  'item': '💎',
  'npc_spot': '💬',
};
```

**视觉效果**：
```
  ┌────────────┐
  │ 🔍 身份卡  │
  │ [可交互]   │
  └────────────┘
```

### 4️⃣ UI - 线框 SVG（运行时绘制）

```typescript
// UI组件白盒渲染
class WhiteboxUIRenderer {
  // 对话框
  drawDialogueBox(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const g = scene.add.graphics();
    // 外框
    g.lineStyle(2, 0xE8E6E3, 1);
    g.strokeRect(-340, -80, 680, 160);
    // 标题区域
    g.lineStyle(1, 0x686868, 1);
    g.strokeRect(-340, -80, 680, 30);
    // 标注
    const label = scene.add.text(-330, -70, '[对话框]', { fontSize: '10px', color: '#686868' });
    return scene.add.container(0, 0, [g, label]);
  }
  
  // 按钮
  drawButton(scene: Phaser.Scene, text: string, w: number, h: number): Phaser.GameObjects.Container {
    const g = scene.add.graphics();
    g.lineStyle(2, 0x00FFAA, 1);
    g.strokeRect(-w/2, -h/2, w, h);
    const label = scene.add.text(0, 0, text, { fontSize: '14px', color: '#E8E6E3' }).setOrigin(0.5);
    return scene.add.container(0, 0, [g, label]);
  }
  
  // 卡片
  drawCard(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const g = scene.add.graphics();
    g.lineStyle(2, 0xFFD700, 1);
    g.strokeRect(-150, -200, 300, 400);
    g.lineStyle(1, 0x686868, 1);
    g.strokeRect(-140, -190, 280, 50); // 标题区
    g.strokeRect(-140, -130, 280, 250); // 内容区
    g.strokeRect(-140, 130, 280, 50); // 底部
    const label = scene.add.text(0, -210, '[卡片]', { fontSize: '10px', color: '#686868' }).setOrigin(0.5);
    return scene.add.container(0, 0, [g, label]);
  }
}
```

### 5️⃣ 特效 - 几何图形动画

```typescript
// 特效白盒方案
const EFFECT_WHITEBOX = {
  // 深度感知 - 蓝绿色扫描线
  'depth_perception': {
    type: 'scanline',
    color: 0x00FFAA,
    animation: 'vertical_sweep',
  },
  // 深度介入 - 紫色波纹
  'depth_intervention': {
    type: 'ripple',
    color: 0xFF00FF,
    animation: 'expand_fade',
  },
  // 时间干预 - 金色时钟圈
  'time_intervention': {
    type: 'clock',
    color: 0xFFD700,
    animation: 'rotate_pulse',
  },
  // 伤痕 - 红色裂纹
  'scar': {
    type: 'crack',
    color: 0xFF4444,
    animation: 'static_glow',
  },
};
```

---

## Billboard 文字标识系统

### 核心组件：`src/systems/whitebox/BillboardFactory.ts`

```typescript
/**
 * Billboard 工厂
 * 生成各类占位资源的文字标识
 */

import Phaser from 'phaser';
import { CURRENT_ASSET_MODE } from '@/config/assetMode.config';

export interface IBillboardConfig {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  color?: number;
  width?: number;
  height?: number;
  interactive?: boolean;
}

export class BillboardFactory {
  private _scene: Phaser.Scene;
  private _config = CURRENT_ASSET_MODE.billboard;

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
  }

  /**
   * 创建角色 Billboard
   */
  createCharacter(config: IBillboardConfig): Phaser.GameObjects.Container {
    const { name, type, color = 0x00FFAA, width = 60, height = 80 } = config;
    
    const container = this._scene.add.container(0, 0);
    
    // 边界框
    if (this._config.showBoundingBox) {
      const border = this._scene.add.graphics();
      border.lineStyle(2, color, 1);
      border.strokeRect(-width/2, -height/2, width, height);
      border.fillStyle(color, 0.1);
      border.fillRect(-width/2, -height/2, width, height);
      container.add(border);
    }
    
    // 名称
    const nameText = this._scene.add.text(0, -height/2 - 20, name, {
      fontSize: `${this._config.fontSize}px`,
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(nameText);
    
    // 类型标签
    if (this._config.showTypeLabel) {
      const typeText = this._scene.add.text(0, -height/2 - 5, `[${type}]`, {
        fontSize: '10px',
        color: '#686868',
      }).setOrigin(0.5);
      container.add(typeText);
    }
    
    // 颜色标识点
    const dot = this._scene.add.graphics();
    dot.fillStyle(color, 1);
    dot.fillCircle(0, 0, 8);
    container.add(dot);
    
    // 设置尺寸供物理系统使用
    container.setSize(width, height);
    container.setData('billboardConfig', config);
    
    return container;
  }

  /**
   * 创建物件 Billboard
   */
  createObject(config: IBillboardConfig): Phaser.GameObjects.Container {
    const { 
      name, 
      type, 
      subtype,
      color = 0xFFFFFF, 
      width = 50, 
      height = 50,
      interactive = false,
    } = config;
    
    const container = this._scene.add.container(0, 0);
    
    // 获取类型图标
    const icon = this._getObjectIcon(type, subtype);
    
    // 背景
    const bg = this._scene.add.graphics();
    bg.fillStyle(0x1E1E24, this._config.bgAlpha);
    bg.fillRoundedRect(-width/2, -height/2, width, height, 6);
    
    // 边框（交互物件用强调色）
    const borderColor = interactive ? 0x00FFAA : 0x3A3A40;
    bg.lineStyle(interactive ? 2 : 1, borderColor, 1);
    bg.strokeRoundedRect(-width/2, -height/2, width, height, 6);
    container.add(bg);
    
    // 图标
    const iconText = this._scene.add.text(0, -5, icon, {
      fontSize: '18px',
    }).setOrigin(0.5);
    container.add(iconText);
    
    // 名称
    const nameText = this._scene.add.text(0, height/2 + 10, name, {
      fontSize: '11px',
      color: '#A8A6A3',
    }).setOrigin(0.5);
    container.add(nameText);
    
    // 类型标签
    if (this._config.showTypeLabel) {
      const typeLabel = this._scene.add.text(0, -height/2 - 8, `[${type}]`, {
        fontSize: '9px',
        color: '#686868',
      }).setOrigin(0.5);
      container.add(typeLabel);
    }
    
    container.setSize(width, height);
    container.setData('billboardConfig', config);
    
    return container;
  }

  /**
   * 创建背景（带区域标注）
   */
  createBackground(zoneId: string, zoneName: string, zoneType: string): Phaser.GameObjects.Container {
    const { width, height } = this._scene.scale;
    const container = this._scene.add.container(0, 0);
    
    // 背景色
    const colors = this._getZoneColors(zoneType);
    const bg = this._scene.add.graphics();
    bg.fillStyle(colors.bg, 1);
    bg.fillRect(0, 0, width, height);
    container.add(bg);
    
    // 边界线
    const border = this._scene.add.graphics();
    border.lineStyle(4, colors.border, 1);
    border.strokeRect(20, 20, width - 40, height - 40);
    container.add(border);
    
    // Zone信息
    const zoneInfo = this._scene.add.text(30, 30, `${zoneId}\n${zoneName}\n[${zoneType}]`, {
      fontSize: '12px',
      color: '#686868',
      lineSpacing: 4,
    });
    container.add(zoneInfo);
    
    // 网格（可选）
    if (CURRENT_ASSET_MODE.debug.showGrid) {
      const grid = this._scene.add.graphics();
      grid.lineStyle(1, colors.border, 0.2);
      const gridSize = 100;
      for (let x = gridSize; x < width; x += gridSize) {
        grid.moveTo(x, 0);
        grid.lineTo(x, height);
      }
      for (let y = gridSize; y < height; y += gridSize) {
        grid.moveTo(0, y);
        grid.lineTo(width, y);
      }
      grid.strokePath();
      container.add(grid);
    }
    
    return container;
  }

  private _getObjectIcon(type: string, subtype?: string): string {
    const icons: Record<string, string> = {
      'interactable': '🔍',
      'decoration': '📦',
      'trigger': '⚡',
      'blocker': '🚧',
      'door': '🚪',
      'item': '💎',
      'npc_spot': '💬',
      'card': '📄',
      'save_point': '💾',
      'exit': '🚶',
      // 场景物件
      'bed': '🛏️',
      'desk': '🪑',
      'lamp': '💡',
      'plant': '🌱',
      'bookshelf': '📚',
      'monitor': '🖥️',
      'altar': '⛩️',
      'crack': '💔',
    };
    return icons[subtype || type] || '❓';
  }

  private _getZoneColors(zoneType: string): { bg: number; border: number } {
    const colors: Record<string, { bg: number; border: number }> = {
      'life': { bg: 0x2D2D33, border: 0x4A4A52 },
      'municipal': { bg: 0x1E2836, border: 0x3A5070 },
      'archive': { bg: 0x2D2818, border: 0x5A5030 },
      'clinic': { bg: 0x1E2D2D, border: 0x305A5A },
      'temple': { bg: 0x2D2818, border: 0x5A5030 },
      'edge': { bg: 0x2D1E1E, border: 0x5A3030 },
      'anomaly': { bg: 0x251E2D, border: 0x4A3060 },
    };
    return colors[zoneType] || { bg: 0x1E1E24, border: 0x3A3A40 };
  }
}
```

---

## 资源切换机制

### 资源加载器适配：`src/systems/assets/AssetResolver.ts`

```typescript
/**
 * 资源解析器
 * 根据当前模式返回正式资源或白盒占位
 */

import { CURRENT_ASSET_MODE, AssetMode } from '@/config/assetMode.config';
import { BillboardFactory, IBillboardConfig } from '@/systems/whitebox/BillboardFactory';

export class AssetResolver {
  private _billboardFactory: BillboardFactory | null = null;

  /**
   * 初始化（需要在Scene中调用）
   */
  init(scene: Phaser.Scene): void {
    if (CURRENT_ASSET_MODE.mode !== AssetMode.PRODUCTION) {
      this._billboardFactory = new BillboardFactory(scene);
    }
  }

  /**
   * 解析背景资源
   */
  resolveBackground(
    scene: Phaser.Scene,
    zoneId: string,
    zoneName: string,
    zoneType: string,
    productionKey: string
  ): Phaser.GameObjects.GameObject {
    // 检查是否使用正式资源
    if (CURRENT_ASSET_MODE.useProductionAssets.backgrounds && scene.textures.exists(productionKey)) {
      return scene.add.image(0, 0, productionKey).setOrigin(0);
    }
    
    // 使用白盒背景
    return this._billboardFactory!.createBackground(zoneId, zoneName, zoneType);
  }

  /**
   * 解析角色资源
   */
  resolveCharacter(
    scene: Phaser.Scene,
    config: IBillboardConfig,
    productionKey: string
  ): Phaser.GameObjects.GameObject {
    if (CURRENT_ASSET_MODE.useProductionAssets.characters && scene.textures.exists(productionKey)) {
      return scene.add.sprite(0, 0, productionKey);
    }
    
    return this._billboardFactory!.createCharacter(config);
  }

  /**
   * 解析物件资源
   */
  resolveObject(
    scene: Phaser.Scene,
    config: IBillboardConfig,
    productionKey: string
  ): Phaser.GameObjects.GameObject {
    if (CURRENT_ASSET_MODE.useProductionAssets.objects && scene.textures.exists(productionKey)) {
      return scene.add.image(0, 0, productionKey);
    }
    
    return this._billboardFactory!.createObject(config);
  }

  /**
   * 检查当前是否为白盒模式
   */
  isWhiteboxMode(): boolean {
    return CURRENT_ASSET_MODE.mode === AssetMode.WHITEBOX;
  }
}

export const assetResolver = new AssetResolver();
```

---

## 开发流程

### Phase 1: 白盒基础搭建（1-2周）

```
目标：完整跑通 C0 序章 + C1 第1章功能
```

#### 步骤清单

- [ ] 1.1 创建 `assetMode.config.ts` 配置文件
- [ ] 1.2 实现 `BillboardFactory` 核心类
- [ ] 1.3 实现 `AssetResolver` 资源解析器
- [ ] 1.4 修改 `SceneAssembler` 支持白盒模式
- [ ] 1.5 修改 `GameScene` 集成资源解析器
- [ ] 1.6 创建白盒 UI 渲染器
- [ ] 1.7 测试 C0-Z1 到 C0-Z4 全流程

### Phase 2: 功能验证（2-3周）

```
目标：验证核心玩法系统
```

- [ ] 2.1 对话系统完整流程
- [ ] 2.2 卡片收集系统
- [ ] 2.3 R/P/W 计数器联动
- [ ] 2.4 深度感知能力（C2解锁）
- [ ] 2.5 深度介入能力（C3解锁）
- [ ] 2.6 时间干预能力（C4解锁）
- [ ] 2.7 伏笔触发与回收
- [ ] 2.8 存档/读档流程
- [ ] 2.9 Zone 过渡系统

### Phase 3: 内容填充（3-4周）

```
目标：完成全部 Zone 白盒版本
```

- [ ] 3.1 C0 序章（4 Zones）
- [ ] 3.2 C1 第1章（6 Zones）
- [ ] 3.3 C2 第2章（7 Zones）
- [ ] 3.4 C3 第3章（7 Zones）
- [ ] 3.5 C4 第4章（8 Zones）
- [ ] 3.6 C5 第5章（7 Zones）
- [ ] 3.7 CF 终章（6 Zones）
- [ ] 3.8 RV 重返变体（12 Zones）

### Phase 4: 正式资源替换（持续）

```
目标：逐步替换正式美术资源
```

替换优先级：
1. **背景** → 视觉冲击最大
2. **角色头像** → 对话沉浸感
3. **角色精灵** → 场景表现力
4. **UI** → 完整体验
5. **物件** → 细节打磨
6. **特效** → 能力表现力

---

## 里程碑计划

### M1: 白盒可玩版（2周）

```
交付物：
- C0-C1 完整可玩
- 核心对话系统
- 基础移动和交互
- 存档功能
```

### M2: 功能完整版（4周）

```
交付物：
- 全章节白盒流程可跑通
- 三种能力完整实现
- R/P/W 系统联动
- 卡片收集系统
- 三结局触发条件
```

### M3: 美术替换版（6周）

```
交付物：
- 背景资源 100% 替换
- 角色资源 100% 替换
- UI 资源 80% 替换
- 音频资源 100% 替换
```

### M4: 发布版（8周）

```
交付物：
- 全部资源正式版
- 性能优化
- Bug 修复
- 测试通过
```

---

## 附录：白盒颜色参考

```typescript
// 角色标识色
const CHARACTER_COLORS = {
  cenhui: 0x00FFAA,    // 主角 - 标志绿
  gulin: 0x4A9EFF,     // 顾临 - 冷静蓝
  songlan: 0xFFD700,   // 宋岚 - 档案金
  xucheng: 0x00CED1,   // 许澄 - 医疗青
  atang: 0xFF69B4,     // 阿棠 - 漂移粉
  muping: 0x9370DB,    // 牧平 - 神秘紫
  qilan: 0x98FB98,     // 栖蓝 - 温暖绿
  chenjiang: 0xFFA500, // 陈匠 - 灯火橙
};

// UI 元素颜色
const UI_COLORS = {
  border: 0x3A3A40,
  borderHover: 0x00FFAA,
  borderActive: 0xFFD700,
  text: 0xE8E6E3,
  textMuted: 0x686868,
  bgPanel: 0x1E1E24,
  bgButton: 0x2D2D33,
};
```

---

*文档版本: v1.0 | 更新日期: 2025-12-26*

