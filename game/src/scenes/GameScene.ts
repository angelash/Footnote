/**
 * 游戏主场景
 * 负责Zone渲染和游戏逻辑
 */
import Phaser from 'phaser';
import { SCENES, TEXT_STYLES, CONSTANTS } from '@/config/game.config';
import type { AbilityType } from '@/config/game.config';
import { createLogger } from '@/utils/Logger';

const logger = createLogger('GameScene');
import { UI_FONT_SIZE } from '@/config/ui.config';
import { getZoneBackgroundKey } from '@/config/zones.config';
import { getSceneConfig } from '@/data/scenes';
import { SceneAssembler } from '@/systems/scene/SceneAssembler';
import { worldState } from '@/systems/world';
import { eventBus, GameEvent } from '@/systems/EventBus';
import {
  DialogueUI,
  CardUI,
  ToastManager,
  AbilitySystem,
  PauseMenu,
  InventoryUI,
  saveManager,
  assetManager,
  debugCommands,
  RedundantFieldBar,
  DepthEffects,
  ForeshadowManager,
  EndingEffects,
  EndingType,
  TouchControls,
  TutorialManager,
  AchievementManager,
  newGamePlusManager,
  performanceMonitor,
  ControlHints,
  InteractionPrompt,
} from '@/systems';
import { AudioManager } from '@/systems/audio/AudioManager';
import { narrativeEngine } from '@/systems/narrative';
import type { ICard as INarrativeCard } from '@/systems/narrative';
import { loadAllNarrativeData } from '@/data/NarrativeDataLoader';
import { AUDIO_CONFIG, ZONE_AUDIO_MAP } from '@/data/audioConfig';
import type { IAssembledScene, ISceneAction } from '@/types/scene';
import type { IDialogue, ICard } from '@/types';

interface IGameSceneData {
  zoneId: string;
  isNewGame?: boolean;
  fromZone?: string;
}

export class GameScene extends Phaser.Scene {
  private _currentZoneId: string = '';
  private _isNewGame: boolean = false;
  private _assembledScene: IAssembledScene | null = null;
  private _sceneAssembler!: SceneAssembler;

  // 游戏对象
  private _player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private _interactables: Phaser.GameObjects.Container[] = [];

  // 输入
  private _cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private _moveKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private _moveSpeed: number = 200;

  // 玩家状态
  private _isMoving: boolean = false;

  // UI系统
  private _dialogueUI!: DialogueUI;
  private _cardUI!: CardUI;
  private _toastManager!: ToastManager;
  private _abilitySystem!: AbilitySystem;
  private _pauseMenu!: PauseMenu;
  private _inventoryUI!: InventoryUI;

  // 音频系统
  private _audioManager!: AudioManager;

  // 新增UI组件
  private _redundantFieldBar!: RedundantFieldBar;
  private _depthEffects!: DepthEffects;
  private _foreshadowManager!: ForeshadowManager;
  private _endingEffects!: EndingEffects;

  // 触控系统
  private _touchControls!: TouchControls;
  private _touchMoveDirection: { x: number; y: number } = { x: 0, y: 0 };

  // 教程和成就系统
  private _tutorialManager!: TutorialManager;
  private _achievementManager!: AchievementManager;

  // 操作指引
  private _controlHints!: ControlHints;

  // 交互提示
  private _interactionPrompt!: InteractionPrompt;
  private _nearestInteractable: Phaser.GameObjects.Container | null = null;
  private readonly _interactionRange: number = 100; // 交互范围

  // UI元素
  private _zoneTitle!: Phaser.GameObjects.Text;
  private _dialogueBox!: Phaser.GameObjects.Container;
  private _hudContainer!: Phaser.GameObjects.Container;
  private _counterTexts!: {
    r: Phaser.GameObjects.Text;
    p: Phaser.GameObjects.Text;
    w: Phaser.GameObjects.Text;
  };
  private _abilityBar!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SCENES.GAME });
  }

  init(data: IGameSceneData): void {
    this._currentZoneId = data.zoneId || 'C0-Z1';
    this._isNewGame = data.isNewGame ?? false;

    logger.info(`初始化 Zone: ${this._currentZoneId}`);
  }

  create(): void {
    const { width, height } = this.scale;

    // 设置资源管理器场景引用
    assetManager.setScene(this);

    // 设置调试命令场景引用
    debugCommands.setScene(this);

    // 按需加载当前章节资源
    const currentChapter = this._currentZoneId.split('-')[0];
    this._loadChapterAssetsAsync(currentChapter);

    // 淡入效果
    this.cameras.main.fadeIn(500, 10, 10, 15);

    // 创建游戏世界
    this._createBackground(width, height);
    this._createPlayer(width, height);
    this._createUI(width, height);
    this._createHUD(width);
    this._createAbilityBar(width, height);

    // 初始化UI系统
    this._initUISystems();

    // 初始化音频系统
    this._initAudioSystem();

    // 初始化辅助系统（存档、成就、教程、NG+）
    this._initAuxiliarySystems();

    this._sceneAssembler = new SceneAssembler(this, {
      onAction: (action) => this._handleSceneAction(action),
    });

    // 加载叙事数据
    this._loadNarrativeData();

    // 加载Zone数据
    this._loadZone(this._currentZoneId);

    // 设置输入
    this._setupInput();

    // 设置事件监听
    this._setupEventListeners();

    // 发送进入Zone事件
    eventBus.emitTyped(GameEvent.ZONE_ENTER, {
      zoneId: this._currentZoneId,
      isFirstVisit: !worldState.getZoneState(this._currentZoneId)?.visitCount,
      isRevisit: (worldState.getZoneState(this._currentZoneId)?.visitCount ?? 0) > 0,
    });

    // 如果是新游戏，播放序章开场
    if (this._isNewGame) {
      this._playPrologueIntro();
    }
  }

  update(time: number, delta: number): void {
    // 更新性能监控（每帧调用）
    performanceMonitor.update(time, delta);

    this._updatePlayerMovement();
    // y-sort：玩家随 y 值更新遮挡层级
    this._player.setDepth(this._player.y);

    // P值自然衰减
    worldState.decayP(delta);

    // 更新游戏时间
    worldState.updatePlayTime(delta / 1000);

    // 更新能力系统
    this._abilitySystem?.update(delta);

    // 更新交互提示（检测附近可交互物品）
    this._updateInteractionPrompt();
  }

  /**
   * 更新交互提示
   * 检测玩家附近是否有可交互物品
   */
  private _updateInteractionPrompt(): void {
    // 如果UI打开，隐藏交互提示
    if (
      this._dialogueUI?.isVisible() ||
      this._cardUI?.isVisible() ||
      this._pauseMenu?.isVisible() ||
      this._inventoryUI?.isVisible()
    ) {
      this._interactionPrompt?.hide();
      this._nearestInteractable = null;
      return;
    }

    // 查找最近的可交互对象
    let nearest: Phaser.GameObjects.Container | null = null;
    let nearestDist = Infinity;
    const playerX = this._player.x;
    const playerY = this._player.y;

    // 检查 SceneAssembler 创建的可交互对象
    if (this._assembledScene) {
      for (const obj of this._assembledScene.objects) {
        // 只检查有交互数据的对象
        if (obj instanceof Phaser.GameObjects.Container && obj.getData('action')) {
          const dist = Phaser.Math.Distance.Between(playerX, playerY, obj.x, obj.y);
          if (dist < this._interactionRange && dist < nearestDist) {
            nearestDist = dist;
            nearest = obj;
          }
        }
      }
    }

    // 检查旧的交互点数组
    for (const interactable of this._interactables) {
      const dist = Phaser.Math.Distance.Between(playerX, playerY, interactable.x, interactable.y);
      if (dist < this._interactionRange && dist < nearestDist) {
        nearestDist = dist;
        nearest = interactable;
      }
    }

    // 更新交互提示
    if (nearest) {
      if (this._nearestInteractable !== nearest) {
        this._nearestInteractable = nearest;
        // 获取标签名称
        const label = nearest.name || nearest.getData('label') || '交互';
        this._interactionPrompt?.show({
          object: nearest,
          label: label,
          x: nearest.x,
          y: nearest.y,
        });
      } else {
        // 更新位置（对象可能移动）
        this._interactionPrompt?.show({
          object: nearest,
          label: nearest.name || nearest.getData('label') || '交互',
          x: nearest.x,
          y: nearest.y,
        });
      }
    } else {
      if (this._nearestInteractable) {
        this._nearestInteractable = null;
        this._interactionPrompt?.hide();
      }
    }
  }

  shutdown(): void {
    // 清理事件监听
    this._cleanupEventListeners();

    // 清理UI系统
    this._dialogueUI?.destroy();
    this._cardUI?.destroy();
    this._toastManager?.destroy();
    this._abilitySystem?.destroy();
    this._pauseMenu?.destroy();
    this._inventoryUI?.destroy();

    // 清理新增UI组件
    this._redundantFieldBar?.destroy();
    this._depthEffects?.destroy();
    this._foreshadowManager?.destroy();
    this._endingEffects?.destroy();

    // 清理触控系统
    this._touchControls?.destroy();

    // 清理教程和成就系统
    this._tutorialManager?.destroy();
    this._achievementManager?.destroy();

    // 清理操作指引
    this._controlHints?.destroy();

    // 清理交互提示
    this._interactionPrompt?.destroy();

    // 清理音频系统
    this._audioManager?.destroy();
  }

  /**
   * 尝试与最近的可交互对象交互
   * 优先使用已检测到的最近对象，否则重新搜索
   */
  private _tryInteract(): void {
    // 优先使用交互提示已检测到的最近对象
    let target: Phaser.GameObjects.Container | null = this._nearestInteractable;

    // 如果没有预检测的目标，重新搜索
    if (!target) {
      const playerX = this._player.x;
      const playerY = this._player.y;
      let closestDist = Infinity;

      // 检查 SceneAssembler 创建的可交互对象
      if (this._assembledScene) {
        for (const obj of this._assembledScene.objects) {
          if (obj instanceof Phaser.GameObjects.Container && obj.getData('action')) {
            const dist = Phaser.Math.Distance.Between(playerX, playerY, obj.x, obj.y);
            if (dist < this._interactionRange && dist < closestDist) {
              closestDist = dist;
              target = obj;
            }
          }
        }
      }

      // 检查旧的交互点数组
      for (const interactable of this._interactables) {
        const dist = Phaser.Math.Distance.Between(playerX, playerY, interactable.x, interactable.y);
        if (dist < this._interactionRange && dist < closestDist) {
          closestDist = dist;
          target = interactable;
        }
      }
    }

    if (target) {
      // 触发交互
      const objectId = target.name;
      logger.info(`触发交互: ${objectId}`);
      eventBus.emit(GameEvent.INTERACT_START, { objectId, actionType: 'touch' });

      // 使用getData获取存储的action（如果有的话）
      const action = target.getData('action') as ISceneAction | undefined;
      if (action) {
        this._handleSceneAction(action);
      }
    }
  }

  /**
   * 初始化UI系统
   */
  private _initUISystems(): void {
    // 对话UI
    this._dialogueUI = new DialogueUI({
      scene: this,
      onDialogueEnd: (dialogueId): void => {
        logger.debug(`对话结束: ${dialogueId}`);
        // 对话结束，检查是否需要继续
        // NarrativeEngine会自动处理对话链
      },
      onChoiceSelected: (dialogueId, choiceIndex): void => {
        logger.debug(`选择了选项 ${choiceIndex} in ${dialogueId}`);
        // 选择已由DialogueUI和NarrativeEngine处理
      },
    });

    // 卡片UI
    this._cardUI = new CardUI({
      scene: this,
      onCardClosed: (cardId): void => {
        logger.debug(`卡片关闭: ${cardId}`);
      },
    });

    // 提示管理器
    this._toastManager = new ToastManager({ scene: this });

    // 能力系统
    this._abilitySystem = new AbilitySystem({
      scene: this,
      onAbilityActivate: (type): void => {
        this._toastManager.showInfo(`能力激活: ${type}`);
      },
      onAbilityDeactivate: (type): void => {
        logger.debug(`能力停用: ${type}`);
      },
    });

    // 暂停菜单
    this._pauseMenu = new PauseMenu({
      scene: this,
      onResume: (): void => {
        logger.debug('游戏继续');
      },
      onSettings: (): void => {
        logger.debug('打开设置');
        // 设置面板已在PauseMenu内部处理
      },
      onSave: async (): Promise<void> => {
        logger.info('保存游戏');
        try {
          // 使用槽位1进行手动存档
          const zoneName = this._zoneTitle?.text || this._currentZoneId;
          const success = await saveManager.save(1, `手动存档 - ${zoneName}`);
          if (success) {
            this._toastManager.showSuccess('游戏已保存');
          } else {
            this._toastManager.showError('保存失败');
          }
        } catch (error) {
          logger.error('保存错误:', error);
          this._toastManager.showError('保存失败');
        }
      },
      onLoad: async (): Promise<void> => {
        logger.info('加载存档');
        // 返回主菜单的存档列表进行读档
        this._pauseMenu.hide();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start(SCENES.MENU);
        });
      },
      onMainMenu: (): void => {
        // 自动存档后返回主菜单
        void saveManager.autoSave().then(() => {
          this._pauseMenu.hide();
          this.cameras.main.fadeOut(500, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start(SCENES.MENU);
          });
        });
      },
    });

    // 物品栏UI
    this._inventoryUI = new InventoryUI({
      scene: this,
      onCardSelect: (cardId: string): void => {
        logger.debug(`选中卡片: ${cardId}`);
        const card = narrativeEngine.getCard(cardId);
        if (card) {
          this._cardUI.showCard(this._convertNarrativeCard(card));
        }
      },
      onClose: (): void => {
        logger.debug('物品栏关闭');
      },
    });

    // 冗余字段条（CF章节显示）
    this._redundantFieldBar = new RedundantFieldBar({ scene: this });

    // 深度能力视觉效果
    this._depthEffects = new DepthEffects({ scene: this });

    // 伏笔管理器
    this._foreshadowManager = new ForeshadowManager({ scene: this });

    // 结局演出效果
    this._endingEffects = new EndingEffects({ scene: this });
  }

  /**
   * 初始化音频系统
   */
  private _initAudioSystem(): void {
    this._audioManager = new AudioManager(this);

    // 加载音频配置
    this._audioManager.loadConfigs(AUDIO_CONFIG.bgm, AUDIO_CONFIG.sfx, AUDIO_CONFIG.ambience);

    logger.info('音频系统初始化完成');
  }

  /**
   * 初始化辅助系统（存档、成就、教程、NG+）
   */
  private _initAuxiliarySystems(): void {
    // 1. 存档系统初始化（异步，不阻塞）
    saveManager
      .initialize()
      .then(() => {
        logger.info('存档系统初始化完成');
      })
      .catch((error) => {
        logger.error('存档系统初始化失败:', error);
      });

    // 2. 成就系统初始化
    this._achievementManager = new AchievementManager({ scene: this });
    logger.info('成就系统初始化完成');

    // 3. 教程系统初始化
    this._tutorialManager = new TutorialManager({ scene: this });
    logger.info('教程系统初始化完成');

    // 4. New Game+ 系统初始化
    newGamePlusManager
      .initialize()
      .then(() => {
        logger.info('NG+系统初始化完成');

        // 如果是NG+，应用继承内容
        if (newGamePlusManager.isNewGamePlus()) {
          logger.info('检测到NG+模式，应用继承奖励');
          // NG+奖励在 startNewGamePlus 中已应用，这里只做记录
        }
      })
      .catch((error) => {
        logger.error('NG+系统初始化失败:', error);
      });

    // 5. 检查是否需要显示教程（仅新游戏且非NG+时）
    if (this._isNewGame && !newGamePlusManager.isNewGamePlus()) {
      // 延迟显示第一个教程，等待场景稳定
      this.time.delayedCall(1500, () => {
        if (!this._tutorialManager.isAllCompleted()) {
          this._tutorialManager.checkAndShowNext();
        }
      });
    }

    // 6. 初始化操作指引（常驻显示）
    this._controlHints = new ControlHints({
      scene: this,
      isMobile: this._touchControls?.isMobile(),
      visible: true,
      position: 'top-left',
    });
    logger.info('操作指引初始化完成');

    // 7. 初始化交互提示
    this._interactionPrompt = new InteractionPrompt({
      scene: this,
      onInteract: () => this._tryInteract(),
    });
    this._interactionPrompt.setMobileMode(this._touchControls?.isMobile() ?? false);
    logger.info('交互提示初始化完成');

    logger.info('辅助系统初始化完成');
  }

  /**
   * 异步加载章节资源
   */
  private async _loadChapterAssetsAsync(chapter: string): Promise<void> {
    try {
      await assetManager.loadChapterAssets(chapter);
      // 预加载下一章资源
      assetManager.preloadNextChapter(chapter);
      logger.info(`章节资源加载完成: ${chapter}`);
    } catch (error) {
      logger.warn('章节资源加载失败:', error);
    }
  }

  /**
   * 播放Zone对应的音频
   */
  private _playZoneAudio(zoneId: string): void {
    const audioConfig = ZONE_AUDIO_MAP[zoneId];
    if (audioConfig) {
      // 播放BGM
      if (this.cache.audio.exists(audioConfig.bgm)) {
        this._audioManager.playBgm(audioConfig.bgm);
      } else {
        logger.debug(`BGM未加载: ${audioConfig.bgm}`);
      }

      // 播放环境音
      if (this.cache.audio.exists(audioConfig.ambience)) {
        this._audioManager.playAmbience(audioConfig.ambience);
      } else {
        logger.debug(`环境音未加载: ${audioConfig.ambience}`);
      }
    }
  }

  /**
   * 播放音效
   */
  public playSfx(sfxId: string): void {
    if (this.cache.audio.exists(sfxId)) {
      this._audioManager.playSfx(sfxId);
    }
  }

  /**
   * 加载叙事数据
   */
  private async _loadNarrativeData(): Promise<void> {
    try {
      const data = await loadAllNarrativeData(this);
      logger.info('叙事数据加载完成:', {
        dialogues: data.dialogues.length,
        cards: data.cards.length,
        foreshadows: data.foreshadows.length,
      });
      // 数据已由NarrativeDataLoader加载到narrativeEngine
    } catch (error) {
      logger.warn('叙事数据加载失败:', error);
    }
  }

  private _createBackground(width: number, height: number): void {
    // 获取Zone背景配置
    const zoneBgKey = getZoneBackgroundKey(this._currentZoneId);

    // 优先使用Zone配置的WebP背景，否则使用占位符
    let bgKey = 'placeholder_bg';
    if (this.textures.exists(zoneBgKey)) {
      bgKey = zoneBgKey;
      logger.debug(`使用Zone背景: ${zoneBgKey}`);
    } else if (this.textures.exists('px_bg_placeholder')) {
      bgKey = 'px_bg_placeholder';
      logger.debug(`Zone背景未找到(${zoneBgKey})，使用像素占位符`);
    } else {
      logger.debug('使用默认占位符背景');
    }

    this.add
      .image(0, 0, bgKey)
      .setOrigin(0)
      .setDisplaySize(width, height)
      .setName('zone_background');
  }

  private _createPlayer(width: number, height: number): void {
    // 检查是否有角色精灵动画可用
    const hasPlayerSprite = this.textures.exists('px_sprite_cenhui_idle');
    const textureKey = hasPlayerSprite ? 'px_sprite_cenhui_idle' : 'placeholder_char';

    // 俯视角：使用 Arcade Physics 的动态体
    this._player = this.physics.add
      .sprite(width / 2, height * 0.7, textureKey)
      .setScale(hasPlayerSprite ? 0.8 : 1.5);

    this._player.setCollideWorldBounds(true);
    // 调整碰撞盒
    this._player.body.setSize(hasPlayerSprite ? 40 : 32, hasPlayerSprite ? 40 : 32, true);
    this._player.setDepth(this._player.y);

    // 如果有动画，播放待机动画
    if (hasPlayerSprite && this.anims.exists('cenhui_idle')) {
      this._player.play('cenhui_idle');
    }
  }

  private _createUI(width: number, height: number): void {
    // Zone标题
    this._zoneTitle = this.add
      .text(width / 2, 60, '', {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.SMALL,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // 对话框
    this._createDialogueBox(width, height);

    // 菜单按钮
    this._createMenuButton();

    // 物品栏按钮
    this._createInventoryButton(width);
  }

  /**
   * 创建HUD（抬头显示）
   */
  private _createHUD(width: number): void {
    this._hudContainer = this.add.container(0, 0);
    this._hudContainer.setDepth(1000); // 确保在最上层

    // 计数器背景
    const counterBg = this.add.graphics();
    counterBg.fillStyle(0x0a0a0f, 0.8);
    counterBg.fillRoundedRect(width - 180, 20, 160, 80, 8);
    this._hudContainer.add(counterBg);

    // R/P/W 计数器显示
    const counters = worldState.getCounters();
    const counterY = 35;
    const spacing = 24;

    // R值（红色）
    const rIcon = this.textures.exists('px_counter_r')
      ? this.add.image(width - 160, counterY, 'px_counter_r').setScale(0.3)
      : this.add
          .text(width - 160, counterY, 'R', { fontSize: UI_FONT_SIZE.TINY, color: '#FF4444' })
          .setOrigin(0.5);
    const rText = this.add
      .text(width - 130, counterY, `${counters.R}`, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.TINY,
        color: '#FF4444',
      })
      .setOrigin(0, 0.5);

    // P值（蓝色）
    const pIcon = this.textures.exists('px_counter_p')
      ? this.add.image(width - 160, counterY + spacing, 'px_counter_p').setScale(0.3)
      : this.add
          .text(width - 160, counterY + spacing, 'P', {
            fontSize: UI_FONT_SIZE.TINY,
            color: '#4A9EFF',
          })
          .setOrigin(0.5);
    const pText = this.add
      .text(width - 130, counterY + spacing, `${counters.P}`, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.TINY,
        color: '#4A9EFF',
      })
      .setOrigin(0, 0.5);

    // W值（金色）
    const wIcon = this.textures.exists('px_counter_w')
      ? this.add.image(width - 160, counterY + spacing * 2, 'px_counter_w').setScale(0.3)
      : this.add
          .text(width - 160, counterY + spacing * 2, 'W', {
            fontSize: UI_FONT_SIZE.TINY,
            color: '#FFD700',
          })
          .setOrigin(0.5);
    const wText = this.add
      .text(width - 130, counterY + spacing * 2, `${counters.W}`, {
        ...TEXT_STYLES.BODY,
        fontSize: UI_FONT_SIZE.TINY,
        color: '#FFD700',
      })
      .setOrigin(0, 0.5);

    this._hudContainer.add([rIcon, rText, pIcon, pText, wIcon, wText]);

    // 保存文本引用以便更新
    this._counterTexts = { r: rText, p: pText, w: wText };
  }

  /**
   * 创建能力栏
   */
  private _createAbilityBar(width: number, height: number): void {
    this._abilityBar = this.add.container(width / 2, height - 60);
    this._abilityBar.setDepth(1000);

    const abilities: Array<{ key: string; name: string; type: AbilityType; color: number }> = [
      { key: '1', name: '深度感知', type: CONSTANTS.ABILITY.DEPTH_PERCEPTION, color: 0x00ffaa },
      { key: '2', name: '深度介入', type: CONSTANTS.ABILITY.DEPTH_INTERVENTION, color: 0xff00ff },
      { key: '3', name: '时间干预', type: CONSTANTS.ABILITY.TIME_INTERVENTION, color: 0xffd700 },
    ];

    abilities.forEach((ability, index) => {
      const x = (index - 1) * 80;

      // 背景
      const bg = this.add.graphics();
      bg.fillStyle(0x1e1e24, 0.9);
      bg.fillRoundedRect(x - 30, -25, 60, 50, 8);
      bg.lineStyle(2, ability.color, 0.5);
      bg.strokeRoundedRect(x - 30, -25, 60, 50, 8);

      // 快捷键提示
      const keyHint = this.add
        .text(x, -15, ability.key, {
          fontSize: UI_FONT_SIZE.TINY,
          color: '#686868',
        })
        .setOrigin(0.5);

      // 图标/名称
      const icon = this.add
        .text(x, 5, ability.name.slice(0, 2), {
          fontSize: UI_FONT_SIZE.TINY,
          color: `#${ability.color.toString(16).padStart(6, '0')}`,
        })
        .setOrigin(0.5);

      // 锁定遮罩（未解锁时显示）
      const lockMask = this.add.graphics();
      lockMask.fillStyle(0x000000, 0.7);
      lockMask.fillRoundedRect(x - 30, -25, 60, 50, 8);
      lockMask.setName(`lock_${ability.type}`);

      // 检查是否解锁
      if (worldState.hasAbility(ability.type)) {
        lockMask.setVisible(false);
      }

      this._abilityBar.add([bg, keyHint, icon, lockMask]);

      // 点击激活能力
      const hitArea = this.add
        .rectangle(x, 0, 60, 50, 0x000000, 0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (worldState.hasAbility(ability.type)) {
            this._abilitySystem?.activateAbility(ability.type);
          } else {
            this._toastManager?.showWarning('能力尚未解锁');
          }
        });
      this._abilityBar.add(hitArea);
    });

    // 键盘快捷键
    this.input.keyboard?.on('keydown-ONE', () => {
      this._abilitySystem?.activateAbility(CONSTANTS.ABILITY.DEPTH_PERCEPTION);
    });
    this.input.keyboard?.on('keydown-TWO', () => {
      this._abilitySystem?.activateAbility(CONSTANTS.ABILITY.DEPTH_INTERVENTION);
    });
    this.input.keyboard?.on('keydown-THREE', () => {
      this._abilitySystem?.activateAbility(CONSTANTS.ABILITY.TIME_INTERVENTION);
    });
  }

  /**
   * 设置事件监听
   */
  private _setupEventListeners(): void {
    // 监听计数器变化
    eventBus.onTyped(GameEvent.COUNTER_R_CHANGE, this._onCounterRChanged.bind(this));
    eventBus.onTyped(GameEvent.COUNTER_P_CHANGE, this._onCounterPChanged.bind(this));
    eventBus.onTyped(GameEvent.COUNTER_W_CHANGE, this._onCounterWChanged.bind(this));

    // 监听卡片收集
    eventBus.onTyped(GameEvent.CARD_OBTAIN, this._onCardObtained.bind(this));

    // 监听能力解锁
    eventBus.onTyped(GameEvent.ABILITY_UNLOCK, this._onAbilityUnlocked.bind(this));

    // 监听Zone过渡
    eventBus.on(GameEvent.ZONE_TRANSITION, this._onZoneTransition.bind(this));

    // 监听播放音效
    eventBus.on(GameEvent.PLAY_SFX, this._onPlaySfx.bind(this));

    // 监听对话结束，处理结局触发
    eventBus.onTyped(GameEvent.DIALOGUE_END, this._onDialogueEnd.bind(this));

    // 监听对话推进（DialogueUI -> NarrativeEngine 同步）
    eventBus.onTyped(GameEvent.DIALOGUE_ADVANCE, this._onDialogueAdvance.bind(this));

    // 监听对话选项选择
    eventBus.onTyped(GameEvent.DIALOGUE_CHOICE, this._onDialogueChoice.bind(this));
  }

  /**
   * 清理事件监听
   */
  private _cleanupEventListeners(): void {
    eventBus.removeAllListeners(GameEvent.COUNTER_R_CHANGE);
    eventBus.removeAllListeners(GameEvent.COUNTER_P_CHANGE);
    eventBus.removeAllListeners(GameEvent.COUNTER_W_CHANGE);
    eventBus.removeAllListeners(GameEvent.CARD_OBTAIN);
    eventBus.removeAllListeners(GameEvent.ABILITY_UNLOCK);
    eventBus.removeAllListeners(GameEvent.ZONE_TRANSITION);
    eventBus.removeAllListeners(GameEvent.PLAY_SFX);
    eventBus.removeAllListeners(GameEvent.DIALOGUE_END);
    eventBus.removeAllListeners(GameEvent.DIALOGUE_ADVANCE);
    eventBus.removeAllListeners(GameEvent.DIALOGUE_CHOICE);
  }

  /**
   * Zone过渡回调
   */
  private _onZoneTransition(payload: { targetZone: string }): void {
    this._loadZone(payload.targetZone);
  }

  /**
   * 播放音效回调
   */
  private _onPlaySfx(payload: { key: string }): void {
    this.playSfx(payload.key);
  }

  /**
   * 对话结束回调 - 处理结局触发
   */
  private _onDialogueEnd(payload: { dialogueId: string }): void {
    const { dialogueId } = payload;

    // 检查是否是结局确认对话
    if (dialogueId.startsWith('CFZ5_CONFIRM_ENDING_')) {
      const endingLetter = dialogueId.charAt(dialogueId.length - 1); // A, B, 或 C

      // 检查结局是否可选
      const available = this._endingEffects.getAvailableEndings();

      if (available.includes(endingLetter)) {
        // 设置结局FLAG，触发结局演出
        worldState.setFlag(`FLAG_ENDING_${endingLetter}`, true);
        logger.info(`触发结局 ${endingLetter}`);
      } else {
        // 结局不可选，显示提示
        const requirement = this._endingEffects.getEndingRequirement(endingLetter);
        const counters = worldState.getCounters();
        this._toastManager?.showWarning(
          `结局${endingLetter}当前不可选\n条件: ${requirement}\n当前: R=${counters.R}, W=${counters.W}`
        );
      }
    }
  }

  /**
   * 对话推进回调 - 同步 NarrativeEngine
   * 当 DialogueUI 推进时，由此方法控制是显示下一行还是结束对话
   *
   * 注意：narrativeEngine.advance() 会通过 onAdvance 回调自动调用 showDialogue
   * 因此这里不需要再次调用 showDialogue，否则会导致重复的打字机效果
   */
  private _onDialogueAdvance(_payload: { dialogueId: string; lineIndex: number }): void {
    // 当 DialogueUI 推进时，也推进 NarrativeEngine
    if (narrativeEngine.isDialogueActive()) {
      // 推进 NarrativeEngine 到下一行
      // 注意：advance() 内部会调用 _showCurrentLine()，
      // 进而触发 onAdvance 回调来显示新的对话行
      narrativeEngine.advance();

      // 检查对话是否结束（onComplete 已在 advance 中执行）
      if (!narrativeEngine.isDialogueActive()) {
        // NarrativeEngine 已结束对话
        // 隐藏 DialogueUI（如果 onEnd 回调未处理）
        this._dialogueUI?.hideDialogue();
      }
      // 不再手动调用 showDialogue - 由 onAdvance 回调处理
    } else {
      // NarrativeEngine 不活跃，直接隐藏对话
      this._dialogueUI?.hideDialogue();
    }
  }

  /**
   * 对话选项选择回调 - 同步 NarrativeEngine
   */
  private _onDialogueChoice(payload: {
    dialogueId: string;
    choiceIndex: number;
    choiceText: string;
  }): void {
    // 当 DialogueUI 选择选项时，同步到 NarrativeEngine
    if (narrativeEngine.isDialogueActive()) {
      logger.debug(`选择对话选项: ${payload.dialogueId}, index=${payload.choiceIndex}`);

      // 使用 choiceText 作为 choiceId（因为 NarrativeEngine 使用 text 作为 id）
      narrativeEngine.selectChoice(payload.choiceText);
    }
  }

  /**
   * 触发结局
   */
  public triggerEnding(ending: EndingType): void {
    this._endingEffects.triggerEnding(ending);
  }

  /**
   * 显示冗余字段条（CF章节）
   */
  public showRedundantFieldBar(): void {
    this._redundantFieldBar.show();
  }

  /**
   * 获取深度效果管理器
   */
  public getDepthEffects(): DepthEffects {
    return this._depthEffects;
  }

  /**
   * 获取伏笔管理器
   */
  public getForeshadowManager(): ForeshadowManager {
    return this._foreshadowManager;
  }

  /**
   * R值变化回调
   */
  private _onCounterRChanged(payload: { oldValue: number; newValue: number; delta: number }): void {
    if (this._counterTexts?.r) {
      this._counterTexts.r.setText(`${Math.floor(payload.newValue)}`);
      // 闪烁效果
      this.tweens.add({
        targets: this._counterTexts.r,
        scale: 1.3,
        duration: 100,
        yoyo: true,
      });
    }
  }

  /**
   * P值变化回调
   */
  private _onCounterPChanged(payload: { oldValue: number; newValue: number; delta: number }): void {
    if (this._counterTexts?.p) {
      this._counterTexts.p.setText(`${Math.floor(payload.newValue)}`);
      this.tweens.add({
        targets: this._counterTexts.p,
        scale: 1.3,
        duration: 100,
        yoyo: true,
      });
    }
  }

  /**
   * W值变化回调
   */
  private _onCounterWChanged(payload: { oldValue: number; newValue: number }): void {
    if (this._counterTexts?.w) {
      this._counterTexts.w.setText(`${Math.floor(payload.newValue)}`);
      this.tweens.add({
        targets: this._counterTexts.w,
        scale: 1.3,
        duration: 100,
        yoyo: true,
      });
    }
  }

  /**
   * 卡片获得回调
   */
  private _onCardObtained(payload: { cardId: string }): void {
    // 显示收集提示已由_showCard处理
    logger.debug(`卡片获得事件: ${payload.cardId}`);
  }

  /**
   * 能力解锁回调
   */
  private _onAbilityUnlocked(payload: { abilityType: string }): void {
    this._toastManager?.showAchievement('能力解锁', `解锁了新能力: ${payload.abilityType}`);

    // 更新能力栏锁定状态
    const lockMask = this._abilityBar?.getByName(
      `lock_${payload.abilityType}`
    ) as Phaser.GameObjects.Graphics;
    if (lockMask) {
      this.tweens.add({
        targets: lockMask,
        alpha: 0,
        duration: 500,
        onComplete: () => lockMask.setVisible(false),
      });
    }
  }

  /**
   * 显示临时提示（保留供外部调用）
   */
  public showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    if (this._toastManager) {
      switch (type) {
        case 'success':
          this._toastManager.showSuccess(message);
          break;
        case 'warning':
          this._toastManager.showWarning(message);
          break;
        case 'error':
          this._toastManager.showError(message);
          break;
        default:
          this._toastManager.showInfo(message);
      }
    } else {
      // 回退到简单提示
      const { width } = this.scale;
      const toast = this.add
        .text(width / 2, 120, message, {
          ...TEXT_STYLES.BODY,
          fontSize: UI_FONT_SIZE.TINY,
          backgroundColor: '#1E1E24',
          padding: { x: 12, y: 8 },
        })
        .setOrigin(0.5)
        .setAlpha(0)
        .setDepth(1001);

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

  private _createDialogueBox(width: number, height: number): void {
    this._dialogueBox = this.add.container(width / 2, height - 150);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a0f, 0.9);
    bg.fillRoundedRect(-340, -80, 680, 160, 12);
    bg.lineStyle(1, 0x3a3a40, 1);
    bg.strokeRoundedRect(-340, -80, 680, 160, 12);

    // 说话者名称
    const speakerName = this.add
      .text(-320, -60, '', {
        ...TEXT_STYLES.SPEAKER,
      })
      .setName('speakerName');

    // 对话文字
    const dialogueText = this.add
      .text(-320, -30, '', {
        ...TEXT_STYLES.DIALOGUE,
        wordWrap: { width: 620 },
      })
      .setName('dialogueText');

    // 继续提示
    const continueHint = this.add
      .text(300, 50, '点击继续 ▼', {
        ...TEXT_STYLES.MUTED,
      })
      .setOrigin(1, 0.5)
      .setName('continueHint');

    this._dialogueBox.add([bg, speakerName, dialogueText, continueHint]);
    this._dialogueBox.setVisible(false);
    this._dialogueBox.setAlpha(0);
  }

  private _createMenuButton(): void {
    const menuBtn = this.add
      .text(30, 30, '☰', {
        fontSize: UI_FONT_SIZE.SECTION,
        color: '#686868',
      })
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setColor('#E8E6E3'))
      .on('pointerout', () => menuBtn.setColor('#686868'))
      .on('pointerdown', () => this._openPauseMenu());
  }

  private _createInventoryButton(width: number): void {
    const invBtn = this.add
      .text(width - 30, 30, '📋', {
        fontSize: UI_FONT_SIZE.ICON,
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._openInventory());

    // 设置测试ID
    invBtn.setData('testid', 'inventory-button');
  }

  private _loadZone(zoneId: string): void {
    logger.info(`加载Zone: ${zoneId}`);

    // Zone标题映射
    const zoneTitles: Record<string, string> = {
      // 序章
      'C0-Z1': '宿舍走廊',
      'C0-Z2': '早餐小店',
      'C0-Z3': '薄墙巷口',
      'C0-Z4': '维修局前台',
      // 第1章
      'C1-Z1': '市政办事厅',
      'C1-Z2': '错门走廊',
      'C1-Z3': '档案巷口',
      'C1-Z4': '诊疗台候诊区',
      'C1-Z5': '礼堂街夜谈',
      'C1-Z6': '边缘断口',
      // 第2章
      'C2-Z1': '维修局校准室',
      'C2-Z2': '薄墙巷口',
      'C2-Z3': '许澄诊疗室',
      'C2-Z4': '修补摊',
      'C2-Z5': '诊疗台候诊区',
      'C2-Z6': '礼堂街',
      'C2-Z7': '边缘断口',
      // 第3章
      'C3-Z1': '顾临办公室',
      'C3-Z2': '不存在的房间',
      'C3-Z3': '宋岚的版本库',
      'C3-Z4': '小院街角',
      'C3-Z5': '诊疗台',
      'C3-Z6': '礼堂街',
      'C3-Z7': '断裂走廊',
      // 第4章
      'C4-Z1': '坍塌后的生活区',
      'C4-Z2': '校准室（时间）',
      'C4-Z3': '断口通道',
      'C4-Z4': '诊疗台',
      'C4-Z5': '走廊长椅',
      'C4-Z6': '街角破墙',
      'C4-Z7': '礼堂街',
      'C4-Z8': '市政走廊',
      // 第5章
      'C5-Z1': '版本冲突现场',
      'C5-Z2': '纠偏中心',
      'C5-Z3': '许澄的诊室',
      'C5-Z4': '礼堂街',
      'C5-Z5': '栖蓝的街角',
      'C5-Z6': '审计覆盖区',
      'C5-Z7': '判词之地',
      // 终章
      'CF-Z1': '冗余字段区',
      'CF-Z2': '最后的选择',
      'CF-Z3': '对视走廊',
      'CF-Z4': '保留之地',
      'CF-Z5': '平面尽头',
      'CF-Z6': '尾声',
      // 重返变体
      'RV-01': '宿舍走廊[深度感知]',
      'RV-02': '早餐小店[深度感知]',
      'RV-03': '薄墙巷口[时间干预]',
      'RV-04': '维修局[深度介入]',
      'RV-05': '折叠楼梯间[深度组合]',
      'RV-06': '版本交界处[三能力]',
      'RV-07': '漂移者居所[深度感知]',
      'RV-08': '时间回溯点[时间干预]',
      'RV-09': '祈言堂[深度感知]',
      'RV-10': '档案巷[深度介入]',
      'RV-11': '冲突点[三能力]',
      'RV-12': '陈匠灯塔[时间干预]',
    };

    this._zoneTitle.setText(zoneTitles[zoneId] || zoneId);
    this._zoneTitle.setData('testid', 'zone-title');

    // 显示Zone标题动画
    this.tweens.add({
      targets: this._zoneTitle,
      alpha: 1,
      duration: 500,
      hold: 2000,
      yoyo: true,
    });

    // 播放Zone音频
    this._playZoneAudio(zoneId);

    // 创建交互点
    this._buildZoneFromConfig(zoneId);
  }

  private _buildZoneFromConfig(zoneId: string): void {
    // 清理旧场景物件
    if (this._assembledScene) {
      this._sceneAssembler.destroy(this._assembledScene);
      this._assembledScene = null;
    }

    const cfg = getSceneConfig(zoneId);
    if (!cfg) {
      // 回退到旧的硬编码交互点（开发阶段安全兜底）
      this._createInteractionPoints(zoneId);
      return;
    }

    // 标题使用配置优先
    if (cfg.title) {
      this._zoneTitle.setText(cfg.title);
    }

    this._assembledScene = this._sceneAssembler.build(cfg);
  }

  private _handleSceneAction(action: ISceneAction): void {
    switch (action.type) {
      case 'dialogue': {
        // 优先使用 dialogueId 从 NarrativeEngine 加载完整对话
        if (action.dialogueId) {
          this.showDialogueById(action.dialogueId);
        } else {
          // 回退：直接使用 speaker/text（用于简单的内联对话）
          this._showDialogue({
            speaker: action.speaker ?? '系统',
            text: action.text ?? '',
          });
        }
        return;
      }
      case 'card': {
        if (action.cardId) this._showCard(action.cardId);
        return;
      }
      case 'gotoZone': {
        if (action.zoneId) {
          this.scene.restart({ zoneId: action.zoneId, fromZone: this._currentZoneId });
        }
        return;
      }
      case 'none':
      default:
        return;
    }
  }

  private _createInteractionPoints(zoneId: string): void {
    // TODO: 根据Zone数据创建交互点
    // 临时：创建示例交互点

    if (zoneId === 'C0-Z1') {
      // 身份卡交互点
      const idCard = this._createInteractable(200, 600, '身份卡', {
        type: 'card',
        cardId: 'CARD_C0_IDENTITY',
      });
      idCard.setData('testid', 'identity-card');
      this._interactables.push(idCard);

      // 公告板交互点
      const noticeBoard = this._createInteractable(500, 500, '公告板', {
        type: 'dialogue',
        speaker: '系统',
        text: '公告板上贴满了通知，日期处有涂改痕迹...',
      });
      this._interactables.push(noticeBoard);

      // 出口门（前往C0-Z2）
      const exitDoor = this._createInteractable(600, 900, '出口', {
        type: 'gotoZone',
        zoneId: 'C0-Z2',
      });
      this._interactables.push(exitDoor);
    }
  }

  /**
   * 创建可交互对象（存储 action 数据，不直接绑定点击事件）
   */
  private _createInteractable(
    x: number,
    y: number,
    label: string,
    action: ISceneAction
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 交互指示器
    const indicator = this.add.graphics();
    indicator.fillStyle(0x00ffaa, 0.3);
    indicator.fillCircle(0, 0, 30);
    indicator.lineStyle(2, 0x00ffaa, 0.8);
    indicator.strokeCircle(0, 0, 30);

    // 标签文字
    const text = this.add
      .text(0, 45, label, {
        ...TEXT_STYLES.MUTED,
        fontSize: UI_FONT_SIZE.TINY,
      })
      .setOrigin(0.5);

    container.add([indicator, text]);
    container.setSize(60, 60);
    container.setName(label);

    // 设置交互区域（仅用于 hover cursor）
    container.setInteractive({ useHandCursor: true });

    // 存储交互数据，供 InteractionPrompt 触发
    container.setData('action', action);
    container.setData('label', label);

    // 呼吸动画
    this.tweens.add({
      targets: indicator,
      alpha: 0.5,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return container;
  }

  private _setupInput(): void {
    // 方向键 + WASD（安全初始化，处理键盘不可用的情况）
    if (this.input.keyboard) {
      this._cursors = this.input.keyboard.createCursorKeys();
      this._moveKeys = this.input.keyboard.addKeys('W,A,S,D') as {
        W: Phaser.Input.Keyboard.Key;
        A: Phaser.Input.Keyboard.Key;
        S: Phaser.Input.Keyboard.Key;
        D: Phaser.Input.Keyboard.Key;
      };

      // ESC键打开/关闭暂停菜单
      this.input.keyboard.on('keydown-ESC', () => {
        if (this._pauseMenu?.isVisible()) {
          this._pauseMenu.hide();
        } else if (this._inventoryUI?.isVisible()) {
          this._inventoryUI.hide();
        } else {
          this._openPauseMenu();
        }
      });

      // I键打开/关闭物品栏
      this.input.keyboard.on('keydown-I', () => {
        if (this._inventoryUI?.isVisible()) {
          this._inventoryUI.hide();
        } else if (!this._pauseMenu?.isVisible()) {
          this._openInventory();
        }
      });
    }

    // 点击空白处关闭对话
    this.input.on('pointerdown', () => {
      if (this._dialogueBox.visible) {
        this._hideDialogue();
      }
    });

    // 初始化触控系统（移动端）
    this._touchControls = new TouchControls({
      scene: this,
      onMove: (direction): void => {
        this._touchMoveDirection = direction;
      },
      onInteract: (): void => {
        this._tryInteract();
      },
      onAbility: (index): void => {
        // 0=深度感知, 1=深度介入, 2=时间干预
        const abilityTypes = [
          'DEPTH_PERCEPTION',
          'DEPTH_INTERVENTION',
          'TIME_INTERVENTION',
        ] as const;
        if (index < abilityTypes.length && this._abilitySystem) {
          // 使用现有的 activateAbility/deactivateAbility 方法
          const abilityType = abilityTypes[index];
          if (this._abilitySystem.isAbilityActive(abilityType)) {
            this._abilitySystem.deactivateAbility(abilityType);
          } else {
            this._abilitySystem.activateAbility(abilityType);
          }
        }
      },
    });

    // 如果是移动设备，显示移动教程
    if (this._touchControls.isMobile()) {
      logger.info('移动设备检测，启用触控控制');
    }
  }

  private _updatePlayerMovement(): void {
    // 如果对话框、暂停菜单或物品栏打开，不允许移动
    if (
      this._dialogueBox.visible ||
      this._pauseMenu?.isVisible() ||
      this._inventoryUI?.isVisible()
    ) {
      this._player.setVelocity(0, 0);
      return;
    }

    let vx = 0;
    let vy = 0;

    // 优先使用触控输入
    if (
      this._touchControls?.isMobile() &&
      (this._touchMoveDirection.x !== 0 || this._touchMoveDirection.y !== 0)
    ) {
      vx = this._touchMoveDirection.x;
      vy = this._touchMoveDirection.y;
    } else if (this._cursors && this._moveKeys) {
      // 键盘输入
      const left = this._cursors.left?.isDown || this._moveKeys.A?.isDown;
      const right = this._cursors.right?.isDown || this._moveKeys.D?.isDown;
      const up = this._cursors.up?.isDown || this._moveKeys.W?.isDown;
      const down = this._cursors.down?.isDown || this._moveKeys.S?.isDown;

      if (left) vx -= 1;
      if (right) vx += 1;
      if (up) vy -= 1;
      if (down) vy += 1;

      // 对角线归一化，保证速度一致
      if (vx !== 0 && vy !== 0) {
        vx *= Math.SQRT1_2;
        vy *= Math.SQRT1_2;
      }
    }

    this._player.setVelocity(vx * this._moveSpeed, vy * this._moveSpeed);

    // 处理动画切换
    const wasMoving = this._isMoving;
    this._isMoving = vx !== 0 || vy !== 0;

    if (this._isMoving !== wasMoving) {
      // 状态变化，切换动画
      if (this._isMoving) {
        // 开始移动
        if (this.anims.exists('cenhui_walk')) {
          this._player.play('cenhui_walk');
        }
      } else {
        // 停止移动
        if (this.anims.exists('cenhui_idle')) {
          this._player.play('cenhui_idle');
        }
      }
    }

    // 根据移动方向翻转精灵
    if (vx < 0) {
      this._player.setFlipX(true);
    } else if (vx > 0) {
      this._player.setFlipX(false);
    }
  }

  /**
   * 显示简单对话（兼容旧代码）
   */
  private _showDialogue(dialogue: { speaker: string; text: string }): void {
    // 使用新的DialogueUI系统
    if (this._dialogueUI) {
      const dialogueData: IDialogue = {
        id: `temp_${Date.now()}`,
        speaker: dialogue.speaker,
        text: dialogue.text,
      };
      this._dialogueUI.showDialogue(dialogueData);
    } else {
      // 回退到旧的对话框
      const speakerName = this._dialogueBox.getByName('speakerName') as Phaser.GameObjects.Text;
      const dialogueText = this._dialogueBox.getByName('dialogueText') as Phaser.GameObjects.Text;

      speakerName.setText(dialogue.speaker);
      dialogueText.setText(dialogue.text);

      this._dialogueBox.setVisible(true);

      this.tweens.add({
        targets: this._dialogueBox,
        alpha: 1,
        y: this._dialogueBox.y - 20,
        duration: 300,
        ease: 'Power2',
      });
    }
  }

  /**
   * 根据ID显示对话（供外部调用）
   */
  public async showDialogueById(dialogueId: string): Promise<void> {
    // 使用NarrativeEngine的对话系统
    narrativeEngine.setDialogueCallbacks({
      onAdvance: (line) => {
        // 使用DialogueUI显示每一行
        if (this._dialogueUI) {
          const dialogueData: IDialogue = {
            id: dialogueId,
            speaker: line.speaker,
            text: line.text,
            expression: line.emotion as IDialogue['expression'],
          };
          this._dialogueUI.showDialogue(dialogueData);
        }
      },
      onChoice: (choices) => {
        // 将 NarrativeEngine 的选项格式转换为 DialogueUI 格式
        if (this._dialogueUI && choices.length > 0) {
          // 构造带选项的对话数据
          const lastLine = narrativeEngine.getCurrentLine();
          const dialogueData: IDialogue = {
            id: dialogueId,
            speaker: lastLine?.speaker ?? '',
            text: lastLine?.text ?? '',
            expression: lastLine?.emotion as IDialogue['expression'],
            choices: choices.map((c) => ({
              label: c.text,
              next: c.nextDialogueId ?? '',
            })),
          };
          this._dialogueUI.showDialogue(dialogueData);
        }
      },
      onEnd: () => {
        logger.debug('对话结束');
        // 对话结束时隐藏 DialogueUI
        this._dialogueUI?.hideDialogue();
      },
    });

    await narrativeEngine.startDialogue(dialogueId);
  }

  /**
   * 隐藏对话
   */
  private _hideDialogue(): void {
    if (this._dialogueUI?.isVisible()) {
      this._dialogueUI.hideDialogue();
    } else {
      this.tweens.add({
        targets: this._dialogueBox,
        alpha: 0,
        y: this._dialogueBox.y + 20,
        duration: 200,
        ease: 'Power2',
        onComplete: () => {
          this._dialogueBox.setVisible(false);
        },
      });
    }
  }

  /**
   * 显示卡片
   */
  private _showCard(cardId: string): void {
    logger.info(`显示卡片: ${cardId}`);

    // 尝试从narrativeEngine获取卡片数据
    const narrativeCard = narrativeEngine.getCard(cardId);

    if (narrativeCard && this._cardUI) {
      // 转换NarrativeEngine的ICard到CardUI需要的格式
      const card = this._convertNarrativeCard(narrativeCard);

      // 检查是否已拥有
      if (narrativeEngine.hasCard(cardId)) {
        // 查看已有卡片
        this._cardUI.showCard(card);
      } else {
        // 新获得卡片
        narrativeEngine.obtainCard(cardId);
        this._cardUI.showCardObtain(card);
        this._toastManager?.showSuccess(`获得卡片: ${card.name}`);
      }
    } else {
      // 回退：使用临时卡片数据
      const tempCard: ICard = {
        id: cardId,
        name: '身份识别卡',
        type: 'archive',
        chapter: 'C0',
        zone: this._currentZoneId,
        front: ['维修局外勤身份凭证', '持卡人：岑回', '编号：EX-7749'],
        detail: ['通行级别：灰', '有效期：本周期内有效', '背面有一道细小的划痕'],
      };

      if (this._cardUI) {
        this._cardUI.showCardObtain(tempCard);
      } else {
        // 最终回退：显示对话
        this._showDialogue({
          speaker: '获得卡片',
          text: `身份识别卡：岑回\n通行级别：灰\n所属：维修局外勤`,
        });
      }
    }
  }

  /**
   * 转换NarrativeEngine的卡片格式到UI需要的格式
   */
  private _convertNarrativeCard(card: INarrativeCard): ICard {
    return {
      id: card.id,
      name: card.title,
      type: card.category as ICard['type'],
      chapter: card.chapter,
      zone: card.zone,
      front: [card.title, card.subtitle || '', card.content.slice(0, 100)],
      detail: [card.content],
    };
  }

  private _openPauseMenu(): void {
    logger.debug('打开暂停菜单');
    if (this._pauseMenu && !this._pauseMenu.isVisible()) {
      this._pauseMenu.show();
    }
  }

  private _openInventory(): void {
    logger.debug('打开物品栏');
    if (this._inventoryUI && !this._inventoryUI.isVisible()) {
      this._inventoryUI.show();
    }
  }

  private _playPrologueIntro(): void {
    logger.debug('播放序章开场');

    // 延迟显示第一条对话
    this.time.delayedCall(1000, () => {
      this._showDialogue({
        speaker: '岑回',
        text: '先按流程走。',
      });
    });
  }
}
