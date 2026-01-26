/**
 * 暂停菜单UI
 * 包含继续游戏、设置、存档、读档、返回主菜单等功能
 * 支持键盘导航和屏幕阅读器
 * @module systems/ui/PauseMenu
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';
import { saveManager } from '@/systems/save';
import { TEXT_STYLES, COLORS, SCENES } from '@/config/game.config';
import { UI, UI_FONT_SIZE } from '@/config/ui.config';
import { i18n, LOCALE_NAMES, type SupportedLocale } from '@/systems/i18n/I18nManager';
import { a11yManager, type IFocusableElement } from '@/systems/accessibility/A11yManager';
import type { IGameSettings } from '@/systems/save';

// ==================== 配置常量 ====================

const CONFIG = {
  /** 菜单宽度 */
  MENU_WIDTH: 450,
  /** 按钮高度 */
  BUTTON_HEIGHT: UI.BUTTON.LG.HEIGHT,
  /** 按钮间距 */
  BUTTON_SPACING: UI.SPACING.LG,
  /** 设置面板宽度 */
  SETTINGS_WIDTH: UI.PANEL.MD.WIDTH,
  /** 滑块宽度 */
  SLIDER_WIDTH: 250,
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

/** 焦点组ID */
const FOCUS_GROUP_MAIN_MENU = 'pause-main-menu';
const FOCUS_GROUP_SETTINGS = 'pause-settings';
const FOCUS_GROUP_HELP = 'pause-help';

/**
 * 暂停菜单
 */
export class PauseMenu {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  private _mainMenuContainer!: Phaser.GameObjects.Container;
  private _settingsContainer!: Phaser.GameObjects.Container;
  private _helpContainer!: Phaser.GameObjects.Container;
  private _settings: IGameSettings;
  private _callbacks: IPauseMenuConfig;

  // 设置控件引用
  private _volumeSliders: Map<
    string,
    { bar: Phaser.GameObjects.Graphics; handle: Phaser.GameObjects.Rectangle }
  > = new Map();

  // 国际化
  private _unsubscribeI18n?: () => void;
  private _i18nTexts: Map<string, Phaser.GameObjects.Text> = new Map();

  // 键盘导航
  private _keyDownHandler: ((event: KeyboardEvent) => void) | null = null;
  private _mainMenuButtons: Phaser.GameObjects.Container[] = [];
  private _currentFocusIndex: number = -1;
  private _isInSettings: boolean = false;

  constructor(config: IPauseMenuConfig) {
    this._scene = config.scene;
    this._callbacks = config;
    this._settings = saveManager.getSettings();
    this._createUI();
    this._setupI18n();
  }

  /**
   * 设置国际化监听
   */
  private _setupI18n(): void {
    this._unsubscribeI18n = i18n.onLocaleChange(() => {
      this._updateI18nTexts();
    });
  }

  /**
   * 更新国际化文本
   */
  private _updateI18nTexts(): void {
    // 更新所有已注册的国际化文本
    this._i18nTexts.forEach((text, key) => {
      text.setText(i18n.t(key));
    });
  }

  /**
   * 注册国际化文本
   */
  private _registerI18nText(key: string, text: Phaser.GameObjects.Text): void {
    this._i18nTexts.set(key, text);
  }

  // ==================== 公共方法 ====================

  /**
   * 显示暂停菜单
   */
  show(): void {
    // 显示主菜单，隐藏设置面板
    this._mainMenuContainer.setVisible(true);
    this._settingsContainer.setVisible(false);
    this._isInSettings = false;

    this._container.setVisible(true);
    this._container.setAlpha(0);

    this._scene.tweens.add({
      targets: this._container,
      alpha: 1,
      duration: 200,
      ease: 'Power2',
    });

    // 设置键盘导航
    this._setupKeyboardNavigation();
    this._setupMainMenuFocusGroup();

    // 播报菜单打开
    a11yManager.announceUIState('暂停菜单', 'opened');

    eventBus.emitTyped(GameEvent.GAME_PAUSE, {});
  }

  /**
   * 隐藏暂停菜单
   */
  hide(): void {
    // 移除键盘导航
    this._removeKeyboardNavigation();

    // 播报菜单关闭
    a11yManager.announceUIState('暂停菜单', 'closed');

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
    this._removeKeyboardNavigation();
    this._unsubscribeI18n?.();
    this._i18nTexts.clear();
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

    // 创建帮助面板
    this._createHelpPanel(width, height);
  }

  private _createMainMenu(width: number, height: number): void {
    this._mainMenuContainer = this._scene.add.container(width / 2, height / 2);

    // 标题
    const title = this._scene.add
      .text(0, -200, i18n.t('pause.title'), {
        ...TEXT_STYLES.TITLE,
        fontSize: UI_FONT_SIZE.TITLE,
      })
      .setOrigin(0.5);
    this._registerI18nText('pause.title', title);
    this._mainMenuContainer.add(title);

    // 菜单按钮（使用国际化键）
    const buttons = [
      { key: 'pause.resume', callback: () => this._onResume() },
      { key: 'pause.settings', callback: () => this._showSettings() },
      { key: 'pause.help', callback: () => this._showHelp() },
      { key: 'pause.save', callback: () => this._onSave() },
      { key: 'pause.load', callback: () => this._onLoad() },
      { key: 'pause.mainMenu', callback: () => this._onQuit() },
    ];

    this._mainMenuButtons = [];
    buttons.forEach((btn, index) => {
      const y = -80 + index * (CONFIG.BUTTON_HEIGHT + CONFIG.BUTTON_SPACING);
      const button = this._createButton(0, y, i18n.t(btn.key), btn.callback, btn.key);
      button.setName(`menu-btn-${index}`);
      this._mainMenuButtons.push(button);
      this._mainMenuContainer.add(button);
    });

    this._container.add(this._mainMenuContainer);
  }

  private _createSettingsPanel(width: number, height: number): void {
    this._settingsContainer = this._scene.add.container(width / 2, height / 2);
    this._settingsContainer.setVisible(false);

    // 标题
    const title = this._scene.add
      .text(0, -280, i18n.t('settings.title'), {
        ...TEXT_STYLES.TITLE,
        fontSize: UI_FONT_SIZE.SECTION,
      })
      .setOrigin(0.5);
    this._registerI18nText('settings.title', title);
    this._settingsContainer.add(title);

    // 音量设置
    const volumeSettings = [
      { key: 'masterVolume', i18nKey: 'settings.bgmVolume', y: -200 },
      { key: 'bgmVolume', i18nKey: 'settings.bgmVolume', y: -140 },
      { key: 'sfxVolume', i18nKey: 'settings.sfxVolume', y: -80 },
    ];

    volumeSettings.forEach((setting) => {
      this._createVolumeSlider(i18n.t(setting.i18nKey), setting.key, setting.y, setting.i18nKey);
    });

    // 文字速度
    const speedLabel = this._scene.add.text(
      -CONFIG.SETTINGS_WIDTH / 2 + 30,
      -20,
      i18n.t('settings.textSpeed'),
      {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.SMALL,
      }
    );
    this._registerI18nText('settings.textSpeed', speedLabel);
    this._settingsContainer.add(speedLabel);

    const speeds = [
      { value: 'slow', label: '慢' },
      { value: 'normal', label: '正常' },
      { value: 'fast', label: '快' },
      { value: 'instant', label: '立即' },
    ];

    speeds.forEach((speed, index) => {
      const x = CONFIG.SETTINGS_WIDTH / 2 - 200 + index * 60;
      const btn = this._createRadioButton(
        x,
        -20,
        speed.label,
        speed.value === this._settings.textSpeed,
        () => {
          this._settings.textSpeed = speed.value as IGameSettings['textSpeed'];
          this._updateSpeedButtons();
          this._saveSettings();
        }
      );
      btn.setName(`speed_${speed.value}`);
      this._settingsContainer.add(btn);
    });

    // 自动播放
    const autoPlayLabel = this._scene.add.text(
      -CONFIG.SETTINGS_WIDTH / 2 + 30,
      40,
      i18n.t('settings.autoPlay'),
      {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.SMALL,
      }
    );
    this._registerI18nText('settings.autoPlay', autoPlayLabel);
    this._settingsContainer.add(autoPlayLabel);

    const autoPlayToggle = this._createToggle(
      CONFIG.SETTINGS_WIDTH / 2 - 60,
      40,
      this._settings.autoPlay,
      (value) => {
        this._settings.autoPlay = value;
        this._saveSettings();
      }
    );
    autoPlayToggle.setName('autoPlayToggle');
    this._settingsContainer.add(autoPlayToggle);

    // 语言选择
    this._createLanguageSelector(-CONFIG.SETTINGS_WIDTH / 2 + 30, 100);

    // 返回按钮
    const backBtn = this._createButton(
      0,
      180,
      i18n.t('common.back'),
      () => this._hideSettings(),
      'common.back'
    );
    this._settingsContainer.add(backBtn);

    this._container.add(this._settingsContainer);
  }

  /**
   * 创建帮助面板
   */
  private _createHelpPanel(width: number, height: number): void {
    this._helpContainer = this._scene.add.container(width / 2, height / 2);
    this._helpContainer.setVisible(false);

    // 面板背景 - 更大的面板
    const panelBg = this._scene.add.graphics();
    panelBg.fillStyle(0x1a1a1f, 0.95);
    panelBg.fillRoundedRect(-280, -350, 560, 700, 12);
    panelBg.lineStyle(2, COLORS.BORDER, 1);
    panelBg.strokeRoundedRect(-280, -350, 560, 700, 12);
    this._helpContainer.add(panelBg);

    // 标题
    const title = this._scene.add
      .text(0, -320, i18n.t('help.title'), {
        ...TEXT_STYLES.TITLE,
        fontSize: UI_FONT_SIZE.SECTION,
      })
      .setOrigin(0.5);
    this._registerI18nText('help.title', title);
    this._helpContainer.add(title);

    // 紧凑布局参数
    const startY = -275;
    const titleHeight = 22;
    const itemHeight = 18;
    const sectionGap = 12;
    let y = startY;

    // === 计数器说明 ===
    this._helpContainer.add(
      this._scene.add
        .text(-250, y, '【隐藏计数器】', {
          fontSize: UI_FONT_SIZE.SMALL,
          color: '#FFD700',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0)
    );
    y += titleHeight;

    // R/P/W 说明（单行格式）
    const counters = [
      { name: 'R', color: '#FF4444', desc: '无收益残差 - 无奖励行为累积，R≥3系统语气变化' },
      { name: 'P', color: '#4A9EFF', desc: '观察者压力 - 能力使用增加，P≥18无法使用能力' },
      { name: 'W', color: '#FFD700', desc: '世界可读性 - 综合稳定度，影响结局走向' },
    ];

    counters.forEach((c) => {
      this._helpContainer.add(
        this._scene.add
          .text(-250, y, c.name, { fontSize: UI_FONT_SIZE.TINY, color: c.color, fontStyle: 'bold' })
          .setOrigin(0, 0)
      );
      this._helpContainer.add(
        this._scene.add
          .text(-230, y, c.desc, { fontSize: UI_FONT_SIZE.TINY, color: '#A8A6A3' })
          .setOrigin(0, 0)
      );
      y += itemHeight;
    });

    y += sectionGap;

    // === 能力说明 ===
    this._helpContainer.add(
      this._scene.add
        .text(-250, y, '【三种能力】', {
          fontSize: UI_FONT_SIZE.SMALL,
          color: '#FFD700',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0)
    );
    y += titleHeight;

    const abilities = [
      {
        key: '1',
        name: '深度感知',
        color: '#00FFAA',
        desc: '揭示隐藏信息，持续消耗P值',
      },
      {
        key: '2',
        name: '深度介入',
        color: '#FF00FF',
        desc: '改变结构留下伤痕，每次P+2',
      },
      {
        key: '3',
        name: '时间干预',
        color: '#FFD700',
        desc: '回溯节点，产生时间污染',
      },
    ];

    abilities.forEach((a) => {
      this._helpContainer.add(
        this._scene.add
          .text(-250, y, `[${a.key}] ${a.name}`, {
            fontSize: UI_FONT_SIZE.TINY,
            color: a.color,
            fontStyle: 'bold',
          })
          .setOrigin(0, 0)
      );
      this._helpContainer.add(
        this._scene.add
          .text(-130, y, a.desc, { fontSize: UI_FONT_SIZE.TINY, color: '#A8A6A3' })
          .setOrigin(0, 0)
      );
      y += itemHeight;
    });

    // 能力通用说明
    this._helpContainer.add(
      this._scene.add
        .text(-230, y, '※ 再次按键或点击可关闭能力', {
          fontSize: UI_FONT_SIZE.TINY,
          color: '#686868',
        })
        .setOrigin(0, 0)
    );
    y += itemHeight + sectionGap;

    // === 操作说明 ===
    this._helpContainer.add(
      this._scene.add
        .text(-250, y, '【操作】', {
          fontSize: UI_FONT_SIZE.SMALL,
          color: '#FFD700',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0)
    );
    y += titleHeight;

    const controls = [
      { key: 'WASD/方向键', desc: '移动' },
      { key: 'E/点击物体', desc: '交互' },
      { key: 'ESC', desc: '暂停菜单' },
      { key: 'I', desc: '物品栏' },
    ];

    controls.forEach((c) => {
      this._helpContainer.add(
        this._scene.add
          .text(-250, y, c.key, { fontSize: UI_FONT_SIZE.TINY, color: '#00FFAA' })
          .setOrigin(0, 0)
      );
      this._helpContainer.add(
        this._scene.add
          .text(-100, y, c.desc, { fontSize: UI_FONT_SIZE.TINY, color: '#A8A6A3' })
          .setOrigin(0, 0)
      );
      y += itemHeight;
    });

    y += sectionGap;

    // === 提示 ===
    this._helpContainer.add(
      this._scene.add
        .text(-250, y, '【提示】', {
          fontSize: UI_FONT_SIZE.SMALL,
          color: '#FFD700',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0)
    );
    y += titleHeight;

    const tips = ['• 能力使用有代价，谨慎选择', '• 世界会记住你做过的一切', '• 不同选择会影响结局'];

    tips.forEach((t) => {
      this._helpContainer.add(
        this._scene.add
          .text(-230, y, t, { fontSize: UI_FONT_SIZE.TINY, color: '#A8A6A3' })
          .setOrigin(0, 0)
      );
      y += itemHeight;
    });

    // 返回按钮
    const backBtn = this._createButton(
      0,
      310,
      i18n.t('common.back'),
      () => this._hideHelp(),
      'common.back'
    );
    this._helpContainer.add(backBtn);

    this._container.add(this._helpContainer);
  }

  /**
   * 创建语言选择器
   */
  private _createLanguageSelector(x: number, y: number): void {
    const languageLabel = this._scene.add.text(x, y, i18n.t('settings.language'), {
      ...TEXT_STYLES.BODY,
      fontSize: UI_FONT_SIZE.SMALL,
    });
    this._registerI18nText('settings.language', languageLabel);
    this._settingsContainer.add(languageLabel);

    const locales: SupportedLocale[] = ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'];
    const currentLocale = i18n.getLocale();

    // 创建语言选择下拉按钮
    const dropdownWidth = 160;
    const dropdownHeight = 36;
    const dropdownX = CONFIG.SETTINGS_WIDTH / 2 - dropdownWidth / 2 - 30;

    const dropdownContainer = this._scene.add.container(dropdownX, y);
    dropdownContainer.setName('languageDropdown');

    // 下拉按钮背景
    const dropdownBg = this._scene.add.graphics();
    dropdownBg.fillStyle(COLORS.BG_TERTIARY, 1);
    dropdownBg.fillRoundedRect(0, -dropdownHeight / 2, dropdownWidth, dropdownHeight, 4);
    dropdownBg.lineStyle(1, COLORS.BORDER, 1);
    dropdownBg.strokeRoundedRect(0, -dropdownHeight / 2, dropdownWidth, dropdownHeight, 4);

    // 当前语言文本
    const currentLangText = this._scene.add
      .text(10, 0, LOCALE_NAMES[currentLocale], {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.TINY,
      })
      .setOrigin(0, 0.5);
    currentLangText.setName('currentLangText');

    // 下拉箭头
    const arrow = this._scene.add
      .text(dropdownWidth - 20, 0, '▼', {
        fontSize: UI_FONT_SIZE.TINY,
        color: '#888888',
      })
      .setOrigin(0.5);

    dropdownContainer.add([dropdownBg, currentLangText, arrow]);
    dropdownContainer.setSize(dropdownWidth, dropdownHeight);

    // 下拉选项容器（初始隐藏）
    const optionsContainer = this._scene.add.container(dropdownX, y + dropdownHeight / 2);
    optionsContainer.setName('languageOptions');
    optionsContainer.setVisible(false);

    // 创建选项
    locales.forEach((locale, index) => {
      const optionY = index * 32 + 16;
      const optionBg = this._scene.add.graphics();
      optionBg.fillStyle(
        locale === currentLocale ? COLORS.ACCENT : COLORS.BG_SECONDARY,
        locale === currentLocale ? 0.3 : 1
      );
      optionBg.fillRect(0, optionY - 16, dropdownWidth, 32);

      const optionText = this._scene.add
        .text(10, optionY, LOCALE_NAMES[locale], {
          ...TEXT_STYLES.BODY,
          fontSize: UI_FONT_SIZE.TINY,
          color: locale === currentLocale ? '#00FFAA' : '#E8E6E3',
        })
        .setOrigin(0, 0.5);

      // 点击选项
      const hitArea = this._scene.add
        .rectangle(dropdownWidth / 2, optionY, dropdownWidth, 32, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          optionBg.clear();
          optionBg.fillStyle(COLORS.BG_TERTIARY, 1);
          optionBg.fillRect(0, optionY - 16, dropdownWidth, 32);
        })
        .on('pointerout', () => {
          optionBg.clear();
          optionBg.fillStyle(
            locale === i18n.getLocale() ? COLORS.ACCENT : COLORS.BG_SECONDARY,
            locale === i18n.getLocale() ? 0.3 : 1
          );
          optionBg.fillRect(0, optionY - 16, dropdownWidth, 32);
        })
        .on('pointerdown', () => {
          this._onLanguageChange(locale);
          optionsContainer.setVisible(false);
        });

      optionsContainer.add([optionBg, optionText, hitArea]);
    });

    // 选项容器背景边框
    const optionsBorder = this._scene.add.graphics();
    optionsBorder.lineStyle(1, COLORS.BORDER, 1);
    optionsBorder.strokeRect(0, 0, dropdownWidth, locales.length * 32);
    optionsContainer.add(optionsBorder);
    optionsContainer.sendToBack(optionsBorder);

    this._settingsContainer.add(optionsContainer);

    // 下拉按钮交互
    dropdownContainer
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        dropdownBg.clear();
        dropdownBg.fillStyle(COLORS.BG_SECONDARY, 1);
        dropdownBg.fillRoundedRect(0, -dropdownHeight / 2, dropdownWidth, dropdownHeight, 4);
        dropdownBg.lineStyle(1, COLORS.ACCENT, 1);
        dropdownBg.strokeRoundedRect(0, -dropdownHeight / 2, dropdownWidth, dropdownHeight, 4);
      })
      .on('pointerout', () => {
        dropdownBg.clear();
        dropdownBg.fillStyle(COLORS.BG_TERTIARY, 1);
        dropdownBg.fillRoundedRect(0, -dropdownHeight / 2, dropdownWidth, dropdownHeight, 4);
        dropdownBg.lineStyle(1, COLORS.BORDER, 1);
        dropdownBg.strokeRoundedRect(0, -dropdownHeight / 2, dropdownWidth, dropdownHeight, 4);
      })
      .on('pointerdown', () => {
        optionsContainer.setVisible(!optionsContainer.visible);
      });

    this._settingsContainer.add(dropdownContainer);
  }

  /**
   * 语言变更处理
   */
  private _onLanguageChange(locale: SupportedLocale): void {
    if (locale === i18n.getLocale()) return;

    i18n.setLocale(locale);

    // 更新下拉按钮显示
    const dropdown = this._settingsContainer.getByName(
      'languageDropdown'
    ) as Phaser.GameObjects.Container;
    if (dropdown) {
      const langText = dropdown.getByName('currentLangText') as Phaser.GameObjects.Text;
      if (langText) {
        langText.setText(LOCALE_NAMES[locale]);
      }
    }
  }

  private _createButton(
    x: number,
    y: number,
    text: string,
    callback: () => void,
    i18nKey?: string
  ): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);
    const buttonWidth = CONFIG.MENU_WIDTH;

    // 背景
    const bg = this._scene.add.graphics();
    bg.fillStyle(COLORS.BG_TERTIARY, 1);
    bg.fillRoundedRect(
      -buttonWidth / 2,
      -CONFIG.BUTTON_HEIGHT / 2,
      buttonWidth,
      CONFIG.BUTTON_HEIGHT,
      8
    );
    bg.lineStyle(1, COLORS.BORDER, 1);
    bg.strokeRoundedRect(
      -buttonWidth / 2,
      -CONFIG.BUTTON_HEIGHT / 2,
      buttonWidth,
      CONFIG.BUTTON_HEIGHT,
      8
    );

    // 文字
    const label = this._scene.add
      .text(0, 0, text, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.NORMAL,
      })
      .setOrigin(0.5);

    // 注册国际化文本
    if (i18nKey) {
      this._registerI18nText(i18nKey, label);
    }

    container.add([bg, label]);
    container.setSize(buttonWidth, CONFIG.BUTTON_HEIGHT);

    // 交互
    container
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_SECONDARY, 1);
        bg.fillRoundedRect(
          -buttonWidth / 2,
          -CONFIG.BUTTON_HEIGHT / 2,
          buttonWidth,
          CONFIG.BUTTON_HEIGHT,
          8
        );
        bg.lineStyle(2, COLORS.ACCENT, 1);
        bg.strokeRoundedRect(
          -buttonWidth / 2,
          -CONFIG.BUTTON_HEIGHT / 2,
          buttonWidth,
          CONFIG.BUTTON_HEIGHT,
          8
        );
        label.setColor('#00FFAA');
      })
      .on('pointerout', () => {
        bg.clear();
        bg.fillStyle(COLORS.BG_TERTIARY, 1);
        bg.fillRoundedRect(
          -buttonWidth / 2,
          -CONFIG.BUTTON_HEIGHT / 2,
          buttonWidth,
          CONFIG.BUTTON_HEIGHT,
          8
        );
        bg.lineStyle(1, COLORS.BORDER, 1);
        bg.strokeRoundedRect(
          -buttonWidth / 2,
          -CONFIG.BUTTON_HEIGHT / 2,
          buttonWidth,
          CONFIG.BUTTON_HEIGHT,
          8
        );
        label.setColor('#E8E6E3');
      })
      .on('pointerdown', callback);

    return container;
  }

  private _createVolumeSlider(label: string, key: string, y: number, i18nKey?: string): void {
    // 标签
    const labelText = this._scene.add.text(-CONFIG.SETTINGS_WIDTH / 2 + 30, y, label, {
      ...TEXT_STYLES.BODY,
      fontSize: UI_FONT_SIZE.SMALL,
    });
    if (i18nKey) {
      this._registerI18nText(i18nKey, labelText);
    }
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
    const handle = this._scene.add
      .rectangle(handleX, y, 24, UI.BUTTON.MIN_TOUCH_SIZE, COLORS.ACCENT)
      .setInteractive({ useHandCursor: true, draggable: true });
    this._settingsContainer.add(handle);

    // 值显示
    const valueText = this._scene.add
      .text(CONFIG.SETTINGS_WIDTH / 2 - 10, y, `${Math.round(value * 100)}%`, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.SMALL,
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

  private _createRadioButton(
    x: number,
    y: number,
    text: string,
    selected: boolean,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this._scene.add.container(x, y);

    const circle = this._scene.add.graphics();
    circle.lineStyle(2, selected ? COLORS.ACCENT : COLORS.BORDER, 1);
    circle.strokeCircle(0, 0, 10);
    if (selected) {
      circle.fillStyle(COLORS.ACCENT, 1);
      circle.fillCircle(0, 0, 5);
    }

    const label = this._scene.add
      .text(20, 0, text, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.SMALL,
        color: selected ? '#00FFAA' : '#A8A6A3',
      })
      .setOrigin(0, 0.5);

    container.add([circle, label]);
    container.setSize(60, UI.BUTTON.MIN_TOUCH_SIZE);
    container.setInteractive({ useHandCursor: true }).on('pointerdown', callback);

    return container;
  }

  private _updateSpeedButtons(): void {
    const speeds = ['slow', 'normal', 'fast', 'instant'];
    speeds.forEach((speed) => {
      const btn = this._settingsContainer.getByName(
        `speed_${speed}`
      ) as Phaser.GameObjects.Container;
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

  private _createToggle(
    x: number,
    y: number,
    value: boolean,
    callback: (value: boolean) => void
  ): Phaser.GameObjects.Container {
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
    container.setSize(50, UI.BUTTON.MIN_TOUCH_SIZE);
    container.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
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
    this._helpContainer.setVisible(false);
    this._isInSettings = true;

    // 切换焦点组
    a11yManager.destroyFocusGroup(FOCUS_GROUP_MAIN_MENU);
    a11yManager.destroyFocusGroup(FOCUS_GROUP_HELP);
    this._setupSettingsFocusGroup();

    // 播报设置面板打开
    a11yManager.announceUIState('设置面板', 'opened');
  }

  private _hideSettings(): void {
    this._settingsContainer.setVisible(false);
    this._mainMenuContainer.setVisible(true);
    this._isInSettings = false;

    // 切换焦点组
    a11yManager.destroyFocusGroup(FOCUS_GROUP_SETTINGS);
    this._setupMainMenuFocusGroup();

    // 播报设置面板关闭
    a11yManager.announceUIState('设置面板', 'closed');
  }

  private _showHelp(): void {
    this._mainMenuContainer.setVisible(false);
    this._settingsContainer.setVisible(false);
    this._helpContainer.setVisible(true);
    this._isInSettings = true; // 复用这个标志表示不在主菜单

    // 切换焦点组
    a11yManager.destroyFocusGroup(FOCUS_GROUP_MAIN_MENU);
    this._setupHelpFocusGroup();

    // 播报帮助面板打开
    a11yManager.announceUIState('帮助面板', 'opened');
  }

  private _hideHelp(): void {
    this._helpContainer.setVisible(false);
    this._mainMenuContainer.setVisible(true);
    this._isInSettings = false;

    // 切换焦点组
    a11yManager.destroyFocusGroup(FOCUS_GROUP_HELP);
    this._setupMainMenuFocusGroup();

    // 播报帮助面板关闭
    a11yManager.announceUIState('帮助面板', 'closed');
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

  // ==================== 私有方法 - 键盘导航 ====================

  /**
   * 设置键盘导航
   */
  private _setupKeyboardNavigation(): void {
    if (this._keyDownHandler) return;

    this._keyDownHandler = (event: KeyboardEvent): void => {
      if (!this.isVisible()) return;

      // 构建按键标识
      let keyCode = event.code;
      if (event.shiftKey && keyCode === 'Tab') {
        keyCode = 'ShiftTab';
      }

      // 让 A11yManager 处理导航
      if (a11yManager.handleKeyboardNavigation(keyCode)) {
        event.preventDefault();
        return;
      }

      // ESC 键处理
      if (event.code === 'Escape') {
        if (this._settingsContainer.visible) {
          this._hideSettings();
        } else if (this._helpContainer.visible) {
          this._hideHelp();
        } else {
          this._onResume();
        }
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', this._keyDownHandler);
  }

  /**
   * 移除键盘导航
   */
  private _removeKeyboardNavigation(): void {
    if (this._keyDownHandler) {
      window.removeEventListener('keydown', this._keyDownHandler);
      this._keyDownHandler = null;
    }

    // 销毁焦点组
    a11yManager.destroyFocusGroup(FOCUS_GROUP_MAIN_MENU);
    a11yManager.destroyFocusGroup(FOCUS_GROUP_SETTINGS);
    a11yManager.destroyFocusGroup(FOCUS_GROUP_HELP);
  }

  /**
   * 设置主菜单焦点组
   */
  private _setupMainMenuFocusGroup(): void {
    const focusGroup = a11yManager.createFocusGroup(FOCUS_GROUP_MAIN_MENU, {
      wrapAround: true,
      autoFocus: true,
      groupName: '暂停菜单',
    });

    const buttonLabels = ['继续游戏', '设置', '帮助', '保存', '读取', '返回主菜单'];
    const buttonCallbacks = [
      () => this._onResume(),
      () => this._showSettings(),
      () => this._showHelp(),
      () => this._onSave(),
      () => this._onLoad(),
      () => this._onQuit(),
    ];

    this._mainMenuButtons.forEach((_button, index) => {
      const focusableElement: IFocusableElement = {
        id: `menu-btn-${index}`,
        label: buttonLabels[index],
        role: 'menuitem',
        enabled: true,
        onFocus: () => this._highlightMenuButton(index, true),
        onBlur: () => this._highlightMenuButton(index, false),
        onActivate: () => buttonCallbacks[index](),
      };
      focusGroup.add(focusableElement);
    });

    a11yManager.setActiveFocusGroup(FOCUS_GROUP_MAIN_MENU);
  }

  /**
   * 设置设置面板焦点组
   */
  private _setupSettingsFocusGroup(): void {
    const focusGroup = a11yManager.createFocusGroup(FOCUS_GROUP_SETTINGS, {
      wrapAround: true,
      autoFocus: true,
      groupName: '设置面板',
    });

    // 添加返回按钮作为可聚焦元素
    focusGroup.add({
      id: 'settings-back',
      label: '返回',
      role: 'button',
      enabled: true,
      onFocus: () => {
        // 高亮返回按钮
      },
      onBlur: () => {
        // 取消高亮
      },
      onActivate: () => this._hideSettings(),
    });

    a11yManager.setActiveFocusGroup(FOCUS_GROUP_SETTINGS);
  }

  /**
   * 设置帮助面板焦点组
   */
  private _setupHelpFocusGroup(): void {
    const focusGroup = a11yManager.createFocusGroup(FOCUS_GROUP_HELP, {
      wrapAround: true,
      autoFocus: true,
      groupName: '帮助面板',
    });

    // 添加返回按钮作为可聚焦元素
    focusGroup.add({
      id: 'help-back',
      label: '返回',
      role: 'button',
      enabled: true,
      onFocus: () => {
        // 高亮返回按钮
      },
      onBlur: () => {
        // 取消高亮
      },
      onActivate: () => this._hideHelp(),
    });

    a11yManager.setActiveFocusGroup(FOCUS_GROUP_HELP);
  }

  /**
   * 高亮菜单按钮
   */
  private _highlightMenuButton(index: number, highlight: boolean): void {
    const button = this._mainMenuButtons[index];
    if (!button) return;

    const bg = button.list[0] as Phaser.GameObjects.Graphics;
    const label = button.list[1] as Phaser.GameObjects.Text;
    const buttonWidth = CONFIG.MENU_WIDTH;

    bg.clear();
    if (highlight) {
      bg.fillStyle(COLORS.BG_SECONDARY, 1);
      bg.fillRoundedRect(
        -buttonWidth / 2,
        -CONFIG.BUTTON_HEIGHT / 2,
        buttonWidth,
        CONFIG.BUTTON_HEIGHT,
        8
      );
      bg.lineStyle(2, COLORS.ACCENT, 1);
      bg.strokeRoundedRect(
        -buttonWidth / 2,
        -CONFIG.BUTTON_HEIGHT / 2,
        buttonWidth,
        CONFIG.BUTTON_HEIGHT,
        8
      );
      label.setColor('#00FFAA');
      this._currentFocusIndex = index;
    } else {
      bg.fillStyle(COLORS.BG_TERTIARY, 1);
      bg.fillRoundedRect(
        -buttonWidth / 2,
        -CONFIG.BUTTON_HEIGHT / 2,
        buttonWidth,
        CONFIG.BUTTON_HEIGHT,
        8
      );
      bg.lineStyle(1, COLORS.BORDER, 1);
      bg.strokeRoundedRect(
        -buttonWidth / 2,
        -CONFIG.BUTTON_HEIGHT / 2,
        buttonWidth,
        CONFIG.BUTTON_HEIGHT,
        8
      );
      label.setColor('#E8E6E3');
    }
  }

  /**
   * 获取当前焦点索引（用于测试/调试）
   */
  public getCurrentFocusIndex(): number {
    return this._currentFocusIndex;
  }
}
