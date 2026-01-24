/**
 * 动画预览场景
 *
 * 预览可动物件的动画帧
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { ANIMATED_OBJECTS, IWebpSpritesheetAsset } from '@/data/webpAssets';

interface IAnimationItem {
  key: string;
  name: string;
  asset: IWebpSpritesheetAsset;
}

export class AnimationPreviewScene extends BasePreviewScene {
  protected title = '🎬 动画预览';
  protected subtitle = '预览可动物件动画帧';

  private previewContainer!: Phaser.GameObjects.Container;
  private isFullPreview = false;
  private currentAnimation: IAnimationItem | null = null;
  private animationSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();

  constructor() {
    super({ key: 'AnimationPreviewScene' });
  }

  protected createContent(width: number, _height: number): void {
    let currentY = 30;

    // 获取动画列表
    const animations = this.getAnimationList();

    // 统计
    const stats = this.add
      .text(width / 2, currentY, `共 ${animations.length} 个动画`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#686868',
      })
      .setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 55;

    // 动画卡片 - 放大尺寸
    const cardWidth = width - 60;
    const cardHeight = 250;
    const cardPadding = 25;

    animations.forEach((anim, index) => {
      const y = currentY + index * (cardHeight + cardPadding);
      const card = this.createAnimationCard(30, y, cardWidth, cardHeight, anim);
      this.contentContainer.add(card);
    });

    currentY += animations.length * (cardHeight + cardPadding) + 20;
    this.setContentHeight(currentY);

    // 全屏预览容器
    this.previewContainer = this.add.container(0, 0);
    this.previewContainer.setDepth(200);
    this.previewContainer.setVisible(false);
  }

  private getAnimationList(): IAnimationItem[] {
    const animations: IAnimationItem[] = [];
    const nameMap: Record<string, string> = {
      anim_lamp_flicker: '台灯闪烁',
      anim_oil_lamp: '油灯火焰',
      anim_candle: '蜡烛燃烧',
      anim_monitor: '监视器闪烁',
      anim_crack: '裂缝颤动',
      anim_rune: '符文发光',
    };

    Object.entries(ANIMATED_OBJECTS).forEach(([key, asset]) => {
      animations.push({
        key,
        name: nameMap[key] || key,
        asset,
      });
    });

    return animations;
  }

  private createAnimationCard(
    x: number,
    y: number,
    width: number,
    height: number,
    anim: IAnimationItem
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 12);
    bg.lineStyle(1, 0x2a2a30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 12);
    container.add(bg);

    // 动画名称
    const nameText = this.add.text(25, 18, anim.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SECTION,
      color: '#E8E6E3',
      fontStyle: 'bold',
    });
    container.add(nameText);

    // 动画键名
    const keyText = this.add.text(25, 58, anim.key, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#686868',
    });
    container.add(keyText);

    // 帧数信息
    const frameInfo = this.add.text(25, 88, `${anim.asset.frameCount} 帧`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#4A9EFF',
    });
    container.add(frameInfo);

    // 帧预览区域 - 放大帧
    const framePreviewX = 25;
    const framePreviewY = 125;
    const frameSize = 90;
    const framePadding = 15;

    anim.asset.frames.forEach((frameUrl, index) => {
      const fx = framePreviewX + index * (frameSize + framePadding);

      // 帧背景
      const frameBg = this.add.graphics();
      frameBg.fillStyle(0x1e1e24, 1);
      frameBg.fillRoundedRect(fx, framePreviewY, frameSize, frameSize, 6);
      container.add(frameBg);

      // 帧编号
      const frameNum = this.add
        .text(fx + frameSize / 2, framePreviewY + frameSize + 12, `#${index + 1}`, {
          fontFamily: 'Noto Sans SC',
          fontSize: this.FONT_SIZE.SMALL,
          color: '#4A4A4A',
        })
        .setOrigin(0.5);
      container.add(frameNum);

      // 尝试加载帧图片
      const frameKey = `${anim.key}_frame_${index}`;
      if (this.textures.exists(frameKey)) {
        const frameImg = this.add.image(
          fx + frameSize / 2,
          framePreviewY + frameSize / 2,
          frameKey
        );
        const scale = Math.min(
          (frameSize - 15) / frameImg.width,
          (frameSize - 15) / frameImg.height
        );
        frameImg.setScale(scale);
        container.add(frameImg);
      } else {
        // 加载
        this.load.image(frameKey, frameUrl);
        const loading = this.add
          .text(fx + frameSize / 2, framePreviewY + frameSize / 2, '⏳', {
            fontSize: '28px',
          })
          .setOrigin(0.5);
        container.add(loading);
      }
    });

    // 启动加载
    this.load.start();

    // 播放按钮
    const playBtn = this.add
      .text(width - 100, height / 2, '▶ 播放', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#00FFAA',
      })
      .setOrigin(0.5);
    container.add(playBtn);

    // 交互
    container.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1e1e24, 1);
      bg.fillRoundedRect(0, 0, width, height, 12);
      bg.lineStyle(2, 0x00ffaa, 1);
      bg.strokeRoundedRect(0, 0, width, height, 12);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(0, 0, width, height, 12);
      bg.lineStyle(1, 0x2a2a30, 1);
      bg.strokeRoundedRect(0, 0, width, height, 12);
    });

    container.on('pointerdown', () => {
      this.showAnimationPreview(anim);
    });

    return container;
  }

  private showAnimationPreview(anim: IAnimationItem): void {
    this.currentAnimation = anim;
    this.isFullPreview = true;
    const { width, height } = this.scale;

    this.previewContainer.removeAll(true);

    // 背景
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.95).setOrigin(0);
    overlay.setInteractive();
    overlay.on('pointerdown', () => this.hideFullPreview());
    this.previewContainer.add(overlay);

    // 标题
    const titleText = this.add
      .text(width / 2, 60, anim.name, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SECTION,
        color: '#00FFAA',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.previewContainer.add(titleText);

    // 创建动画 spritesheet
    this.createAnimationSpritesheet(anim, width / 2, height / 2);

    // 控制按钮
    const controlY = height - 130;

    // 播放/暂停按钮
    const playPauseBtn = this.add
      .text(width / 2 - 120, controlY, '⏸ 暂停', {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#4A9EFF',
        backgroundColor: '#1E1E24',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5);
    playPauseBtn.setInteractive({ useHandCursor: true });
    let isPlaying = true;
    playPauseBtn.on('pointerdown', () => {
      const sprite = this.animationSprites.get(anim.key);
      if (sprite) {
        if (isPlaying) {
          sprite.anims.pause();
          playPauseBtn.setText('▶ 播放');
        } else {
          sprite.anims.resume();
          playPauseBtn.setText('⏸ 暂停');
        }
        isPlaying = !isPlaying;
      }
    });
    this.previewContainer.add(playPauseBtn);

    // 速度控制
    let speed = 1;
    const speedText = this.add
      .text(width / 2 + 120, controlY, `速度: ${speed}x`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.NORMAL,
        color: '#FFD700',
        backgroundColor: '#1E1E24',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(0.5);
    speedText.setInteractive({ useHandCursor: true });
    speedText.on('pointerdown', () => {
      speed = speed >= 2 ? 0.5 : speed + 0.5;
      speedText.setText(`速度: ${speed}x`);
      const sprite = this.animationSprites.get(anim.key);
      if (sprite && sprite.anims.currentAnim) {
        sprite.anims.timeScale = speed;
      }
    });
    this.previewContainer.add(speedText);

    // 关闭按钮
    const closeBtn = this.add
      .text(width - 50, 40, '✕', {
        fontSize: '36px',
        color: '#A8A6A3',
      })
      .setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#A8A6A3'));
    closeBtn.on('pointerdown', () => this.hideFullPreview());
    this.previewContainer.add(closeBtn);

    // 帧信息
    const frameInfoText = this.add
      .text(width / 2, height - 50, `${anim.asset.frameCount} 帧 | 按 ESC 关闭`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#4A4A4A',
      })
      .setOrigin(0.5);
    this.previewContainer.add(frameInfoText);

    this.previewContainer.setVisible(true);
    this.previewContainer.setAlpha(0);
    this.tweens.add({
      targets: this.previewContainer,
      alpha: 1,
      duration: 200,
    });
  }

  private createAnimationSpritesheet(anim: IAnimationItem, x: number, y: number): void {
    // 检查是否所有帧都已加载
    const allFramesLoaded = anim.asset.frames.every((_, index) => {
      const frameKey = `${anim.key}_frame_${index}`;
      return this.textures.exists(frameKey);
    });

    if (!allFramesLoaded) {
      // 加载所有帧
      anim.asset.frames.forEach((frameUrl, index) => {
        const frameKey = `${anim.key}_frame_${index}`;
        if (!this.textures.exists(frameKey)) {
          this.load.image(frameKey, frameUrl);
        }
      });

      this.load.once('complete', () => {
        this.buildAnimation(anim, x, y);
      });
      this.load.start();

      // 显示加载中
      const loadingText = this.add
        .text(x, y, '加载中...', {
          fontFamily: 'Noto Sans SC',
          fontSize: this.FONT_SIZE.NORMAL,
          color: '#686868',
        })
        .setOrigin(0.5);
      this.previewContainer.add(loadingText);
    } else {
      this.buildAnimation(anim, x, y);
    }
  }

  private buildAnimation(anim: IAnimationItem, x: number, y: number): void {
    // 创建动画配置
    const frames = anim.asset.frames.map((_, index) => ({
      key: `${anim.key}_frame_${index}`,
    }));

    // 如果动画已存在则跳过
    if (!this.anims.exists(anim.key)) {
      this.anims.create({
        key: anim.key,
        frames: frames,
        frameRate: 4,
        repeat: -1,
      });
    }

    // 创建精灵并播放
    const firstFrameKey = `${anim.key}_frame_0`;
    if (this.textures.exists(firstFrameKey)) {
      const sprite = this.add.sprite(x, y, firstFrameKey);
      sprite.setScale(2); // 放大显示
      sprite.play(anim.key);
      this.animationSprites.set(anim.key, sprite);
      this.previewContainer.add(sprite);
    }
  }

  private hideFullPreview(): void {
    this.isFullPreview = false;

    // 停止动画
    if (this.currentAnimation) {
      const sprite = this.animationSprites.get(this.currentAnimation.key);
      if (sprite) {
        sprite.anims.stop();
      }
    }
    this.currentAnimation = null;

    this.tweens.add({
      targets: this.previewContainer,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.previewContainer.setVisible(false);
        this.previewContainer.removeAll(true);
        this.animationSprites.clear();
      },
    });
  }

  protected setupKeyboard(): void {
    super.setupKeyboard();

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.isFullPreview) {
        this.hideFullPreview();
      } else {
        this.goBack();
      }
    });
  }
}
