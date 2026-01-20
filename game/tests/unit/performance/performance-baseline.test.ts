/**
 * 性能基线测试
 * 自动化验证性能常量和门禁阈值
 * @module tests/unit/performance/performance-baseline.test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  PERFORMANCE_THRESHOLDS,
  DEVICE_TIER_THRESHOLDS,
  DevicePerformanceTier,
  LOAD_STRATEGY,
  PERFORMANCE_MONITOR_CONFIG,
  PERFORMANCE_DEGRADATION,
} from '@/config/performance.config';

describe('性能基线测试', () => {
  describe('性能阈值常量验证', () => {
    it('首屏加载阈值应符合 QA Bible 门禁', () => {
      // QA Bible: 首屏加载 < 3s（4G）
      expect(PERFORMANCE_THRESHOLDS.FIRST_SCREEN_MS).toBeLessThanOrEqual(3000);
      expect(PERFORMANCE_THRESHOLDS.FCP_MS).toBeLessThanOrEqual(1500);
      expect(PERFORMANCE_THRESHOLDS.TTI_MS).toBeLessThanOrEqual(3000);
    });

    it('首屏红线应有足够容错空间', () => {
      // 红线应大于目标值
      expect(PERFORMANCE_THRESHOLDS.FIRST_SCREEN_REDLINE_MS).toBeGreaterThan(
        PERFORMANCE_THRESHOLDS.FIRST_SCREEN_MS
      );
      // 红线 8s 是合理值
      expect(PERFORMANCE_THRESHOLDS.FIRST_SCREEN_REDLINE_MS).toBe(8000);
    });

    it('帧率阈值应符合 QA Bible 门禁', () => {
      // QA Bible: ≥60fps
      expect(PERFORMANCE_THRESHOLDS.FPS_TARGET).toBe(60);
      expect(PERFORMANCE_THRESHOLDS.FPS_MIN).toBeGreaterThanOrEqual(55);
      // 低端设备最低 30fps
      expect(PERFORMANCE_THRESHOLDS.FPS_MIN_LOW_END).toBeGreaterThanOrEqual(30);
      // 红线 24fps
      expect(PERFORMANCE_THRESHOLDS.FPS_REDLINE).toBe(24);
    });

    it('内存阈值应符合 QA Bible 门禁', () => {
      // QA Bible: < 100MB
      expect(PERFORMANCE_THRESHOLDS.MEMORY_MB_MAX).toBeLessThanOrEqual(100);
      // 红线 200MB
      expect(PERFORMANCE_THRESHOLDS.MEMORY_MB_REDLINE).toBe(200);
    });

    it('场景切换阈值应合理', () => {
      // 章节切换 ≤2s
      expect(PERFORMANCE_THRESHOLDS.CHAPTER_SWITCH_MS).toBeLessThanOrEqual(2000);
      // Zone 切换 ≤1s
      expect(PERFORMANCE_THRESHOLDS.ZONE_SWITCH_MS).toBeLessThanOrEqual(1000);
      // 场景切换 ≤500ms
      expect(PERFORMANCE_THRESHOLDS.SCENE_SWITCH_MS).toBeLessThanOrEqual(500);
    });

    it('交互响应阈值应合理', () => {
      // 中端设备 ≤100ms
      expect(PERFORMANCE_THRESHOLDS.INTERACTION_RESPONSE_MS).toBeLessThanOrEqual(100);
      // 红线 300ms
      expect(PERFORMANCE_THRESHOLDS.INTERACTION_RESPONSE_REDLINE_MS).toBe(300);
    });

    it('包体大小阈值应符合 QA Bible 门禁', () => {
      // QA Bible: < 10MB
      expect(PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_KB).toBeLessThanOrEqual(10240);
      // 红线 15MB
      expect(PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_REDLINE_KB).toBe(15360);
    });
  });

  describe('设备分级配置验证', () => {
    it('高端设备配置应正确', () => {
      const high = DEVICE_TIER_THRESHOLDS[DevicePerformanceTier.HIGH];
      expect(high.fpsTarget).toBe(60);
      expect(high.fpsMin).toBeGreaterThanOrEqual(55);
      expect(high.enableEffects).toBe(true);
      expect(high.enableAntialias).toBe(true);
      expect(high.textureQuality).toBe(1.0);
    });

    it('中端设备配置应正确', () => {
      const medium = DEVICE_TIER_THRESHOLDS[DevicePerformanceTier.MEDIUM];
      expect(medium.fpsTarget).toBe(45);
      expect(medium.fpsMin).toBeGreaterThanOrEqual(40);
      expect(medium.enableEffects).toBe(true);
      expect(medium.enableAntialias).toBe(false); // 中端关闭抗锯齿
      expect(medium.textureQuality).toBeLessThan(1.0);
    });

    it('低端设备配置应正确', () => {
      const low = DEVICE_TIER_THRESHOLDS[DevicePerformanceTier.LOW];
      expect(low.fpsTarget).toBe(30);
      expect(low.fpsMin).toBeGreaterThanOrEqual(24);
      expect(low.enableEffects).toBe(false); // 低端关闭特效
      expect(low.enableAntialias).toBe(false);
      expect(low.textureQuality).toBeLessThanOrEqual(0.5);
    });

    it('设备分级应有明确的性能梯度', () => {
      const high = DEVICE_TIER_THRESHOLDS[DevicePerformanceTier.HIGH];
      const medium = DEVICE_TIER_THRESHOLDS[DevicePerformanceTier.MEDIUM];
      const low = DEVICE_TIER_THRESHOLDS[DevicePerformanceTier.LOW];

      // FPS 目标递减
      expect(high.fpsTarget).toBeGreaterThan(medium.fpsTarget);
      expect(medium.fpsTarget).toBeGreaterThan(low.fpsTarget);

      // 内存限制递减
      expect(high.memoryLimit).toBeGreaterThan(medium.memoryLimit);
      expect(medium.memoryLimit).toBeGreaterThan(low.memoryLimit);

      // 纹理质量递减
      expect(high.textureQuality).toBeGreaterThan(medium.textureQuality);
      expect(medium.textureQuality).toBeGreaterThan(low.textureQuality);
    });
  });

  describe('加载策略配置验证', () => {
    it('核心资源列表应存在', () => {
      expect(LOAD_STRATEGY.CRITICAL_ASSETS).toBeDefined();
      expect(LOAD_STRATEGY.CRITICAL_ASSETS.images).toBeInstanceOf(Array);
      expect(LOAD_STRATEGY.CRITICAL_ASSETS.images.length).toBeGreaterThan(0);
    });

    it('首屏资源列表应存在', () => {
      expect(LOAD_STRATEGY.FIRST_SCREEN_ASSETS).toBeDefined();
      expect(LOAD_STRATEGY.FIRST_SCREEN_ASSETS.images).toBeInstanceOf(Array);
    });

    it('首章资源列表应存在', () => {
      expect(LOAD_STRATEGY.FIRST_CHAPTER_ASSETS).toBeDefined();
      expect(LOAD_STRATEGY.FIRST_CHAPTER_ASSETS.dialogues).toBeInstanceOf(Array);
      expect(LOAD_STRATEGY.FIRST_CHAPTER_ASSETS.dialogues.length).toBeGreaterThan(0);
    });

    it('加载超时配置应合理', () => {
      // 空闲预加载超时 ≤10s
      expect(LOAD_STRATEGY.IDLE_PRELOAD_TIMEOUT_MS).toBeLessThanOrEqual(10000);
      // 加载总超时 ≤60s
      expect(LOAD_STRATEGY.LOAD_TIMEOUT_MS).toBeLessThanOrEqual(60000);
      // 批量大小 ≤20
      expect(LOAD_STRATEGY.BATCH_SIZE).toBeLessThanOrEqual(20);
    });
  });

  describe('性能监控配置验证', () => {
    it('监控更新间隔应合理', () => {
      // 更新间隔 100ms-1000ms
      expect(PERFORMANCE_MONITOR_CONFIG.UPDATE_INTERVAL_MS).toBeGreaterThanOrEqual(100);
      expect(PERFORMANCE_MONITOR_CONFIG.UPDATE_INTERVAL_MS).toBeLessThanOrEqual(1000);
    });

    it('FPS 采样窗口应合理', () => {
      // 采样窗口 30-120 帧
      expect(PERFORMANCE_MONITOR_CONFIG.FPS_SAMPLE_WINDOW).toBeGreaterThanOrEqual(30);
      expect(PERFORMANCE_MONITOR_CONFIG.FPS_SAMPLE_WINDOW).toBeLessThanOrEqual(120);
    });

    it('采样配置应合理', () => {
      // 采样间隔 ≤5s
      expect(PERFORMANCE_MONITOR_CONFIG.SAMPLE_INTERVAL_MS).toBeLessThanOrEqual(5000);
      // 数据保留 ≥30s
      expect(PERFORMANCE_MONITOR_CONFIG.SAMPLE_RETENTION_SECONDS).toBeGreaterThanOrEqual(30);
    });

    it('掉帧阈值应合理', () => {
      // 掉帧阈值应低于目标帧率
      expect(PERFORMANCE_MONITOR_CONFIG.FRAME_DROP_THRESHOLD).toBeLessThan(
        PERFORMANCE_THRESHOLDS.FPS_TARGET
      );
      // 严重掉帧阈值应低于掉帧阈值
      expect(PERFORMANCE_MONITOR_CONFIG.SEVERE_FRAME_DROP_THRESHOLD).toBeLessThan(
        PERFORMANCE_MONITOR_CONFIG.FRAME_DROP_THRESHOLD
      );
    });
  });

  describe('降级策略配置验证', () => {
    it('降级触发帧数应合理', () => {
      // 连续低帧数触发：30-120 帧
      expect(PERFORMANCE_DEGRADATION.FPS_LOW_FRAME_COUNT).toBeGreaterThanOrEqual(30);
      expect(PERFORMANCE_DEGRADATION.FPS_LOW_FRAME_COUNT).toBeLessThanOrEqual(120);
    });

    it('降级动作应有层级', () => {
      const { LEVEL_1, LEVEL_2, LEVEL_3 } = PERFORMANCE_DEGRADATION.DEGRADATION_ACTIONS;

      // Level 1: 只关闭粒子
      expect(LEVEL_1.disableParticles).toBe(true);
      expect(LEVEL_1.disableAnimations).toBe(false);
      expect(LEVEL_1.reduceTextureQuality).toBe(false);

      // Level 2: 关闭粒子+动画
      expect(LEVEL_2.disableParticles).toBe(true);
      expect(LEVEL_2.disableAnimations).toBe(true);
      expect(LEVEL_2.reduceTextureQuality).toBe(false);

      // Level 3: 全部降级
      expect(LEVEL_3.disableParticles).toBe(true);
      expect(LEVEL_3.disableAnimations).toBe(true);
      expect(LEVEL_3.reduceTextureQuality).toBe(true);
    });
  });

  describe('性能配置一致性验证', () => {
    it('红线值应始终大于目标值', () => {
      expect(PERFORMANCE_THRESHOLDS.FIRST_SCREEN_REDLINE_MS).toBeGreaterThan(
        PERFORMANCE_THRESHOLDS.FIRST_SCREEN_MS
      );
      expect(PERFORMANCE_THRESHOLDS.MEMORY_MB_REDLINE).toBeGreaterThan(
        PERFORMANCE_THRESHOLDS.MEMORY_MB_MAX
      );
      expect(PERFORMANCE_THRESHOLDS.SCENE_SWITCH_REDLINE_MS).toBeGreaterThan(
        PERFORMANCE_THRESHOLDS.SCENE_SWITCH_MS
      );
      expect(PERFORMANCE_THRESHOLDS.INTERACTION_RESPONSE_REDLINE_MS).toBeGreaterThan(
        PERFORMANCE_THRESHOLDS.INTERACTION_RESPONSE_MS
      );
      expect(PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_REDLINE_KB).toBeGreaterThan(
        PERFORMANCE_THRESHOLDS.BUNDLE_SIZE_KB
      );
    });

    it('FPS 红线应低于最低要求', () => {
      expect(PERFORMANCE_THRESHOLDS.FPS_REDLINE).toBeLessThan(
        PERFORMANCE_THRESHOLDS.FPS_MIN_LOW_END
      );
    });

    it('所有阈值应为正数', () => {
      Object.values(PERFORMANCE_THRESHOLDS).forEach((value) => {
        expect(value).toBeGreaterThan(0);
      });
    });
  });
});

describe('性能配置类型验证', () => {
  it('设备分级枚举应完整', () => {
    expect(DevicePerformanceTier.HIGH).toBe('high');
    expect(DevicePerformanceTier.MEDIUM).toBe('medium');
    expect(DevicePerformanceTier.LOW).toBe('low');
  });

  it('所有设备分级应有对应配置', () => {
    const tiers = Object.values(DevicePerformanceTier);
    tiers.forEach((tier) => {
      expect(DEVICE_TIER_THRESHOLDS[tier]).toBeDefined();
      expect(DEVICE_TIER_THRESHOLDS[tier].fpsTarget).toBeDefined();
      expect(DEVICE_TIER_THRESHOLDS[tier].fpsMin).toBeDefined();
      expect(DEVICE_TIER_THRESHOLDS[tier].memoryLimit).toBeDefined();
      expect(DEVICE_TIER_THRESHOLDS[tier].enableEffects).toBeDefined();
      expect(DEVICE_TIER_THRESHOLDS[tier].enableAntialias).toBeDefined();
      expect(DEVICE_TIER_THRESHOLDS[tier].textureQuality).toBeDefined();
    });
  });
});
