/**
 * Billboard 工厂
 * 生成各类占位资源的文字标识（白盒开发模式）
 * @module systems/whitebox/BillboardFactory
 */

import Phaser from 'phaser';
import {
  CURRENT_ASSET_MODE,
  getCharacterColor,
  getZoneTypeColors,
  getObjectIcon,
} from '@/config/assetMode.config';
import { UI_FONT_SIZE } from '@/config/ui.config';

// ==================== 类型定义 ====================

export interface IBillboardConfig {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 主类型 */
  type: string;
  /** 子类型（用于选择图标） */
  subtype?: string;
  /** 标识颜色 */
  color?: number;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 是否可交互 */
  interactive?: boolean;
  /** 额外描述 */
  description?: string;
}

export interface ICharacterBillboardConfig extends IBillboardConfig {
  /** 角色ID */
  characterId: string;
  /** 角色定位 */
  role?: string;
  /** 当前表情 */
  expression?: string;
}

export interface IZoneBillboardConfig {
  /** Zone ID (如 C0-Z1) */
  zoneId: string;
  /** Zone 名称 */
  zoneName: string;
  /** Zone 类型 */
  zoneType: string;
  /** 章节 */
  chapter?: string;
  /** 地标点 */
  landmarks?: Array<{ x: number; y: number; label: string }>;
}

// ==================== BillboardFactory 类 ====================

/**
 * Billboard 工厂类
 * 负责创建各类白盒占位资源
 */
export class BillboardFactory {
  private _scene: Phaser.Scene;
  private _config = CURRENT_ASSET_MODE.billboard;
  private _debug = CURRENT_ASSET_MODE.debug;

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
  }

  // ==================== 角色 Billboard ====================

  /**
   * 创建角色 Billboard
   * 显示：名称、角色定位、颜色标识点
   */
  createCharacter(config: ICharacterBillboardConfig): Phaser.GameObjects.Container {
    const { name, characterId, role = '角色', color, width = 60, height = 80 } = config;

    const actualColor = color ?? getCharacterColor(characterId);
    const container = this._scene.add.container(0, 0);
    container.setName(`billboard_char_${config.id}`);

    // 边界框
    if (this._config.showBoundingBox) {
      const border = this._scene.add.graphics();
      border.lineStyle(2, actualColor, 1);
      border.strokeRect(-width / 2, -height / 2, width, height);
      border.fillStyle(actualColor, 0.15);
      border.fillRect(-width / 2, -height / 2, width, height);
      container.add(border);
    }

    // 名称标签
    const nameText = this._scene.add
      .text(0, -height / 2 - 24, name, {
        fontSize: `${this._config.fontSize}px`,
        color: `#${actualColor.toString(16).padStart(6, '0')}`,
        fontStyle: 'bold',
        fontFamily: 'Noto Sans SC, sans-serif',
      })
      .setOrigin(0.5);
    container.add(nameText);

    // 角色定位标签
    if (this._config.showTypeLabel && role) {
      const roleText = this._scene.add
        .text(0, -height / 2 - 8, `[${role}]`, {
          fontSize: UI_FONT_SIZE.TINY,
          color: '#686868',
          fontFamily: 'Noto Sans SC, sans-serif',
        })
        .setOrigin(0.5);
      container.add(roleText);
    }

    // 颜色标识点（中心）
    const dot = this._scene.add.graphics();
    dot.fillStyle(actualColor, 1);
    dot.fillCircle(0, 0, 10);
    dot.lineStyle(2, 0xffffff, 0.3);
    dot.strokeCircle(0, 0, 10);
    container.add(dot);

    // 角色首字母
    const initial = this._scene.add
      .text(0, 0, name.charAt(0), {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#000000',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    container.add(initial);

    // 设置尺寸供物理系统使用
    container.setSize(width, height);
    container.setData('billboardConfig', config);
    container.setData('billboardType', 'character');

    return container;
  }

  // ==================== 物件 Billboard ====================

  /**
   * 创建物件 Billboard
   * 显示：图标、名称、类型标签
   */
  createObject(config: IBillboardConfig): Phaser.GameObjects.Container {
    const {
      id,
      name,
      type,
      subtype,
      color = 0xffffff,
      width = 50,
      height = 50,
      interactive = false,
    } = config;

    const icon = getObjectIcon(type, subtype);
    const container = this._scene.add.container(0, 0);
    container.setName(`billboard_obj_${id}`);

    // 背景
    const bg = this._scene.add.graphics();
    bg.fillStyle(0x1e1e24, this._config.bgAlpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);

    // 边框（交互物件用强调色）
    const borderColor = interactive ? 0x00ffaa : color;
    const borderWidth = interactive ? 2 : 1;
    bg.lineStyle(borderWidth, borderColor, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
    container.add(bg);

    // 图标
    const iconText = this._scene.add
      .text(0, -5, icon, {
        fontSize: UI_FONT_SIZE.NORMAL,
      })
      .setOrigin(0.5);
    container.add(iconText);

    // 名称（在下方）
    const nameText = this._scene.add
      .text(0, height / 2 + 12, name, {
        fontSize: UI_FONT_SIZE.TINY,
        color: interactive ? '#00FFAA' : '#A8A6A3',
        fontFamily: 'Noto Sans SC, sans-serif',
      })
      .setOrigin(0.5);
    container.add(nameText);

    // 类型标签
    if (this._config.showTypeLabel) {
      const typeLabel = this._scene.add
        .text(0, -height / 2 - 10, `[${type}]`, {
          fontSize: UI_FONT_SIZE.TINY,
          color: '#686868',
          fontFamily: 'Noto Sans SC, sans-serif',
        })
        .setOrigin(0.5);
      container.add(typeLabel);
    }

    // 交互提示
    if (interactive && this._debug.showInteractZones) {
      const interactHint = this._scene.add.graphics();
      interactHint.lineStyle(1, 0x00ffaa, 0.5);
      interactHint.strokeCircle(0, 0, Math.max(width, height) * 0.8);
      container.add(interactHint);

      // 呼吸动画
      this._scene.tweens.add({
        targets: interactHint,
        alpha: 0.2,
        scale: 1.1,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    container.setSize(width, height);
    container.setData('billboardConfig', config);
    container.setData('billboardType', 'object');

    return container;
  }

  // ==================== 背景 Billboard ====================

  /**
   * 创建白盒背景
   * 显示：Zone信息、区域颜色、网格、地标点
   */
  createBackground(config: IZoneBillboardConfig): Phaser.GameObjects.Container {
    const { zoneId, zoneName, zoneType, chapter, landmarks = [] } = config;
    const { width, height } = this._scene.scale;
    const colors = getZoneTypeColors(zoneType);

    const container = this._scene.add.container(0, 0);
    container.setName(`billboard_bg_${zoneId}`);

    // 背景填充
    const bg = this._scene.add.graphics();
    bg.fillStyle(colors.bg, 1);
    bg.fillRect(0, 0, width, height);
    container.add(bg);

    // 边界框
    if (this._debug.showZoneBounds) {
      const border = this._scene.add.graphics();
      border.lineStyle(4, colors.border, 1);
      border.strokeRect(20, 20, width - 40, height - 40);
      container.add(border);

      // 角落装饰
      const corners = [
        [24, 24],
        [width - 24, 24],
        [24, height - 24],
        [width - 24, height - 24],
      ];
      corners.forEach(([cx, cy]) => {
        border.fillStyle(colors.border, 1);
        border.fillRect(cx - 4, cy - 4, 8, 8);
      });
    }

    // Zone 信息面板
    const infoPanel = this._scene.add.graphics();
    infoPanel.fillStyle(0x0a0a0f, 0.8);
    infoPanel.fillRoundedRect(25, 25, 200, 80, 8);
    infoPanel.lineStyle(1, colors.border, 1);
    infoPanel.strokeRoundedRect(25, 25, 200, 80, 8);
    container.add(infoPanel);

    // Zone 信息文字
    const chapterLabel = chapter ? `${chapter} / ` : '';
    const zoneInfo = this._scene.add.text(
      35,
      35,
      `${chapterLabel}${zoneId}\n${zoneName}\n[${zoneType}]`,
      {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#686868',
        lineSpacing: 6,
        fontFamily: 'Noto Sans SC, sans-serif',
      }
    );
    container.add(zoneInfo);

    // 网格
    if (this._debug.showGrid) {
      const grid = this._scene.add.graphics();
      grid.lineStyle(1, colors.border, 0.15);
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

      // 坐标标签
      for (let x = gridSize; x < width; x += gridSize * 2) {
        const label = this._scene.add
          .text(x, height - 15, `${x}`, {
            fontSize: UI_FONT_SIZE.TINY,
            color: '#444444',
          })
          .setOrigin(0.5);
        container.add(label);
      }
      for (let y = gridSize; y < height; y += gridSize * 2) {
        const label = this._scene.add
          .text(15, y, `${y}`, {
            fontSize: UI_FONT_SIZE.TINY,
            color: '#444444',
          })
          .setOrigin(0.5);
        container.add(label);
      }
    }

    // 地标点
    landmarks.forEach((landmark) => {
      const marker = this._createLandmarkMarker(landmark.x, landmark.y, landmark.label);
      container.add(marker);
    });

    container.setData('billboardConfig', config);
    container.setData('billboardType', 'background');

    return container;
  }

  // ==================== UI 组件 Billboard ====================

  /**
   * 创建线框对话框
   */
  createDialogueBox(x: number, y: number): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);
    const boxWidth = 680;
    const boxHeight = 160;

    const g = this._scene.add.graphics();

    // 外框
    g.lineStyle(2, 0xe8e6e3, 1);
    g.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);

    // 说话者区域
    g.lineStyle(1, 0x686868, 0.5);
    g.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, 30);

    // 对角线装饰
    g.lineStyle(1, 0x686868, 0.3);
    g.moveTo(-boxWidth / 2 + 10, -boxHeight / 2 + 10);
    g.lineTo(-boxWidth / 2 + 30, -boxHeight / 2 + 10);
    g.moveTo(-boxWidth / 2 + 10, -boxHeight / 2 + 10);
    g.lineTo(-boxWidth / 2 + 10, -boxHeight / 2 + 30);
    g.strokePath();

    container.add(g);

    // 标注
    const label = this._scene.add
      .text(-boxWidth / 2 + 10, -boxHeight / 2 - 15, '[对话框]', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#686868',
      })
      .setOrigin(0, 1);
    container.add(label);

    container.setData('billboardType', 'ui_dialogue');
    return container;
  }

  /**
   * 创建线框按钮
   */
  createButton(
    text: string,
    width: number = 120,
    height: number = 40,
    highlighted: boolean = false
  ): Phaser.GameObjects.Container {
    const container = this._scene.add.container(0, 0);
    const color = highlighted ? 0x00ffaa : 0xe8e6e3;

    const g = this._scene.add.graphics();
    g.lineStyle(2, color, 1);
    g.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    if (highlighted) {
      g.fillStyle(color, 0.1);
      g.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    }

    container.add(g);

    const label = this._scene.add
      .text(0, 0, text, {
        fontSize: UI_FONT_SIZE.TINY,
        color: `#${color.toString(16).padStart(6, '0')}`,
        fontFamily: 'Noto Sans SC, sans-serif',
      })
      .setOrigin(0.5);
    container.add(label);

    container.setSize(width, height);
    container.setData('billboardType', 'ui_button');
    return container;
  }

  /**
   * 创建线框卡片
   */
  createCard(width: number = 300, height: number = 400): Phaser.GameObjects.Container {
    const container = this._scene.add.container(0, 0);

    const g = this._scene.add.graphics();

    // 外框
    g.lineStyle(2, 0xffd700, 1);
    g.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);

    // 标题区
    g.lineStyle(1, 0x686868, 0.5);
    g.strokeRect(-width / 2 + 10, -height / 2 + 10, width - 20, 50);

    // 内容区
    g.strokeRect(-width / 2 + 10, -height / 2 + 70, width - 20, height - 140);

    // 底部区
    g.strokeRect(-width / 2 + 10, height / 2 - 60, width - 20, 50);

    container.add(g);

    // 标注
    const label = this._scene.add
      .text(0, -height / 2 - 15, '[卡片]', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#686868',
      })
      .setOrigin(0.5, 1);
    container.add(label);

    container.setData('billboardType', 'ui_card');
    return container;
  }

  /**
   * 创建线框面板
   */
  createPanel(width: number, height: number, title?: string): Phaser.GameObjects.Container {
    const container = this._scene.add.container(0, 0);

    const g = this._scene.add.graphics();

    // 背景
    g.fillStyle(0x0a0a0f, 0.9);
    g.fillRoundedRect(-width / 2, -height / 2, width, height, 8);

    // 外框
    g.lineStyle(2, 0x3a3a40, 1);
    g.strokeRoundedRect(-width / 2, -height / 2, width, height, 8);

    // 标题栏
    if (title) {
      g.lineStyle(1, 0x3a3a40, 0.5);
      g.moveTo(-width / 2 + 10, -height / 2 + 40);
      g.lineTo(width / 2 - 10, -height / 2 + 40);
      g.strokePath();

      const titleText = this._scene.add
        .text(0, -height / 2 + 20, title, {
          fontSize: UI_FONT_SIZE.TINY,
          color: '#E8E6E3',
          fontFamily: 'Noto Sans SC, sans-serif',
        })
        .setOrigin(0.5);
      container.add(titleText);
    }

    container.add(g);
    container.setData('billboardType', 'ui_panel');
    return container;
  }

  // ==================== 特效 Billboard ====================

  /**
   * 创建白盒特效（简单几何动画）
   */
  createEffect(effectType: string, x: number, y: number): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);

    switch (effectType) {
      case 'depth_perception':
        this._createScanlineEffect(container);
        break;
      case 'depth_intervention':
        this._createRippleEffect(container);
        break;
      case 'time_intervention':
        this._createClockEffect(container);
        break;
      case 'scar':
        this._createScarEffect(container);
        break;
      default:
        this._createGenericEffect(container);
    }

    container.setData('billboardType', 'effect');
    container.setData('effectType', effectType);
    return container;
  }

  // ==================== 私有辅助方法 ====================

  private _createLandmarkMarker(x: number, y: number, label: string): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);

    // 标记点
    const marker = this._scene.add.graphics();
    marker.fillStyle(0x00ffaa, 0.5);
    marker.fillCircle(0, 0, 15);
    marker.lineStyle(2, 0x00ffaa, 1);
    marker.strokeCircle(0, 0, 15);
    container.add(marker);

    // 标签
    const text = this._scene.add
      .text(0, 25, label, {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#00FFAA',
        fontFamily: 'Noto Sans SC, sans-serif',
      })
      .setOrigin(0.5, 0);
    container.add(text);

    return container;
  }

  private _createScanlineEffect(container: Phaser.GameObjects.Container): void {
    const { height } = this._scene.scale;
    const line = this._scene.add.graphics();
    line.lineStyle(2, 0x00ffaa, 0.8);
    line.moveTo(-400, 0);
    line.lineTo(400, 0);
    line.strokePath();
    container.add(line);

    // 上下扫描动画
    this._scene.tweens.add({
      targets: container,
      y: { from: 0, to: height },
      duration: 2000,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 标签
    const label = this._scene.add
      .text(0, -20, '[深度感知]', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#00FFAA',
      })
      .setOrigin(0.5);
    container.add(label);
  }

  private _createRippleEffect(container: Phaser.GameObjects.Container): void {
    for (let i = 0; i < 3; i++) {
      const ring = this._scene.add.graphics();
      ring.lineStyle(2, 0xff00ff, 0.8);
      ring.strokeCircle(0, 0, 30);
      container.add(ring);

      this._scene.tweens.add({
        targets: ring,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 1500,
        delay: i * 500,
        repeat: -1,
      });
    }

    // 标签
    const label = this._scene.add
      .text(0, 60, '[深度介入]', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#FF00FF',
      })
      .setOrigin(0.5);
    container.add(label);
  }

  private _createClockEffect(container: Phaser.GameObjects.Container): void {
    const clock = this._scene.add.graphics();
    clock.lineStyle(3, 0xffd700, 1);
    clock.strokeCircle(0, 0, 40);

    // 时针
    clock.lineStyle(2, 0xffd700, 1);
    clock.moveTo(0, 0);
    clock.lineTo(0, -25);
    clock.moveTo(0, 0);
    clock.lineTo(15, 0);
    clock.strokePath();

    container.add(clock);

    // 旋转动画
    this._scene.tweens.add({
      targets: clock,
      angle: -360,
      duration: 2000,
      repeat: -1,
      ease: 'Linear',
    });

    // 标签
    const label = this._scene.add
      .text(0, 55, '[时间干预]', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#FFD700',
      })
      .setOrigin(0.5);
    container.add(label);
  }

  private _createScarEffect(container: Phaser.GameObjects.Container): void {
    const crack = this._scene.add.graphics();
    crack.lineStyle(3, 0xff4444, 1);
    // 锯齿状裂纹
    crack.moveTo(-30, -20);
    crack.lineTo(-10, 0);
    crack.lineTo(5, -15);
    crack.lineTo(20, 5);
    crack.lineTo(30, -10);
    crack.strokePath();

    container.add(crack);

    // 脉动发光
    this._scene.tweens.add({
      targets: crack,
      alpha: { from: 1, to: 0.5 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // 标签
    const label = this._scene.add
      .text(0, 25, '[伤痕]', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#FF4444',
      })
      .setOrigin(0.5);
    container.add(label);
  }

  private _createGenericEffect(container: Phaser.GameObjects.Container): void {
    const shape = this._scene.add.graphics();
    shape.lineStyle(2, 0x4a9eff, 1);
    shape.strokeCircle(0, 0, 25);
    shape.fillStyle(0x4a9eff, 0.2);
    shape.fillCircle(0, 0, 25);
    container.add(shape);

    this._scene.tweens.add({
      targets: shape,
      alpha: { from: 1, to: 0.3 },
      scale: { from: 1, to: 1.2 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    const label = this._scene.add
      .text(0, 35, '[特效]', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#4A9EFF',
      })
      .setOrigin(0.5);
    container.add(label);
  }
}
