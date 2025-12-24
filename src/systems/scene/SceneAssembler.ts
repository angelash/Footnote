import Phaser from 'phaser';
import type {
  IAssembledScene,
  ISceneAssemblerCallbacks,
  ISceneConfig,
  ISceneObjectConfig,
} from '@/types/scene';
import { TEXT_STYLES } from '@/config/game.config';

export class SceneAssembler {
  private readonly _scene: Phaser.Scene;
  private readonly _callbacks: ISceneAssemblerCallbacks;

  constructor(scene: Phaser.Scene, callbacks: ISceneAssemblerCallbacks) {
    this._scene = scene;
    this._callbacks = callbacks;
  }

  build(config: ISceneConfig): IAssembledScene {
    const created: Phaser.GameObjects.GameObject[] = [];

    // 背景
    if (config.background) {
      const bg = this._scene.add.image(
        config.background.x ?? 0,
        config.background.y ?? 0,
        config.background.texture
      );
      bg.setOrigin(config.background.origin?.[0] ?? 0, config.background.origin?.[1] ?? 0);
      if (config.background.displaySize) {
        bg.setDisplaySize(config.background.displaySize[0], config.background.displaySize[1]);
      }
      if (typeof config.background.alpha === 'number') bg.setAlpha(config.background.alpha);
      created.push(bg);
    }

    // 物件
    for (const obj of config.objects) {
      const go = this._createObject(obj);
      created.push(...go);
    }

    return { objects: created };
  }

  destroy(assembled: IAssembledScene | null | undefined): void {
    if (!assembled) return;
    for (const obj of assembled.objects) {
      obj.destroy();
    }
  }

  private _createObject(obj: ISceneObjectConfig): Phaser.GameObjects.GameObject[] {
    const created: Phaser.GameObjects.GameObject[] = [];

    type DisplayObject = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;
    let display: DisplayObject;
    if (obj.type === 'sprite') {
      const sprite = this._scene.add.sprite(obj.x, obj.y, obj.texture, obj.frame ?? 0);
      display = sprite;

      // 动画
      if (obj.animation) {
        const animKey = obj.animation.key;
        if (!this._scene.anims.exists(animKey)) {
          const frames =
            obj.animation.frameNumbers
              ? this._scene.anims.generateFrameNumbers(obj.texture, { frames: obj.animation.frameNumbers })
              : this._scene.anims.generateFrameNumbers(obj.texture, {
                  start: obj.animation.frames?.start ?? 0,
                  end: obj.animation.frames?.end ?? 0,
                });
          this._scene.anims.create({
            key: animKey,
            frames,
            frameRate: obj.animation.frameRate ?? 6,
            repeat: obj.animation.repeat ?? -1,
          });
        }
        sprite.play(animKey);
      }
    } else {
      display = this._scene.add.image(obj.x, obj.y, obj.texture);
    }

    // 通用属性
    if (typeof obj.scale === 'number') display.setScale(obj.scale);
    if (typeof obj.depth === 'number') display.setDepth(obj.depth);
    if (typeof obj.alpha === 'number') display.setAlpha(obj.alpha);
    if (typeof obj.rotation === 'number') display.setRotation(obj.rotation);
    if (obj.origin) display.setOrigin(obj.origin[0], obj.origin[1]);

    // 交互
    if (obj.interactive) {
      display.setInteractive({ useHandCursor: obj.interactive.cursor ?? true });
        if (obj.interactive.action && obj.interactive.action.type !== 'none') {
          display.on('pointerdown', () => {
            this._callbacks.onAction(obj.interactive!.action!, obj.id);
          });
        }
        if (obj.interactive.testid) {
          display.setData('testid', obj.interactive.testid);
        }
    }

    created.push(display);

    // label（可选）
    if (obj.label) {
      const dx = obj.labelOffset?.[0] ?? 0;
      const dy = obj.labelOffset?.[1] ?? 72;
      const label = this._scene.add
        .text(obj.x + dx, obj.y + dy, obj.label, { ...TEXT_STYLES.MUTED, fontSize: '12px' })
        .setOrigin(0.5, 0.5);
      if (typeof obj.depth === 'number') label.setDepth(obj.depth + 1);
      created.push(label);
    }

    return created;
  }
}


