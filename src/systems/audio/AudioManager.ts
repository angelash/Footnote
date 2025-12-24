/**
 * 《备注 / Footnote》音频管理系统
 * 
 * 负责BGM、音效、环境音的加载和播放
 */

import Phaser from 'phaser';

export interface IBgmConfig {
  id: string;
  name: string;
  file: string;
  loop: boolean;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}

export interface ISfxConfig {
  id: string;
  name: string;
  file: string;
  volume: number;
  duration?: number;
  loop?: boolean;
}

export interface IAmbienceConfig {
  id: string;
  name: string;
  file: string;
  volume: number;
  loop: boolean;
  fadeIn: number;
  fadeOut: number;
}

export class AudioManager {
  private scene: Phaser.Scene;
  
  // 当前播放状态
  private _currentBgm: Phaser.Sound.BaseSound | null = null;
  private _currentBgmId: string = '';
  private _currentAmbience: Phaser.Sound.BaseSound | null = null;
  private _currentAmbienceId: string = '';
  private _ambienceOverlay: Phaser.Sound.BaseSound | null = null;
  
  // 配置缓存
  private _bgmConfigs: Map<string, IBgmConfig> = new Map();
  private _sfxConfigs: Map<string, ISfxConfig> = new Map();
  private _ambienceConfigs: Map<string, IAmbienceConfig> = new Map();
  
  // 音量控制
  private _masterVolume: number = 1.0;
  private _bgmVolume: number = 0.7;
  private _sfxVolume: number = 0.8;
  private _ambienceVolume: number = 0.5;
  
  // 对话降低BGM
  private _dialogueActive: boolean = false;
  private _dialogueVolumeMultiplier: number = 0.5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * 加载音频配置
   */
  public loadConfigs(
    bgmConfigs: IBgmConfig[],
    sfxConfigs: ISfxConfig[],
    ambienceConfigs: IAmbienceConfig[]
  ): void {
    bgmConfigs.forEach(config => this._bgmConfigs.set(config.id, config));
    sfxConfigs.forEach(config => this._sfxConfigs.set(config.id, config));
    ambienceConfigs.forEach(config => this._ambienceConfigs.set(config.id, config));
  }

  /**
   * 播放BGM
   * @param bgmId BGM ID
   * @param crossfade 是否交叉淡化
   */
  public playBgm(bgmId: string, crossfade: boolean = true): void {
    if (this._currentBgmId === bgmId) return;
    
    const config = this._bgmConfigs.get(bgmId);
    if (!config) {
      console.warn(`BGM not found: ${bgmId}`);
      return;
    }
    
    const targetVolume = config.volume * this._bgmVolume * this._masterVolume * 
      (this._dialogueActive ? this._dialogueVolumeMultiplier : 1);
    
    // 淡出当前BGM
    if (this._currentBgm && crossfade) {
      const oldBgm = this._currentBgm;
      this.scene.tweens.add({
        targets: oldBgm,
        volume: 0,
        duration: config.fadeOut,
        onComplete: () => {
          oldBgm.stop();
        }
      });
    } else if (this._currentBgm) {
      this._currentBgm.stop();
    }
    
    // 播放新BGM
    this._currentBgm = this.scene.sound.add(bgmId, {
      loop: config.loop,
      volume: 0
    });
    this._currentBgm.play();
    this._currentBgmId = bgmId;
    
    // 淡入
    this.scene.tweens.add({
      targets: this._currentBgm,
      volume: targetVolume,
      duration: config.fadeIn
    });
  }

  /**
   * 停止BGM
   */
  public stopBgm(fadeOut: number = 1500): void {
    if (!this._currentBgm) return;
    
    const bgm = this._currentBgm;
    this.scene.tweens.add({
      targets: bgm,
      volume: 0,
      duration: fadeOut,
      onComplete: () => {
        bgm.stop();
      }
    });
    
    this._currentBgm = null;
    this._currentBgmId = '';
  }

  /**
   * 播放音效
   * @param sfxId 音效ID
   */
  public playSfx(sfxId: string): void {
    const config = this._sfxConfigs.get(sfxId);
    if (!config) {
      console.warn(`SFX not found: ${sfxId}`);
      return;
    }
    
    const volume = config.volume * this._sfxVolume * this._masterVolume;
    this.scene.sound.play(sfxId, { volume, loop: config.loop || false });
  }

  /**
   * 播放环境音
   * @param ambienceId 环境音ID
   */
  public playAmbience(ambienceId: string): void {
    if (this._currentAmbienceId === ambienceId) return;
    
    const config = this._ambienceConfigs.get(ambienceId);
    if (!config) {
      console.warn(`Ambience not found: ${ambienceId}`);
      return;
    }
    
    const targetVolume = config.volume * this._ambienceVolume * this._masterVolume;
    
    // 淡出当前环境音
    if (this._currentAmbience) {
      const oldAmbience = this._currentAmbience;
      this.scene.tweens.add({
        targets: oldAmbience,
        volume: 0,
        duration: config.fadeOut,
        onComplete: () => {
          oldAmbience.stop();
        }
      });
    }
    
    // 播放新环境音
    this._currentAmbience = this.scene.sound.add(ambienceId, {
      loop: config.loop,
      volume: 0
    });
    this._currentAmbience.play();
    this._currentAmbienceId = ambienceId;
    
    // 淡入
    this.scene.tweens.add({
      targets: this._currentAmbience,
      volume: targetVolume,
      duration: config.fadeIn
    });
  }

  /**
   * 添加环境音叠加层（如深度感知时）
   */
  public addAmbienceOverlay(ambienceId: string, baseReduction: number = 0.5): void {
    const config = this._ambienceConfigs.get(ambienceId);
    if (!config) return;
    
    // 降低基础环境音音量
    if (this._currentAmbience) {
      const currentConfig = this._ambienceConfigs.get(this._currentAmbienceId);
      if (currentConfig) {
        const reducedVolume = currentConfig.volume * this._ambienceVolume * 
          this._masterVolume * baseReduction;
        this.scene.tweens.add({
          targets: this._currentAmbience,
          volume: reducedVolume,
          duration: 500
        });
      }
    }
    
    // 播放叠加层
    const overlayVolume = config.volume * this._ambienceVolume * this._masterVolume;
    this._ambienceOverlay = this.scene.sound.add(ambienceId, {
      loop: config.loop,
      volume: 0
    });
    this._ambienceOverlay.play();
    
    this.scene.tweens.add({
      targets: this._ambienceOverlay,
      volume: overlayVolume,
      duration: config.fadeIn
    });
  }

  /**
   * 移除环境音叠加层
   */
  public removeAmbienceOverlay(): void {
    if (this._ambienceOverlay) {
      const overlay = this._ambienceOverlay;
      this.scene.tweens.add({
        targets: overlay,
        volume: 0,
        duration: 500,
        onComplete: () => {
          overlay.stop();
        }
      });
      this._ambienceOverlay = null;
    }
    
    // 恢复基础环境音音量
    if (this._currentAmbience) {
      const currentConfig = this._ambienceConfigs.get(this._currentAmbienceId);
      if (currentConfig) {
        const normalVolume = currentConfig.volume * this._ambienceVolume * this._masterVolume;
        this.scene.tweens.add({
          targets: this._currentAmbience,
          volume: normalVolume,
          duration: 500
        });
      }
    }
  }

  /**
   * 对话开始 - 降低BGM音量
   */
  public onDialogueStart(): void {
    this._dialogueActive = true;
    if (this._currentBgm) {
      const config = this._bgmConfigs.get(this._currentBgmId);
      if (config) {
        const reducedVolume = config.volume * this._bgmVolume * 
          this._masterVolume * this._dialogueVolumeMultiplier;
        this.scene.tweens.add({
          targets: this._currentBgm,
          volume: reducedVolume,
          duration: 300
        });
      }
    }
  }

  /**
   * 对话结束 - 恢复BGM音量
   */
  public onDialogueEnd(): void {
    this._dialogueActive = false;
    if (this._currentBgm) {
      const config = this._bgmConfigs.get(this._currentBgmId);
      if (config) {
        const normalVolume = config.volume * this._bgmVolume * this._masterVolume;
        this.scene.tweens.add({
          targets: this._currentBgm,
          volume: normalVolume,
          duration: 300
        });
      }
    }
  }

  /**
   * 设置主音量
   */
  public setMasterVolume(volume: number): void {
    this._masterVolume = Math.max(0, Math.min(1, volume));
    this._updateAllVolumes();
  }

  /**
   * 设置BGM音量
   */
  public setBgmVolume(volume: number): void {
    this._bgmVolume = Math.max(0, Math.min(1, volume));
    this._updateBgmVolume();
  }

  /**
   * 设置音效音量
   */
  public setSfxVolume(volume: number): void {
    this._sfxVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 设置环境音音量
   */
  public setAmbienceVolume(volume: number): void {
    this._ambienceVolume = Math.max(0, Math.min(1, volume));
    this._updateAmbienceVolume();
  }

  private _updateAllVolumes(): void {
    this._updateBgmVolume();
    this._updateAmbienceVolume();
  }

  private _updateBgmVolume(): void {
    if (this._currentBgm) {
      const config = this._bgmConfigs.get(this._currentBgmId);
      if (config) {
        const volume = config.volume * this._bgmVolume * this._masterVolume *
          (this._dialogueActive ? this._dialogueVolumeMultiplier : 1);
        (this._currentBgm as Phaser.Sound.WebAudioSound).setVolume(volume);
      }
    }
  }

  private _updateAmbienceVolume(): void {
    if (this._currentAmbience) {
      const config = this._ambienceConfigs.get(this._currentAmbienceId);
      if (config) {
        const volume = config.volume * this._ambienceVolume * this._masterVolume;
        (this._currentAmbience as Phaser.Sound.WebAudioSound).setVolume(volume);
      }
    }
  }

  /**
   * 获取当前播放状态
   */
  public getCurrentState(): {
    bgmId: string;
    ambienceId: string;
    masterVolume: number;
    bgmVolume: number;
    sfxVolume: number;
    ambienceVolume: number;
  } {
    return {
      bgmId: this._currentBgmId,
      ambienceId: this._currentAmbienceId,
      masterVolume: this._masterVolume,
      bgmVolume: this._bgmVolume,
      sfxVolume: this._sfxVolume,
      ambienceVolume: this._ambienceVolume
    };
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    if (this._currentBgm) {
      this._currentBgm.stop();
      this._currentBgm = null;
    }
    if (this._currentAmbience) {
      this._currentAmbience.stop();
      this._currentAmbience = null;
    }
    if (this._ambienceOverlay) {
      this._ambienceOverlay.stop();
      this._ambienceOverlay = null;
    }
  }
}

