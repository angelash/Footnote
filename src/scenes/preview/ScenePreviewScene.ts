/**
 * 场景预览场景 (Prefab 模式)
 * 
 * 使用 SceneAssembler 组装完整场景，展示：
 * - 背景（正式资源或白盒占位）
 * - 所有物件（位置、碰撞区域、交互类型）
 * - 交互点标记
 * - 动画物件
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { ZONES, ChapterId, getZonesByChapter } from '@/config/zones.config';
import { getSceneConfig, getAllZoneIds } from '@/data/scenes';
import { SceneAssembler } from '@/systems/scene/SceneAssembler';
import { assetResolver } from '@/systems/whitebox/AssetResolver';
import type { ISceneConfig, IAssembledScene, ISceneAction } from '@/types/scene';

// 章节配置
const CHAPTERS = [
  { id: ChapterId.C0, name: '序章 (C0)', color: '#4A9EFF' },
  { id: ChapterId.C1, name: '第1章 (C1)', color: '#00CC66' },
  { id: ChapterId.C2, name: '第2章 (C2)', color: '#FFD700' },
  { id: ChapterId.C3, name: '第3章 (C3)', color: '#FF6600' },
  { id: ChapterId.C4, name: '第4章 (C4)', color: '#FF4444' },
  { id: ChapterId.C5, name: '第5章 (C5)', color: '#9933FF' },
  { id: ChapterId.CF, name: '终章 (CF)', color: '#00FFAA' },
];

// 显示模式
type DisplayMode = 'list' | 'prefab';

export class ScenePreviewScene extends BasePreviewScene {
  protected title = '🏠 场景预览';
  protected subtitle = '使用 SceneAssembler 组装完整场景 Prefab';

  // 场景组装器
  private _sceneAssembler!: SceneAssembler;
  private _assembledScene: IAssembledScene | null = null;

  // 预览相关
  private _previewContainer!: Phaser.GameObjects.Container;
  private _prefabViewContainer!: Phaser.GameObjects.Container;
  private _currentZoneId: string | null = null;
  private _displayMode: DisplayMode = 'list';

  // 调试覆盖层
  private _debugOverlay!: Phaser.GameObjects.Container;
  private _showDebugInfo = true;

  // 交互信息面板
  private _interactionPanel!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'ScenePreviewScene' });
  }

  create(): void {
    super.create();

    // 初始化资源解析器
    if (!assetResolver.isInitialized()) {
      assetResolver.init(this);
    }

    // 创建场景组装器
    this._sceneAssembler = new SceneAssembler(this, {
      onAction: (action, objectId) => this._handlePreviewAction(action, objectId),
    });

    // Prefab视图容器（在contentContainer之上）
    this._prefabViewContainer = this.add.container(0, 0);
    this._prefabViewContainer.setDepth(100);
    this._prefabViewContainer.setVisible(false);

    // 调试信息覆盖层
    this._debugOverlay = this.add.container(0, 0);
    this._debugOverlay.setDepth(150);
    this._debugOverlay.setVisible(false);

    // 交互信息面板
    this._interactionPanel = this.add.container(0, 0);
    this._interactionPanel.setDepth(160);
    this._interactionPanel.setVisible(false);

    // 预览弹窗容器
    this._previewContainer = this.add.container(0, 0);
    this._previewContainer.setDepth(200);
    this._previewContainer.setVisible(false);
  }

  protected createContent(width: number, height: number): void {
    let currentY = 30;
    const cardWidth = 300;
    const cardHeight = 220;
    const cardPadding = 20;
    const cardsPerRow = 3;

    // 统计信息
    const totalZones = getAllZoneIds().length;
    const configuredZones = getAllZoneIds().filter(id => getSceneConfig(id) !== null).length;
    
    const stats = this.add.text(width / 2, currentY, 
      `共 ${totalZones} 个Zone | ${configuredZones} 个已配置Prefab`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#686868',
    }).setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 45;

    // 操作提示
    const hint = this.add.text(width / 2, currentY, 
      '💡 点击Zone卡片进入 Prefab 预览模式（包含物件、交互点、碰撞区域）', {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#4A9EFF',
    }).setOrigin(0.5);
    this.contentContainer.add(hint);
    currentY += 50;

    // 按章节分类显示
    CHAPTERS.forEach((chapter) => {
      const zones = getZonesByChapter(chapter.id);
      if (zones.length === 0) return;

      // 章节标题
      const sectionTitle = this.createSectionTitle(40, currentY, `${chapter.name} (${zones.length}个)`);
      sectionTitle.setColor(chapter.color);
      this.contentContainer.add(sectionTitle);
      currentY += 50;

      // Zone卡片网格
      zones.forEach((zone, index) => {
        const col = index % cardsPerRow;
        const row = Math.floor(index / cardsPerRow);
        const x = 40 + col * (cardWidth + cardPadding);
        const y = currentY + row * (cardHeight + cardPadding);

        // 检查是否有配置
        const hasConfig = getSceneConfig(zone.id) !== null;
        const card = this._createZoneCard(x, y, cardWidth, cardHeight, zone.id, zone.name, hasConfig);
        this.contentContainer.add(card);
      });

      // 计算行数
      const rows = Math.ceil(zones.length / cardsPerRow);
      currentY += rows * (cardHeight + cardPadding) + 30;

      // 分隔线
      const divider = this.createDivider(currentY, width);
      this.contentContainer.add(divider);
      currentY += 40;
    });

    this.setContentHeight(currentY);
  }

  private _createZoneCard(
    x: number,
    y: number,
    width: number,
    height: number,
    zoneId: string,
    zoneName: string,
    hasConfig: boolean
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(hasConfig ? 0x141419 : 0x0A0A0F, 1);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(1, hasConfig ? 0x2A2A30 : 0x1A1A1F, 1);
    bg.strokeRoundedRect(0, 0, width, height, 8);
    container.add(bg);

    // 配置状态图标
    const statusIcon = hasConfig ? '✅' : '⚠️';
    const statusColor = hasConfig ? '#00FFAA' : '#FFD700';
    
    // 场景预览图标（占位）
    const previewIcon = this.add.text(width / 2, (height - 40) / 2, hasConfig ? '🎬' : '📋', {
      fontSize: '48px',
    }).setOrigin(0.5);
    container.add(previewIcon);

    // 获取物件数量
    const config = getSceneConfig(zoneId);
    const objectCount = config?.objects?.length ?? 0;
    const interactiveCount = config?.objects?.filter(o => o.interactive)?.length ?? 0;

    // 物件统计
    if (hasConfig) {
      const objStats = this.add.text(width / 2, (height - 50) / 2 + 40, 
        `${objectCount}物件 | ${interactiveCount}交互`, {
        fontFamily: 'Noto Sans SC',
        fontSize: '14px',
        color: '#4A4A4A',
      }).setOrigin(0.5);
      container.add(objStats);
    }

    // Zone ID + 状态
    const idText = this.add.text(15, height - 50, `${statusIcon} ${zoneId}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '16px',
      color: statusColor,
      fontStyle: 'bold',
    });
    container.add(idText);

    // Zone名称
    const nameText = this.add.text(15, height - 25, zoneName, {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#A8A6A3',
    });
    container.add(nameText);

    // 交互
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(2, hasConfig ? 0x00FFAA : 0xFFD700, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(hasConfig ? 0x141419 : 0x0A0A0F, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(1, hasConfig ? 0x2A2A30 : 0x1A1A1F, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    });

    container.on('pointerdown', () => {
      this._enterPrefabView(zoneId);
    });

    return container;
  }

  /**
   * 进入 Prefab 视图模式
   */
  private _enterPrefabView(zoneId: string): void {
    const config = getSceneConfig(zoneId);
    const zone = ZONES[zoneId];
    
    if (!zone) return;

    this._currentZoneId = zoneId;
    this._displayMode = 'prefab';

    const { width, height } = this.scale;

    // 隐藏列表
    this.contentContainer.setVisible(false);
    this.headerContainer.setVisible(false);

    // 清理旧的组装场景
    if (this._assembledScene) {
      this._sceneAssembler.destroy(this._assembledScene);
      this._assembledScene = null;
    }

    // 清空 Prefab 视图
    this._prefabViewContainer.removeAll(true);
    this._debugOverlay.removeAll(true);

    // 背景
    const bgRect = this.add.rectangle(0, 0, width, height, 0x0A0A0F).setOrigin(0);
    this._prefabViewContainer.add(bgRect);

    // 使用 SceneAssembler 组装场景
    if (config) {
      this._assembledScene = this._sceneAssembler.build(config);
      
      // 将组装的对象添加到容器
      // 注意：SceneAssembler 直接添加到场景，我们需要调整深度
      this._assembledScene.objects.forEach(obj => {
        obj.setDepth((obj.depth ?? 0) + 10);
      });

      // 创建调试覆盖层
      this._createDebugOverlay(config);
    } else {
      // 无配置，显示提示
      const noConfigText = this.add.text(width / 2, height / 2, 
        `⚠️ Zone ${zoneId} 暂无 Prefab 配置\n\n请在 src/data/scenes/ 添加对应 YAML 文件`, {
        fontFamily: 'Noto Sans SC',
        fontSize: '16px',
        color: '#FFD700',
        align: 'center',
      }).setOrigin(0.5);
      this._prefabViewContainer.add(noConfigText);
    }

    // 顶部信息栏
    this._createPrefabHeader(zoneId, zone.name, config);

    // 底部工具栏
    this._createPrefabToolbar();

    // 显示 Prefab 视图
    this._prefabViewContainer.setVisible(true);
    this._debugOverlay.setVisible(this._showDebugInfo);
  }

  /**
   * 创建 Prefab 视图头部
   */
  private _createPrefabHeader(zoneId: string, zoneName: string, config: ISceneConfig | null): void {
    const { width } = this.scale;

    // 头部背景
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x141419, 0.95);
    headerBg.fillRect(0, 0, width, 80);
    this._prefabViewContainer.add(headerBg);

    // 返回按钮
    const backBtn = this.add.text(30, 30, '← 返回列表', {
      fontFamily: 'Noto Sans SC',
      fontSize: '18px',
      color: '#4A9EFF',
    }).setInteractive({ useHandCursor: true });
    
    backBtn.on('pointerover', () => backBtn.setColor('#00FFAA'));
    backBtn.on('pointerout', () => backBtn.setColor('#4A9EFF'));
    backBtn.on('pointerdown', () => this._exitPrefabView());
    this._prefabViewContainer.add(backBtn);

    // Zone 信息
    const zoneTitle = this.add.text(width / 2, 22, `🎬 ${zoneId} - ${zoneName}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '22px',
      color: '#00FFAA',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this._prefabViewContainer.add(zoneTitle);

    // 配置信息
    if (config) {
      const objectCount = config.objects?.length ?? 0;
      const interactiveObjects = config.objects?.filter(o => o.interactive) ?? [];
      const animatedObjects = config.objects?.filter(o => o.animation) ?? [];
      
      const statsText = this.add.text(width / 2, 52, 
        `📦 ${objectCount} 物件 | 🎯 ${interactiveObjects.length} 交互点 | 🎬 ${animatedObjects.length} 动画`, {
        fontFamily: 'Noto Sans SC',
        fontSize: '16px',
        color: '#686868',
      }).setOrigin(0.5, 0);
      this._prefabViewContainer.add(statsText);
    }

    // 调试开关
    const debugToggle = this.add.text(width - 30, 30, this._showDebugInfo ? '🔍 隐藏调试' : '🔍 显示调试', {
      fontFamily: 'Noto Sans SC',
      fontSize: '16px',
      color: '#686868',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    
    debugToggle.on('pointerover', () => debugToggle.setColor('#00FFAA'));
    debugToggle.on('pointerout', () => debugToggle.setColor('#686868'));
    debugToggle.on('pointerdown', () => {
      this._showDebugInfo = !this._showDebugInfo;
      debugToggle.setText(this._showDebugInfo ? '🔍 隐藏调试' : '🔍 显示调试');
      this._debugOverlay.setVisible(this._showDebugInfo);
    });
    this._prefabViewContainer.add(debugToggle);
  }

  /**
   * 创建调试覆盖层（显示碰撞区域、交互类型等）
   */
  private _createDebugOverlay(config: ISceneConfig): void {
    if (!config.objects) return;

    config.objects.forEach(obj => {
      // 物件边界框
      const bounds = this._estimateObjectBounds(obj);
      
      // 根据类型选择颜色
      let color = 0x444444; // 默认灰色（装饰）
      let label = '装饰';
      
      if (obj.interactive) {
        switch (obj.interactive.action?.type) {
          case 'card':
            color = 0x00FFAA;
            label = '📇 卡片';
            break;
          case 'dialogue':
            color = 0x4A9EFF;
            label = '💬 对话';
            break;
          case 'gotoZone':
            color = 0xFFD700;
            label = '🚪 传送';
            break;
          default:
            color = 0xFF6600;
            label = '🎯 交互';
        }
      }
      
      if (obj.animation) {
        color = 0xFF00FF;
        label = '🎬 动画';
      }

      // 绘制边界框
      const debugBox = this.add.graphics();
      debugBox.lineStyle(2, color, 0.8);
      debugBox.strokeRect(
        obj.x - bounds.width / 2,
        obj.y - bounds.height / 2,
        bounds.width,
        bounds.height
      );
      
      // 中心点
      debugBox.fillStyle(color, 1);
      debugBox.fillCircle(obj.x, obj.y, 4);
      
      this._debugOverlay.add(debugBox);

      // 标签
      const labelBg = this.add.graphics();
      labelBg.fillStyle(0x000000, 0.7);
      labelBg.fillRoundedRect(obj.x - 30, obj.y - bounds.height / 2 - 25, 60, 20, 4);
      this._debugOverlay.add(labelBg);

      const labelText = this.add.text(obj.x, obj.y - bounds.height / 2 - 15, label, {
        fontFamily: 'Noto Sans SC',
        fontSize: '10px',
        color: `#${color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);
      this._debugOverlay.add(labelText);

      // 物件ID
      const idText = this.add.text(obj.x, obj.y + bounds.height / 2 + 5, obj.id, {
        fontFamily: 'Noto Sans SC',
        fontSize: '9px',
        color: '#4A4A4A',
      }).setOrigin(0.5, 0);
      this._debugOverlay.add(idText);
    });

    // 图例
    this._createDebugLegend();
  }

  /**
   * 创建调试图例
   */
  private _createDebugLegend(): void {
    const { width, height } = this.scale;
    
    const legendBg = this.add.graphics();
    legendBg.fillStyle(0x141419, 0.9);
    legendBg.fillRoundedRect(width - 150, height - 180, 140, 160, 8);
    this._debugOverlay.add(legendBg);

    const legendTitle = this.add.text(width - 80, height - 170, '📋 图例', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#A8A6A3',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this._debugOverlay.add(legendTitle);

    const legends = [
      { color: 0x00FFAA, label: '📇 卡片交互' },
      { color: 0x4A9EFF, label: '💬 对话交互' },
      { color: 0xFFD700, label: '🚪 区域传送' },
      { color: 0xFF6600, label: '🎯 其他交互' },
      { color: 0xFF00FF, label: '🎬 动画物件' },
      { color: 0x444444, label: '🏛️ 装饰物件' },
    ];

    legends.forEach((item, index) => {
      const y = height - 145 + index * 22;
      
      const dot = this.add.graphics();
      dot.fillStyle(item.color, 1);
      dot.fillCircle(width - 130, y, 5);
      this._debugOverlay.add(dot);

      const text = this.add.text(width - 120, y, item.label, {
        fontFamily: 'Noto Sans SC',
        fontSize: '10px',
        color: '#A8A6A3',
      }).setOrigin(0, 0.5);
      this._debugOverlay.add(text);
    });
  }

  /**
   * 创建底部工具栏
   */
  private _createPrefabToolbar(): void {
    const { width, height } = this.scale;

    const toolbarBg = this.add.graphics();
    toolbarBg.fillStyle(0x141419, 0.95);
    toolbarBg.fillRect(0, height - 50, width, 50);
    this._prefabViewContainer.add(toolbarBg);

    // 快捷键提示
    const shortcuts = this.add.text(width / 2, height - 25, 
      'ESC 返回 | D 切换调试 | ← → 切换Zone', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#4A4A4A',
    }).setOrigin(0.5);
    this._prefabViewContainer.add(shortcuts);

    // 前一个Zone
    const prevBtn = this.add.text(100, height - 25, '← 上一个', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#686868',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    prevBtn.on('pointerover', () => prevBtn.setColor('#00FFAA'));
    prevBtn.on('pointerout', () => prevBtn.setColor('#686868'));
    prevBtn.on('pointerdown', () => this._navigateZone(-1));
    this._prefabViewContainer.add(prevBtn);

    // 下一个Zone
    const nextBtn = this.add.text(width - 100, height - 25, '下一个 →', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#686868',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    
    nextBtn.on('pointerover', () => nextBtn.setColor('#00FFAA'));
    nextBtn.on('pointerout', () => nextBtn.setColor('#686868'));
    nextBtn.on('pointerdown', () => this._navigateZone(1));
    this._prefabViewContainer.add(nextBtn);
  }

  /**
   * 退出 Prefab 视图
   */
  private _exitPrefabView(): void {
    // 清理组装的场景
    if (this._assembledScene) {
      this._sceneAssembler.destroy(this._assembledScene);
      this._assembledScene = null;
    }

    this._currentZoneId = null;
    this._displayMode = 'list';

    // 隐藏 Prefab 视图
    this._prefabViewContainer.setVisible(false);
    this._prefabViewContainer.removeAll(true);
    this._debugOverlay.setVisible(false);
    this._debugOverlay.removeAll(true);

    // 显示列表
    this.contentContainer.setVisible(true);
    this.headerContainer.setVisible(true);
  }

  /**
   * 导航到相邻Zone
   */
  private _navigateZone(direction: number): void {
    if (!this._currentZoneId) return;

    const allZones = getAllZoneIds();
    const currentIndex = allZones.indexOf(this._currentZoneId);
    
    if (currentIndex === -1) return;

    const newIndex = (currentIndex + direction + allZones.length) % allZones.length;
    this._enterPrefabView(allZones[newIndex]);
  }

  /**
   * 处理预览中的交互动作
   */
  private _handlePreviewAction(action: ISceneAction, objectId: string): void {
    // 在预览模式下显示交互信息面板
    const { width, height } = this.scale;

    // 清空旧面板
    this._interactionPanel.removeAll(true);

    // 面板背景
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x141419, 0.95);
    panelBg.fillRoundedRect(20, height - 200, width - 40, 140, 8);
    panelBg.lineStyle(2, 0x00FFAA, 1);
    panelBg.strokeRoundedRect(20, height - 200, width - 40, 140, 8);
    this._interactionPanel.add(panelBg);

    // 标题
    const title = this.add.text(40, height - 185, `🎯 交互预览 - ${objectId}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#00FFAA',
      fontStyle: 'bold',
    });
    this._interactionPanel.add(title);

    // 动作类型
    const actionType = this.add.text(40, height - 160, `类型: ${action.type}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#A8A6A3',
    });
    this._interactionPanel.add(actionType);

    // 动作详情
    let detailText = '';
    switch (action.type) {
      case 'card':
        detailText = `卡片ID: ${action.cardId}`;
        break;
      case 'dialogue':
        detailText = `说话者: ${action.speaker}\n内容: ${action.text?.slice(0, 50)}...`;
        break;
      case 'gotoZone':
        detailText = `目标Zone: ${action.zoneId}`;
        break;
    }

    const detail = this.add.text(40, height - 140, detailText, {
      fontFamily: 'Noto Sans SC',
      fontSize: '11px',
      color: '#686868',
      wordWrap: { width: width - 80 },
    });
    this._interactionPanel.add(detail);

    // 关闭按钮
    const closeBtn = this.add.text(width - 50, height - 185, '✕', {
      fontSize: '20px',
      color: '#686868',
    }).setInteractive({ useHandCursor: true });
    
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#686868'));
    closeBtn.on('pointerdown', () => this._interactionPanel.setVisible(false));
    this._interactionPanel.add(closeBtn);

    this._interactionPanel.setVisible(true);

    // 3秒后自动隐藏
    this.time.delayedCall(3000, () => {
      this._interactionPanel.setVisible(false);
    });
  }

  /**
   * 估算物件边界
   */
  private _estimateObjectBounds(obj: { scale?: number; texture?: string }): { width: number; height: number } {
    let width = 60;
    let height = 60;

    if (typeof obj.scale === 'number') {
      width *= obj.scale;
      height *= obj.scale;
    }

    return { width, height };
  }

  protected setupKeyboard(): void {
    super.setupKeyboard();

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this._interactionPanel.visible) {
        this._interactionPanel.setVisible(false);
      } else if (this._displayMode === 'prefab') {
        this._exitPrefabView();
      } else {
        this.goBack();
      }
    });

    // D键切换调试信息
    this.input.keyboard?.on('keydown-D', () => {
      if (this._displayMode === 'prefab') {
        this._showDebugInfo = !this._showDebugInfo;
        this._debugOverlay.setVisible(this._showDebugInfo);
      }
    });

    // 方向键导航
    this.input.keyboard?.on('keydown-LEFT', () => {
      if (this._displayMode === 'prefab') {
        this._navigateZone(-1);
      }
    });

    this.input.keyboard?.on('keydown-RIGHT', () => {
      if (this._displayMode === 'prefab') {
        this._navigateZone(1);
      }
    });
  }

  shutdown(): void {
    // 清理组装的场景
    if (this._assembledScene) {
      this._sceneAssembler.destroy(this._assembledScene);
      this._assembledScene = null;
    }
    
    super.shutdown();
  }
}
