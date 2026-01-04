/**
 * 版本切换动画效果
 * C5章节版本冲突的视觉表现
 * @module systems/ui/VersionSwitchEffect
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';

export interface IVersionInfo {
  id: string;
  name: string;
  color: number;
  bgKey?: string;
}

interface IVersionSwitchEffectConfig {
  scene: Phaser.Scene;
}

/**
 * 版本切换效果
 */
export class VersionSwitchEffect {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _splitLine!: Phaser.GameObjects.Rectangle;
  private _versionALabel!: Phaser.GameObjects.Text;
  private _versionBLabel!: Phaser.GameObjects.Text;
  private _confirmPanel!: Phaser.GameObjects.Container;

  private _isActive: boolean = false;
  private _currentVersions: { a: IVersionInfo; b: IVersionInfo } | null = null;
  private _selectedVersion: string | null = null;

  constructor(config: IVersionSwitchEffectConfig) {
    this._scene = config.scene;
    this._createComponents();
  }

  /**
   * 创建组件
   */
  private _createComponents(): void {
    const { width, height } = this._scene.scale;

    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(600);
    this._container.setAlpha(0);

    // 分割线
    this._splitLine = this._scene.add.rectangle(width / 2, height / 2, 4, 0, 0xffffff, 0.8);
    this._container.add(this._splitLine);

    // 版本A标签
    this._versionALabel = this._scene.add.text(width * 0.25, 150, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#4488ff',
      backgroundColor: '#1a1a2e',
      padding: { x: 10, y: 5 },
    });
    this._versionALabel.setOrigin(0.5);
    this._container.add(this._versionALabel);

    // 版本B标签
    this._versionBLabel = this._scene.add.text(width * 0.75, 150, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ff8844',
      backgroundColor: '#1a1a2e',
      padding: { x: 10, y: 5 },
    });
    this._versionBLabel.setOrigin(0.5);
    this._container.add(this._versionBLabel);

    // 确认面板
    this._createConfirmPanel();
  }

  /**
   * 创建确认面板
   */
  private _createConfirmPanel(): void {
    const { width, height } = this._scene.scale;

    this._confirmPanel = this._scene.add.container(width / 2, height - 150);
    this._confirmPanel.setAlpha(0);
    this._container.add(this._confirmPanel);

    // 背景
    const bg = this._scene.add.rectangle(0, 0, 400, 120, 0x1a1a2e, 0.95);
    bg.setStrokeStyle(2, 0x4a4a6a);
    this._confirmPanel.add(bg);

    // 提示文字
    const hint = this._scene.add.text(0, -35, '选择要保留的版本', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#aaaacc',
    });
    hint.setOrigin(0.5);
    this._confirmPanel.add(hint);

    // 版本A按钮
    const btnA = this._scene.add.rectangle(-100, 20, 150, 50, 0x2a3a5a, 1);
    btnA.setStrokeStyle(2, 0x4488ff);
    btnA.setInteractive({ useHandCursor: true });
    btnA.on('pointerover', () => btnA.setFillStyle(0x3a4a7a));
    btnA.on('pointerout', () => btnA.setFillStyle(0x2a3a5a));
    btnA.on('pointerdown', () => this._selectVersion('A'));
    this._confirmPanel.add(btnA);

    const btnAText = this._scene.add.text(-100, 20, '版本 A', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#4488ff',
    });
    btnAText.setOrigin(0.5);
    this._confirmPanel.add(btnAText);

    // 版本B按钮
    const btnB = this._scene.add.rectangle(100, 20, 150, 50, 0x5a3a2a, 1);
    btnB.setStrokeStyle(2, 0xff8844);
    btnB.setInteractive({ useHandCursor: true });
    btnB.on('pointerover', () => btnB.setFillStyle(0x7a4a3a));
    btnB.on('pointerout', () => btnB.setFillStyle(0x5a3a2a));
    btnB.on('pointerdown', () => this._selectVersion('B'));
    this._confirmPanel.add(btnB);

    const btnBText = this._scene.add.text(100, 20, '版本 B', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff8844',
    });
    btnBText.setOrigin(0.5);
    this._confirmPanel.add(btnBText);
  }

  /**
   * 显示版本冲突
   */
  public showVersionConflict(versionA: IVersionInfo, versionB: IVersionInfo): void {
    if (this._isActive) return;

    this._isActive = true;
    this._currentVersions = { a: versionA, b: versionB };
    this._selectedVersion = null;

    const { height } = this._scene.scale;

    // 更新标签
    this._versionALabel.setText(`V-${versionA.name}`);
    this._versionBLabel.setText(`V-${versionB.name}`);

    // 分割线动画
    this._splitLine.setSize(4, 0);
    this._scene.tweens.add({
      targets: this._splitLine,
      displayHeight: height,
      duration: 500,
      ease: 'Sine.easeOut',
    });

    // 整体淡入
    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: 300,
    });

    // 标签滑入
    this._versionALabel.x = -100;
    this._versionBLabel.x = this._scene.scale.width + 100;

    this._scene.tweens.add({
      targets: this._versionALabel,
      x: this._scene.scale.width * 0.25,
      duration: 400,
      delay: 300,
      ease: 'Back.easeOut',
    });

    this._scene.tweens.add({
      targets: this._versionBLabel,
      x: this._scene.scale.width * 0.75,
      duration: 400,
      delay: 300,
      ease: 'Back.easeOut',
    });

    // 确认面板延迟显示
    this._scene.time.delayedCall(800, () => {
      this._scene.tweens.add({
        targets: this._confirmPanel,
        alpha: 1,
        y: this._scene.scale.height - 130,
        duration: 300,
        ease: 'Back.easeOut',
      });
    });

    // 播放音效
    eventBus.emit(GameEvent.PLAY_SFX, { key: 'sfx_version_conflict' });
  }

  /**
   * 选择版本
   */
  private _selectVersion(version: 'A' | 'B'): void {
    this._selectedVersion = version;
    const { width, height } = this._scene.scale;

    // 隐藏确认面板
    this._scene.tweens.add({
      targets: this._confirmPanel,
      alpha: 0,
      duration: 200,
    });

    // 选中动画
    const selectedLabel = version === 'A' ? this._versionALabel : this._versionBLabel;
    const discardedLabel = version === 'A' ? this._versionBLabel : this._versionALabel;

    // 选中标签居中放大
    this._scene.tweens.add({
      targets: selectedLabel,
      x: width / 2,
      scale: 1.3,
      duration: 500,
      ease: 'Sine.easeInOut',
    });

    // 淘汰标签消失
    this._scene.tweens.add({
      targets: discardedLabel,
      alpha: 0,
      scale: 0.5,
      duration: 300,
    });

    // 分割线消失
    this._scene.tweens.add({
      targets: this._splitLine,
      alpha: 0,
      duration: 300,
    });

    // 全屏闪烁确认
    const flash = this._scene.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      version === 'A' ? 0x4488ff : 0xff8844,
      0
    );
    flash.setDepth(700);

    this._scene.tweens.add({
      targets: flash,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        flash.destroy();
        this._completeSelection(version);
      },
    });

    // 播放音效
    eventBus.emit(GameEvent.PLAY_SFX, { key: 'sfx_version_select' });
  }

  /**
   * 完成选择
   */
  private _completeSelection(version: 'A' | 'B'): void {
    const selectedVersion = version === 'A' ? this._currentVersions?.a : this._currentVersions?.b;

    // 淡出整体
    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        this._isActive = false;
        this._resetComponents();

        // 发送事件
        eventBus.emit('version:selected', {
          selectedVersion,
          discardedVersion: version === 'A' ? this._currentVersions?.b : this._currentVersions?.a,
        });
      },
    });
  }

  /**
   * 重置组件状态
   */
  private _resetComponents(): void {
    const { width, height } = this._scene.scale;

    this._versionALabel.setPosition(width * 0.25, 150);
    this._versionALabel.setScale(1);
    this._versionALabel.setAlpha(1);

    this._versionBLabel.setPosition(width * 0.75, 150);
    this._versionBLabel.setScale(1);
    this._versionBLabel.setAlpha(1);

    this._splitLine.setAlpha(1);
    this._splitLine.setSize(4, 0);

    this._confirmPanel.setPosition(width / 2, height - 150);
    this._confirmPanel.setAlpha(0);
  }

  /**
   * 快速切换效果（无选择）
   */
  public quickSwitch(
    _fromVersion: IVersionInfo,
    toVersion: IVersionInfo,
    callback?: () => void
  ): void {
    const { width, height } = this._scene.scale;

    // 创建过渡效果
    const mask = this._scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
    mask.setDepth(700);

    // 版本标签
    const versionText = this._scene.add.text(width / 2, height / 2, `→ V-${toVersion.name}`, {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: `#${toVersion.color.toString(16).padStart(6, '0')}`,
    });
    versionText.setOrigin(0.5);
    versionText.setDepth(701);
    versionText.setAlpha(0);

    // 动画序列
    this._scene.tweens.add({
      targets: mask,
      alpha: 0.8,
      duration: 200,
      onComplete: () => {
        this._scene.tweens.add({
          targets: versionText,
          alpha: 1,
          scale: { from: 0.8, to: 1 },
          duration: 300,
          onComplete: () => {
            this._scene.time.delayedCall(500, () => {
              this._scene.tweens.add({
                targets: [mask, versionText],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                  mask.destroy();
                  versionText.destroy();
                  callback?.();
                },
              });
            });
          },
        });
      },
    });
  }

  /**
   * 是否激活
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * 获取选中的版本
   */
  public getSelectedVersion(): string | null {
    return this._selectedVersion;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this._container?.destroy();
  }
}
