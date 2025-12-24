/**
 * 主菜单场景
 */
import Phaser from 'phaser';
import { SCENES, TEXT_STYLES, COLORS } from '@/config/game.config';

export class MenuScene extends Phaser.Scene {
  private _title!: Phaser.GameObjects.Text;
  private _subtitle!: Phaser.GameObjects.Text;
  private _buttons: Phaser.GameObjects.Container[] = [];

  constructor() {
    super({ key: SCENES.MENU });
  }

  create(): void {
    console.log('[MenuScene] 创建主菜单');

    const { width, height } = this.scale;

    // 背景
    this.add.rectangle(0, 0, width, height, COLORS.BG_PRIMARY).setOrigin(0);

    // 标题
    this._createTitle(width, height);

    // 菜单按钮
    this._createMenuButtons(width, height);

    // 版本信息
    this._createVersionInfo(width, height);

    // 入场动画
    this._playIntroAnimation();
  }

  private _createTitle(width: number, height: number): void {
    // 主标题
    this._title = this.add.text(width / 2, height * 0.3, '备 注', {
      ...TEXT_STYLES.TITLE,
      fontSize: '48px',
    })
      .setOrigin(0.5)
      .setAlpha(0);

    // 副标题
    this._subtitle = this.add.text(width / 2, height * 0.3 + 60, 'FOOTNOTE', {
      ...TEXT_STYLES.MUTED,
      fontSize: '16px',
      letterSpacing: 8,
    })
      .setOrigin(0.5)
      .setAlpha(0);

    // 标语
    this.add.text(width / 2, height * 0.3 + 100, 
      '你生活在一个二维世界，\n但你能短暂触碰更高维度——\n代价是：世界会记住你做过的一切。', {
      ...TEXT_STYLES.BODY,
      fontSize: '14px',
      align: 'center',
      color: '#686868',
    })
      .setOrigin(0.5)
      .setAlpha(0);
  }

  private _createMenuButtons(width: number, height: number): void {
    const buttonData = [
      { text: '开始游戏', action: () => this._startNewGame() },
      { text: '继续游戏', action: () => this._continueGame() },
      { text: '设置', action: () => this._openSettings() },
    ];

    const startY = height * 0.55;
    const spacing = 80;

    buttonData.forEach((data, index) => {
      const button = this._createButton(
        width / 2,
        startY + index * spacing,
        data.text,
        data.action
      );
      this._buttons.push(button);
    });
  }

  private _createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 按钮背景
    const bg = this.add.graphics();
    bg.fillStyle(0x1E1E24, 1);
    bg.fillRoundedRect(-120, -30, 240, 60, 8);
    bg.lineStyle(1, 0x3A3A40, 1);
    bg.strokeRoundedRect(-120, -30, 240, 60, 8);

    // 按钮文字
    const label = this.add.text(0, 0, text, {
      ...TEXT_STYLES.BODY,
      fontSize: '18px',
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(240, 60);
    container.setAlpha(0);

    // 交互
    container.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x2A2A30, 1);
        bg.fillRoundedRect(-120, -30, 240, 60, 8);
        bg.lineStyle(1, 0x00FFAA, 1);
        bg.strokeRoundedRect(-120, -30, 240, 60, 8);
        label.setColor('#00FFAA');
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x1E1E24, 1);
        bg.fillRoundedRect(-120, -30, 240, 60, 8);
        bg.lineStyle(1, 0x3A3A40, 1);
        bg.strokeRoundedRect(-120, -30, 240, 60, 8);
        label.setColor('#E8E6E3');
      })
      .on('pointerdown', () => {
        this.tweens.add({
          targets: container,
          scale: 0.95,
          duration: 100,
          yoyo: true,
          onComplete: callback,
        });
      });

    return container;
  }

  private _createVersionInfo(width: number, height: number): void {
    const version = __VERSION__ || '0.1.0';
    this.add.text(width / 2, height - 30, `v${version}`, {
      ...TEXT_STYLES.MUTED,
      fontSize: '12px',
    }).setOrigin(0.5);
  }

  private _playIntroAnimation(): void {
    // 标题动画
    this.tweens.add({
      targets: this._title,
      alpha: 1,
      y: this._title.y + 20,
      duration: 800,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: this._subtitle,
      alpha: 1,
      delay: 200,
      duration: 800,
      ease: 'Power2',
    });

    // 标语
    this.tweens.add({
      targets: this.children.list[3], // 标语文字
      alpha: 0.8,
      delay: 400,
      duration: 800,
      ease: 'Power2',
    });

    // 按钮动画
    this._buttons.forEach((button, index) => {
      this.tweens.add({
        targets: button,
        alpha: 1,
        y: button.y + 20,
        delay: 600 + index * 100,
        duration: 500,
        ease: 'Power2',
      });
    });
  }

  private _startNewGame(): void {
    console.log('[MenuScene] 开始新游戏');

    // 淡出过渡
    this.cameras.main.fadeOut(500, 10, 10, 15);

    this.cameras.main.once('camerafadeoutcomplete', () => {
      // TODO: 初始化新游戏状态
      this.scene.start(SCENES.GAME, { zoneId: 'C0-Z1', isNewGame: true });
    });
  }

  private _continueGame(): void {
    console.log('[MenuScene] 继续游戏');

    // TODO: 检查是否有存档
    // 如果有，加载存档并进入对应Zone
    // 如果没有，提示无存档

    // 临时：直接进入游戏
    this.scene.start(SCENES.GAME, { zoneId: 'C0-Z1', isNewGame: false });
  }

  private _openSettings(): void {
    console.log('[MenuScene] 打开设置');
    // TODO: 实现设置界面
  }
}

