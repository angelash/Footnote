/**
 * 音频预览场景
 * 
 * 预览BGM/环境音/音效
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { BGM_CONFIGS, SFX_CONFIGS, AMBIENCE_CONFIGS, IBgmConfig, ISfxConfig, IAmbienceConfig } from '@/data/audioConfig';

interface IAudioCategory {
  name: string;
  icon: string;
  color: string;
  items: IAudioItem[];
}

interface IAudioItem {
  id: string;
  name: string;
  file: string;
  volume: number;
  loop?: boolean;
  type: 'bgm' | 'sfx' | 'ambience';
}

export class AudioPreviewScene extends BasePreviewScene {
  protected title = '🔊 音频预览';
  protected subtitle = '预览BGM/环境音/音效';

  private currentlyPlaying: Phaser.Sound.BaseSound | null = null;
  private currentPlayingId: string | null = null;
  private playingIndicators: Map<string, Phaser.GameObjects.Graphics> = new Map();

  constructor() {
    super({ key: 'AudioPreviewScene' });
  }

  protected createContent(width: number, height: number): void {
    let currentY = 30;

    const categories = this.getAudioCategories();

    // 统计
    const totalAudio = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    const stats = this.add.text(width / 2, currentY, `${categories.length} 个分类，共 ${totalAudio} 个音频`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#686868',
    }).setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 35;

    // 全局控制按钮
    const stopAllBtn = this.createStopAllButton(width / 2, currentY + 30);
    this.contentContainer.add(stopAllBtn);
    currentY += 80;

    // 分类展示
    categories.forEach((category) => {
      // 分类标题
      const sectionTitle = this.add.text(30, currentY, `${category.icon} ${category.name} (${category.items.length})`, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SECTION,
        color: category.color,
        fontStyle: 'bold',
      });
      this.contentContainer.add(sectionTitle);
      currentY += 55;

      // 音频列表
      category.items.forEach((item) => {
        const itemRow = this.createAudioItem(30, currentY, width - 60, 80, item, category.color);
        this.contentContainer.add(itemRow);
        currentY += 90;
      });

      currentY += 20;

      // 分隔线
      const divider = this.createDivider(currentY, width);
      this.contentContainer.add(divider);
      currentY += 40;
    });

    this.setContentHeight(currentY);
  }

  private getAudioCategories(): IAudioCategory[] {
    return [
      {
        name: 'BGM 背景音乐',
        icon: '🎵',
        color: '#00FFAA',
        items: BGM_CONFIGS.map(config => ({
          id: config.id,
          name: config.name,
          file: config.file,
          volume: config.volume,
          loop: config.loop,
          type: 'bgm' as const,
        })),
      },
      {
        name: '环境音 Ambience',
        icon: '🌿',
        color: '#4A9EFF',
        items: AMBIENCE_CONFIGS.map(config => ({
          id: config.id,
          name: config.name,
          file: config.file,
          volume: config.volume,
          loop: config.loop,
          type: 'ambience' as const,
        })),
      },
      {
        name: '音效 SFX',
        icon: '🔔',
        color: '#FFD700',
        items: SFX_CONFIGS.map(config => ({
          id: config.id,
          name: config.name,
          file: config.file,
          volume: config.volume,
          loop: config.loop,
          type: 'sfx' as const,
        })),
      },
    ];
  }

  private createStopAllButton(x: number, y: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0xFF4444, 0.2);
    bg.fillRoundedRect(-90, -22, 180, 44, 8);
    bg.lineStyle(2, 0xFF4444, 0.5);
    bg.strokeRoundedRect(-90, -22, 180, 44, 8);
    container.add(bg);

    const text = this.add.text(0, 0, '⏹ 停止所有', {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#FF4444',
    }).setOrigin(0.5);
    container.add(text);

    container.setInteractive(new Phaser.Geom.Rectangle(-90, -22, 180, 44), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xFF4444, 0.4);
      bg.fillRoundedRect(-90, -22, 180, 44, 8);
      bg.lineStyle(2, 0xFF4444, 1);
      bg.strokeRoundedRect(-90, -22, 180, 44, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xFF4444, 0.2);
      bg.fillRoundedRect(-90, -22, 180, 44, 8);
      bg.lineStyle(2, 0xFF4444, 0.5);
      bg.strokeRoundedRect(-90, -22, 180, 44, 8);
    });

    container.on('pointerdown', () => {
      this.stopAllAudio();
    });

    return container;
  }

  private createAudioItem(
    x: number,
    y: number,
    width: number,
    height: number,
    item: IAudioItem,
    accentColor: string
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 10);
    bg.lineStyle(1, 0x2A2A30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 10);
    container.add(bg);

    // 播放状态指示器
    const indicator = this.add.graphics();
    indicator.fillStyle(Phaser.Display.Color.HexStringToColor(accentColor).color, 0);
    indicator.fillCircle(30, height / 2, 8);
    container.add(indicator);
    this.playingIndicators.set(item.id, indicator);

    // 音频名称
    const nameText = this.add.text(55, 15, item.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#E8E6E3',
    });
    container.add(nameText);

    // 音频ID
    const idText = this.add.text(55, 48, item.id, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#4A4A4A',
    });
    container.add(idText);

    // 音量信息
    const volumeText = this.add.text(width - 250, height / 2, `音量: ${Math.round(item.volume * 100)}%`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#686868',
    }).setOrigin(0, 0.5);
    container.add(volumeText);

    // 循环标记
    if (item.loop) {
      const loopText = this.add.text(width - 130, height / 2, '🔁', {
        fontSize: '28px',
      }).setOrigin(0, 0.5);
      container.add(loopText);
    }

    // 播放按钮
    const playBtn = this.add.text(width - 55, height / 2, '▶', {
      fontSize: '36px',
      color: accentColor,
    }).setOrigin(0.5);
    playBtn.setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => {
      playBtn.setScale(1.2);
    });

    playBtn.on('pointerout', () => {
      playBtn.setScale(1);
    });

    playBtn.on('pointerdown', () => {
      this.toggleAudio(item, playBtn, indicator, accentColor);
    });

    container.add(playBtn);

    // 行交互
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width - 100, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(0, 0, width, height, 10);
      bg.lineStyle(1, 0x3A3A40, 1);
      bg.strokeRoundedRect(0, 0, width, height, 10);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(0, 0, width, height, 10);
      bg.lineStyle(1, 0x2A2A30, 1);
      bg.strokeRoundedRect(0, 0, width, height, 10);
    });

    return container;
  }

  private toggleAudio(
    item: IAudioItem,
    playBtn: Phaser.GameObjects.Text,
    indicator: Phaser.GameObjects.Graphics,
    accentColor: string
  ): void {
    const colorValue = Phaser.Display.Color.HexStringToColor(accentColor).color;

    // 如果正在播放这个音频，停止它
    if (this.currentPlayingId === item.id) {
      this.stopCurrentAudio();
      playBtn.setText('▶');
      return;
    }

    // 停止当前播放的音频
    this.stopCurrentAudio();

    // 检查音频是否已加载
    if (!this.cache.audio.exists(item.id)) {
      // 加载音频
      this.load.audio(item.id, item.file);
      this.load.once('complete', () => {
        this.playAudio(item, playBtn, indicator, colorValue);
      });
      this.load.start();

      // 显示加载中
      playBtn.setText('⏳');
    } else {
      this.playAudio(item, playBtn, indicator, colorValue);
    }
  }

  private playAudio(
    item: IAudioItem,
    playBtn: Phaser.GameObjects.Text,
    indicator: Phaser.GameObjects.Graphics,
    colorValue: number
  ): void {
    const sound = this.sound.add(item.id, {
      volume: item.volume,
      loop: item.loop ?? false,
    });

    sound.play();
    this.currentlyPlaying = sound;
    this.currentPlayingId = item.id;

    // 更新UI
    playBtn.setText('⏸');
    indicator.clear();
    indicator.fillStyle(colorValue, 1);
    indicator.fillCircle(30, 40, 8);

    // 播放动画
    this.tweens.add({
      targets: indicator,
      alpha: { from: 1, to: 0.3 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // 监听播放结束
    if (!item.loop) {
      sound.once('complete', () => {
        this.onAudioComplete(item.id, playBtn, indicator);
      });
    }
  }

  private onAudioComplete(
    audioId: string,
    playBtn: Phaser.GameObjects.Text,
    indicator: Phaser.GameObjects.Graphics
  ): void {
    if (this.currentPlayingId === audioId) {
      this.currentlyPlaying = null;
      this.currentPlayingId = null;

      playBtn.setText('▶');
      this.tweens.killTweensOf(indicator);
      indicator.clear();
      indicator.fillStyle(0x000000, 0);
      indicator.fillCircle(30, 40, 8);
    }
  }

  private stopCurrentAudio(): void {
    if (this.currentlyPlaying) {
      this.currentlyPlaying.stop();
      
      // 重置之前播放的音频按钮
      const indicator = this.playingIndicators.get(this.currentPlayingId || '');
      if (indicator) {
        this.tweens.killTweensOf(indicator);
        indicator.clear();
        indicator.fillStyle(0x000000, 0);
        indicator.fillCircle(30, 40, 8);
      }

      this.currentlyPlaying = null;
      this.currentPlayingId = null;
    }
  }

  private stopAllAudio(): void {
    this.sound.stopAll();
    this.currentlyPlaying = null;
    this.currentPlayingId = null;

    // 重置所有指示器
    this.playingIndicators.forEach((indicator) => {
      this.tweens.killTweensOf(indicator);
      indicator.clear();
      indicator.fillStyle(0x000000, 0);
      indicator.fillCircle(30, 40, 8);
    });
  }

  protected goBack(): void {
    // 停止所有音频再返回
    this.stopAllAudio();
    super.goBack();
  }

  shutdown(): void {
    this.stopAllAudio();
  }
}

