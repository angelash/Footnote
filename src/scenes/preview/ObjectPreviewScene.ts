/**
 * 物件预览场景 (Prefab 模式)
 * 
 * 展示所有场景物件的 Prefab 定义：
 * - 物件类型（装饰、交互、动画）
 * - 碰撞区域可视化
 * - 交互动作配置
 * - 动画参数
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { getSceneConfig, getAllZoneIds } from '@/data/scenes';
import { assetResolver } from '@/systems/whitebox/AssetResolver';
import type { ISceneObjectConfig, ISceneAction } from '@/types/scene';

// 物件分类
type ObjectCategory = 'all' | 'interactive' | 'animated' | 'decoration';

// 物件统计
interface IObjectStats {
  total: number;
  interactive: number;
  animated: number;
  decoration: number;
  byActionType: Record<string, number>;
}

// 扁平化的物件数据
interface IFlatObject {
  zoneId: string;
  zoneName: string;
  object: ISceneObjectConfig;
}

// 分页配置
const PAGE_SIZE = 20; // 每页显示物件数量（大尺寸卡片需减少数量）

export class ObjectPreviewScene extends BasePreviewScene {
  protected title = '📦 物件预览';
  protected subtitle = '预览所有场景物件 Prefab（碰撞、交互、动画）';

  // 数据
  private _allObjects: IFlatObject[] = [];
  private _filteredObjects: IFlatObject[] = [];
  private _currentCategory: ObjectCategory = 'all';

  // 分页
  private _currentPage = 0;
  private _totalPages = 1;

  // 详情面板
  private _detailPanel!: Phaser.GameObjects.Container;
  private _selectedObject: IFlatObject | null = null;

  constructor() {
    super({ key: 'ObjectPreviewScene' });
  }

  create(): void {
    // 初始化资源解析器（必须在 super.create() 之前）
    if (!assetResolver.isInitialized()) {
      assetResolver.init(this);
    }

    // 收集所有物件（必须在 super.create() 之前，因为 createContent 会使用）
    this._collectAllObjects();

    // 调用父类 create（会调用 createContent）
    super.create();

    // 详情面板
    this._detailPanel = this.add.container(0, 0);
    this._detailPanel.setDepth(200);
    this._detailPanel.setVisible(false);
  }

  protected createContent(width: number, height: number): void {
    let currentY = 30;

    // 统计信息
    const stats = this._calculateStats();
    const statsText = this.add.text(width / 2, currentY, 
      `共 ${stats.total} 个物件 | 🎯 ${stats.interactive} 交互 | 🎬 ${stats.animated} 动画 | 🏛️ ${stats.decoration} 装饰`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#686868',
    }).setOrigin(0.5);
    this.contentContainer.add(statsText);
    currentY += 50;

    // 筛选标签
    currentY = this._createFilterTabs(currentY, width);
    currentY += 30;

    // 分页信息和物件列表
    this._applyFilter();
    this._totalPages = Math.ceil(this._filteredObjects.length / PAGE_SIZE);
    
    // 分页控制器
    currentY = this._createPaginationControls(currentY, width);
    currentY += 20;

    // 物件列表（当前页）
    currentY = this._createObjectList(currentY, width);

    this.setContentHeight(currentY + 50);
  }

  /**
   * 创建分页控制器
   */
  private _createPaginationControls(startY: number, width: number): number {
    const pageInfo = this.add.text(width / 2, startY, 
      `第 ${this._currentPage + 1} / ${this._totalPages} 页 (显示 ${PAGE_SIZE} 项/页)`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#4A9EFF',
    }).setOrigin(0.5);
    this.contentContainer.add(pageInfo);

    // 上一页按钮
    if (this._currentPage > 0) {
      const prevBtn = this.add.text(width / 2 - 150, startY, '← 上一页', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#00FFAA',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      prevBtn.on('pointerover', () => prevBtn.setColor('#FFFFFF'));
      prevBtn.on('pointerout', () => prevBtn.setColor('#00FFAA'));
      prevBtn.on('pointerdown', () => {
        this._currentPage--;
        this._refreshContent();
      });
      this.contentContainer.add(prevBtn);
    }

    // 下一页按钮
    if (this._currentPage < this._totalPages - 1) {
      const nextBtn = this.add.text(width / 2 + 150, startY, '下一页 →', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#00FFAA',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      
      nextBtn.on('pointerover', () => nextBtn.setColor('#FFFFFF'));
      nextBtn.on('pointerout', () => nextBtn.setColor('#00FFAA'));
      nextBtn.on('pointerdown', () => {
        this._currentPage++;
        this._refreshContent();
      });
      this.contentContainer.add(nextBtn);
    }

    return startY + 40;
  }

  /**
   * 收集所有Zone的物件
   */
  private _collectAllObjects(): void {
    this._allObjects = [];

    const zoneIds = getAllZoneIds();
    zoneIds.forEach(zoneId => {
      const config = getSceneConfig(zoneId);
      if (!config?.objects) return;

      const zoneName = config.title || zoneId;
      
      config.objects.forEach(obj => {
        this._allObjects.push({
          zoneId,
          zoneName,
          object: obj,
        });
      });
    });

    this._filteredObjects = [...this._allObjects];
  }

  /**
   * 计算统计信息
   */
  private _calculateStats(): IObjectStats {
    const stats: IObjectStats = {
      total: this._allObjects.length,
      interactive: 0,
      animated: 0,
      decoration: 0,
      byActionType: {},
    };

    this._allObjects.forEach(item => {
      const obj = item.object;
      
      if (obj.interactive) {
        stats.interactive++;
        const actionType = obj.interactive.action?.type || 'none';
        stats.byActionType[actionType] = (stats.byActionType[actionType] || 0) + 1;
      }
      
      if (obj.animation) {
        stats.animated++;
      }
      
      if (!obj.interactive && !obj.animation) {
        stats.decoration++;
      }
    });

    return stats;
  }

  /**
   * 创建筛选标签
   */
  private _createFilterTabs(startY: number, width: number): number {
    const tabs: { id: ObjectCategory; name: string; icon: string; color: string }[] = [
      { id: 'all', name: '全部', icon: '📦', color: '#A8A6A3' },
      { id: 'interactive', name: '交互物件', icon: '🎯', color: '#00FFAA' },
      { id: 'animated', name: '动画物件', icon: '🎬', color: '#FF00FF' },
      { id: 'decoration', name: '装饰物件', icon: '🏛️', color: '#686868' },
    ];

    const tabWidth = 230;
    const tabHeight = 60;
    const totalWidth = tabs.length * tabWidth + (tabs.length - 1) * 15;
    const startX = (width - totalWidth) / 2;

    tabs.forEach((tab, index) => {
      const x = startX + index * (tabWidth + 15);
      const isActive = tab.id === this._currentCategory;

      const tabContainer = this.add.container(x, startY);
      this.contentContainer.add(tabContainer);

      // 背景
      const bg = this.add.graphics();
      if (isActive) {
        bg.fillStyle(Phaser.Display.Color.HexStringToColor(tab.color).color, 0.2);
        bg.fillRoundedRect(0, 0, tabWidth, tabHeight, 8);
      }
      bg.lineStyle(isActive ? 2 : 1, Phaser.Display.Color.HexStringToColor(tab.color).color, isActive ? 1 : 0.5);
      bg.strokeRoundedRect(0, 0, tabWidth, tabHeight, 8);
      tabContainer.add(bg);

      // 文字
      const count = this._getCountByCategory(tab.id);
      const text = this.add.text(tabWidth / 2, tabHeight / 2, `${tab.icon} ${tab.name} (${count})`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: isActive ? tab.color : '#686868',
      }).setOrigin(0.5);
      tabContainer.add(text);

      // 交互
      tabContainer.setInteractive(new Phaser.Geom.Rectangle(0, 0, tabWidth, tabHeight), Phaser.Geom.Rectangle.Contains);
      tabContainer.on('pointerdown', () => {
        if (tab.id !== this._currentCategory) {
          this._currentCategory = tab.id;
          this._currentPage = 0; // 重置到第一页
          this._refreshContent();
        }
      });
    });

    return startY + tabHeight + 15;
  }

  /**
   * 获取分类数量
   */
  private _getCountByCategory(category: ObjectCategory): number {
    switch (category) {
      case 'all':
        return this._allObjects.length;
      case 'interactive':
        return this._allObjects.filter(o => o.object.interactive).length;
      case 'animated':
        return this._allObjects.filter(o => o.object.animation).length;
      case 'decoration':
        return this._allObjects.filter(o => !o.object.interactive && !o.object.animation).length;
    }
  }

  /**
   * 应用筛选
   */
  private _applyFilter(): void {
    switch (this._currentCategory) {
      case 'all':
        this._filteredObjects = [...this._allObjects];
        break;
      case 'interactive':
        this._filteredObjects = this._allObjects.filter(o => o.object.interactive);
        break;
      case 'animated':
        this._filteredObjects = this._allObjects.filter(o => o.object.animation);
        break;
      case 'decoration':
        this._filteredObjects = this._allObjects.filter(o => !o.object.interactive && !o.object.animation);
        break;
    }
  }

  /**
   * 刷新内容
   */
  private _refreshContent(): void {
    // 重新创建场景
    this.scene.restart();
  }

  /**
   * 创建物件列表
   */
  private _createObjectList(startY: number, width: number): number {
    let currentY = startY;

    // 获取当前页的物件
    const startIndex = this._currentPage * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, this._filteredObjects.length);
    const pageObjects = this._filteredObjects.slice(startIndex, endIndex);

    // 按Zone分组
    const byZone = new Map<string, IFlatObject[]>();
    pageObjects.forEach(item => {
      const key = item.zoneId;
      if (!byZone.has(key)) {
        byZone.set(key, []);
      }
      byZone.get(key)!.push(item);
    });

    // 渲染每个Zone的物件
    byZone.forEach((objects, zoneId) => {
      const zoneName = objects[0]?.zoneName || zoneId;

      // Zone标题
      const zoneTitle = this.add.text(40, currentY, `📍 ${zoneId} - ${zoneName}`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#4A9EFF',
        fontStyle: 'bold',
      });
      this.contentContainer.add(zoneTitle);

      const countText = this.add.text(width - 40, currentY, `${objects.length} 个物件`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#4A4A4A',
      }).setOrigin(1, 0);
      this.contentContainer.add(countText);

      currentY += 45;

      // 物件卡片 - 改为2列布局，大尺寸卡片
      const cardWidth = (width - 120) / 2;
      const cardHeight = 180;

      objects.forEach((item, index) => {
        const col = index % 2;
        const row = Math.floor(index / 2);
        const x = 40 + col * (cardWidth + 20);
        const y = currentY + row * (cardHeight + 15);

        const card = this._createObjectCard(x, y, cardWidth, cardHeight, item);
        this.contentContainer.add(card);
      });

      const rows = Math.ceil(objects.length / 2);
      currentY += rows * (cardHeight + 15) + 30;

      // 分隔线
      const divider = this.createDivider(currentY, width);
      this.contentContainer.add(divider);
      currentY += 35;
    });

    return currentY;
  }

  /**
   * 创建物件卡片
   */
  private _createObjectCard(
    x: number,
    y: number,
    width: number,
    height: number,
    item: IFlatObject
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const obj = item.object;

    // 确定物件类型和颜色
    let typeIcon = '🏛️';
    let typeColor = 0x444444;
    let typeName = '装饰';

    if (obj.interactive) {
      switch (obj.interactive.action?.type) {
        case 'card':
          typeIcon = '📇';
          typeColor = 0x00FFAA;
          typeName = '卡片';
          break;
        case 'dialogue':
          typeIcon = '💬';
          typeColor = 0x4A9EFF;
          typeName = '对话';
          break;
        case 'gotoZone':
          typeIcon = '🚪';
          typeColor = 0xFFD700;
          typeName = '传送';
          break;
        default:
          typeIcon = '🎯';
          typeColor = 0xFF6600;
          typeName = '交互';
      }
    }

    if (obj.animation) {
      typeIcon = '🎬';
      typeColor = 0xFF00FF;
      typeName = '动画';
    }

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 10);
    bg.lineStyle(2, typeColor, 0.5);
    bg.strokeRoundedRect(0, 0, width, height, 10);
    container.add(bg);

    // 类型图标
    const iconBg = this.add.graphics();
    iconBg.fillStyle(typeColor, 0.2);
    iconBg.fillCircle(40, 40, 28);
    container.add(iconBg);

    const icon = this.add.text(40, 40, typeIcon, {
      fontSize: '32px',
    }).setOrigin(0.5);
    container.add(icon);

    // 物件ID
    const idText = this.add.text(85, 22, obj.id, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#E8E6E3',
      fontStyle: 'bold',
    });
    container.add(idText);

    // 类型标签
    const typeLabel = this.add.text(85, 55, typeName, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: `#${typeColor.toString(16).padStart(6, '0')}`,
    });
    container.add(typeLabel);

    // 纹理键
    const textureText = this.add.text(18, 95, `🖼️ ${obj.texture}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#686868',
    });
    textureText.setWordWrapWidth(width - 35);
    container.add(textureText);

    // 位置信息
    const posText = this.add.text(18, height - 35, `📍 (${obj.x}, ${obj.y})`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#4A4A4A',
    });
    container.add(posText);

    // 缩放信息
    if (typeof obj.scale === 'number') {
      const scaleText = this.add.text(width - 18, height - 35, `×${obj.scale}`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#4A4A4A',
      }).setOrigin(1, 0);
      container.add(scaleText);
    }

    // 交互
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(0, 0, width, height, 10);
      bg.lineStyle(2, typeColor, 1);
      bg.strokeRoundedRect(0, 0, width, height, 10);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(0, 0, width, height, 10);
      bg.lineStyle(2, typeColor, 0.5);
      bg.strokeRoundedRect(0, 0, width, height, 10);
    });

    container.on('pointerdown', () => {
      this._showObjectDetail(item);
    });

    return container;
  }

  /**
   * 显示物件详情
   */
  private _showObjectDetail(item: IFlatObject): void {
    this._selectedObject = item;
    const obj = item.object;
    const { width, height } = this.scale;

    // 清空面板
    this._detailPanel.removeAll(true);

    // 遮罩
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this._hideObjectDetail());
    this._detailPanel.add(overlay);

    // 面板
    const panelWidth = width - 100;
    const panelHeight = 600;
    const panelX = 50;
    const panelY = (height - panelHeight) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x141419, 1);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
    panel.lineStyle(2, 0x00FFAA, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
    this._detailPanel.add(panel);

    // 标题
    const title = this.add.text(panelX + 30, panelY + 25, `📦 物件详情 - ${obj.id}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SECTION,
      color: '#00FFAA',
      fontStyle: 'bold',
    });
    this._detailPanel.add(title);

    // 关闭按钮
    const closeBtn = this.add.text(panelX + panelWidth - 40, panelY + 25, '✕', {
      fontSize: '36px',
      color: '#686868',
    }).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#686868'));
    closeBtn.on('pointerdown', () => this._hideObjectDetail());
    this._detailPanel.add(closeBtn);

    // 所属Zone
    const zoneInfo = this.add.text(panelX + 30, panelY + 70, `📍 所属: ${item.zoneId} - ${item.zoneName}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#4A9EFF',
    });
    this._detailPanel.add(zoneInfo);

    // 基础信息
    let detailY = panelY + 120;

    const basicTitle = this.add.text(panelX + 30, detailY, '▸ 基础属性', {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#E8E6E3',
      fontStyle: 'bold',
    });
    this._detailPanel.add(basicTitle);
    detailY += 35;

    const basicInfo = [
      `类型: ${obj.type}`,
      `纹理: ${obj.texture}`,
      `位置: (${obj.x}, ${obj.y})`,
      `缩放: ${obj.scale ?? 1}`,
      `深度: ${obj.depth ?? 'auto'}`,
      `标签: ${obj.label || '无'}`,
    ];

    basicInfo.forEach(info => {
      const text = this.add.text(panelX + 40, detailY, info, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#A8A6A3',
      });
      this._detailPanel.add(text);
      detailY += 28;
    });

    // 交互信息
    if (obj.interactive) {
      detailY += 15;
      const interactiveTitle = this.add.text(panelX + 30, detailY, '▸ 交互配置', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#00FFAA',
        fontStyle: 'bold',
      });
      this._detailPanel.add(interactiveTitle);
      detailY += 35;

      const action = obj.interactive.action;
      const interactiveInfo = [
        `动作类型: ${action?.type || 'none'}`,
        `指针样式: ${obj.interactive.cursor ? '手型' : '默认'}`,
        `测试ID: ${obj.interactive.testid || '无'}`,
      ];

      if (action?.type === 'card') {
        interactiveInfo.push(`卡片ID: ${action.cardId}`);
      } else if (action?.type === 'dialogue') {
        interactiveInfo.push(`说话者: ${action.speaker}`);
        interactiveInfo.push(`对话: ${action.text?.slice(0, 30)}...`);
      } else if (action?.type === 'gotoZone') {
        interactiveInfo.push(`目标Zone: ${action.zoneId}`);
      }

      interactiveInfo.forEach(info => {
        const text = this.add.text(panelX + 40, detailY, info, {
          fontFamily: 'Noto Sans SC',
          fontSize: this.FONT_SIZE.SMALL,
          color: '#686868',
        });
        this._detailPanel.add(text);
        detailY += 28;
      });
    }

    // 动画信息
    if (obj.animation) {
      detailY += 15;
      const animTitle = this.add.text(panelX + 30, detailY, '▸ 动画配置', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#FF00FF',
        fontStyle: 'bold',
      });
      this._detailPanel.add(animTitle);
      detailY += 35;

      const animInfo = [
        `动画键: ${obj.animation.key}`,
        `帧率: ${obj.animation.frameRate ?? 6} fps`,
        `循环: ${obj.animation.repeat === -1 ? '无限' : obj.animation.repeat}`,
      ];

      animInfo.forEach(info => {
        const text = this.add.text(panelX + 40, detailY, info, {
          fontFamily: 'Noto Sans SC',
          fontSize: this.FONT_SIZE.SMALL,
          color: '#686868',
        });
        this._detailPanel.add(text);
        detailY += 28;
      });
    }

    // 可视化预览（白盒）
    const previewX = panelX + panelWidth - 200;
    const previewY = panelY + 130;

    const previewBg = this.add.graphics();
    previewBg.fillStyle(0x0A0A0F, 1);
    previewBg.fillRect(previewX, previewY, 160, 160);
    previewBg.lineStyle(1, 0x2A2A30, 1);
    previewBg.strokeRect(previewX, previewY, 160, 160);
    this._detailPanel.add(previewBg);

    // 物件占位符
    const previewObject = this.add.graphics();
    const objColor = obj.interactive ? 0x00FFAA : (obj.animation ? 0xFF00FF : 0x444444);
    previewObject.fillStyle(objColor, 0.3);
    previewObject.fillRect(previewX + 45, previewY + 45, 70, 70);
    previewObject.lineStyle(2, objColor, 1);
    previewObject.strokeRect(previewX + 45, previewY + 45, 70, 70);
    this._detailPanel.add(previewObject);

    const previewLabel = this.add.text(previewX + 80, previewY + 175, '白盒预览', {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#4A4A4A',
    }).setOrigin(0.5);
    this._detailPanel.add(previewLabel);

    // 显示面板
    this._detailPanel.setVisible(true);
  }

  /**
   * 隐藏详情面板
   */
  private _hideObjectDetail(): void {
    this._selectedObject = null;
    this._detailPanel.setVisible(false);
    this._detailPanel.removeAll(true);
  }

  protected setupKeyboard(): void {
    super.setupKeyboard();

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this._detailPanel.visible) {
        this._hideObjectDetail();
      } else {
        this.goBack();
      }
    });
  }
}

