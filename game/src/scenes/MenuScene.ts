/**
 * 主菜单场景
 */
import Phaser from 'phaser';
import { SCENES, TEXT_STYLES, COLORS } from '@/config/game.config';
import { UI_FONT_SIZE } from '@/config/ui.config';
import { saveManager } from '@/systems/save';
import { worldState } from '@/systems/world';
import type { ISaveMetadata, IGameSettings } from '@/systems/save';

// ==================== 配置常量 ====================

const CONFIG = {
  /** 设置面板宽度 */
  SETTINGS_WIDTH: 500,
  /** 滑块宽度 */
  SLIDER_WIDTH: 200,
};

// ==================== MenuScene类 ====================

export class MenuScene extends Phaser.Scene {
  private _title!: Phaser.GameObjects.Text;
  private _subtitle!: Phaser.GameObjects.Text;
  private _buttons: Phaser.GameObjects.Container[] = [];
  private _saveListContainer!: Phaser.GameObjects.Container;
  private _settingsContainer!: Phaser.GameObjects.Container;
  private _settings!: IGameSettings;

  // 设置控件引用
  private _volumeSliders: Map<
    string,
    { bar: Phaser.GameObjects.Graphics; handle: Phaser.GameObjects.Rectangle }
  > = new Map();

  constructor() {
    super({ key: SCENES.MENU });
  }

  create(): void {
    console.log('[MenuScene] 创建主菜单');

    const { width, height } = this.scale;

    // 获取设置
    this._settings = saveManager.getSettings();

    // 背景
    this.add.rectangle(0, 0, width, height, COLORS.BG_PRIMARY).setOrigin(0);

    // 标题
    this._createTitle(width, height);

    // 菜单按钮
    this._createMenuButtons(width, height);

    // 存档列表（默认隐藏）
    this._createSaveList(width, height);

    // 设置面板（默认隐藏）
    this._createSettingsPanel(width, height);

    // 版本信息
    this._createVersionInfo(width, height);

    // 入场动画
    this._playIntroAnimation();
  }

  private _createTitle(width: number, height: number): void {
    // 主标题
    this._title = this.add
      .text(width / 2, height * 0.25, '备 注', {
        ...TEXT_STYLES.TITLE,
        fontSize: UI_FONT_SIZE.HUGE,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // 副标题
    this._subtitle = this.add
      .text(width / 2, height * 0.25 + 60, 'FOOTNOTE', {
        ...TEXT_STYLES.MUTED,
        fontSize: UI_FONT_SIZE.SMALL,
        letterSpacing: 8,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // 标语
    this.add
      .text(
        width / 2,
        height * 0.25 + 100,
        '你生活在一个二维世界，\n但你能短暂触碰更高维度——\n代价是：世界会记住你做过的一切。',
        {
          ...TEXT_STYLES.BODY,
          fontSize: UI_FONT_SIZE.SMALL,
          align: 'center',
          color: '#686868',
        }
      )
      .setOrigin(0.5)
      .setAlpha(0)
      .setName('tagline');
  }

  private _createMenuButtons(width: number, height: number): void {
    const buttonData = [
      { text: '开始游戏', action: () => this._startNewGame() },
      { text: '继续游戏', action: () => this._showSaveList() },
      { text: '设置', action: () => this._showSettings() },
    ];

    const startY = height * 0.52;
    const spacing = 70;

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
    bg.fillStyle(0x1e1e24, 1);
    bg.fillRoundedRect(-120, -25, 240, 50, 8);
    bg.lineStyle(1, 0x3a3a40, 1);
    bg.strokeRoundedRect(-120, -25, 240, 50, 8);

    // 按钮文字
    const label = this.add
      .text(0, 0, text, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.NORMAL,
      })
      .setOrigin(0.5);

    container.add([bg, label]);
    container.setSize(240, 50);
    container.setAlpha(0);

    // 交互
    container
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x2a2a30, 1);
        bg.fillRoundedRect(-120, -25, 240, 50, 8);
        bg.lineStyle(1, 0x00ffaa, 1);
        bg.strokeRoundedRect(-120, -25, 240, 50, 8);
        label.setColor('#00FFAA');
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x1e1e24, 1);
        bg.fillRoundedRect(-120, -25, 240, 50, 8);
        bg.lineStyle(1, 0x3a3a40, 1);
        bg.strokeRoundedRect(-120, -25, 240, 50, 8);
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

  // ==================== 存档列表 ====================

  private _createSaveList(width: number, height: number): void {
    this._saveListContainer = this.add.container(width / 2, height / 2);
    this._saveListContainer.setDepth(100);
    this._saveListContainer.setVisible(false);

    // 半透明背景
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setInteractive()
      .on('pointerdown', () => this._hideSaveList());
    this._saveListContainer.add(overlay);

    // 面板背景
    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.BG_SECONDARY, 0.98);
    panelBg.fillRoundedRect(-250, -300, 500, 600, 16);
    panelBg.lineStyle(2, COLORS.BORDER, 1);
    panelBg.strokeRoundedRect(-250, -300, 500, 600, 16);
    this._saveListContainer.add(panelBg);

    // 标题
    const title = this.add
      .text(0, -260, '选择存档', {
        ...TEXT_STYLES.TITLE,
        fontSize: UI_FONT_SIZE.ICON,
      })
      .setOrigin(0.5);
    this._saveListContainer.add(title);

    // 关闭按钮
    const closeBtn = this._createCloseButton(-210, -260, () => this._hideSaveList());
    this._saveListContainer.add(closeBtn);
  }

  private async _showSaveList(): Promise<void> {
    // 清除旧的存档项
    const oldItems = this._saveListContainer
      .getAll()
      .filter((child) => child.getData('isSaveItem'));
    oldItems.forEach((item) => item.destroy());

    // 获取存档列表
    const saves = await saveManager.getSaveList();

    if (saves.length === 0) {
      // 无存档提示
      const noSaveText = this.add
        .text(0, 0, '没有找到存档\n\n请开始新游戏', {
          ...TEXT_STYLES.BODY,
          fontSize: UI_FONT_SIZE.SMALL,
          align: 'center',
          color: '#686868',
        })
        .setOrigin(0.5);
      noSaveText.setData('isSaveItem', true);
      this._saveListContainer.add(noSaveText);
    } else {
      // 显示存档列表
      saves.forEach((save, index) => {
        const item = this._createSaveItem(save, index);
        this._saveListContainer.add(item);
      });
    }

    // 显示面板
    this._saveListContainer.setVisible(true);
    this._saveListContainer.setAlpha(0);
    this.tweens.add({
      targets: this._saveListContainer,
      alpha: 1,
      duration: 200,
    });
  }

  private _createSaveItem(save: ISaveMetadata, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(0, -150 + index * 100);
    container.setData('isSaveItem', true);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.BG_TERTIARY, 1);
    bg.fillRoundedRect(-200, -35, 400, 70, 8);

    // 存档名称
    const name = this.add.text(-180, -15, save.name || `存档 ${save.slot}`, {
      ...TEXT_STYLES.BODY,
      fontSize: UI_FONT_SIZE.SMALL,
    });

    // 章节和位置
    const location = this.add.text(-180, 10, `${save.chapter} - ${save.currentZone}`, {
      ...TEXT_STYLES.MUTED,
      fontSize: UI_FONT_SIZE.TINY,
    });

    // 时间
    const date = new Date(save.timestamp);
    const dateStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const timeText = this.add
      .text(180, -15, dateStr, {
        ...TEXT_STYLES.MUTED,
        fontSize: UI_FONT_SIZE.TINY,
      })
      .setOrigin(1, 0);

    // 游玩时长
    const playTimeStr = this._formatPlayTime(save.playTime);
    const playTimeText = this.add
      .text(180, 10, `游玩: ${playTimeStr}`, {
        ...TEXT_STYLES.MUTED,
        fontSize: UI_FONT_SIZE.TINY,
      })
      .setOrigin(1, 0);

    container.add([bg, name, location, timeText, playTimeText]);
    container.setSize(400, 70);

    // 交互
    container
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x2a2a30, 1);
        bg.fillRoundedRect(-200, -35, 400, 70, 8);
        bg.lineStyle(1, COLORS.ACCENT, 1);
        bg.strokeRoundedRect(-200, -35, 400, 70, 8);
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_TERTIARY, 1);
        bg.fillRoundedRect(-200, -35, 400, 70, 8);
      })
      .on('pointerdown', () => {
        this._loadSave(save.slot);
      });

    return container;
  }

  private _formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  }

  private _hideSaveList(): void {
    this.tweens.add({
      targets: this._saveListContainer,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this._saveListContainer.setVisible(false);
      },
    });
  }

  private async _loadSave(slot: number): Promise<void> {
    console.log(`[MenuScene] 加载存档 ${slot}`);

    const success = await saveManager.load(slot);
    if (success) {
      this._hideSaveList();
      this.cameras.main.fadeOut(500, 10, 10, 15);

      this.cameras.main.once('camerafadeoutcomplete', () => {
        // worldState.getCurrentZone 已经被 load 方法更新
        const currentZone = worldState.getCurrentZone() || 'C0-Z1';
        this.scene.start(SCENES.GAME, { zoneId: currentZone, isNewGame: false });
      });
    } else {
      // 加载失败提示
      this._showToast('存档加载失败', 'error');
    }
  }

  // ==================== 设置面板 ====================

  private _createSettingsPanel(width: number, height: number): void {
    this._settingsContainer = this.add.container(width / 2, height / 2);
    this._settingsContainer.setDepth(100);
    this._settingsContainer.setVisible(false);

    // 半透明背景
    const overlay = this.add
      .rectangle(0, 0, width, height, 0x000000, 0.7)
      .setInteractive()
      .on('pointerdown', () => this._hideSettings());
    this._settingsContainer.add(overlay);

    // 面板背景
    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.BG_SECONDARY, 0.98);
    panelBg.fillRoundedRect(-CONFIG.SETTINGS_WIDTH / 2, -250, CONFIG.SETTINGS_WIDTH, 500, 16);
    panelBg.lineStyle(2, COLORS.BORDER, 1);
    panelBg.strokeRoundedRect(-CONFIG.SETTINGS_WIDTH / 2, -250, CONFIG.SETTINGS_WIDTH, 500, 16);
    this._settingsContainer.add(panelBg);

    // 标题
    const title = this.add
      .text(0, -210, '设置', {
        ...TEXT_STYLES.TITLE,
        fontSize: UI_FONT_SIZE.ICON,
      })
      .setOrigin(0.5);
    this._settingsContainer.add(title);

    // 关闭按钮
    const closeBtn = this._createCloseButton(CONFIG.SETTINGS_WIDTH / 2 - 40, -210, () =>
      this._hideSettings()
    );
    this._settingsContainer.add(closeBtn);

    // 音量设置
    this._createVolumeSlider(-CONFIG.SETTINGS_WIDTH / 2 + 30, -130, '主音量', 'masterVolume');
    this._createVolumeSlider(-CONFIG.SETTINGS_WIDTH / 2 + 30, -70, 'BGM音量', 'bgmVolume');
    this._createVolumeSlider(-CONFIG.SETTINGS_WIDTH / 2 + 30, -10, '音效音量', 'sfxVolume');

    // 文本速度
    this._createTextSpeedSelector(-CONFIG.SETTINGS_WIDTH / 2 + 30, 60);

    // 自动存档开关
    this._createToggle(-CONFIG.SETTINGS_WIDTH / 2 + 30, 130, '自动存档', 'autoSave');
  }

  private _createCloseButton(
    x: number,
    y: number,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.BG_TERTIARY, 1);
    bg.fillCircle(0, 0, 18);

    const closeX = this.add
      .text(0, 0, '×', {
        fontSize: UI_FONT_SIZE.ICON,
        color: '#888888',
      })
      .setOrigin(0.5);

    container.add([bg, closeX]);
    container.setSize(36, 36);
    container
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_SECONDARY, 1);
        bg.fillCircle(0, 0, 18);
        bg.lineStyle(1, COLORS.ACCENT, 1);
        bg.strokeCircle(0, 0, 18);
        closeX.setColor('#FFFFFF');
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_TERTIARY, 1);
        bg.fillCircle(0, 0, 18);
        closeX.setColor('#888888');
      })
      .on('pointerdown', callback);

    return container;
  }

  private _createVolumeSlider(x: number, y: number, label: string, key: string): void {
    // 标签
    const labelText = this.add.text(x, y, label, {
      ...TEXT_STYLES.BODY,
      fontSize: UI_FONT_SIZE.TINY,
    });
    this._settingsContainer.add(labelText);

    // 滑动条轨道
    const trackX = CONFIG.SETTINGS_WIDTH / 2 - CONFIG.SLIDER_WIDTH - 30;
    const track = this.add.graphics();
    track.fillStyle(COLORS.BG_PRIMARY, 1);
    track.fillRoundedRect(trackX, y - 4, CONFIG.SLIDER_WIDTH, 8, 4);
    this._settingsContainer.add(track);

    // 滑块填充
    const value = this._getSettingValue(key);
    const fillBar = this.add.graphics();
    this._updateSliderFill(fillBar, trackX, y, value);
    this._settingsContainer.add(fillBar);

    // 滑块手柄
    const handleX = trackX + value * CONFIG.SLIDER_WIDTH;
    const handle = this.add
      .rectangle(handleX, y, 16, 20, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true, draggable: true });
    this._settingsContainer.add(handle);

    // 值显示
    const valueText = this.add
      .text(CONFIG.SETTINGS_WIDTH / 2 - 10, y, `${Math.round(value * 100)}%`, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.TINY,
      })
      .setOrigin(1, 0.5);
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
      void this._saveSettings();
    });
  }

  private _updateSliderFill(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    value: number
  ): void {
    graphics.clear();
    graphics.fillStyle(COLORS.ACCENT, 1);
    graphics.fillRoundedRect(x, y - 4, CONFIG.SLIDER_WIDTH * value, 8, 4);
  }

  private _createTextSpeedSelector(x: number, y: number): void {
    const labelText = this.add.text(x, y, '文本速度', {
      ...TEXT_STYLES.BODY,
      fontSize: UI_FONT_SIZE.TINY,
    });
    this._settingsContainer.add(labelText);

    const speeds: Array<{ value: IGameSettings['textSpeed']; label: string }> = [
      { value: 'slow', label: '慢' },
      { value: 'normal', label: '中' },
      { value: 'fast', label: '快' },
      { value: 'instant', label: '即时' },
    ];

    const startX = CONFIG.SETTINGS_WIDTH / 2 - 180;
    speeds.forEach((speed, index) => {
      const btnX = startX + index * 55;
      const isSelected = this._settings.textSpeed === speed.value;
      const btn = this._createSpeedButton(btnX, y, speed.label, isSelected, () => {
        this._settings.textSpeed = speed.value;
        void this._saveSettings();
        // 更新按钮状态
        this._updateSpeedButtons(speeds, speed.value);
      });
      btn.setName(`speed_${speed.value}`);
      this._settingsContainer.add(btn);
    });
  }

  private _createSpeedButton(
    x: number,
    y: number,
    label: string,
    selected: boolean,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.setName('bg');
    if (selected) {
      bg.fillStyle(COLORS.ACCENT, 0.3);
      bg.fillRoundedRect(-22, -14, 44, 28, 4);
      bg.lineStyle(1, COLORS.ACCENT, 1);
      bg.strokeRoundedRect(-22, -14, 44, 28, 4);
    } else {
      bg.fillStyle(COLORS.BG_TERTIARY, 1);
      bg.fillRoundedRect(-22, -14, 44, 28, 4);
    }

    const text = this.add
      .text(0, 0, label, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.TINY,
        color: selected ? '#00FFAA' : '#A8A6A3',
      })
      .setOrigin(0.5);
    text.setName('text');

    container.add([bg, text]);
    container.setSize(44, 28);
    container.setInteractive({ useHandCursor: true }).on('pointerdown', callback);

    return container;
  }

  private _updateSpeedButtons(
    speeds: Array<{ value: IGameSettings['textSpeed']; label: string }>,
    selectedValue: string
  ): void {
    speeds.forEach((speed) => {
      const btn = this._settingsContainer.getByName(
        `speed_${speed.value}`
      ) as Phaser.GameObjects.Container;
      if (!btn) return;

      const bg = btn.getByName('bg') as Phaser.GameObjects.Graphics;
      const text = btn.getByName('text') as Phaser.GameObjects.Text;
      const isSelected = speed.value === selectedValue;

      bg.clear();
      if (isSelected) {
        bg.fillStyle(COLORS.ACCENT, 0.3);
        bg.fillRoundedRect(-22, -14, 44, 28, 4);
        bg.lineStyle(1, COLORS.ACCENT, 1);
        bg.strokeRoundedRect(-22, -14, 44, 28, 4);
        text.setColor('#00FFAA');
      } else {
        bg.fillStyle(COLORS.BG_TERTIARY, 1);
        bg.fillRoundedRect(-22, -14, 44, 28, 4);
        text.setColor('#A8A6A3');
      }
    });
  }

  private _createToggle(x: number, y: number, label: string, _key: string): void {
    const labelText = this.add.text(x, y, label, {
      ...TEXT_STYLES.BODY,
      fontSize: UI_FONT_SIZE.TINY,
    });
    this._settingsContainer.add(labelText);

    const toggleX = CONFIG.SETTINGS_WIDTH / 2 - 60;
    const isOn = this._settings.autoPlay; // Using autoPlay as proxy for now

    const toggleBg = this.add.graphics();
    toggleBg.setName('toggleBg');
    this._updateToggleBg(toggleBg, isOn);
    toggleBg.setPosition(toggleX, y);
    this._settingsContainer.add(toggleBg);

    const toggleHandle = this.add.circle(toggleX + (isOn ? 20 : -20), y, 10, 0xffffff);
    toggleHandle.setName('toggleHandle');
    this._settingsContainer.add(toggleHandle);

    // 交互
    const hitArea = this.add
      .rectangle(toggleX, y, 50, 24, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this._settings.autoPlay = !this._settings.autoPlay;
        void this._saveSettings();

        this._updateToggleBg(toggleBg, this._settings.autoPlay);
        this.tweens.add({
          targets: toggleHandle,
          x: toggleX + (this._settings.autoPlay ? 20 : -20),
          duration: 150,
        });
      });
    this._settingsContainer.add(hitArea);
  }

  private _updateToggleBg(bg: Phaser.GameObjects.Graphics, isOn: boolean): void {
    bg.clear();
    bg.fillStyle(isOn ? COLORS.ACCENT : COLORS.BG_TERTIARY, 1);
    bg.fillRoundedRect(-25, -12, 50, 24, 12);
  }

  private _showSettings(): void {
    this._settingsContainer.setVisible(true);
    this._settingsContainer.setAlpha(0);
    this.tweens.add({
      targets: this._settingsContainer,
      alpha: 1,
      duration: 200,
    });
  }

  private _hideSettings(): void {
    this.tweens.add({
      targets: this._settingsContainer,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        this._settingsContainer.setVisible(false);
      },
    });
  }

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

  private async _saveSettings(): Promise<void> {
    await saveManager.updateSettings(this._settings);
  }

  // ==================== 通用方法 ====================

  private _createVersionInfo(width: number, height: number): void {
    const version = __VERSION__ || '0.1.0';
    this.add
      .text(width / 2, height - 30, `v${version}`, {
        ...TEXT_STYLES.MUTED,
        fontSize: UI_FONT_SIZE.TINY,
      })
      .setOrigin(0.5);
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
    const tagline = this.children.getByName('tagline');
    if (tagline) {
      this.tweens.add({
        targets: tagline,
        alpha: 0.8,
        delay: 400,
        duration: 800,
        ease: 'Power2',
      });
    }

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
      this.scene.start(SCENES.GAME, { zoneId: 'C0-Z1', isNewGame: true });
    });
  }

  private _showToast(
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): void {
    const { width } = this.scale;

    const colors: Record<string, number> = {
      info: 0x1e1e24,
      success: 0x1a4a2a,
      warning: 0x4a3a1a,
      error: 0x4a1a1a,
    };

    const toast = this.add
      .text(width / 2, 80, message, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.TINY,
        backgroundColor: `#${colors[type].toString(16).padStart(6, '0')}`,
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(200);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 100,
      duration: 300,
      hold: 2000,
      yoyo: true,
      onComplete: () => toast.destroy(),
    });
  }
}
