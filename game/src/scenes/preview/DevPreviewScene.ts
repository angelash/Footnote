/**
 * 开发预览入口场景
 *
 * 提供资源预览的统一入口，支持：
 * - 场景预览（Zone背景+物件布局）
 * - 角色预览（8角色×多种表情）
 * - 动画预览（可动物件动画帧）
 * - UI预览（面板、按钮、图标）
 * - 特效预览（能力/系统/环境特效）
 * - 音频预览（BGM/环境音/音效）
 * - 卡片预览（游戏卡片系统）
 * - 对话预览（对话流程测试）
 */

import Phaser from 'phaser';

// 预览类型
export type PreviewType =
  | 'scene' // 场景预览
  | 'object' // 物件预览
  | 'character' // 角色预览
  | 'animation' // 动画预览
  | 'ui' // UI预览
  | 'effect' // 特效预览
  | 'audio' // 音频预览
  | 'card' // 卡片预览
  | 'dialogue'; // 对话预览

// 预览菜单项
interface IPreviewMenuItem {
  type: PreviewType;
  label: string;
  icon: string;
  description: string;
  sceneKey: string;
}

export class DevPreviewScene extends Phaser.Scene {
  private menuItems: IPreviewMenuItem[] = [
    {
      type: 'scene',
      label: '场景预览',
      icon: '🏠',
      description: '使用 SceneAssembler 组装完整场景 Prefab',
      sceneKey: 'ScenePreviewScene',
    },
    {
      type: 'object',
      label: '物件预览',
      icon: '📦',
      description: '预览所有物件 Prefab（碰撞、交互、动画）',
      sceneKey: 'ObjectPreviewScene',
    },
    {
      type: 'character',
      label: '角色预览',
      icon: '👤',
      description: '预览8个角色的所有表情',
      sceneKey: 'CharacterPreviewScene',
    },
    {
      type: 'animation',
      label: '动画预览',
      icon: '🎬',
      description: '预览可动物件动画帧',
      sceneKey: 'AnimationPreviewScene',
    },
    {
      type: 'ui',
      label: 'UI预览',
      icon: '🎨',
      description: '预览完整UI界面 Prefab（对话框、菜单、物品栏）',
      sceneKey: 'UIPreviewScene',
    },
    {
      type: 'effect',
      label: '特效预览',
      icon: '✨',
      description: '预览能力/系统/环境特效',
      sceneKey: 'EffectPreviewScene',
    },
    {
      type: 'audio',
      label: '音频预览',
      icon: '🔊',
      description: '预览BGM/环境音/音效',
      sceneKey: 'AudioPreviewScene',
    },
    {
      type: 'card',
      label: '卡片预览',
      icon: '🃏',
      description: '预览游戏卡片系统',
      sceneKey: 'CardPreviewScene',
    },
    {
      type: 'dialogue',
      label: '对话预览',
      icon: '💬',
      description: '测试对话流程',
      sceneKey: 'DialoguePreviewScene',
    },
  ];

  private menuContainer!: Phaser.GameObjects.Container;
  private titleText!: Phaser.GameObjects.Text;
  private versionText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'DevPreviewScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // 背景渐变
    this.createBackground(width, height);

    // 标题
    this.titleText = this.add
      .text(width / 2, 100, '🛠️ 开发预览工具', {
        fontFamily: 'Noto Sans SC',
        fontSize: '56px',
        color: '#00FFAA',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // 副标题
    this.add
      .text(width / 2, 175, '《备注 / Footnote》资源预览系统', {
        fontFamily: 'Noto Sans SC',
        fontSize: '28px',
        color: '#686868',
      })
      .setOrigin(0.5);

    // 版本信息
    this.versionText = this.add
      .text(width / 2, height - 50, 'DEV v0.1.0 | 按 ESC 返回此菜单', {
        fontFamily: 'Noto Sans SC',
        fontSize: '22px',
        color: '#4A4A4A',
      })
      .setOrigin(0.5);

    // 创建菜单
    this.createMenu(width, height);

    // 键盘事件
    this.input.keyboard?.on('keydown-ESC', () => {
      // 已经在主菜单，不做任何操作
    });

    // URL参数快速跳转
    this.checkUrlParams();

    // 动画入场
    this.animateIn();
  }

  private createBackground(width: number, height: number): void {
    // 深色背景
    this.add.rectangle(0, 0, width, height, 0x0a0a0f).setOrigin(0);

    // 网格背景
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1a1a20, 0.3);

    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
    }
    graphics.strokePath();

    // 顶部装饰线
    const topLine = this.add.graphics();
    topLine.fillStyle(0x00ffaa, 0.3);
    topLine.fillRect(0, 0, width, 3);
  }

  private createMenu(width: number, _height: number): void {
    this.menuContainer = this.add.container(0, 0);

    const startY = 260;
    const itemHeight = 150;
    const itemPadding = 22;
    const itemWidth = width - 80;

    this.menuItems.forEach((item, index) => {
      const y = startY + index * (itemHeight + itemPadding);
      const menuItem = this.createMenuItem(item, width / 2, y, itemWidth, itemHeight);
      this.menuContainer.add(menuItem);
    });
  }

  private createMenuItem(
    item: IPreviewMenuItem,
    x: number,
    y: number,
    width: number,
    height: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.lineStyle(1, 0x2a2a30, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    container.add(bg);

    // 图标
    const icon = this.add.text(-width / 2 + 45, -height / 2 + 30, item.icon, {
      fontSize: '64px',
    });
    container.add(icon);

    // 标签
    const label = this.add.text(-width / 2 + 140, -height / 2 + 30, item.label, {
      fontFamily: 'Noto Sans SC',
      fontSize: '36px',
      color: '#E8E6E3',
      fontStyle: 'bold',
    });
    container.add(label);

    // 描述
    const desc = this.add.text(-width / 2 + 140, -height / 2 + 80, item.description, {
      fontFamily: 'Noto Sans SC',
      fontSize: '24px',
      color: '#686868',
    });
    container.add(desc);

    // 箭头
    const arrow = this.add
      .text(width / 2 - 50, 0, '→', {
        fontSize: '44px',
        color: '#3A3A40',
      })
      .setOrigin(0.5);
    container.add(arrow);

    // 交互
    const hitArea = new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e1e24, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
      bg.lineStyle(2, 0x00ffaa, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
      label.setColor('#00FFAA');
      arrow.setColor('#00FFAA');
      this.tweens.add({
        targets: container,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 100,
      });
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
      bg.lineStyle(1, 0x2a2a30, 1);
      bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
      label.setColor('#E8E6E3');
      arrow.setColor('#3A3A40');
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    container.on('pointerdown', () => {
      this.navigateToPreview(item);
    });

    return container;
  }

  private navigateToPreview(item: IPreviewMenuItem): void {
    // 动画过渡
    this.cameras.main.fadeOut(200, 10, 10, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(item.sceneKey);
    });
  }

  private checkUrlParams(): void {
    const params = new URLSearchParams(window.location.search);
    const previewType = params.get('preview') as PreviewType | null;

    if (previewType) {
      const item = this.menuItems.find((m) => m.type === previewType);
      if (item) {
        // 延迟跳转，让场景先完成加载
        this.time.delayedCall(100, () => {
          this.navigateToPreview(item);
        });
      }
    }
  }

  private animateIn(): void {
    // 标题动画
    this.titleText.setAlpha(0);
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      y: '-=10',
      duration: 400,
      ease: 'Power2',
    });

    // 菜单项依次入场
    this.menuContainer.list.forEach((item, index) => {
      const gameObject = item as Phaser.GameObjects.Container;
      gameObject.setAlpha(0);
      gameObject.x += 50;

      this.tweens.add({
        targets: gameObject,
        alpha: 1,
        x: '-=50',
        duration: 300,
        delay: 150 + index * 50,
        ease: 'Power2',
      });
    });
  }
}
