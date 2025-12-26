/**
 * UI预览场景 (Prefab 模式)
 * 
 * 展示完整的UI界面 Prefab，而不只是单个组件：
 * - 对话界面 (DialogueUI)
 * - 卡片界面 (CardUI)
 * - 暂停菜单 (PauseMenu)
 * - 物品栏 (InventoryUI)
 * - HUD元素
 * - Toast提示
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { COLORS, TEXT_STYLES } from '@/config/game.config';
import { DialogueUI } from '@/systems/ui/DialogueUI';
import { CardUI } from '@/systems/ui/CardUI';
import { ToastManager } from '@/systems/ui/ToastManager';
import type { IDialogue, ICard } from '@/types';

// UI界面分类
interface IUIScreen {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// 显示模式
type DisplayMode = 'list' | 'preview';

export class UIPreviewScene extends BasePreviewScene {
  protected title = '🎨 UI预览';
  protected subtitle = '预览完整UI界面 Prefab（对话框、菜单、物品栏等）';

  // UI 实例
  private _dialogueUI: DialogueUI | null = null;
  private _cardUI: CardUI | null = null;
  private _toastManager: ToastManager | null = null;

  // 预览容器
  private _uiPreviewContainer!: Phaser.GameObjects.Container;
  private _displayMode: DisplayMode = 'list';
  private _currentScreen: string | null = null;

  constructor() {
    super({ key: 'UIPreviewScene' });
  }

  create(): void {
    super.create();

    // UI预览容器
    this._uiPreviewContainer = this.add.container(0, 0);
    this._uiPreviewContainer.setDepth(100);
    this._uiPreviewContainer.setVisible(false);
  }

  protected createContent(width: number, height: number): void {
    let currentY = 20;

    // 分两大类
    const uiScreens = this._getUIScreens();
    const uiComponents = this._getUIComponents();

    // 统计
    const totalScreens = uiScreens.length;
    const totalComponents = uiComponents.length;
    const stats = this.add.text(width / 2, currentY, 
      `${totalScreens} 个界面 Prefab | ${totalComponents} 个组件元素`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#686868',
    }).setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 30;

    // 操作提示
    const hint = this.add.text(width / 2, currentY, 
      '💡 点击界面卡片进入全屏预览模式，可交互测试', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#4A9EFF',
    }).setOrigin(0.5);
    this.contentContainer.add(hint);
    currentY += 40;

    // UI界面 Prefab 区域
    const screenTitle = this.createSectionTitle(30, currentY, '📺 UI界面 Prefab（点击进入全屏预览）');
    this.contentContainer.add(screenTitle);
    currentY += 35;

    // 界面卡片网格
    const cardWidth = 200;
    const cardHeight = 120;
    const cardsPerRow = 3;

    uiScreens.forEach((screen, index) => {
      const col = index % cardsPerRow;
      const row = Math.floor(index / cardsPerRow);
      const x = 30 + col * (cardWidth + 15);
      const y = currentY + row * (cardHeight + 15);

      const card = this._createScreenCard(x, y, cardWidth, cardHeight, screen);
      this.contentContainer.add(card);
    });

    const screenRows = Math.ceil(uiScreens.length / cardsPerRow);
    currentY += screenRows * (cardHeight + 15) + 20;

    // 分隔线
    const divider1 = this.createDivider(currentY, width);
    this.contentContainer.add(divider1);
    currentY += 30;

    // UI组件元素区域
    const componentTitle = this.createSectionTitle(30, currentY, '🧩 UI组件元素');
    this.contentContainer.add(componentTitle);
    currentY += 35;

    // 组件预览
    currentY = this._renderComponentPreviews(currentY, width);

    this.setContentHeight(currentY + 50);
  }

  private _getUIScreens(): IUIScreen[] {
    return [
      {
        id: 'dialogue',
        name: '对话界面',
        description: 'DialogueUI - 角色对话、打字机效果、选项',
        icon: '💬',
      },
      {
        id: 'card',
        name: '卡片界面',
        description: 'CardUI - 卡片详情、获得动画',
        icon: '🃏',
      },
      {
        id: 'pause',
        name: '暂停菜单',
        description: 'PauseMenu - 游戏暂停、设置、存档',
        icon: '⏸️',
      },
      {
        id: 'inventory',
        name: '物品栏',
        description: 'InventoryUI - 收集的卡片列表',
        icon: '📋',
      },
      {
        id: 'hud',
        name: 'HUD抬头显示',
        description: 'R/P/W计数器、能力栏',
        icon: '📊',
      },
      {
        id: 'toast',
        name: '提示系统',
        description: 'ToastManager - 各类提示消息',
        icon: '💭',
      },
    ];
  }

  private _getUIComponents(): string[] {
    return ['按钮', '面板', '图标', '颜色'];
  }

  private _createScreenCard(
    x: number,
    y: number,
    width: number,
    height: number,
    screen: IUIScreen
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(1, 0x2A2A30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 8);
    container.add(bg);

    // 图标
    const icon = this.add.text(width / 2, 30, screen.icon, {
      fontSize: '32px',
    }).setOrigin(0.5);
    container.add(icon);

    // 名称
    const name = this.add.text(width / 2, 65, screen.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#00FFAA',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(name);

    // 描述
    const desc = this.add.text(width / 2, 88, screen.description, {
      fontFamily: 'Noto Sans SC',
      fontSize: '9px',
      color: '#686868',
      wordWrap: { width: width - 20 },
      align: 'center',
    }).setOrigin(0.5, 0);
    container.add(desc);

    // 交互
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(2, 0x00FFAA, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(0, 0, width, height, 8);
      bg.lineStyle(1, 0x2A2A30, 1);
      bg.strokeRoundedRect(0, 0, width, height, 8);
    });

    container.on('pointerdown', () => {
      this._enterPreviewMode(screen.id);
    });

    return container;
  }

  /**
   * 进入UI界面预览模式
   */
  private _enterPreviewMode(screenId: string): void {
    this._currentScreen = screenId;
    this._displayMode = 'preview';

    const { width, height } = this.scale;

    // 隐藏列表
    this.contentContainer.setVisible(false);
    this.headerContainer.setVisible(false);

    // 清空预览容器
    this._uiPreviewContainer.removeAll(true);

    // 游戏背景模拟
    const gameBg = this.add.rectangle(0, 0, width, height, 0x0A0A0F).setOrigin(0);
    this._uiPreviewContainer.add(gameBg);

    // 模拟游戏场景（白盒）
    this._createMockGameScene();

    // 根据类型创建UI
    switch (screenId) {
      case 'dialogue':
        this._previewDialogueUI();
        break;
      case 'card':
        this._previewCardUI();
        break;
      case 'pause':
        this._previewPauseMenu();
        break;
      case 'inventory':
        this._previewInventoryUI();
        break;
      case 'hud':
        this._previewHUD();
        break;
      case 'toast':
        this._previewToastSystem();
        break;
    }

    // 顶部信息栏
    this._createPreviewHeader(screenId);

    // 显示预览
    this._uiPreviewContainer.setVisible(true);
  }

  /**
   * 创建模拟游戏场景（白盒背景）
   */
  private _createMockGameScene(): void {
    const { width, height } = this.scale;

    // 网格背景
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1A1A1F, 0.5);
    
    for (let x = 0; x < width; x += 50) {
      grid.moveTo(x, 0);
      grid.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 50) {
      grid.moveTo(0, y);
      grid.lineTo(width, y);
    }
    grid.strokePath();
    this._uiPreviewContainer.add(grid);

    // 模拟玩家位置
    const player = this.add.graphics();
    player.fillStyle(0x00FFAA, 0.5);
    player.fillCircle(width / 2, height / 2, 20);
    player.lineStyle(2, 0x00FFAA, 1);
    player.strokeCircle(width / 2, height / 2, 20);
    this._uiPreviewContainer.add(player);

    const playerLabel = this.add.text(width / 2, height / 2 + 35, '玩家', {
      fontFamily: 'Noto Sans SC',
      fontSize: '10px',
      color: '#00FFAA',
    }).setOrigin(0.5);
    this._uiPreviewContainer.add(playerLabel);
  }

  /**
   * 预览对话界面
   */
  private _previewDialogueUI(): void {
    // 创建真实的 DialogueUI 实例
    this._dialogueUI = new DialogueUI({
      scene: this,
      onDialogueEnd: () => {
        console.log('[UIPreview] 对话结束');
      },
      onChoiceSelected: (id, index) => {
        console.log(`[UIPreview] 选择了选项 ${index}`);
      },
    });

    // 显示示例对话
    const sampleDialogue: IDialogue = {
      id: 'preview_dialogue',
      speaker: '岑回',
      text: '这是一段示例对话文本，用于展示 DialogueUI 的完整效果。包括打字机动画、角色名称高亮、以及底部的继续提示。',
      choices: [
        { text: '继续探索', nextId: 'next_1' },
        { text: '询问详情', nextId: 'next_2' },
      ],
    };

    // 延迟显示对话
    this.time.delayedCall(500, () => {
      this._dialogueUI?.showDialogue(sampleDialogue);
    });

    // 添加操作提示
    const tip = this.add.text(this.scale.width / 2, 120, 
      '💡 点击对话框可推进对话，点击选项可选择', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#FFD700',
    }).setOrigin(0.5);
    this._uiPreviewContainer.add(tip);
  }

  /**
   * 预览卡片界面
   */
  private _previewCardUI(): void {
    this._cardUI = new CardUI({
      scene: this,
      onCardClosed: () => {
        console.log('[UIPreview] 卡片关闭');
      },
    });

    // 示例卡片
    const sampleCard: ICard = {
      id: 'preview_card',
      name: '维修局身份证',
      type: 'archive',
      chapter: 'C0',
      zone: 'C0-Z1',
      front: [
        '维修局外勤身份凭证',
        '持卡人：岑回',
        '编号：EX-7749',
      ],
      detail: [
        '通行级别：灰',
        '有效期：本周期内有效',
        '备注：背面有一道细小的划痕',
        '',
        '「例外处理器。负责修复那些',
        '不该存在的裂缝。」',
      ],
    };

    // 延迟显示卡片获得动画
    this.time.delayedCall(500, () => {
      this._cardUI?.showCardObtain(sampleCard);
    });

    const tip = this.add.text(this.scale.width / 2, 120, 
      '💡 展示卡片获得动画，点击可关闭', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#FFD700',
    }).setOrigin(0.5);
    this._uiPreviewContainer.add(tip);
  }

  /**
   * 预览暂停菜单
   */
  private _previewPauseMenu(): void {
    const { width, height } = this.scale;

    // 模拟暂停菜单 UI
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.8).setOrigin(0);
    this._uiPreviewContainer.add(overlay);

    // 菜单面板
    const panelWidth = 300;
    const panelHeight = 400;
    const panelX = (width - panelWidth) / 2;
    const panelY = (height - panelHeight) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0x141419, 1);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    panel.lineStyle(2, 0x2A2A30, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    this._uiPreviewContainer.add(panel);

    // 标题
    const title = this.add.text(width / 2, panelY + 30, '游戏暂停', {
      fontFamily: 'Noto Sans SC',
      fontSize: '20px',
      color: '#E8E6E3',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this._uiPreviewContainer.add(title);

    // 菜单项
    const menuItems = [
      { text: '继续游戏', color: 0x00FFAA },
      { text: '保存游戏', color: 0x4A9EFF },
      { text: '读取存档', color: 0x4A9EFF },
      { text: '游戏设置', color: 0x686868 },
      { text: '返回主菜单', color: 0xFF4444 },
    ];

    menuItems.forEach((item, index) => {
      const btnY = panelY + 80 + index * 55;
      
      const btn = this.add.graphics();
      btn.fillStyle(0x1E1E24, 1);
      btn.fillRoundedRect(panelX + 30, btnY, panelWidth - 60, 45, 8);
      this._uiPreviewContainer.add(btn);

      const btnText = this.add.text(width / 2, btnY + 22, item.text, {
        fontFamily: 'Noto Sans SC',
        fontSize: '14px',
        color: `#${item.color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);
      this._uiPreviewContainer.add(btnText);
    });

    const tip = this.add.text(width / 2, panelY + panelHeight + 20, 
      '💡 这是 PauseMenu 的完整界面预览', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#FFD700',
    }).setOrigin(0.5);
    this._uiPreviewContainer.add(tip);
  }

  /**
   * 预览物品栏
   */
  private _previewInventoryUI(): void {
    const { width, height } = this.scale;

    // 物品栏面板
    const panelWidth = width - 60;
    const panelHeight = height - 200;
    const panelX = 30;
    const panelY = 100;

    const panel = this.add.graphics();
    panel.fillStyle(0x141419, 0.95);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    panel.lineStyle(2, 0x2A2A30, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 12);
    this._uiPreviewContainer.add(panel);

    // 标题
    const title = this.add.text(width / 2, panelY + 25, '📋 已收集卡片', {
      fontFamily: 'Noto Sans SC',
      fontSize: '18px',
      color: '#00FFAA',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this._uiPreviewContainer.add(title);

    // 分类标签
    const tabs = ['全部', '档案', '物品', '祈言', '判词'];
    tabs.forEach((tab, index) => {
      const tabX = panelX + 40 + index * 100;
      const isActive = index === 0;

      const tabBg = this.add.graphics();
      if (isActive) {
        tabBg.fillStyle(0x00FFAA, 0.2);
        tabBg.fillRoundedRect(tabX, panelY + 55, 80, 28, 6);
      }
      tabBg.lineStyle(1, isActive ? 0x00FFAA : 0x2A2A30, 1);
      tabBg.strokeRoundedRect(tabX, panelY + 55, 80, 28, 6);
      this._uiPreviewContainer.add(tabBg);

      const tabText = this.add.text(tabX + 40, panelY + 69, tab, {
        fontFamily: 'Noto Sans SC',
        fontSize: '12px',
        color: isActive ? '#00FFAA' : '#686868',
      }).setOrigin(0.5);
      this._uiPreviewContainer.add(tabText);
    });

    // 卡片网格（示例）
    const cardWidth = 120;
    const cardHeight = 160;
    const cardsPerRow = 4;

    for (let i = 0; i < 8; i++) {
      const col = i % cardsPerRow;
      const row = Math.floor(i / cardsPerRow);
      const cardX = panelX + 40 + col * (cardWidth + 20);
      const cardY = panelY + 100 + row * (cardHeight + 15);

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x1E1E24, 1);
      cardBg.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, 8);
      cardBg.lineStyle(1, i < 3 ? 0x00FFAA : 0x2A2A30, 0.5);
      cardBg.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, 8);
      this._uiPreviewContainer.add(cardBg);

      if (i < 3) {
        // 已收集的卡片
        const cardIcon = this.add.text(cardX + cardWidth / 2, cardY + 50, '📄', {
          fontSize: '32px',
        }).setOrigin(0.5);
        this._uiPreviewContainer.add(cardIcon);

        const cardName = this.add.text(cardX + cardWidth / 2, cardY + 100, `卡片 ${i + 1}`, {
          fontFamily: 'Noto Sans SC',
          fontSize: '11px',
          color: '#A8A6A3',
        }).setOrigin(0.5);
        this._uiPreviewContainer.add(cardName);
      } else {
        // 未收集的卡片
        const lockIcon = this.add.text(cardX + cardWidth / 2, cardY + cardHeight / 2, '🔒', {
          fontSize: '24px',
        }).setOrigin(0.5);
        lockIcon.setAlpha(0.3);
        this._uiPreviewContainer.add(lockIcon);
      }
    }

    const tip = this.add.text(width / 2, height - 50, 
      '💡 这是 InventoryUI 的完整界面预览', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#FFD700',
    }).setOrigin(0.5);
    this._uiPreviewContainer.add(tip);
  }

  /**
   * 预览HUD
   */
  private _previewHUD(): void {
    const { width } = this.scale;

    // R/P/W 计数器
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x141419, 0.9);
    hudBg.fillRoundedRect(width - 180, 100, 160, 90, 8);
    this._uiPreviewContainer.add(hudBg);

    const counters = [
      { label: 'R', value: 3, color: '#FF4444', desc: '无收益残差' },
      { label: 'P', value: 5.2, color: '#4A9EFF', desc: '观察者压力' },
      { label: 'W', value: 87, color: '#00CC66', desc: '世界可读性' },
    ];

    counters.forEach((counter, index) => {
      const y = 120 + index * 25;

      const label = this.add.text(width - 160, y, counter.label, {
        fontFamily: 'Noto Sans SC',
        fontSize: '14px',
        color: counter.color,
        fontStyle: 'bold',
      });
      this._uiPreviewContainer.add(label);

      const value = this.add.text(width - 130, y, 
        counter.label === 'W' ? `${counter.value}%` : `${counter.value}`, {
        fontFamily: 'Noto Sans SC',
        fontSize: '14px',
        color: counter.color,
      });
      this._uiPreviewContainer.add(value);
    });

    // 能力栏
    const abilityBarY = this.scale.height - 150;
    const abilities = [
      { name: '深度感知', key: '1', color: 0x00FFAA, unlocked: true },
      { name: '深度介入', key: '2', color: 0xFF00FF, unlocked: true },
      { name: '时间干预', key: '3', color: 0xFFD700, unlocked: false },
    ];

    abilities.forEach((ability, index) => {
      const x = width / 2 + (index - 1) * 90;

      const abilityBg = this.add.graphics();
      abilityBg.fillStyle(0x1E1E24, 0.9);
      abilityBg.fillRoundedRect(x - 35, abilityBarY, 70, 60, 8);
      abilityBg.lineStyle(2, ability.color, ability.unlocked ? 0.8 : 0.2);
      abilityBg.strokeRoundedRect(x - 35, abilityBarY, 70, 60, 8);
      this._uiPreviewContainer.add(abilityBg);

      // 锁定遮罩
      if (!ability.unlocked) {
        const lock = this.add.graphics();
        lock.fillStyle(0x000000, 0.7);
        lock.fillRoundedRect(x - 35, abilityBarY, 70, 60, 8);
        this._uiPreviewContainer.add(lock);
      }

      const keyHint = this.add.text(x, abilityBarY + 15, ability.key, {
        fontFamily: 'Noto Sans SC',
        fontSize: '11px',
        color: '#4A4A4A',
      }).setOrigin(0.5);
      this._uiPreviewContainer.add(keyHint);

      const abilityName = this.add.text(x, abilityBarY + 38, ability.name.slice(0, 2), {
        fontFamily: 'Noto Sans SC',
        fontSize: '14px',
        color: `#${ability.color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);
      if (!ability.unlocked) abilityName.setAlpha(0.3);
      this._uiPreviewContainer.add(abilityName);
    });

    const tip = this.add.text(width / 2, 250, 
      '💡 HUD元素：R/P/W计数器 + 能力栏', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#FFD700',
    }).setOrigin(0.5);
    this._uiPreviewContainer.add(tip);
  }

  /**
   * 预览Toast系统
   */
  private _previewToastSystem(): void {
    this._toastManager = new ToastManager({ scene: this });

    const { width } = this.scale;

    // 说明
    const instructions = this.add.text(width / 2, 150, 
      '点击下方按钮触发不同类型的 Toast 提示', {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#A8A6A3',
    }).setOrigin(0.5);
    this._uiPreviewContainer.add(instructions);

    // Toast类型按钮
    const toastTypes = [
      { name: '成功', method: 'showSuccess', color: 0x00CC66 },
      { name: '错误', method: 'showError', color: 0xFF4444 },
      { name: '警告', method: 'showWarning', color: 0xFFD700 },
      { name: '信息', method: 'showInfo', color: 0x4A9EFF },
    ];

    toastTypes.forEach((toast, index) => {
      const x = width / 2 + (index - 1.5) * 110;
      const y = 220;

      const btn = this.add.graphics();
      btn.fillStyle(toast.color, 0.2);
      btn.fillRoundedRect(x - 45, y - 20, 90, 40, 8);
      btn.lineStyle(2, toast.color, 1);
      btn.strokeRoundedRect(x - 45, y - 20, 90, 40, 8);
      this._uiPreviewContainer.add(btn);

      const btnText = this.add.text(x, y, toast.name, {
        fontFamily: 'Noto Sans SC',
        fontSize: '14px',
        color: `#${toast.color.toString(16).padStart(6, '0')}`,
      }).setOrigin(0.5);
      this._uiPreviewContainer.add(btnText);

      // 交互
      const hitArea = this.add.rectangle(x, y, 90, 40, 0x000000, 0)
        .setInteractive({ useHandCursor: true });
      
      hitArea.on('pointerdown', () => {
        const messages: Record<string, string> = {
          showSuccess: '操作成功完成！',
          showError: '操作失败，请重试。',
          showWarning: '请注意：这是一条警告。',
          showInfo: '这是一条信息提示。',
        };
        (this._toastManager as any)[toast.method](messages[toast.method]);
      });
      this._uiPreviewContainer.add(hitArea);
    });

    // 成就提示按钮
    const achievementBtn = this.add.graphics();
    achievementBtn.fillStyle(0xFF00FF, 0.2);
    achievementBtn.fillRoundedRect(width / 2 - 80, 300, 160, 40, 8);
    achievementBtn.lineStyle(2, 0xFF00FF, 1);
    achievementBtn.strokeRoundedRect(width / 2 - 80, 300, 160, 40, 8);
    this._uiPreviewContainer.add(achievementBtn);

    const achievementText = this.add.text(width / 2, 320, '🏆 成就提示', {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#FF00FF',
    }).setOrigin(0.5);
    this._uiPreviewContainer.add(achievementText);

    const achievementHit = this.add.rectangle(width / 2, 320, 160, 40, 0x000000, 0)
      .setInteractive({ useHandCursor: true });
    achievementHit.on('pointerdown', () => {
      this._toastManager?.showAchievement('成就解锁', '完成首次预览测试');
    });
    this._uiPreviewContainer.add(achievementHit);
  }

  /**
   * 创建预览头部
   */
  private _createPreviewHeader(screenId: string): void {
    const { width } = this.scale;
    const screens = this._getUIScreens();
    const screen = screens.find(s => s.id === screenId);

    // 头部背景
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x141419, 0.95);
    headerBg.fillRect(0, 0, width, 70);
    this._uiPreviewContainer.add(headerBg);

    // 返回按钮
    const backBtn = this.add.text(20, 25, '← 返回列表', {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#4A9EFF',
    }).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#00FFAA'));
    backBtn.on('pointerout', () => backBtn.setColor('#4A9EFF'));
    backBtn.on('pointerdown', () => this._exitPreviewMode());
    this._uiPreviewContainer.add(backBtn);

    // 标题
    const title = this.add.text(width / 2, 20, 
      `${screen?.icon || '🎨'} ${screen?.name || screenId}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '18px',
      color: '#00FFAA',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);
    this._uiPreviewContainer.add(title);

    // 描述
    const desc = this.add.text(width / 2, 45, screen?.description || '', {
      fontFamily: 'Noto Sans SC',
      fontSize: '11px',
      color: '#686868',
    }).setOrigin(0.5, 0);
    this._uiPreviewContainer.add(desc);
  }

  /**
   * 退出预览模式
   */
  private _exitPreviewMode(): void {
    // 清理UI实例
    this._dialogueUI?.destroy();
    this._dialogueUI = null;
    
    this._cardUI?.destroy();
    this._cardUI = null;
    
    this._toastManager?.destroy();
    this._toastManager = null;

    this._currentScreen = null;
    this._displayMode = 'list';

    // 隐藏预览
    this._uiPreviewContainer.setVisible(false);
    this._uiPreviewContainer.removeAll(true);

    // 显示列表
    this.contentContainer.setVisible(true);
    this.headerContainer.setVisible(true);
  }

  /**
   * 渲染组件元素预览
   */
  private _renderComponentPreviews(startY: number, width: number): number {
    let currentY = startY;

    // 按钮示例
    const buttonContainer = this._createComponentSection('按钮 (Buttons)', currentY, width);
    this._addButtonPreviews(buttonContainer, width);
    this.contentContainer.add(buttonContainer);
    currentY += 160;

    // 颜色系统
    const colorContainer = this._createComponentSection('颜色系统 (Colors)', currentY, width);
    this._addColorPreviews(colorContainer, width);
    this.contentContainer.add(colorContainer);
    currentY += 100;

    return currentY;
  }

  private _createComponentSection(title: string, y: number, width: number): Phaser.GameObjects.Container {
    const container = this.add.container(30, y);

    const sectionTitle = this.add.text(0, 0, title, {
      fontFamily: 'Noto Sans SC',
      fontSize: '13px',
      color: '#686868',
    });
    container.add(sectionTitle);

    return container;
  }

  private _addButtonPreviews(container: Phaser.GameObjects.Container, width: number): void {
    const buttons = [
      { name: '主按钮', fill: true, color: 0x00FFAA },
      { name: '次按钮', fill: false, color: 0x00FFAA },
      { name: '危险按钮', fill: true, color: 0xFF4444 },
      { name: '禁用按钮', fill: true, color: 0x2A2A30, textColor: '#4A4A4A' },
    ];

    buttons.forEach((btn, index) => {
      const x = 20 + index * 150;
      const y = 50;

      const graphic = this.add.graphics();
      if (btn.fill) {
        graphic.fillStyle(btn.color, 1);
        graphic.fillRoundedRect(x, y, 130, 40, 8);
      } else {
        graphic.lineStyle(2, btn.color, 1);
        graphic.strokeRoundedRect(x, y, 130, 40, 8);
      }
      container.add(graphic);

      const text = this.add.text(x + 65, y + 20, btn.name, {
        fontFamily: 'Noto Sans SC',
        fontSize: '13px',
        color: btn.textColor || (btn.fill ? '#0A0A0F' : `#${btn.color.toString(16).padStart(6, '0')}`),
      }).setOrigin(0.5);
      container.add(text);
    });
  }

  private _addColorPreviews(container: Phaser.GameObjects.Container, width: number): void {
    const colors = [
      { name: 'Accent', color: 0x00FFAA },
      { name: 'Error', color: 0xFF4444 },
      { name: 'Warning', color: 0xFFD700 },
      { name: 'Info', color: 0x4A9EFF },
      { name: 'Text', color: 0xE8E6E3 },
      { name: 'Muted', color: 0x686868 },
      { name: 'BG', color: 0x141419 },
    ];

    colors.forEach((c, index) => {
      const x = 20 + index * 80;
      const y = 40;

      const swatch = this.add.graphics();
      swatch.fillStyle(c.color, 1);
      swatch.fillRoundedRect(x, y, 60, 30, 4);
      container.add(swatch);

      const label = this.add.text(x + 30, y + 40, c.name, {
        fontFamily: 'Noto Sans SC',
        fontSize: '9px',
        color: '#4A4A4A',
      }).setOrigin(0.5, 0);
      container.add(label);
    });
  }

  protected setupKeyboard(): void {
    super.setupKeyboard();

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this._displayMode === 'preview') {
        this._exitPreviewMode();
      } else {
        this.goBack();
      }
    });
  }

  shutdown(): void {
    this._dialogueUI?.destroy();
    this._cardUI?.destroy();
    this._toastManager?.destroy();
    super.shutdown();
  }
}
