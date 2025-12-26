/**
 * 对话预览场景
 * 
 * 测试对话流程
 */

import Phaser from 'phaser';
import { BasePreviewScene } from './BasePreviewScene';
import { CHARACTERS, CharacterId, getPortraitKey } from '@/config/characters.config';
import { CHARACTER_PORTRAITS } from '@/data/webpAssets';

// 示例对话数据
interface IDialogueLine {
  speaker: string;
  speakerId?: CharacterId;
  expression?: string;
  text: string;
  choices?: { text: string; next: number }[];
}

interface IDialogueSequence {
  id: string;
  name: string;
  chapter: string;
  lines: IDialogueLine[];
}

export class DialoguePreviewScene extends BasePreviewScene {
  protected title = '💬 对话预览';
  protected subtitle = '测试对话流程';

  private previewContainer!: Phaser.GameObjects.Container;
  private isPlaying = false;
  private currentSequence: IDialogueSequence | null = null;
  private currentLineIndex = 0;

  constructor() {
    super({ key: 'DialoguePreviewScene' });
  }

  protected createContent(width: number, height: number): void {
    let currentY = 30;

    const sequences = this.getSampleDialogues();

    // 统计
    const stats = this.add.text(width / 2, currentY, `${sequences.length} 个对话序列`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#686868',
    }).setOrigin(0.5);
    this.contentContainer.add(stats);
    currentY += 50;

    // 说明
    const description = this.add.text(width / 2, currentY, '点击对话可预览完整流程，支持选项分支', {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#4A4A4A',
    }).setOrigin(0.5);
    this.contentContainer.add(description);
    currentY += 50;

    // 对话列表 - 放大卡片
    const itemHeight = 150;
    const itemPadding = 20;

    sequences.forEach((sequence, index) => {
      const y = currentY + index * (itemHeight + itemPadding);
      const item = this.createDialogueItem(30, y, width - 60, itemHeight, sequence);
      this.contentContainer.add(item);
    });

    currentY += sequences.length * (itemHeight + itemPadding) + 30;
    this.setContentHeight(currentY);

    // 预览容器
    this.previewContainer = this.add.container(0, 0);
    this.previewContainer.setDepth(200);
    this.previewContainer.setVisible(false);
  }

  private getSampleDialogues(): IDialogueSequence[] {
    return [
      {
        id: 'DLG_C0_INTRO',
        name: '序章开场',
        chapter: 'C0',
        lines: [
          { speaker: '系统', text: '欢迎加入维修局。' },
          { speaker: '系统', text: '你被分配了一项任务。' },
          { speaker: '岑回', speakerId: CharacterId.CENHUI, expression: 'neutral', text: '（又是新的一天...）' },
          { speaker: '岑回', speakerId: CharacterId.CENHUI, expression: 'thinking', text: '我应该先去哪里？' },
          {
            speaker: '选择', text: '',
            choices: [
              { text: '前往档案室', next: 5 },
              { text: '查看公告板', next: 6 },
            ],
          },
          { speaker: '岑回', speakerId: CharacterId.CENHUI, expression: 'neutral', text: '去档案室看看有什么新任务。' },
          { speaker: '岑回', speakerId: CharacterId.CENHUI, expression: 'surprised', text: '公告板上贴着一张奇怪的通知...' },
        ],
      },
      {
        id: 'DLG_C1_GULIN',
        name: '与顾临对话',
        chapter: 'C1',
        lines: [
          { speaker: '顾临', speakerId: CharacterId.GULIN, expression: 'stern', text: '你就是新来的例外处理器？' },
          { speaker: '岑回', speakerId: CharacterId.CENHUI, expression: 'nervous', text: '是的，主管。' },
          { speaker: '顾临', speakerId: CharacterId.GULIN, expression: 'thinking', text: '记住，系统稳定高于一切。' },
          { speaker: '顾临', speakerId: CharacterId.GULIN, expression: 'displeased', text: '不要做多余的事。' },
        ],
      },
      {
        id: 'DLG_C2_SONGLAN',
        name: '宋岚的告诫',
        chapter: 'C2',
        lines: [
          { speaker: '宋岚', speakerId: CharacterId.SONGLAN, expression: 'serious', text: '有些事，官方版本不会告诉你。' },
          { speaker: '岑回', speakerId: CharacterId.CENHUI, expression: 'surprised', text: '什么意思？' },
          { speaker: '宋岚', speakerId: CharacterId.SONGLAN, expression: 'worried', text: '版本之间...存在差异。' },
          { speaker: '宋岚', speakerId: CharacterId.SONGLAN, expression: 'kind', text: '小心，别让系统发现你在看。' },
        ],
      },
      {
        id: 'DLG_C3_ATANG',
        name: '阿棠的困惑',
        chapter: 'C3',
        lines: [
          { speaker: '阿棠', speakerId: CharacterId.ATANG, expression: 'dreamy', text: '我好像...忘记了什么重要的事。' },
          { speaker: '岑回', speakerId: CharacterId.CENHUI, expression: 'concerned', text: '你还好吗？' },
          { speaker: '阿棠', speakerId: CharacterId.ATANG, expression: 'confused', text: '我是谁来着...？' },
          { speaker: '阿棠', speakerId: CharacterId.ATANG, expression: 'scared', text: '为什么...我在这里？' },
        ],
      },
    ];
  }

  private createDialogueItem(
    x: number,
    y: number,
    width: number,
    height: number,
    sequence: IDialogueSequence
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // 背景
    const bg = this.add.graphics();
    bg.fillStyle(0x141419, 1);
    bg.fillRoundedRect(0, 0, width, height, 14);
    bg.lineStyle(1, 0x2A2A30, 1);
    bg.strokeRoundedRect(0, 0, width, height, 14);
    container.add(bg);

    // 章节标签
    const chapterBadge = this.add.graphics();
    chapterBadge.fillStyle(0x00FFAA, 0.2);
    chapterBadge.fillRoundedRect(20, 20, 60, 32, 6);
    container.add(chapterBadge);

    const chapterText = this.add.text(50, 36, sequence.chapter, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#00FFAA',
    }).setOrigin(0.5);
    container.add(chapterText);

    // 对话名称
    const nameText = this.add.text(100, 18, sequence.name, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#E8E6E3',
      fontStyle: 'bold',
    });
    container.add(nameText);

    // 对话ID
    const idText = this.add.text(100, 52, sequence.id, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#4A4A4A',
    });
    container.add(idText);

    // 对话行数
    const lineCount = this.add.text(100, 82, `${sequence.lines.length} 行对话`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#686868',
    });
    container.add(lineCount);

    // 预览首行
    const firstLine = sequence.lines[0];
    const previewText = this.add.text(100, 115, `"${firstLine.text.substring(0, 40)}${firstLine.text.length > 40 ? '...' : ''}"`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#4A4A4A',
      fontStyle: 'italic',
    });
    container.add(previewText);

    // 播放按钮
    const playBtn = this.add.text(width - 80, height / 2, '▶ 播放', {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#00FFAA',
    }).setOrigin(0.5);
    container.add(playBtn);

    // 交互
    container.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x1E1E24, 1);
      bg.fillRoundedRect(0, 0, width, height, 12);
      bg.lineStyle(2, 0x00FFAA, 1);
      bg.strokeRoundedRect(0, 0, width, height, 12);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x141419, 1);
      bg.fillRoundedRect(0, 0, width, height, 12);
      bg.lineStyle(1, 0x2A2A30, 1);
      bg.strokeRoundedRect(0, 0, width, height, 12);
    });

    container.on('pointerdown', () => {
      this.playDialogue(sequence);
    });

    return container;
  }

  private playDialogue(sequence: IDialogueSequence): void {
    this.isPlaying = true;
    this.currentSequence = sequence;
    this.currentLineIndex = 0;
    const { width, height } = this.scale;

    this.previewContainer.removeAll(true);

    // 背景
    const overlay = this.add.rectangle(0, 0, width, height, 0x0A0A0F, 0.98).setOrigin(0);
    this.previewContainer.add(overlay);

    // 标题
    const titleText = this.add.text(width / 2, 40, `${sequence.chapter} - ${sequence.name}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SECTION,
      color: '#00FFAA',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.previewContainer.add(titleText);

    // 进度指示
    const progressText = this.add.text(width / 2, 85, `1 / ${sequence.lines.length}`, {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#686868',
    }).setOrigin(0.5);
    this.previewContainer.add(progressText);

    // 关闭按钮
    const closeBtn = this.add.text(width - 50, 40, '✕', {
      fontSize: '36px',
      color: '#A8A6A3',
    }).setOrigin(0.5);
    closeBtn.setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FF4444'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#A8A6A3'));
    closeBtn.on('pointerdown', () => this.stopDialogue());
    this.previewContainer.add(closeBtn);

    // 头像区域
    const portraitContainer = this.add.container(width / 2, 350);
    this.previewContainer.add(portraitContainer);

    // 对话框
    const dialogueBox = this.add.graphics();
    dialogueBox.fillStyle(0x141419, 0.95);
    dialogueBox.fillRoundedRect(30, height - 400, width - 60, 280, 16);
    dialogueBox.lineStyle(2, 0x2A2A30, 1);
    dialogueBox.strokeRoundedRect(30, height - 400, width - 60, 280, 16);
    this.previewContainer.add(dialogueBox);

    // 说话者名称
    const speakerText = this.add.text(60, height - 375, '', {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#00FFAA',
      fontStyle: 'bold',
    });
    this.previewContainer.add(speakerText);

    // 对话文本
    const dialogueText = this.add.text(60, height - 335, '', {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.NORMAL,
      color: '#E8E6E3',
      wordWrap: { width: width - 120 },
      lineSpacing: 10,
    });
    this.previewContainer.add(dialogueText);

    // 选项容器
    const choicesContainer = this.add.container(width / 2, height - 180);
    this.previewContainer.add(choicesContainer);

    // 继续提示
    const continueHint = this.add.text(width - 70, height - 140, '点击继续 →', {
      fontFamily: 'Noto Sans SC',
      fontSize: this.FONT_SIZE.SMALL,
      color: '#4A4A4A',
    }).setOrigin(1, 0.5);
    this.previewContainer.add(continueHint);

    // 显示第一行
    this.showDialogueLine(
      sequence.lines[0],
      speakerText,
      dialogueText,
      portraitContainer,
      choicesContainer,
      progressText,
      continueHint
    );

    // 点击继续
    overlay.setInteractive();
    overlay.on('pointerdown', () => {
      const currentLine = sequence.lines[this.currentLineIndex];
      if (currentLine.choices) return; // 有选项时不能点击跳过

      this.currentLineIndex++;
      if (this.currentLineIndex < sequence.lines.length) {
        this.showDialogueLine(
          sequence.lines[this.currentLineIndex],
          speakerText,
          dialogueText,
          portraitContainer,
          choicesContainer,
          progressText,
          continueHint
        );
      } else {
        this.stopDialogue();
      }
    });

    this.previewContainer.setVisible(true);
    this.previewContainer.setAlpha(0);
    this.tweens.add({
      targets: this.previewContainer,
      alpha: 1,
      duration: 200,
    });
  }

  private showDialogueLine(
    line: IDialogueLine,
    speakerText: Phaser.GameObjects.Text,
    dialogueText: Phaser.GameObjects.Text,
    portraitContainer: Phaser.GameObjects.Container,
    choicesContainer: Phaser.GameObjects.Container,
    progressText: Phaser.GameObjects.Text,
    continueHint: Phaser.GameObjects.Text
  ): void {
    // 更新进度
    progressText.setText(`${this.currentLineIndex + 1} / ${this.currentSequence!.lines.length}`);

    // 清除头像
    portraitContainer.removeAll(true);

    // 清除选项
    choicesContainer.removeAll(true);

    // 更新说话者
    speakerText.setText(line.speaker);

    // 更新对话
    dialogueText.setText(line.text);

    // 显示头像
    if (line.speakerId) {
      const expression = line.expression || 'neutral';
      const portraitKey = getPortraitKey(line.speakerId, expression as any);
      
      if (this.textures.exists(portraitKey)) {
        const portrait = this.add.image(0, 0, portraitKey);
        portrait.setDisplaySize(200, 200);
        portraitContainer.add(portrait);
      } else {
        // 显示占位
        const placeholder = this.add.text(0, 0, '👤', {
          fontSize: '80px',
        }).setOrigin(0.5);
        portraitContainer.add(placeholder);
      }

      // 表情标签
      const expressionLabel = this.add.text(0, 110, expression, {
        fontFamily: 'Noto Sans SC',
        fontSize: this.FONT_SIZE.SMALL,
        color: '#686868',
      }).setOrigin(0.5);
      portraitContainer.add(expressionLabel);
    }

    // 显示选项
    if (line.choices) {
      continueHint.setVisible(false);
      
      line.choices.forEach((choice, index) => {
        const choiceY = index * 60 - (line.choices!.length - 1) * 30;
        
        const choiceBg = this.add.graphics();
        choiceBg.fillStyle(0x1E1E24, 1);
        choiceBg.fillRoundedRect(-200, choiceY - 22, 400, 50, 8);
        choiceBg.lineStyle(1, 0x3A3A40, 1);
        choiceBg.strokeRoundedRect(-200, choiceY - 22, 400, 50, 8);
        choicesContainer.add(choiceBg);

        const choiceText = this.add.text(0, choiceY, choice.text, {
          fontFamily: 'Noto Sans SC',
          fontSize: this.FONT_SIZE.NORMAL,
          color: '#A8A6A3',
        }).setOrigin(0.5);
        choicesContainer.add(choiceText);

        // 选项交互
        const hitArea = this.add.rectangle(0, choiceY, 400, 50, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });
        
        hitArea.on('pointerover', () => {
          choiceBg.clear();
          choiceBg.fillStyle(0x2A2A30, 1);
          choiceBg.fillRoundedRect(-200, choiceY - 22, 400, 50, 8);
          choiceBg.lineStyle(2, 0x00FFAA, 1);
          choiceBg.strokeRoundedRect(-200, choiceY - 22, 400, 50, 8);
          choiceText.setColor('#00FFAA');
        });

        hitArea.on('pointerout', () => {
          choiceBg.clear();
          choiceBg.fillStyle(0x1E1E24, 1);
          choiceBg.fillRoundedRect(-200, choiceY - 22, 400, 50, 8);
          choiceBg.lineStyle(1, 0x3A3A40, 1);
          choiceBg.strokeRoundedRect(-200, choiceY - 22, 400, 50, 8);
          choiceText.setColor('#A8A6A3');
        });

        hitArea.on('pointerdown', () => {
          this.currentLineIndex = choice.next;
          if (this.currentLineIndex < this.currentSequence!.lines.length) {
            this.showDialogueLine(
              this.currentSequence!.lines[this.currentLineIndex],
              speakerText,
              dialogueText,
              portraitContainer,
              choicesContainer,
              progressText,
              continueHint
            );
          } else {
            this.stopDialogue();
          }
        });

        choicesContainer.add(hitArea);
      });
    } else {
      continueHint.setVisible(true);
    }
  }

  private stopDialogue(): void {
    this.isPlaying = false;
    this.currentSequence = null;
    this.currentLineIndex = 0;

    this.tweens.add({
      targets: this.previewContainer,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.previewContainer.setVisible(false);
        this.previewContainer.removeAll(true);
      },
    });
  }

  protected setupKeyboard(): void {
    super.setupKeyboard();

    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.isPlaying) {
        this.stopDialogue();
      } else {
        this.goBack();
      }
    });

    // 空格键继续对话
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.isPlaying && this.currentSequence) {
        const currentLine = this.currentSequence.lines[this.currentLineIndex];
        if (!currentLine.choices) {
          this.currentLineIndex++;
          if (this.currentLineIndex >= this.currentSequence.lines.length) {
            this.stopDialogue();
          }
        }
      }
    });
  }
}

