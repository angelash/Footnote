/**
 * 触控输入系统
 * 移动端虚拟摇杆和触控按钮
 * @module systems/input/TouchControls
 */

import Phaser from 'phaser';
import { eventBus, GameEvent } from '@/systems/EventBus';

export interface ITouchControlsConfig {
  scene: Phaser.Scene;
  onMove?: (direction: { x: number; y: number }) => void;
  onInteract?: () => void;
  onAbility?: (index: number) => void;
}

interface IJoystickState {
  active: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  pointerId: number;
}

/**
 * 触控控制系统
 */
export class TouchControls {
  private _scene: Phaser.Scene;
  private _container!: Phaser.GameObjects.Container;
  
  // 虚拟摇杆
  private _joystickBase!: Phaser.GameObjects.Arc;
  private _joystickThumb!: Phaser.GameObjects.Arc;
  private _joystickState: IJoystickState = {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    pointerId: -1,
  };
  
  // 动作按钮
  private _interactButton!: Phaser.GameObjects.Container;
  private _abilityButtons: Phaser.GameObjects.Container[] = [];
  
  // 配置
  private _joystickRadius: number = 60;
  private _thumbRadius: number = 25;
  private _deadzone: number = 10;
  
  // 回调
  private _onMove?: (direction: { x: number; y: number }) => void;
  private _onInteract?: () => void;
  private _onAbility?: (index: number) => void;
  
  // 状态
  private _isEnabled: boolean = true;
  private _isMobile: boolean = false;

  constructor(config: ITouchControlsConfig) {
    this._scene = config.scene;
    this._onMove = config.onMove;
    this._onInteract = config.onInteract;
    this._onAbility = config.onAbility;
    
    this._checkMobile();
    
    if (this._isMobile) {
      this._createControls();
      this._setupTouchListeners();
    }
  }

  /**
   * 检测是否为移动设备
   */
  private _checkMobile(): void {
    this._isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || ('ontouchstart' in window);
  }

  /**
   * 创建控制元素
   */
  private _createControls(): void {
    const { width, height } = this._scene.scale;
    
    this._container = this._scene.add.container(0, 0);
    this._container.setDepth(1800);
    
    // 创建虚拟摇杆
    this._createJoystick(120, height - 150);
    
    // 创建交互按钮
    this._createInteractButton(width - 100, height - 150);
    
    // 创建能力按钮
    this._createAbilityButtons(width - 100, height - 280);
  }

  /**
   * 创建虚拟摇杆
   */
  private _createJoystick(x: number, y: number): void {
    // 底座
    this._joystickBase = this._scene.add.arc(x, y, this._joystickRadius, 0, 360, false, 0x333344, 0.5);
    this._joystickBase.setStrokeStyle(3, 0x4a9eff, 0.8);
    this._container.add(this._joystickBase);
    
    // 摇杆
    this._joystickThumb = this._scene.add.arc(x, y, this._thumbRadius, 0, 360, false, 0x4a9eff, 0.8);
    this._container.add(this._joystickThumb);
    
    // 设置交互区域
    this._joystickBase.setInteractive(
      new Phaser.Geom.Circle(0, 0, this._joystickRadius * 1.5),
      Phaser.Geom.Circle.Contains
    );
  }

  /**
   * 创建交互按钮
   */
  private _createInteractButton(x: number, y: number): void {
    this._interactButton = this._scene.add.container(x, y);
    
    // 按钮背景
    const bg = this._scene.add.arc(0, 0, 40, 0, 360, false, 0x2a4a6a, 0.8);
    bg.setStrokeStyle(3, 0x4a9eff);
    bg.setInteractive(new Phaser.Geom.Circle(0, 0, 40), Phaser.Geom.Circle.Contains);
    this._interactButton.add(bg);
    
    // 按钮图标
    const icon = this._scene.add.text(0, 0, '👆', {
      fontSize: '28px',
    });
    icon.setOrigin(0.5);
    this._interactButton.add(icon);
    
    // 标签
    const label = this._scene.add.text(0, 50, '交互', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#aaaacc',
    });
    label.setOrigin(0.5);
    this._interactButton.add(label);
    
    // 点击事件
    bg.on('pointerdown', () => {
      this._onInteractPress();
      bg.setFillStyle(0x4a6a8a, 0.9);
    });
    
    bg.on('pointerup', () => {
      bg.setFillStyle(0x2a4a6a, 0.8);
    });
    
    bg.on('pointerout', () => {
      bg.setFillStyle(0x2a4a6a, 0.8);
    });
    
    this._container.add(this._interactButton);
  }

  /**
   * 创建能力按钮
   */
  private _createAbilityButtons(x: number, y: number): void {
    const abilities = [
      { icon: '👁️', name: '感知', color: 0x00ffaa },
      { icon: '✋', name: '介入', color: 0xff00ff },
      { icon: '⏪', name: '回溯', color: 0xffd700 },
    ];
    
    abilities.forEach((ability, index) => {
      const btn = this._scene.add.container(x, y - index * 70);
      
      // 按钮背景
      const bg = this._scene.add.arc(0, 0, 30, 0, 360, false, 0x1a1a2e, 0.8);
      bg.setStrokeStyle(2, ability.color, 0.8);
      bg.setInteractive(new Phaser.Geom.Circle(0, 0, 30), Phaser.Geom.Circle.Contains);
      btn.add(bg);
      
      // 图标
      const icon = this._scene.add.text(0, 0, ability.icon, {
        fontSize: '20px',
      });
      icon.setOrigin(0.5);
      btn.add(icon);
      
      // 快捷键提示
      const hint = this._scene.add.text(0, -35, `${index + 1}`, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#666666',
      });
      hint.setOrigin(0.5);
      btn.add(hint);
      
      // 锁定遮罩（默认显示）
      const lock = this._scene.add.arc(0, 0, 30, 0, 360, false, 0x000000, 0.7);
      lock.setName(`lock_${index}`);
      btn.add(lock);
      
      // 点击事件
      bg.on('pointerdown', () => {
        this._onAbilityPress(index);
        bg.setFillStyle(0x2a2a3e, 0.9);
      });
      
      bg.on('pointerup', () => {
        bg.setFillStyle(0x1a1a2e, 0.8);
      });
      
      this._container.add(btn);
      this._abilityButtons.push(btn);
    });
  }

  /**
   * 设置触控监听
   */
  private _setupTouchListeners(): void {
    this._scene.input.on('pointerdown', this._onPointerDown, this);
    this._scene.input.on('pointermove', this._onPointerMove, this);
    this._scene.input.on('pointerup', this._onPointerUp, this);
  }

  /**
   * 指针按下
   */
  private _onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!this._isEnabled) return;
    
    // 检查是否在摇杆区域
    const dx = pointer.x - this._joystickBase.x;
    const dy = pointer.y - this._joystickBase.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist <= this._joystickRadius * 1.5) {
      this._joystickState = {
        active: true,
        startX: this._joystickBase.x,
        startY: this._joystickBase.y,
        currentX: pointer.x,
        currentY: pointer.y,
        pointerId: pointer.id,
      };
      this._updateJoystickPosition(pointer.x, pointer.y);
    }
  }

  /**
   * 指针移动
   */
  private _onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this._isEnabled) return;
    
    if (this._joystickState.active && pointer.id === this._joystickState.pointerId) {
      this._joystickState.currentX = pointer.x;
      this._joystickState.currentY = pointer.y;
      this._updateJoystickPosition(pointer.x, pointer.y);
    }
  }

  /**
   * 指针抬起
   */
  private _onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (this._joystickState.active && pointer.id === this._joystickState.pointerId) {
      this._joystickState.active = false;
      this._resetJoystick();
      
      // 发送停止移动
      this._onMove?.({ x: 0, y: 0 });
    }
  }

  /**
   * 更新摇杆位置
   */
  private _updateJoystickPosition(x: number, y: number): void {
    const dx = x - this._joystickState.startX;
    const dy = y - this._joystickState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // 限制在最大半径内
    let thumbX = dx;
    let thumbY = dy;
    
    if (dist > this._joystickRadius) {
      const angle = Math.atan2(dy, dx);
      thumbX = Math.cos(angle) * this._joystickRadius;
      thumbY = Math.sin(angle) * this._joystickRadius;
    }
    
    // 更新摇杆位置
    this._joystickThumb.setPosition(
      this._joystickState.startX + thumbX,
      this._joystickState.startY + thumbY
    );
    
    // 计算方向（归一化）
    if (dist > this._deadzone) {
      const normalizedX = thumbX / this._joystickRadius;
      const normalizedY = thumbY / this._joystickRadius;
      this._onMove?.({ x: normalizedX, y: normalizedY });
    } else {
      this._onMove?.({ x: 0, y: 0 });
    }
  }

  /**
   * 重置摇杆
   */
  private _resetJoystick(): void {
    this._scene.tweens.add({
      targets: this._joystickThumb,
      x: this._joystickBase.x,
      y: this._joystickBase.y,
      duration: 100,
      ease: 'Sine.easeOut',
    });
  }

  /**
   * 交互按钮按下
   */
  private _onInteractPress(): void {
    if (!this._isEnabled) return;
    this._onInteract?.();
    eventBus.emit(GameEvent.PLAY_SFX, { key: 'sfx_ui_click' });
  }

  /**
   * 能力按钮按下
   */
  private _onAbilityPress(index: number): void {
    if (!this._isEnabled) return;
    this._onAbility?.(index);
    eventBus.emit(GameEvent.PLAY_SFX, { key: 'sfx_ui_click' });
  }

  /**
   * 解锁能力按钮
   */
  public unlockAbility(index: number): void {
    if (index < 0 || index >= this._abilityButtons.length) return;
    
    const btn = this._abilityButtons[index];
    const lock = btn.getByName(`lock_${index}`);
    if (lock) {
      this._scene.tweens.add({
        targets: lock,
        alpha: 0,
        duration: 300,
        onComplete: () => lock.destroy(),
      });
    }
  }

  /**
   * 启用控制
   */
  public enable(): void {
    this._isEnabled = true;
    this._container?.setAlpha(1);
  }

  /**
   * 禁用控制
   */
  public disable(): void {
    this._isEnabled = false;
    this._container?.setAlpha(0.5);
    this._resetJoystick();
    this._onMove?.({ x: 0, y: 0 });
  }

  /**
   * 显示/隐藏
   */
  public setVisible(visible: boolean): void {
    this._container?.setVisible(visible);
  }

  /**
   * 是否为移动设备
   */
  public isMobile(): boolean {
    return this._isMobile;
  }

  /**
   * 销毁
   */
  public destroy(): void {
    this._scene.input.off('pointerdown', this._onPointerDown, this);
    this._scene.input.off('pointermove', this._onPointerMove, this);
    this._scene.input.off('pointerup', this._onPointerUp, this);
    this._container?.destroy();
  }
}

