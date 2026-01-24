/**
 * 预览场景基类
 *
 * 提供通用的预览功能：
 * - 顶部导航栏
 * - 返回按钮
 * - 滚动容器
 * - 键盘导航
 */

import Phaser from 'phaser';

export abstract class BasePreviewScene extends Phaser.Scene {
  protected headerHeight = 160;
  protected footerHeight = 100;
  protected headerContainer!: Phaser.GameObjects.Container;
  protected contentContainer!: Phaser.GameObjects.Container;
  protected scrollY = 0;
  protected maxScrollY = 0;
  protected title: string = '预览';
  protected subtitle: string = '';

  // 字体大小常量（大幅放大后的尺寸）
  protected readonly FONT_SIZE = {
    TITLE: '48px',
    SUBTITLE: '28px',
    SECTION: '40px',
    NORMAL: '28px',
    SMALL: '24px',
    TINY: '20px',
  };

  create(): void {
    const { width, height } = this.scale;

    // 背景
    this.createBackground(width, height);

    // 头部
    this.createHeader(width);

    // 内容容器（可滚动）
    this.contentContainer = this.add.container(0, this.headerHeight);

    // 创建具体内容
    this.createContent(width, height - this.headerHeight - this.footerHeight);

    // 底部
    this.createFooter(width, height);

    // 设置滚动
    this.setupScrolling(height);

    // 键盘事件
    this.setupKeyboard();

    // 动画入场
    this.animateIn();
  }

  protected abstract createContent(width: number, height: number): void;

  protected createBackground(width: number, height: number): void {
    this.add.rectangle(0, 0, width, height, 0x0a0a0f).setOrigin(0);

    // 网格
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1a1a20, 0.2);
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
    }
    graphics.strokePath();
  }

  protected createHeader(width: number): void {
    // 头部容器
    this.headerContainer = this.add.container(0, 0);
    this.headerContainer.setDepth(100);

    // 头部背景
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x141419, 0.95);
    headerBg.fillRect(0, 0, width, this.headerHeight);
    headerBg.lineStyle(2, 0x2a2a30, 1);
    headerBg.lineBetween(0, this.headerHeight, width, this.headerHeight);
    this.headerContainer.add(headerBg);

    // 返回按钮
    const backBtn = this.createBackButton(40, this.headerHeight / 2);
    this.headerContainer.add(backBtn);

    // 标题
    const titleText = this.add
      .text(width / 2, 50, this.title, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.TITLE,
        color: '#00FFAA',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.headerContainer.add(titleText);

    // 副标题
    if (this.subtitle) {
      const subtitleText = this.add
        .text(width / 2, 105, this.subtitle, {
          fontFamily: 'Noto Sans SC',
          fontSize: this.FONT_SIZE.SUBTITLE,
          color: '#686868',
        })
        .setOrigin(0.5);
      this.headerContainer.add(subtitleText);
    }
  }

  protected createBackButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const btnWidth = 160;
    const btnHeight = 65;

    const bg = this.add.graphics();
    bg.fillStyle(0x1e1e24, 1);
    bg.fillRoundedRect(0, -btnHeight / 2, btnWidth, btnHeight, 10);
    container.add(bg);

    const text = this.add
      .text(btnWidth / 2, 0, '← 返回', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#A8A6A3',
      })
      .setOrigin(0.5);
    container.add(text);

    container.setInteractive(
      new Phaser.Geom.Rectangle(0, -btnHeight / 2, btnWidth, btnHeight),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2a2a30, 1);
      bg.fillRoundedRect(0, -btnHeight / 2, btnWidth, btnHeight, 10);
      text.setColor('#00FFAA');
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1e1e24, 1);
      bg.fillRoundedRect(0, -btnHeight / 2, btnWidth, btnHeight, 10);
      text.setColor('#A8A6A3');
    });

    container.on('pointerdown', () => {
      this.goBack();
    });

    return container;
  }

  protected createFooter(width: number, height: number): void {
    const footerBg = this.add.graphics();
    footerBg.fillStyle(0x141419, 0.95);
    footerBg.fillRect(0, height - this.footerHeight, width, this.footerHeight);
    footerBg.lineStyle(2, 0x2a2a30, 1);
    footerBg.lineBetween(0, height - this.footerHeight, width, height - this.footerHeight);
    footerBg.setDepth(100);

    // 提示文字
    this.add
      .text(width / 2, height - this.footerHeight / 2, '↑↓ 滚动 | ESC 返回 | 点击预览', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#4A4A4A',
      })
      .setOrigin(0.5)
      .setDepth(101);
  }

  protected setupScrolling(_height: number): void {
    // 鼠标滚轮
    this.input.on(
      'wheel',
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number
      ) => {
        this.scroll(deltaY * 0.5);
      }
    );

    // 触摸拖动
    let lastY = 0;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      lastY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const delta = lastY - pointer.y;
        this.scroll(delta);
        lastY = pointer.y;
      }
    });
  }

  protected scroll(deltaY: number): void {
    this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY, 0, this.maxScrollY);
    this.contentContainer.y = this.headerHeight - this.scrollY;
  }

  protected setContentHeight(contentHeight: number): void {
    const viewHeight = this.scale.height - this.headerHeight - this.footerHeight;
    this.maxScrollY = Math.max(0, contentHeight - viewHeight);
  }

  protected setupKeyboard(): void {
    this.input.keyboard?.on('keydown-ESC', () => {
      this.goBack();
    });

    this.input.keyboard?.on('keydown-UP', () => {
      this.scroll(-50);
    });

    this.input.keyboard?.on('keydown-DOWN', () => {
      this.scroll(50);
    });
  }

  protected goBack(): void {
    this.cameras.main.fadeOut(200, 10, 10, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('DevPreviewScene');
    });
  }

  protected animateIn(): void {
    this.cameras.main.fadeIn(200, 10, 10, 15);
  }

  /**
   * 创建预览卡片
   */
  protected createPreviewCard(
    x: number,
    y: number,
    width: number,
    height: number,
    title: string,
    onClick?: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 12);
    bg.lineStyle(2, 0x2a2a30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 12);
    container.add(bg);

    // 标题
    const titleText = this.add
      .text(width / 2, height - 35, title, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#A8A6A3',
      })
      .setOrigin(0.5);
    container.add(titleText);

    if (onClick) {
      container.setInteractive(
        new Phaser.Geom.Rectangle(0, 0, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x1e1e24, 1);
        bg.fillRoundedRect(0, 0, width, height, 12);
        bg.lineStyle(3, 0x00ffaa, 1);
        bg.strokeRoundedRect(0, 0, width, height, 12);
        titleText.setColor('#00FFAA');
      });

      container.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x141419, 1);
        bg.fillRoundedRect(0, 0, width, height, 12);
        bg.lineStyle(2, 0x2a2a30, 1);
        bg.strokeRoundedRect(0, 0, width, height, 12);
        titleText.setColor('#A8A6A3');
      });

      container.on('pointerdown', onClick);
    }

    return container;
  }

  /**
   * 创建分类标题
   */
  protected createSectionTitle(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SECTION,
      color: '#00FFAA',
      fontStyle: 'bold',
    });
  }

  /**
   * 创建分隔线
   */
  protected createDivider(y: number, width: number): Phaser.GameObjects.Graphics {
    const line = this.add.graphics();
    line.lineStyle(2, 0x2a2a30, 0.5);
    line.lineBetween(40, y, width - 40, y);
    return line;
  }

  /**
   * 显示Toast提示
   */
  protected showToast(message: string, type: 'info' | 'success' | 'error' = 'info'): void {
    const { width } = this.scale;

    const colors = {
      info: 0x4a9eff,
      success: 0x00ffaa,
      error: 0xff4444,
    };

    const toast = this.add.container(width / 2, 150);
    toast.setDepth(1000);

    const bg = this.add.graphics();
    bg.fillStyle(colors[type], 0.9);
    bg.fillRoundedRect(-180, -25, 360, 50, 8);
    toast.add(bg);

    const text = this.add
      .text(0, 0, message, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#FFFFFF',
      })
      .setOrigin(0.5);
    toast.add(text);

    this.tweens.add({
      targets: toast,
      alpha: { from: 0, to: 1 },
      y: { from: 100, to: 150 },
      duration: 200,
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: toast,
            alpha: 0,
            duration: 200,
            onComplete: () => toast.destroy(),
          });
        });
      },
    });
  }

  /**
   * 场景关闭时清理
   */
  public shutdown(): void {
    // 清理输入事件
    this.input.removeAllListeners();
    // 子类可以覆写此方法添加额外清理逻辑
  }
}
