/**
 * 资源管理器
 * 实现按需加载和资源分组管理
 * @module systems/assets/AssetManager
 */

import Phaser from 'phaser';
import { createLogger } from '@/utils/Logger';

const logger = createLogger('AssetManager');

import {
  CHARACTER_PORTRAITS,
  SCENE_BACKGROUNDS,
  // Scene objects and effects are defined but used dynamically
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ALL_SCENE_OBJECTS as _ALL_SCENE_OBJECTS,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ALL_EFFECTS as _ALL_EFFECTS,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ANIMATED_OBJECTS as _ANIMATED_OBJECTS,
} from '@/data/webpAssets';
import { BGM_CONFIGS, SFX_CONFIGS, AMBIENCE_CONFIGS } from '@/data/audioConfig';

// ==================== 类型定义 ====================

export enum AssetGroup {
  /** 核心资源 - 启动时加载 */
  CORE = 'core',
  /** 菜单资源 */
  MENU = 'menu',
  /** 序章资源 */
  CHAPTER_0 = 'chapter_0',
  /** 第1章资源 */
  CHAPTER_1 = 'chapter_1',
  /** 第2章资源 */
  CHAPTER_2 = 'chapter_2',
  /** 第3章资源 */
  CHAPTER_3 = 'chapter_3',
  /** 第4章资源 */
  CHAPTER_4 = 'chapter_4',
  /** 第5章资源 */
  CHAPTER_5 = 'chapter_5',
  /** 终章资源 */
  CHAPTER_FINALE = 'chapter_finale',
}

/** Asset definition interface for future use */
type IAssetDefinition = {
  key: string;
  url: string;
  type: 'image' | 'audio' | 'spritesheet';
  frameConfig?: { frameWidth: number; frameHeight: number };
};

// Export to avoid unused warning (used for documentation/future expansion)
export type { IAssetDefinition };

interface IGroupConfig {
  backgrounds: string[];
  characters: string[];
  audio: string[];
  objects: string[];
  effects: string[];
}

// ==================== 章节资源映射 ====================

const CHAPTER_ASSET_MAP: Record<string, IGroupConfig> = {
  [AssetGroup.CORE]: {
    backgrounds: [],
    characters: ['cenhui'],
    audio: ['bgm_title'],
    objects: [],
    effects: [],
  },
  [AssetGroup.CHAPTER_0]: {
    backgrounds: [
      'bg_c0z1_corridor',
      'bg_c0z2_cenhui_room',
      'bg_c0z3_thin_wall_alley',
      'bg_c0z4_archive_room',
      'bg_c0z5_abandoned_clinic',
      'bg_c0z6_auditorium_street',
    ],
    characters: ['cenhui', 'gulin'],
    audio: ['bgm_prologue', 'amb_indoor_office'],
    objects: ['obj_bed', 'obj_desk', 'obj_lamp', 'obj_door'],
    effects: ['fx_depth_perception'],
  },
  [AssetGroup.CHAPTER_1]: {
    backgrounds: [
      'bg_c1z1_municipal_hall',
      'bg_c1z2_gulin_office',
      'bg_c1z3_residential_crossing',
      'bg_c1z4_songlan_map_house',
      'bg_c1z5_clinic_waiting',
      'bg_c1z6_auditorium_entrance',
    ],
    characters: ['cenhui', 'gulin', 'songlan'],
    audio: ['bgm_archive', 'amb_indoor_archive'],
    objects: ['obj_office_desk', 'obj_filing_cabinet', 'obj_bookshelf'],
    effects: [],
  },
  [AssetGroup.CHAPTER_2]: {
    backgrounds: [
      'bg_c2z1_edge_breach',
      'bg_c2z2_crack_edge',
      'bg_c2z3_clinic',
      'bg_c2z4_drifter_zone',
      'bg_c2z5_altar',
      'bg_c2z6_cottage',
      'bg_c2z7_rift',
    ],
    characters: ['cenhui', 'xucheng', 'atang'],
    audio: ['bgm_anomaly', 'amb_anomaly_zone'],
    objects: ['obj_hospital_bed', 'obj_crack', 'obj_altar'],
    effects: ['fx_depth_intervention'],
  },
  [AssetGroup.CHAPTER_3]: {
    backgrounds: [
      'bg_c3z1_collapse',
      'bg_c3z2_intervention',
      'bg_c3z3_drift_trail',
      'bg_c3z4_version_conflict',
      'bg_c3z5_lighthouse',
      'bg_c3z6_server_room',
      'bg_c3z7_rescue',
    ],
    characters: ['cenhui', 'songlan', 'atang', 'muping'],
    audio: ['bgm_depth_perception', 'amb_drifter_area'],
    objects: ['obj_monitor', 'obj_rune'],
    effects: ['fx_time_manipulation'],
  },
  [AssetGroup.CHAPTER_4]: {
    backgrounds: [
      'bg_c4z1_time_training',
      'bg_c4z2_ledger',
      'bg_c4z3_time_pollution',
      'bg_c4z4_permission',
      'bg_c4z5_version_archive',
      'bg_c4z6_rewind_fail',
      'bg_c4z7_myth_echo',
      'bg_c4z8_patch_boundary',
    ],
    characters: ['cenhui', 'gulin', 'muping', 'qilan'],
    audio: ['amb_time_distortion'],
    objects: [],
    effects: ['fx_time_manipulation', 'fx_drift'],
  },
  [AssetGroup.CHAPTER_5]: {
    backgrounds: [
      'bg_c5z1_non_convergent',
      'bg_c5z2_judgment',
      'bg_c5z3_damaged_cottage',
      'bg_c5z4_stutter',
      'bg_c5z5_residue',
      'bg_c5z6_museum',
      'bg_c5z7_model_boundary',
    ],
    characters: ['cenhui', 'gulin', 'songlan', 'xucheng', 'atang', 'muping', 'qilan', 'chenjiang'],
    audio: ['bgm_finale', 'amb_finale'],
    objects: [],
    effects: ['fx_verdict', 'fx_scar'],
  },
  [AssetGroup.CHAPTER_FINALE]: {
    backgrounds: [
      'bg_cfz1_viewing_space',
      'bg_cfz2_field_accept',
      'bg_cfz3_ending_a',
      'bg_cfz4_ending_b',
      'bg_cfz5_ending_c',
      'bg_cfz6_epilogue',
    ],
    characters: ['cenhui'],
    audio: ['bgm_ending'],
    objects: [],
    effects: [],
  },
};

// ==================== AssetManager类 ====================

class AssetManager {
  private static _instance: AssetManager | null = null;
  private _loadedGroups: Set<AssetGroup> = new Set();
  private _scene: Phaser.Scene | null = null;

  private constructor() {}

  static getInstance(): AssetManager {
    if (!AssetManager._instance) {
      AssetManager._instance = new AssetManager();
    }
    return AssetManager._instance;
  }

  /**
   * 设置当前场景（用于加载资源）
   */
  setScene(scene: Phaser.Scene): void {
    this._scene = scene;
  }

  /**
   * 检查资源组是否已加载
   */
  isGroupLoaded(group: AssetGroup): boolean {
    return this._loadedGroups.has(group);
  }

  /**
   * 按需加载章节资源
   */
  async loadChapterAssets(chapter: string): Promise<void> {
    const group = this._getGroupFromChapter(chapter);
    if (!group || this._loadedGroups.has(group)) {
      return;
    }

    if (!this._scene) {
      logger.warn('没有设置场景，无法加载资源');
      return;
    }

    logger.info(`开始加载章节资源: ${group}`);

    const config = CHAPTER_ASSET_MAP[group];
    if (!config) {
      return;
    }

    // 加载背景
    await this._loadBackgrounds(config.backgrounds);

    // 加载角色头像
    await this._loadCharacterPortraits(config.characters);

    // 加载音频
    await this._loadAudio(config.audio);

    this._loadedGroups.add(group);
    logger.info(`章节资源加载完成: ${group}`);
  }

  /**
   * 预加载下一章资源（后台加载）
   */
  preloadNextChapter(currentChapter: string): void {
    const nextChapter = this._getNextChapter(currentChapter);
    if (nextChapter) {
      // 使用requestIdleCallback在空闲时加载
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback((): void => {
          this.loadChapterAssets(nextChapter);
        });
      } else {
        setTimeout(() => {
          this.loadChapterAssets(nextChapter);
        }, 1000);
      }
    }
  }

  /**
   * 获取已加载资源统计
   */
  getLoadedStats(): { groups: string[]; count: number } {
    return {
      groups: Array.from(this._loadedGroups),
      count: this._loadedGroups.size,
    };
  }

  /**
   * 卸载指定章节资源（释放内存）
   */
  unloadChapterAssets(chapter: string): void {
    const group = this._getGroupFromChapter(chapter);
    if (!group || !this._loadedGroups.has(group)) {
      return;
    }

    // 可选：卸载纹理释放内存
    // 注意：谨慎使用，可能影响游戏体验
    logger.info(`卸载章节资源: ${group}`);
    this._loadedGroups.delete(group);
  }

  // ==================== 私有方法 ====================

  private _getGroupFromChapter(chapter: string): AssetGroup | null {
    const chapterMap: Record<string, AssetGroup> = {
      C0: AssetGroup.CHAPTER_0,
      C1: AssetGroup.CHAPTER_1,
      C2: AssetGroup.CHAPTER_2,
      C3: AssetGroup.CHAPTER_3,
      C4: AssetGroup.CHAPTER_4,
      C5: AssetGroup.CHAPTER_5,
      CF: AssetGroup.CHAPTER_FINALE,
    };
    return chapterMap[chapter] || null;
  }

  private _getNextChapter(current: string): string | null {
    const chapters = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'CF'];
    const index = chapters.indexOf(current);
    return index >= 0 && index < chapters.length - 1 ? chapters[index + 1] : null;
  }

  private async _loadBackgrounds(keys: string[]): Promise<void> {
    if (!this._scene) return;

    for (const key of keys) {
      if (this._scene.textures.exists(key)) continue;

      const url = SCENE_BACKGROUNDS[key];
      if (url) {
        this._scene.load.image(key, url);
      }
    }

    return new Promise((resolve) => {
      this._scene!.load.once('complete', resolve);
      this._scene!.load.start();
    });
  }

  private async _loadCharacterPortraits(characters: string[]): Promise<void> {
    if (!this._scene) return;

    for (const charId of characters) {
      const portraits = CHARACTER_PORTRAITS[charId];
      if (!portraits) continue;

      for (const [key, url] of Object.entries(portraits)) {
        const assetKey = `portrait_${charId}_${key}`;
        if (this._scene.textures.exists(assetKey)) continue;
        this._scene.load.image(assetKey, url);
      }
    }

    return new Promise((resolve) => {
      this._scene!.load.once('complete', resolve);
      this._scene!.load.start();
    });
  }

  private async _loadAudio(audioKeys: string[]): Promise<void> {
    if (!this._scene) return;

    for (const key of audioKeys) {
      if (this._scene.cache.audio.exists(key)) continue;

      // 查找音频配置
      const bgm = BGM_CONFIGS.find((b) => b.id === key);
      const sfx = SFX_CONFIGS.find((s) => s.id === key);
      const amb = AMBIENCE_CONFIGS.find((a) => a.id === key);

      const config = bgm || sfx || amb;
      if (config) {
        this._scene.load.audio(key, config.file);
      }
    }

    return new Promise((resolve) => {
      this._scene!.load.once('complete', resolve);
      this._scene!.load.start();
    });
  }
}

export const assetManager = AssetManager.getInstance();
