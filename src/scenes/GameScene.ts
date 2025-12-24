/**
 * 游戏主场景
 * 负责Zone渲染和游戏逻辑
 */
import Phaser from 'phaser';
import { SCENES, TEXT_STYLES } from '@/config/game.config';
import { getSceneConfig } from '@/data/scenes';
import { SceneAssembler } from '@/systems/scene/SceneAssembler';
import type { IAssembledScene, ISceneAction } from '@/types/scene';

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
  private _player!: Phaser.GameObjects.Sprite;
  private _interactables: Phaser.GameObjects.Container[] = [];

  // UI元素
  private _zoneTitle!: Phaser.GameObjects.Text;
  private _dialogueBox!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SCENES.GAME });
  }

  init(data: IGameSceneData): void {
    this._currentZoneId = data.zoneId || 'C0-Z1';
    this._isNewGame = data.isNewGame ?? false;

    console.log(`[GameScene] 初始化 Zone: ${this._currentZoneId}`);
  }

  create(): void {
    const { width, height } = this.scale;

    // 淡入效果
    this.cameras.main.fadeIn(500, 10, 10, 15);

    // 创建游戏世界
    this._createBackground(width, height);
    this._createPlayer(width, height);
    this._createUI(width, height);

    this._sceneAssembler = new SceneAssembler(this, {
      onAction: (action) => this._handleSceneAction(action),
    });

    // 加载Zone数据
    this._loadZone(this._currentZoneId);

    // 设置输入
    this._setupInput();

    // 如果是新游戏，播放序章开场
    if (this._isNewGame) {
      this._playPrologueIntro();
    }
  }

  update(time: number, delta: number): void {
    // 开发阶段：让玩家占位符做轻微呼吸，避免 noUnusedParameters/noUnusedLocals
    if (this._player) {
      this._player.y = this.scale.height * 0.7 + Math.sin(time / 600) * 2;
    }
    void delta;
  }

  private _createBackground(width: number, height: number): void {
    // 临时使用纯色背景
    this.add.image(0, 0, 'placeholder_bg')
      .setOrigin(0)
      .setDisplaySize(width, height);
  }

  private _createPlayer(width: number, height: number): void {
    // 临时使用占位图形
    this._player = this.add.sprite(width / 2, height * 0.7, 'placeholder_char')
      .setScale(1.5);
  }

  private _createUI(width: number, height: number): void {
    // Zone标题
    this._zoneTitle = this.add.text(width / 2, 60, '', {
      ...TEXT_STYLES.BODY,
      fontSize: '16px',
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

  private _createDialogueBox(width: number, height: number): void {
    this._dialogueBox = this.add.container(width / 2, height - 150);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x0A0A0F, 0.9);
    bg.fillRoundedRect(-340, -80, 680, 160, 12);
    bg.lineStyle(1, 0x3A3A40, 1);
    bg.strokeRoundedRect(-340, -80, 680, 160, 12);

    // 说话者名称
    const speakerName = this.add.text(-320, -60, '', {
      ...TEXT_STYLES.SPEAKER,
    }).setName('speakerName');

    // 对话文字
    const dialogueText = this.add.text(-320, -30, '', {
      ...TEXT_STYLES.DIALOGUE,
      wordWrap: { width: 620 },
    }).setName('dialogueText');

    // 继续提示
    const continueHint = this.add.text(300, 50, '点击继续 ▼', {
      ...TEXT_STYLES.MUTED,
    })
      .setOrigin(1, 0.5)
      .setName('continueHint');

    this._dialogueBox.add([bg, speakerName, dialogueText, continueHint]);
    this._dialogueBox.setVisible(false);
    this._dialogueBox.setAlpha(0);
  }

  private _createMenuButton(): void {
    const menuBtn = this.add.text(30, 30, '☰', {
      fontSize: '28px',
      color: '#686868',
    })
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => menuBtn.setColor('#E8E6E3'))
      .on('pointerout', () => menuBtn.setColor('#686868'))
      .on('pointerdown', () => this._openPauseMenu());
  }

  private _createInventoryButton(width: number): void {
    const invBtn = this.add.text(width - 30, 30, '📋', {
      fontSize: '24px',
    })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._openInventory());

    // 设置测试ID
    invBtn.setData('testid', 'inventory-button');
  }

  private _loadZone(zoneId: string): void {
    console.log(`[GameScene] 加载Zone: ${zoneId}`);

    // TODO: 从数据加载Zone配置
    // 临时：显示Zone标题
    const zoneTitles: Record<string, string> = {
      'C0-Z1': '宿舍走廊',
      'C0-Z2': '早餐小店',
      'C0-Z3': '薄墙巷口',
      'C0-Z4': '维修局前台',
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

    // TODO: 创建交互点
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
        this._showDialogue({
          speaker: action.speaker ?? '系统',
          text: action.text ?? '',
        });
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
      const idCard = this._createInteractable(200, 600, '身份卡', () => {
        this._showCard('CARD_C0_01');
      });
      idCard.setData('testid', 'identity-card');
      this._interactables.push(idCard);

      // 公告板交互点
      const noticeBoard = this._createInteractable(500, 500, '公告板', () => {
        this._showDialogue({
          speaker: '系统',
          text: '公告板上贴满了通知，日期处有涂改痕迹...',
        });
      });
      this._interactables.push(noticeBoard);
    }
  }

  private _createInteractable(
    x: number,
    y: number,
    label: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 交互指示器
    const indicator = this.add.graphics();
    indicator.fillStyle(0x00FFAA, 0.3);
    indicator.fillCircle(0, 0, 30);
    indicator.lineStyle(2, 0x00FFAA, 0.8);
    indicator.strokeCircle(0, 0, 30);

    // 标签
    const text = this.add.text(0, 45, label, {
      ...TEXT_STYLES.MUTED,
      fontSize: '12px',
    }).setOrigin(0.5);

    container.add([indicator, text]);
    container.setSize(60, 60);

    // 交互
    container.setInteractive({ useHandCursor: true })
      .on('pointerdown', callback);

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
    // 点击空白处关闭对话
    this.input.on('pointerdown', () => {
      if (this._dialogueBox.visible) {
        this._hideDialogue();
      }
    });
  }

  private _showDialogue(dialogue: { speaker: string; text: string }): void {
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

  private _hideDialogue(): void {
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

  private _showCard(cardId: string): void {
    console.log(`[GameScene] 显示卡片: ${cardId}`);
    // TODO: 实现卡片弹窗

    // 临时：显示对话
    this._showDialogue({
      speaker: '获得卡片',
      text: `身份识别卡：岑回\n通行级别：灰\n所属：维修局外勤`,
    });
  }

  private _openPauseMenu(): void {
    console.log('[GameScene] 打开暂停菜单');
    // TODO: 实现暂停菜单
  }

  private _openInventory(): void {
    console.log('[GameScene] 打开物品栏');
    // TODO: 实现物品栏
  }

  private _playPrologueIntro(): void {
    console.log('[GameScene] 播放序章开场');

    // 延迟显示第一条对话
    this.time.delayedCall(1000, () => {
      this._showDialogue({
        speaker: '岑回',
        text: '先按流程走。',
      });
    });
  }
}

