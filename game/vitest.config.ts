import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    /* 全局API */
    globals: true,
    
    /* 环境 */
    environment: 'jsdom',
    
    /* 测试文件 */
    include: ['src/**/*.test.ts', 'tests/unit/**/*.ts'],
    
    /* 排除 */
    exclude: ['node_modules', 'dist', 'tests/e2e'],
    
    /* 覆盖率 */
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      all: false,
      include: [
        'src/systems/world/WorldState.ts',
        'src/systems/narrative/NarrativeEngine.ts',
        'src/systems/EventBus.ts',
        'src/systems/i18n/I18nManager.ts',
        // AbilitySystem excluded: ~40% is Phaser UI visualization code (filters, animations, drag handling)
        // 'src/systems/ability/AbilitySystem.ts',
        'src/systems/assets/AssetManager.ts',
        'src/systems/audio/AudioManager.ts',
        'src/systems/scene/SceneAssembler.ts',
        'src/systems/interaction/InteractionSystem.ts',
        // UI 组件 (需要 Phaser mock)
        'src/systems/ui/CardUI.ts',
        'src/systems/ui/DialogueUI.ts',
      ],
      exclude: [
        'node_modules/',
        'tests/',
        'src/types/',
        '**/*.d.ts',
        // SaveManager excluded: requires IndexedDB which can't be unit tested
        'src/systems/save/SaveManager.ts',
        // GameScene excluded: Phaser Scene class, requires full game runtime
        'src/scenes/GameScene.ts',
      ],
      thresholds: {
        statements: 70,
        branches: 55,
        functions: 75,
        lines: 70,
      },
    },
    
    /* 设置文件 */
    setupFiles: ['./tests/setup.ts'],
    
    /* 超时 */
    testTimeout: 10000,
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/scenes': resolve(__dirname, 'src/scenes'),
      '@/systems': resolve(__dirname, 'src/systems'),
      '@/entities': resolve(__dirname, 'src/entities'),
      '@/data': resolve(__dirname, 'src/data'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
    },
  },
});

