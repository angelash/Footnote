/**
 * UI预览场景
 * 
 * 预览面板、按钮、图标等UI元素
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { COLORS, TEXT_STYLES } from '@/config/game.config';

// UI组件分类
interface IUICategory {
  name: string;
  items: IUIItem[];
}

interface IUIItem {
  name: string;
  type: 'button' | 'panel' | 'icon' | 'input' | 'toast' | 'dialog';
  preview: (container: Phaser.GameObjects.Container, x: number, y: number) => void;
}

export class UIPreviewScene extends BasePreviewScene {
  protected title = '🎨 UI预览';
  protected subtitle = '预览面板、按钮、图标等UI元素';

  constructor() {
    super({ key: 'UIPreviewScene' });
  }

  protected createContent(width: number, height: number): void {
    let currentY = 20;

    const categories = this.getUICategories();

    // 统计
    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    const stats = this.add.text(width / 2, currentY, `${categories.length} 个分类，共 ${totalItems} 个组件`, {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#686868',
    }).setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 40;

    // 分类展示
    categories.forEach((category) => {
      // 分类标题
      const sectionTitle = this.createSectionTitle(30, currentY, category.name);
      this.contentContainer.add(sectionTitle);
      currentY += 35;

      // 组件预览区
      const previewHeight = this.renderCategoryItems(category, 30, currentY, width - 60);
      currentY += previewHeight + 30;

      // 分隔线
      const divider = this.createDivider(currentY, width);
      this.contentContainer.add(divider);
      currentY += 30;
    });

    this.setContentHeight(currentY);
  }

  private getUICategories(): IUICategory[] {
    return [
      {
        name: '按钮 (Buttons)',
        items: [
          { name: '主按钮', type: 'button', preview: this.previewPrimaryButton.bind(this) },
          { name: '次按钮', type: 'button', preview: this.previewSecondaryButton.bind(this) },
          { name: '图标按钮', type: 'button', preview: this.previewIconButton.bind(this) },
          { name: '禁用按钮', type: 'button', preview: this.previewDisabledButton.bind(this) },
        ],
      },
      {
        name: '面板 (Panels)',
        items: [
          { name: '对话框面板', type: 'panel', preview: this.previewDialoguePanel.bind(this) },
          { name: '卡片面板', type: 'panel', preview: this.previewCardPanel.bind(this) },
          { name: '状态面板', type: 'panel', preview: this.previewStatusPanel.bind(this) },
        ],
      },
      {
        name: '图标 (Icons)',
        items: [
          { name: '系统图标', type: 'icon', preview: this.previewSystemIcons.bind(this) },
          { name: '能力图标', type: 'icon', preview: this.previewAbilityIcons.bind(this) },
          { name: '状态图标', type: 'icon', preview: this.previewStatusIcons.bind(this) },
        ],
      },
      {
        name: '提示 (Toasts)',
        items: [
          { name: '成功提示', type: 'toast', preview: this.previewSuccessToast.bind(this) },
          { name: '错误提示', type: 'toast', preview: this.previewErrorToast.bind(this) },
          { name: '警告提示', type: 'toast', preview: this.previewWarningToast.bind(this) },
          { name: '信息提示', type: 'toast', preview: this.previewInfoToast.bind(this) },
        ],
      },
      {
        name: '输入 (Inputs)',
        items: [
          { name: '选择按钮', type: 'input', preview: this.previewChoiceButtons.bind(this) },
          { name: '确认对话框', type: 'dialog', preview: this.previewConfirmDialog.bind(this) },
        ],
      },
      {
        name: '颜色系统 (Colors)',
        items: [
          { name: '主色调', type: 'panel', preview: this.previewColorPalette.bind(this) },
        ],
      },
    ];
  }

  private renderCategoryItems(category: IUICategory, x: number, y: number, width: number): number {
    let maxHeight = 0;
    let currentX = x;
    let currentY = y;
    const itemWidth = 220;
    const itemHeight = 150;
    const padding = 15;

    category.items.forEach((item, index) => {
      // 换行检查
      if (currentX + itemWidth > x + width) {
        currentX = x;
        currentY += itemHeight + padding;
      }

      const container = this.createUIItemCard(currentX, currentY, itemWidth, itemHeight, item);
      this.contentContainer.add(container);

      currentX += itemWidth + padding;
      maxHeight = Math.max(maxHeight, currentY - y + itemHeight);
    });

    return maxHeight + padding;
  }

  private createUIItemCard(
    x: number,
    y: number,
    width: number,
    height: number,
    item: IUIItem
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(1, 0x2A2A30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 8);
    container.add(bg);

    // 名称
    const nameText = this.add.text(width / 2, height - 18, item.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: '11px',
      color: '#686868',
    }).setOrigin(0.5);
    container.add(nameText);

    // 预览区域
    const previewContainer = this.add.container(0, 0);
    container.add(previewContainer);
    item.preview(previewContainer, width / 2, (height - 30) / 2);

    return container;
  }

  // ========== 按钮预览 ==========

  private previewPrimaryButton(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const btn = this.add.graphics();
    btn.fillStyle(0x00FFAA, 1);
    btn.fillRoundedRect(x - 60, y - 18, 120, 36, 8);
    container.add(btn);

    const text = this.add.text(x, y, '主按钮', {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#0A0A0F',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(text);
  }

  private previewSecondaryButton(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const btn = this.add.graphics();
    btn.lineStyle(2, 0x00FFAA, 1);
    btn.strokeRoundedRect(x - 60, y - 18, 120, 36, 8);
    container.add(btn);

    const text = this.add.text(x, y, '次按钮', {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#00FFAA',
    }).setOrigin(0.5);
    container.add(text);
  }

  private previewIconButton(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const icons = ['⚙️', '💾', '📋', '❌'];
    icons.forEach((icon, index) => {
      const ix = x - 60 + index * 40;
      
      const bg = this.add.graphics();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(ix - 15, y - 15, 30, 30, 6);
      container.add(bg);

      const iconText = this.add.text(ix, y, icon, {
        fontSize: '16px',
      }).setOrigin(0.5);
      container.add(iconText);
    });
  }

  private previewDisabledButton(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const btn = this.add.graphics();
    btn.fillStyle(0x2A2A30, 1);
    btn.fillRoundedRect(x - 60, y - 18, 120, 36, 8);
    container.add(btn);

    const text = this.add.text(x, y, '禁用按钮', {
      fontFamily: 'Noto Sans SC',
      fontSize: '14px',
      color: '#4A4A4A',
    }).setOrigin(0.5);
    container.add(text);
  }

  // ========== 面板预览 ==========

  private previewDialoguePanel(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 0.95);
    bg.fillRoundedRect(x - 90, y - 40, 180, 80, 8);
    bg.lineStyle(1, 0x2A2A30, 1);
    bg.strokeRoundedRect(x - 90, y - 40, 180, 80, 8);
    container.add(bg);

    const speaker = this.add.text(x - 80, y - 30, '岑回', {
      fontFamily: 'Noto Sans SC',
      fontSize: '11px',
      color: '#00FFAA',
    });
    container.add(speaker);

    const dialogue = this.add.text(x - 80, y - 10, '这是一段对话文字...', {
      fontFamily: 'Noto Sans SC',
      fontSize: '10px',
      color: '#E8E6E3',
    });
    container.add(dialogue);
  }

  private previewCardPanel(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x1E1E24, 1);
    bg.fillRoundedRect(x - 50, y - 40, 100, 80, 6);
    bg.lineStyle(1, 0x00FFAA, 0.5);
    bg.strokeRoundedRect(x - 50, y - 40, 100, 80, 6);
    container.add(bg);

    const title = this.add.text(x, y - 25, '档案卡', {
      fontFamily: 'Noto Sans SC',
      fontSize: '11px',
      color: '#00FFAA',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(title);

    const content = this.add.text(x, y + 5, '卡片内容...', {
      fontFamily: 'Noto Sans SC',
      fontSize: '9px',
      color: '#A8A6A3',
    }).setOrigin(0.5);
    container.add(content);
  }

  private previewStatusPanel(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(x - 80, y - 25, 160, 50, 6);
    container.add(bg);

    const rText = this.add.text(x - 60, y, 'R: 3', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#FF4444',
    }).setOrigin(0.5);
    container.add(rText);

    const pText = this.add.text(x, y, 'P: 5', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#4A9EFF',
    }).setOrigin(0.5);
    container.add(pText);

    const wText = this.add.text(x + 60, y, 'W: 87%', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#00CC66',
    }).setOrigin(0.5);
    container.add(wText);
  }

  // ========== 图标预览 ==========

  private previewSystemIcons(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const icons = ['📁', '💾', '⚙️', '🔊', '❓'];
    icons.forEach((icon, index) => {
      const ix = x - 80 + index * 40;
      const iconText = this.add.text(ix, y, icon, {
        fontSize: '20px',
      }).setOrigin(0.5);
      container.add(iconText);
    });
  }

  private previewAbilityIcons(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const abilities = [
      { icon: '👁️', color: '#00FFAA' },
      { icon: '✋', color: '#FFD700' },
      { icon: '⏰', color: '#FF4444' },
    ];
    abilities.forEach((ability, index) => {
      const ix = x - 50 + index * 50;
      
      const bg = this.add.graphics();
      bg.fillStyle(Phaser.Display.Color.HexStringToColor(ability.color).color, 0.2);
      bg.fillCircle(ix, y, 18);
      container.add(bg);

      const iconText = this.add.text(ix, y, ability.icon, {
        fontSize: '18px',
      }).setOrigin(0.5);
      container.add(iconText);
    });
  }

  private previewStatusIcons(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const statuses = ['✓', '⚠️', '✕', 'ℹ️'];
    const colors = ['#00CC66', '#FFD700', '#FF4444', '#4A9EFF'];
    statuses.forEach((status, index) => {
      const ix = x - 60 + index * 40;
      const text = this.add.text(ix, y, status, {
        fontSize: '18px',
      }).setOrigin(0.5);
      container.add(text);
    });
  }

  // ========== 提示预览 ==========

  private previewSuccessToast(container: Phaser.GameObjects.Container, x: number, y: number): void {
    this.createToast(container, x, y, '操作成功', 0x00CC66);
  }

  private previewErrorToast(container: Phaser.GameObjects.Container, x: number, y: number): void {
    this.createToast(container, x, y, '操作失败', 0xFF4444);
  }

  private previewWarningToast(container: Phaser.GameObjects.Container, x: number, y: number): void {
    this.createToast(container, x, y, '请注意', 0xFFD700);
  }

  private previewInfoToast(container: Phaser.GameObjects.Container, x: number, y: number): void {
    this.createToast(container, x, y, '提示信息', 0x4A9EFF);
  }

  private createToast(container: Phaser.GameObjects.Container, x: number, y: number, text: string, color: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(color, 0.15);
    bg.fillRoundedRect(x - 70, y - 15, 140, 30, 6);
    bg.lineStyle(1, color, 0.5);
    bg.strokeRoundedRect(x - 70, y - 15, 140, 30, 6);
    container.add(bg);

    const toastText = this.add.text(x, y, text, {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#' + color.toString(16).padStart(6, '0'),
    }).setOrigin(0.5);
    container.add(toastText);
  }

  // ========== 输入预览 ==========

  private previewChoiceButtons(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const choices = ['选项A', '选项B'];
    choices.forEach((choice, index) => {
      const cy = y - 20 + index * 35;
      
      const bg = this.add.graphics();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(x - 70, cy - 12, 140, 28, 6);
      bg.lineStyle(1, 0x2A2A30, 1);
      bg.strokeRoundedRect(x - 70, cy - 12, 140, 28, 6);
      container.add(bg);

      const text = this.add.text(x, cy, choice, {
        fontFamily: 'Noto Sans SC',
        fontSize: '11px',
        color: '#A8A6A3',
      }).setOrigin(0.5);
      container.add(text);
    });
  }

  private previewConfirmDialog(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(x - 80, y - 35, 160, 70, 8);
    bg.lineStyle(1, 0x2A2A30, 1);
    bg.strokeRoundedRect(x - 80, y - 35, 160, 70, 8);
    container.add(bg);

    const title = this.add.text(x, y - 20, '确认操作？', {
      fontFamily: 'Noto Sans SC',
      fontSize: '12px',
      color: '#E8E6E3',
    }).setOrigin(0.5);
    container.add(title);

    // 确认按钮
    const confirmBg = this.add.graphics();
    confirmBg.fillStyle(0x00FFAA, 1);
    confirmBg.fillRoundedRect(x - 65, y + 5, 55, 22, 4);
    container.add(confirmBg);

    const confirmText = this.add.text(x - 37, y + 16, '确认', {
      fontFamily: 'Noto Sans SC',
      fontSize: '10px',
      color: '#0A0A0F',
    }).setOrigin(0.5);
    container.add(confirmText);

    // 取消按钮
    const cancelBg = this.add.graphics();
    cancelBg.lineStyle(1, 0x686868, 1);
    cancelBg.strokeRoundedRect(x + 10, y + 5, 55, 22, 4);
    container.add(cancelBg);

    const cancelText = this.add.text(x + 37, y + 16, '取消', {
      fontFamily: 'Noto Sans SC',
      fontSize: '10px',
      color: '#686868',
    }).setOrigin(0.5);
    container.add(cancelText);
  }

  // ========== 颜色预览 ==========

  private previewColorPalette(container: Phaser.GameObjects.Container, x: number, y: number): void {
    const colors = [
      { name: 'Accent', color: 0x00FFAA },
      { name: 'Error', color: 0xFF4444 },
      { name: 'Warn', color: 0xFFD700 },
      { name: 'Info', color: 0x4A9EFF },
      { name: 'Text', color: 0xE8E6E3 },
    ];

    colors.forEach((c, index) => {
      const cx = x - 80 + index * 35;
      
      const colorBox = this.add.graphics();
      colorBox.fillStyle(c.color, 1);
      colorBox.fillRoundedRect(cx - 12, y - 15, 24, 24, 4);
      container.add(colorBox);
    });
  }
}

