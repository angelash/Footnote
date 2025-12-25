/**
 * 暂停菜单UI
 * 包含继续游戏、设置、存档、读档、返回主菜单等功能
 * @module systems/ui/PauseMenu
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { saveManager } from '@/systems/save';
import { TEXT_STYLES, COLORS, SCENES } from '@/config/game.config';
import type { IGameSettings } from '@/systems/save';

// ==================== 配置常量 ====================

const CONFIG = {
  /** 菜单宽度 */
  MENU_WIDTH: 400,
  /** 按钮高度 */
  BUTTON_HEIGHT: 50,
  /** 按钮间距 */
  BUTTON_SPACING: 15,
  /** 设置面板宽度 */
  SETTINGS_WIDTH: 500,
  /** 滑块宽度 */
  SLIDER_WIDTH: 200,
};

// ==================== 类型定义 ====================

interface IPauseMenuConfig {
  scene: Phaser.Scene;
  onResume?: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onSettings?: () => void;
  onMainMenu?: () => void;
  onQuit?: () => void;
}

// ==================== PauseMenu类 ====================

/**
 * 暂停菜单
 */
export class PauseMenu {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _mainMenuContainer!: Phaser.GameObjects.Container;
  private _settingsContainer!: Phaser.GameObjects.Container;
  private _settings: IGameSettings;
  private _callbacks: IPauseMenuConfig;

  // 设置控件引用
  private _volumeSliders: Map<string, { bar: Phaser.GameObjects.Graphics; handle: Phaser.GameObjects.Rectangle }> = new Map();

  constructor(config: IPauseMenuConfig) {
    this._scene = config.scene;
    this._callbacks = config;
    this._settings = saveManager.getSettings();
    this._createUI();
  }

  // ==================== 公共方法 ====================

  /**
   * 显示暂停菜单
   */
  show(): void {
    // 显示主菜单，隐藏设置面板
    this._mainMenuContainer.setVisible(true);
    this._settingsContainer.setVisible(false);

    this._container.setVisible(true);
    this._container.setAlpha(0);

    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });

    eventBus.emitTyped(GameEvent.GAME_PAUSE, {});
  }

  /**
   * 隐藏暂停菜单
   */
  hide(): void {
    this._scene.tweens.add({
      targets: this._container,
      alpha: 0,
      duration: 150,
      ease: 'Power2',
      onComplete: () => {
        this._container.setVisible(false);
        eventBus.emitTyped(GameEvent.GAME_RESUME, {});
      },
    });
  }

  /**
   * 是否可见
   */
  isVisible(): boolean {
    return this._container.visible;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this._container.destroy();
  }

  // ==================== 私有方法 - UI创建 ====================

  private _createUI(): void {
    const { width, height } = this._scene.scale;

    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(2000);
    this._container.setVisible(false);

    // 半透明背景
    const overlay = this._scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
    this._container.add(overlay);

    // 创建主菜单
    this._createMainMenu(width, height);

    // 创建设置面板
    this._createSettingsPanel(width, height);
  }

  private _createMainMenu(width: number, height: number): void {
    this._mainMenuContainer = this._scene.add.container(width / 2, height / 2);

    // 标题
    const title = this._scene.add.text(0, -200, '暂停', {
      ...TEXT_STYLES.TITLE,
      fontSize: '36px',
    }).setOrigin(0.5);
    this._mainMenuContainer.add(title);

    // 菜单按钮
    const buttons = [
      { text: '继续游戏', callback: () => this._onResume() },
      { text: '游戏设置', callback: () => this._showSettings() },
      { text: '保存进度', callback: () => this._onSave() },
      { text: '读取存档', callback: () => this._onLoad() },
      { text: '返回主菜单', callback: () => this._onQuit() },
    ];

    buttons.forEach((btn, index) => {
      const y = -80 + index * (CONFIG.BUTTON_HEIGHT + CONFIG.BUTTON_SPACING);
      const button = this._createButton(0, y, btn.text, btn.callback);
      this._mainMenuContainer.add(button);
    });

    this._container.add(this._mainMenuContainer);
  }

  private _createSettingsPanel(width: number, height: number): void {
    this._settingsContainer = this._scene.add.container(width / 2, height / 2);
    this._settingsContainer.setVisible(false);

    // 标题
    const title = this._scene.add.text(0, -250, '设置', {
      ...TEXT_STYLES.TITLE,
      fontSize: '32px',
    }).setOrigin(0.5);
    this._settingsContainer.add(title);

    // 音量设置
    const volumeSettings = [
      { key: 'masterVolume', label: '主音量', y: -150 },
      { key: 'bgmVolume', label: '音乐音量', y: -80 },
      { key: 'sfxVolume', label: '音效音量', y: -10 },
    ];

    volumeSettings.forEach(setting => {
      this._createVolumeSlider(setting.label, setting.key, setting.y);
    });

    // 文字速度
    const speedLabel = this._scene.add.text(-CONFIG.SETTINGS_WIDTH / 2 + 30, 60, '文字速度', {
      ...TEXT_STYLES.BODY,
      fontSize: '16px',
    });
    this._settingsContainer.add(speedLabel);

    const speeds = [
      { value: 'slow', label: '慢' },
      { value: 'normal', label: '正常' },
      { value: 'fast', label: '快' },
      { value: 'instant', label: '立即' },
    ];

    speeds.forEach((speed, index) => {
      const x = CONFIG.SETTINGS_WIDTH / 2 - 200 + index * 60;
      const btn = this._createRadioButton(x, 60, speed.label, speed.value === this._settings.textSpeed, () => {
        this._settings.textSpeed = speed.value as IGameSettings['textSpeed'];
        this._updateSpeedButtons();
        this._saveSettings();
      });
      btn.setName(`speed_${speed.value}`);
      this._settingsContainer.add(btn);
    });

    // 自动播放
    const autoPlayLabel = this._scene.add.text(-CONFIG.SETTINGS_WIDTH / 2 + 30, 130, '自动播放', {
      ...TEXT_STYLES.BODY,
      fontSize: '16px',
    });
    this._settingsContainer.add(autoPlayLabel);

    const autoPlayToggle = this._createToggle(
      CONFIG.SETTINGS_WIDTH / 2 - 60,
      130,
      this._settings.autoPlay,
      (value) => {
        this._settings.autoPlay = value;
        this._saveSettings();
      }
    );
    autoPlayToggle.setName('autoPlayToggle');
    this._settingsContainer.add(autoPlayToggle);

    // 返回按钮
    const backBtn = this._createButton(0, 220, '返回', () => this._hideSettings());
    this._settingsContainer.add(backBtn);

    this._container.add(this._settingsContainer);
  }

  private _createButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);
    const buttonWidth = CONFIG.MENU_WIDTH;

    // 背景
    const bg = this._scene.add.graphics();
    bg.fillStyle(COLORS.BG_TERTIARY, 1);
    bg.fillRoundedRect(-buttonWidth / 2, -CONFIG.BUTTON_HEIGHT / 2, buttonWidth, CONFIG.BUTTON_HEIGHT, 8);
    bg.lineStyle(1, COLORS.BORDER, 1);
    bg.strokeRoundedRect(-buttonWidth / 2, -CONFIG.BUTTON_HEIGHT / 2, buttonWidth, CONFIG.BUTTON_HEIGHT, 8);

    // 文字
    const label = this._scene.add.text(0, 0, text, {
      ...TEXT_STYLES.BODY,
      fontSize: '18px',
    }).setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(buttonWidth, CONFIG.BUTTON_HEIGHT);

    // 交互
    container.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_SECONDARY, 1);
        bg.fillRoundedRect(-buttonWidth / 2, -CONFIG.BUTTON_HEIGHT / 2, buttonWidth, CONFIG.BUTTON_HEIGHT, 8);
        bg.lineStyle(2, COLORS.ACCENT, 1);
        bg.strokeRoundedRect(-buttonWidth / 2, -CONFIG.BUTTON_HEIGHT / 2, buttonWidth, CONFIG.BUTTON_HEIGHT, 8);
        label.setColor('#00FFAA');
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_TERTIARY, 1);
        bg.fillRoundedRect(-buttonWidth / 2, -CONFIG.BUTTON_HEIGHT / 2, buttonWidth, CONFIG.BUTTON_HEIGHT, 8);
        bg.lineStyle(1, COLORS.BORDER, 1);
        bg.strokeRoundedRect(-buttonWidth / 2, -CONFIG.BUTTON_HEIGHT / 2, buttonWidth, CONFIG.BUTTON_HEIGHT, 8);
        label.setColor('#E8E6E3');
      })
      .on('pointerdown', callback);

    return container;
  }

  private _createVolumeSlider(label: string, key: string, y: number): void {
    // 标签
    const labelText = this._scene.add.text(-CONFIG.SETTINGS_WIDTH / 2 + 30, y, label, {
      ...TEXT_STYLES.BODY,
      fontSize: '16px',
    });
    this._settingsContainer.add(labelText);

    // 滑块轨道
    const trackX = CONFIG.SETTINGS_WIDTH / 2 - CONFIG.SLIDER_WIDTH - 30;
    const track = this._scene.add.graphics();
    track.fillStyle(COLORS.BG_PRIMARY, 1);
    track.fillRoundedRect(trackX, y - 4, CONFIG.SLIDER_WIDTH, 8, 4);
    this._settingsContainer.add(track);

    // 滑块填充
    const value = this._getSettingValue(key);
    const fillBar = this._scene.add.graphics();
    this._updateSliderFill(fillBar, trackX, y, value);
    this._settingsContainer.add(fillBar);

    // 滑块手柄
    const handleX = trackX + value * CONFIG.SLIDER_WIDTH;
    const handle = this._scene.add.rectangle(handleX, y, 16, 20, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true, draggable: true });
    this._settingsContainer.add(handle);

    // 值显示
    const valueText = this._scene.add.text(
      CONFIG.SETTINGS_WIDTH / 2 - 10,
      y,
      `${Math.round(value * 100)}%`,
      { ...TEXT_STYLES.BODY, fontSize: '14px' }
    ).setOrigin(1, 0.5);
    this._settingsContainer.add(valueText);

    // 保存引用
    this._volumeSliders.set(key, { bar: fillBar, handle });

    // 拖动事件
    handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
      const newX = Phaser.Math.Clamp(dragX, trackX, trackX + CONFIG.SLIDER_WIDTH);
      handle.x = newX;
      const newValue = (newX - trackX) / CONFIG.SLIDER_WIDTH;
      this._updateSliderFill(fillBar, trackX, y, newValue);
      valueText.setText(`${Math.round(newValue * 100)}%`);
      this._setSettingValue(key, newValue);
      this._saveSettings();
    });
  }

  /**
   * 获取设置值（类型安全）
   */
  private _getSettingValue(key: string): number {
    switch (key) {
      case 'masterVolume':
        return this._settings.masterVolume;
      case 'bgmVolume':
        return this._settings.bgmVolume;
      case 'sfxVolume':
        return this._settings.sfxVolume;
      default:
        return 0.8;
    }
  }

  /**
   * 设置设置值（类型安全）
   */
  private _setSettingValue(key: string, value: number): void {
    switch (key) {
      case 'masterVolume':
        this._settings.masterVolume = value;
        break;
      case 'bgmVolume':
        this._settings.bgmVolume = value;
        break;
      case 'sfxVolume':
        this._settings.sfxVolume = value;
        break;
    }
  }

  private _updateSliderFill(graphics: Phaser.GameObjects.Graphics, x: number, y: number, value: number): void {
    graphics.clear();
    graphics.fillStyle(COLORS.ACCENT, 1);
    graphics.fillRoundedRect(x, y - 4, CONFIG.SLIDER_WIDTH * value, 8, 4);
  }

  private _createRadioButton(x: number, y: number, text: string, selected: boolean, callback: () => void): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);

    const circle = this._scene.add.graphics();
    circle.lineStyle(2, selected ? COLORS.ACCENT : COLORS.BORDER, 1);
    circle.strokeCircle(0, 0, 10);
    if (selected) {
      circle.fillStyle(COLORS.ACCENT, 1);
      circle.fillCircle(0, 0, 5);
    }

    const label = this._scene.add.text(20, 0, text, {
      ...TEXT_STYLES.BODY,
      fontSize: '14px',
      color: selected ? '#00FFAA' : '#A8A6A3',
    }).setOrigin(0, 0.5);

    container.add([circle, label]);
    container.setSize(60, 24);
    container.setInteractive({ useHandCursor: true })
      .on('pointerdown', callback);

    return container;
  }

  private _updateSpeedButtons(): void {
    const speeds = ['slow', 'normal', 'fast', 'instant'];
    speeds.forEach(speed => {
      const btn = this._settingsContainer.getByName(`speed_${speed}`) as Phaser.GameObjects.Container;
      if (btn) {
        const circle = btn.list[0] as Phaser.GameObjects.Graphics;
        const label = btn.list[1] as Phaser.GameObjects.Text;
        const isSelected = this._settings.textSpeed === speed;

        circle.clear();
        circle.lineStyle(2, isSelected ? COLORS.ACCENT : COLORS.BORDER, 1);
        circle.strokeCircle(0, 0, 10);
        if (isSelected) {
          circle.fillStyle(COLORS.ACCENT, 1);
          circle.fillCircle(0, 0, 5);
        }
        label.setColor(isSelected ? '#00FFAA' : '#A8A6A3');
      }
    });
  }

  private _createToggle(x: number, y: number, value: boolean, callback: (value: boolean) => void): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);

    const track = this._scene.add.graphics();
    const handle = this._scene.add.rectangle(value ? 15 : -15, 0, 24, 20, COLORS.TEXT_PRIMARY);

    const updateToggle = (on: boolean): void => {
      track.clear();
      track.fillStyle(on ? COLORS.ACCENT : COLORS.BG_PRIMARY, 1);
      track.fillRoundedRect(-25, -12, 50, 24, 12);
      track.lineStyle(1, COLORS.BORDER, 1);
      track.strokeRoundedRect(-25, -12, 50, 24, 12);
      
      this._scene.tweens.add({
        targets: handle,
        x: on ? 15 : -15,
        duration: 100,
      });
    };

    updateToggle(value);

    container.add([track, handle]);
    container.setSize(50, 24);
    container.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        const newValue = !container.getData('value');
        container.setData('value', newValue);
        updateToggle(newValue);
        callback(newValue);
      });

    container.setData('value', value);

    return container;
  }

  // ==================== 私有方法 - 菜单操作 ====================

  private _showSettings(): void {
    this._mainMenuContainer.setVisible(false);
    this._settingsContainer.setVisible(true);
  }

  private _hideSettings(): void {
    this._settingsContainer.setVisible(false);
    this._mainMenuContainer.setVisible(true);
  }

  private async _saveSettings(): Promise<void> {
    await saveManager.updateSettings(this._settings);
  }

  private _onResume(): void {
    this.hide();
    this._callbacks.onResume?.();
  }

  private _onSave(): void {
    this._callbacks.onSave?.();
  }

  private _onLoad(): void {
    this._callbacks.onLoad?.();
  }

  private _onQuit(): void {
    this._callbacks.onQuit?.();
    this._scene.scene.start(SCENES.MENU);
  }
}

